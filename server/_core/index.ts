import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { registerAuthRoutes } from "./auth-simple";
import { registerRefreshEndpoint } from "./auth-refresh-endpoint";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { startNotificationScheduler } from "../notificationScheduler";
import { scheduleBackups } from "../services/backup";
import { handleStripeWebhook } from "../stripe-webhook";
import { handleVippsCallback } from "../vipps-callback";
import * as Sentry from "@sentry/node";
import { getDb } from "../db";

// Initialize Sentry for error tracking
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Ignore known errors
    ignoreErrors: [
      'Can\'t add new command when connection is in closed state',
      'Connection lost: The server closed the connection',
    ],
  });
}

// ============================================================================
// RATE LIMITING CONFIGURATION
// ============================================================================

// General API rate limiter - 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "For mange forespørsler. Vennligst vent litt før du prøver igjen.",
    retryAfter: "15 minutter",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for specific webhook and callback URLs only
    // Use req.url to include query parameters in comparison (prevents bypass)
    return req.url === "/api/stripe/webhook" || req.url === "/api/vipps/callback";
  },
});

// Webhook/callback rate limiter - lighter limits for payment webhooks
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Allow up to 100 webhook calls per minute
  message: {
    error: "For mange webhook forespørsler.",
    retryAfter: "1 minutt",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for authentication - 20 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 login attempts per windowMs
  message: {
    error: "For mange innloggingsforsøk. Vennligst vent 15 minutter.",
    retryAfter: "15 minutter",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public booking rate limiter - 20 requests per minute
const bookingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 requests per minute
  message: {
    error: "For mange bookingforespørsler. Vennligst vent litt.",
    retryAfter: "1 minutt",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Upload rate limiter - 30 requests per minute for file uploads
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    error: "For mange opplastingsforespørsler. Vennligst vent litt.",
    retryAfter: "1 minutt",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Trust proxy for rate limiting behind reverse proxy
  // Use environment variable or default to 1 for standard reverse proxy setup
  app.set('trust proxy', process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) : 1);

  // ============================================================================
  // SECURITY MIDDLEWARE
  // ============================================================================
  
  // Helmet for HTTP security headers
  // Disable CSP in development to avoid blocking React scripts
  // Enable proper CSP in production with specific directives
  const isDev = process.env.NODE_ENV === "development";
  
  app.use(helmet({
    contentSecurityPolicy: isDev ? false : {
      useDefaults: true,
      directives: {
        "script-src": ["'self'", "https://js.stripe.com"],
        "frame-src": ["'self'", "https://js.stripe.com", "https://checkout.stripe.com"],
        "connect-src": ["'self'", "https://api.stripe.com"],
        "img-src": ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding for Stripe
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resources
  }));

  // Apply rate limiting to API routes
  app.use("/api/auth", authLimiter); // Strict limit for auth
  app.use("/api/trpc/publicBooking", bookingLimiter); // Moderate limit for public booking
  app.use("/api", generalLimiter); // General limit for all API
  
  // Stripe webhook must receive raw body for signature verification
  // Register this route BEFORE the JSON body parser
  app.post(
    "/api/stripe/webhook",
    webhookLimiter,
    express.raw({ type: "application/json" }),
    handleStripeWebhook
  );
  
  // Vipps callback endpoint (must be registered before JSON parser)
  app.post("/api/vipps/callback", webhookLimiter, express.json(), handleVippsCallback);
  
  // iZettle OAuth callback endpoint
  app.get("/api/izettle/callback", async (req, res) => {
    try {
      const code = req.query.code as string;
      const state = req.query.state as string;
      
      console.log("[iZettle Callback] Received:", { code: code ? "present" : "missing", state: state ? "present" : "missing" });
      
      if (!code || !state) {
        console.error("[iZettle Callback] Missing parameters:", { code, state });
        return res.redirect("/izettle/callback?izettle=error&message=" + encodeURIComponent("Missing code or state parameter"));
      }
      
      // Verify and decode state with HMAC signature
      const { verifyAndDecodeState } = await import("../services/izettle");
      const stateData = verifyAndDecodeState(state);
      
      if (!stateData || !stateData.tenantId) {
        console.error("[iZettle Callback] Invalid or expired state parameter");
        return res.redirect("/izettle/callback?izettle=error&message=" + encodeURIComponent("Invalid or expired state parameter"));
      }
      
      const tenantId = stateData.tenantId;
      console.log("[iZettle Callback] Verified state:", { tenantId });
      
      // Exchange code for tokens
      console.log("[iZettle Callback] Exchanging code for tokens...");
      const { exchangeCodeForToken, encryptToken } = await import("../services/izettle");
      const tokens = await exchangeCodeForToken(code);
      console.log("[iZettle Callback] Tokens received successfully");
      
      // Save tokens to database
      console.log("[iZettle Callback] Saving tokens to database for tenant:", tenantId);
      const { getDb } = await import("../db");
      const dbInstance = await getDb();
      console.log("[iZettle Callback] Database instance:", dbInstance ? "connected" : "null");
      
      if (!dbInstance) {
        console.error("[iZettle Callback] Database not available!");
        return res.redirect("/izettle/callback?izettle=error&message=" + encodeURIComponent("Database connection failed. Please contact support."));
      }
      
      try {
        const { paymentProviders } = await import("../../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        
        // Check if provider already exists (with tenantId filter)
        let existing;
        try {
          console.log("[iZettle Callback] Querying existing provider for tenant:", tenantId);
          [existing] = await dbInstance
            .select()
            .from(paymentProviders)
            .where(
              and(
                eq(paymentProviders.providerType, "izettle"),
                eq(paymentProviders.tenantId, tenantId || 'platform-admin-tenant')
              )
            )
            .limit(1);
          console.log("[iZettle Callback] Query result:", existing ? "found" : "not found");
        } catch (dbError: any) {
          console.error("[iZettle Callback] Database query failed:", dbError.message);
          console.error("[iZettle Callback] This is likely because the table is empty. Will try to insert new record.");
          existing = null; // Treat as not found and proceed with insert
        }
        
        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
        
        try {
          if (existing) {
            // Update existing
            console.log("[iZettle Callback] Updating existing provider:", existing.id);
            const encryptedAccessToken = encryptToken(tokens.access_token);
            const encryptedRefreshToken = encryptToken(tokens.refresh_token);
            await dbInstance
              .update(paymentProviders)
              .set({
                accessToken: encryptedAccessToken,
                refreshToken: encryptedRefreshToken,
                tokenExpiresAt: expiresAt,
                isActive: true,
                updatedAt: new Date(),
              })
              .where(eq(paymentProviders.id, existing.id));
            console.log("[iZettle Callback] Provider updated successfully");
          } else {
            // Insert new
            console.log("[iZettle Callback] Creating new provider entry");
            console.log("[iZettle Callback] Insert data:", {
              tenantId: tenantId || 'platform-admin-tenant',
              providerType: "izettle",
              hasAccessToken: true,
              hasRefreshToken: true,
            });
            
            const insertResult = await dbInstance.insert(paymentProviders).values({
              tenantId: tenantId || 'platform-admin-tenant',
              providerType: "izettle",
              providerName: "iZettle",
              accessToken: encryptToken(tokens.access_token),
              refreshToken: encryptToken(tokens.refresh_token),
              tokenExpiresAt: expiresAt,
              providerAccountId: null,
              providerEmail: null,
              config: null,
              isActive: true,
              isDefault: false,
            });
            
            console.log("[iZettle Callback] Insert result:", insertResult);
            console.log("[iZettle Callback] Insert result keys:", Object.keys(insertResult));
            
            // Verify the insert by querying back
            const [verifyProvider] = await dbInstance
              .select()
              .from(paymentProviders)
              .where(
                and(
                  eq(paymentProviders.tenantId, tenantId || 'platform-admin-tenant'),
                  eq(paymentProviders.providerType, "izettle")
                )
              )
              .limit(1);
            
            if (verifyProvider) {
              console.log("[iZettle Callback] ✅ Verification successful - Provider saved with ID:", verifyProvider.id);
            } else {
              console.error("[iZettle Callback] ❌ Verification failed - Provider not found after insert!");
              throw new Error("Failed to verify provider insertion");
            }
          }
        } catch (dbError: any) {
          console.error("[iZettle Callback] Database save failed:", {
            message: dbError.message,
            code: dbError.code,
            errno: dbError.errno,
            sqlState: dbError.sqlState,
            sqlMessage: dbError.sqlMessage,
            sql: dbError.sql,
            stack: dbError.stack
          });
          return res.redirect("/izettle/callback?izettle=error&message=" + encodeURIComponent("Failed to save connection. Please try again."));
        }
      } catch (dbError: any) {
        console.error("[iZettle Callback] Database operation failed:", dbError.message);
        console.error("[iZettle Callback] Error stack:", dbError.stack);
        return res.redirect("/izettle/callback?izettle=error&message=" + encodeURIComponent("Database error. Please try again."));
      }
      
      // Redirect to confirmation page with success message
      res.redirect("/izettle/callback?izettle=connected");
    } catch (error: any) {
      console.error("iZettle callback error:", error);
      res.redirect("/izettle/callback?izettle=error&message=" + encodeURIComponent(error.message));
    }
  });
  
  // Storage upload endpoint with authentication and validation
  const ALLOWED_UPLOAD_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ]);
  
  app.post("/api/storage/upload", uploadLimiter, express.raw({ type: "*/*", limit: "10mb" }), async (req, res) => {
    try {
      // Authentication check
      const { authenticateRequest } = await import("./auth-simple");
      let authResult;
      try {
        authResult = await authenticateRequest(req);
      } catch (error) {
        console.error("[Storage Upload] Authentication error:", error);
        return res.status(401).json({ error: "Authentication required" });
      }
      
      if (!authResult) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // Validate content type
      const contentType = String(req.headers["content-type"] || "");
      if (!ALLOWED_UPLOAD_TYPES.has(contentType)) {
        return res.status(415).json({ error: "Unsupported file type. Allowed: JPEG, PNG, WEBP, PDF" });
      }
      
      // TODO: Add file magic number validation to verify actual file format
      // This would check file headers to ensure the content matches the declared MIME type
      // and prevent malicious files with correct MIME types but harmful content
      
      // Validate body
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ error: "Empty body" });
      }
      
      const { storagePut } = await import("../storage");
      const { nanoid } = await import("nanoid");
      
      // Map content type to file extension
      const extensionMap: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "application/pdf": "pdf",
      };
      
      const ext = extensionMap[contentType];
      if (!ext) {
        // Should never happen due to ALLOWED_UPLOAD_TYPES check, but fail safe
        return res.status(500).json({ error: "Failed to determine file extension" });
      }
      
      // Generate unique filename
      const filename = `uploads/${nanoid()}.${ext}`;
      
      // Upload to S3
      const { url } = await storagePut(filename, req.body, contentType);
      
      res.json({ url });
    } catch (error: any) {
      console.error("Storage upload error:", error);
      res.status(500).json({ error: error.message || "Upload failed" });
    }
  });
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Simple email/password authentication routes
  registerAuthRoutes(app);
  // Refresh token endpoint
  registerRefreshEndpoint(app);
  // SEO routes - sitemap and robots.txt
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const { generateSitemap } = await import("../sitemap");
      const sitemap = generateSitemap();
      res.header("Content-Type", "application/xml");
      res.send(sitemap);
    } catch (error) {
      res.status(500).send("Error generating sitemap");
    }
  });
  
  app.get("/robots.txt", (req, res) => {
    const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://www.stylora.no/sitemap.xml`;
    res.header("Content-Type", "text/plain");
    res.send(robotsTxt);
  });
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  
  // Sentry error handler (must be after all routes)
  if (process.env.SENTRY_DSN) {
    app.use((err: any, req: any, res: any, next: any) => {
      Sentry.captureException(err);
      console.error("Error:", err);
      res.status(500).json({ error: 'Internal server error' });
    });
  } else {
    // Unified error handler without Sentry
    app.use((err: any, req: any, res: any, next: any) => {
      console.error("Error:", err);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  
  // In production, use direct port binding without scanning
  // In development, scan for available port to avoid conflicts
  const port = process.env.NODE_ENV === "production"
    ? preferredPort
    : await findAvailablePort(preferredPort);

  if (port !== preferredPort && process.env.NODE_ENV !== "production") {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Validate database connectivity on startup
    console.log("[Database] Validating database connection...");
    try {
      const dbInstance = await getDb();
      if (!dbInstance) {
        console.error("❌ [Database] CRITICAL: Database connection failed!");
        console.error("[Database] Please check your DATABASE_URL environment variable");
        console.error("[Database] Server will continue but authentication will not work");
      } else {
        console.log("✅ [Database] Connection validated successfully");
      }
    } catch (error) {
      console.error("❌ [Database] CRITICAL: Database validation error:", error);
      console.error("[Database] Server will continue but authentication will not work");
    }
    
    // Only start schedulers if this is a worker instance or not specified
    // This prevents duplicate scheduler jobs when running multiple instances
    const instanceType = process.env.INSTANCE_TYPE;
    
    if (!instanceType || instanceType === "worker") {
      console.log("[Scheduler] Starting schedulers (INSTANCE_TYPE:", instanceType || "not set", ")");
      
      // Start notification scheduler for SMS reminders
      startNotificationScheduler();
      
      // Start database backup scheduler
      scheduleBackups();
      
      // Start auto clock-out scheduler
      const { startAutoClockOutScheduler } = await import("../autoClockOutScheduler");
      startAutoClockOutScheduler();
      
      // Start email notification scheduler
      const { startEmailScheduler } = await import("../emailScheduler");
      startEmailScheduler();
    } else {
      console.log("[Scheduler] Skipping schedulers (INSTANCE_TYPE:", instanceType, ")");
    }
  });
}

startServer().catch(console.error);
