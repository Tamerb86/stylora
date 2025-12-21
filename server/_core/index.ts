import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { registerAuthRoutes } from "./auth-simple";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { startNotificationScheduler } from "../notificationScheduler";
import { handleStripeWebhook } from "../stripe-webhook";
import { handleVippsCallback } from "../vipps-callback";

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
    // Skip rate limiting for webhooks
    return req.path.includes("/webhook") || req.path.includes("/callback");
  },
});

// Strict rate limiter for authentication - 5 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
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
  app.set('trust proxy', 1);

  // ============================================================================
  // SECURITY MIDDLEWARE
  // ============================================================================
  
  // Helmet for HTTP security headers
  // Disable CSP in development to avoid blocking React scripts
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled - React needs inline scripts
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
    express.raw({ type: "application/json" }),
    (req, res) => {
      // Attach raw body for signature verification
      (req as any).rawBody = req.body;
      handleStripeWebhook(req, res);
    }
  );
  
  // Vipps callback endpoint (must be registered before JSON parser)
  app.post("/api/vipps/callback", express.json(), handleVippsCallback);
  
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
      
      // Decode state to get tenantId
      let stateData;
      let tenantId;
      try {
        stateData = JSON.parse(Buffer.from(state, "base64").toString());
        tenantId = stateData.tenantId;
        console.log("[iZettle Callback] Decoded state:", { tenantId });
      } catch (error) {
        console.error("[iZettle Callback] Failed to decode state:", error);
        return res.redirect("/izettle/callback?izettle=error&message=" + encodeURIComponent("Invalid state parameter"));
      }
      
      if (!tenantId) {
        console.error("[iZettle Callback] No tenantId in state:", stateData);
        return res.redirect("/izettle/callback?izettle=error&message=" + encodeURIComponent("Missing tenant information"));
      }
      
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
            await dbInstance
              .update(paymentProviders)
              .set({
                accessToken: encryptToken(tokens.access_token),
                refreshToken: encryptToken(tokens.refresh_token),
                tokenExpiresAt: expiresAt,
                isActive: true,
                updatedAt: new Date(),
              })
              .where(eq(paymentProviders.id, existing.id));
            console.log("[iZettle Callback] Provider updated successfully");
          } else {
            // Insert new
            console.log("[iZettle Callback] Creating new provider entry");
            await dbInstance.insert(paymentProviders).values({
              tenantId: tenantId || 'platform-admin-tenant',
              providerType: "izettle",
              providerName: "iZettle",
              accessToken: encryptToken(tokens.access_token),
              refreshToken: encryptToken(tokens.refresh_token),
              tokenExpiresAt: expiresAt,
              providerAccountId: null,
              providerEmail: null,
              config: null,
              lastSyncAt: null,
              lastErrorAt: null,
              lastErrorMessage: null,
              isActive: true,
            });
            console.log("[iZettle Callback] Provider created successfully");
          }
        } catch (dbError: any) {
          console.error("[iZettle Callback] Database save failed:", dbError.message);
          console.error("[iZettle Callback] Database error stack:", dbError.stack);
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
  
  // Storage upload endpoint
  app.post("/api/storage/upload", express.raw({ type: "*/*", limit: "10mb" }), async (req, res) => {
    try {
      const { storagePut } = await import("../storage");
      const { nanoid } = await import("nanoid");
      
      // Get content type from header
      const contentType = req.headers["content-type"] || "application/octet-stream";
      
      // Generate unique filename
      const ext = contentType.split("/")[1] || "bin";
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

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Start notification scheduler for SMS reminders
    startNotificationScheduler();
    
    // Start auto clock-out scheduler
    const { startAutoClockOutScheduler } = await import("../autoClockOutScheduler");
    startAutoClockOutScheduler();
    
    // Start email notification scheduler
    const { startEmailScheduler } = await import("../emailScheduler");
    startEmailScheduler();
  });
}

startServer().catch(console.error);
