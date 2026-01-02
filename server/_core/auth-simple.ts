/**
 * Simple email/password authentication system
 * Uses bcrypt for password hashing and JWT for sessions
 */

import { SignJWT, jwtVerify } from "jose";
import { COOKIE_NAME, THIRTY_DAYS_MS, REFRESH_TOKEN_COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Request, Response, Express } from "express";
import { parse as parseCookieHeader } from "cookie";
import * as db from "../db";
import { ENV } from "./env";
import { getSessionCookieOptions } from "./cookies";
import bcrypt from "bcrypt";
import { users, tenants } from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

// Email validation regex - RFC 5322 simplified
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate and normalize email address
 * @param email - Email to validate
 * @returns Trimmed, lowercase email or null if invalid
 */
function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed || !EMAIL_REGEX.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
  email?: string;
  impersonatedTenantId?: string | null;
};

const SALT_ROUNDS = 10;

/**
 * Simple authentication service
 */
class AuthService {
  private getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Create a session token
   */
  async createSessionToken(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? THIRTY_DAYS_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name,
      email: payload.email,
      impersonatedTenantId: payload.impersonatedTenantId ?? null,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  /**
   * Verify a session token
   */
  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<SessionPayload | null> {
    if (!cookieValue) {
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { openId, appId, name, email, impersonatedTenantId } = payload as Record<string, unknown>;

      if (
        !isNonEmptyString(openId) ||
        !isNonEmptyString(appId) ||
        !isNonEmptyString(name)
      ) {
        return null;
      }

      return {
        openId,
        appId,
        name,
        email: typeof email === 'string' ? email : undefined,
        impersonatedTenantId: typeof impersonatedTenantId === 'string' ? impersonatedTenantId : null,
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  /**
   * Parse cookies from request
   */
  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }

    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  /**
   * Authenticate a request
   */
  async authenticateRequest(req: Request) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      return null;
    }

    const sessionUserId = session.openId;
    const signedInAt = new Date();
    let user = await db.getUserByOpenId(sessionUserId);

    // Handle impersonation: if platform owner is impersonating a tenant
    if (session.impersonatedTenantId && session.openId === ENV.ownerOpenId) {
      if (user) {
        user = { ...user, tenantId: session.impersonatedTenantId };
      }
    }

    if (!user) {
      return null;
    }

    // Update last signed in
    await db.upsertUser({
      openId: user.openId,
      tenantId: user.tenantId,
      role: user.role,
      lastSignedIn: signedInAt,
    });

    return { 
      user, 
      impersonatedTenantId: session.impersonatedTenantId ?? null 
    };
  }
}

export const authService = new AuthService();

// Export authenticateRequest for backward compatibility
export const authenticateRequest = (req: Request) => authService.authenticateRequest(req);

/**
 * Register authentication routes
 */
export function registerAuthRoutes(app: Express) {
  // Login endpoint - email/password
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        console.warn("[Auth] Login attempt with missing credentials");
        res.status(400).json({ error: "E-post og passord er påkrevd" });
        return;
      }

      // Validate and normalize email
      const trimmedEmail = validateEmail(email);
      if (!trimmedEmail) {
        console.warn("[Auth] Login attempt with invalid email format:", email);
        res.status(400).json({ error: "Vennligst oppgi en gyldig e-postadresse" });
        return;
      }

      // Get database instance with better error handling
      let dbInstance;
      try {
        dbInstance = await db.getDb();
        if (!dbInstance) {
          throw new Error("Database connection returned null");
        }
      } catch (dbError) {
        console.error("[Auth] Database connection error:", dbError);
        res.status(500).json({ 
          error: "Tjenesten er midlertidig utilgjengelig", 
          hint: "Vi har problemer med å koble til databasen. Vennligst prøv igjen om noen minutter."
        });
        return;
      }

      // Case-insensitive email lookup using parameterized SQL
      // Security note: Drizzle ORM automatically sanitizes ${} parameters in sql`` templates
      // to prevent SQL injection. The trimmedEmail is safely parameterized.
      let user;
      try {
        [user] = await dbInstance
          .select()
          .from(users)
          .where(sql`LOWER(${users.email}) = LOWER(${trimmedEmail})`)
          .limit(1);
      } catch (queryError) {
        console.error("[Auth] Database query error during login:", queryError);
        res.status(500).json({ 
          error: "En databasefeil oppstod",
          hint: "Det oppstod en feil ved oppslag i brukerdatabasen. Vennligst prøv igjen senere."
        });
        return;
      }

      if (!user) {
        console.warn("[Auth] Login attempt for non-existent user:", trimmedEmail);
        res.status(401).json({ 
          error: "Ugyldig e-post eller passord",
          hint: "Hvis du har glemt passordet, klikk på 'Glemt passord?' for å tilbakestille det."
        });
        return;
      }

      // Check if user has a password set
      if (!user.passwordHash) {
        console.warn("[Auth] Login attempt for user without password:", user.id);
        res.status(401).json({ 
          error: "Kontoen din bruker en annen innloggingsmetode",
          hint: "Denne kontoen ble opprettet med en annen innloggingsmetode. Kontakt support for hjelp."
        });
        return;
      }

      // Verify password
      const isValidPassword = await authService.verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        console.warn("[Auth] Invalid password for user:", user.id);
        res.status(401).json({ 
          error: "Ugyldig e-post eller passord",
          hint: "Hvis du har glemt passordet, klikk på 'Glemt passord?' for å tilbakestille det."
        });
        return;
      }

      // Check if user is active
      if (!user.isActive) {
        console.warn("[Auth] Login attempt for deactivated user:", user.id);
        res.status(403).json({ 
          error: "Kontoen er deaktivert",
          hint: "Kontoen din har blitt deaktivert. Kontakt support for å reaktivere den."
        });
        return;
      }

      // Check if tenant exists and is active
      // Note: This adds one additional DB query per login. For optimization, consider:
      // - Caching tenant status (requires invalidation strategy)
      // - Including tenant data in user query with JOIN
      // - Moving this check to middleware for all authenticated routes
      let tenant;
      try {
        tenant = await db.getTenantById(user.tenantId);
        if (!tenant) {
          console.error("[Auth] User's tenant not found:", user.tenantId);
          res.status(500).json({ 
            error: "Kontokonfigurasjonsfeil",
            hint: "Det er et problem med kontoen din. Kontakt support for hjelp."
          });
          return;
        }
      } catch (tenantError) {
        console.error("[Auth] Error fetching tenant:", tenantError);
        res.status(500).json({ 
          error: "Kunne ikke hente kontoinformasjon",
          hint: "En feil oppstod ved oppslag av kontoinformasjon. Vennligst prøv igjen."
        });
        return;
      }

      if (tenant.status === 'suspended' || tenant.status === 'canceled') {
        console.warn("[Auth] Login attempt for suspended/canceled tenant:", tenant.id, "status:", tenant.status);
        res.status(403).json({ 
          error: tenant.status === 'suspended' 
            ? "Abonnementet er suspendert"
            : "Abonnementet er avsluttet",
          hint: "Kontakt support for å reaktivere abonnementet."
        });
        return;
      }

      // Create session token (30 days)
      const sessionToken = await authService.createSessionToken({
        openId: user.openId,
        appId: ENV.appId,
        name: user.name || trimmedEmail,
        email: user.email || undefined,
      }, {
        expiresInMs: THIRTY_DAYS_MS,
      });

      // Create refresh token (90 days) - handle failures gracefully
      let refreshToken: string | null = null;
      try {
        const { createRefreshToken } = await import("./refresh-tokens");
        refreshToken = await createRefreshToken(
          user.id,
          user.tenantId,
          req.ip,
          req.headers["user-agent"]
        );
      } catch (refreshError) {
        // Log the error but don't fail the login
        console.error("[Auth] Failed to create refresh token:", refreshError);
        // Continue with session token only - user can still log in
      }

      // Set cookies
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: THIRTY_DAYS_MS });
      if (refreshToken) {
        res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, { ...cookieOptions, maxAge: 90 * 24 * 60 * 60 * 1000 }); // 90 days
      }

      console.log("[Auth] Successful login for user:", user.id, "email:", user.email);
      res.json({ 
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
        }
      });
    } catch (error) {
      console.error("[Auth] Login failed with error:", error);
      res.status(500).json({ 
        error: "En uventet feil oppstod",
        hint: "Vennligst prøv igjen. Hvis problemet vedvarer, kontakt support."
      });
    }
  });

  // Demo login endpoint - auto-login to demo account
  app.post("/api/auth/demo-login", async (req: Request, res: Response) => {
    try {
      const DEMO_EMAIL = "demo@stylora.no";
      
      // Get demo user from database
      const dbInstance = await db.getDb();
      if (!dbInstance) {
        res.status(500).json({ error: "Database ikke tilgjengelig" });
        return;
      }

      const [user] = await dbInstance
        .select()
        .from(users)
        .where(eq(users.email, DEMO_EMAIL))
        .limit(1);

      if (!user) {
        res.status(404).json({ error: "Demo-konto ikke funnet" });
        return;
      }

      // Create session token
      const sessionToken = await authService.createSessionToken({
        openId: user.openId,
        appId: ENV.appId,
        name: user.name || "Demo User",
        email: user.email || undefined,
      }, {
        expiresInMs: ONE_YEAR_MS,
      });

      // Set cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ 
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
        }
      });
    } catch (error) {
      console.error("[Auth] Demo login failed", error);
      res.status(500).json({ error: "Demo-innlogging feilet" });
    }
  });

  // Register endpoint
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, name, salonName, phone } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "E-post og passord er påkrevd" });
        return;
      }

      // Validate and normalize email
      const trimmedEmail = validateEmail(email);
      if (!trimmedEmail) {
        res.status(400).json({ error: "Vennligst oppgi en gyldig e-postadresse" });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: "Passordet må være minst 6 tegn" });
        return;
      }

      const dbInstance = await db.getDb();
      if (!dbInstance) {
        console.error("[Auth] Database not available for registration");
        res.status(500).json({ error: "Tjenesten er midlertidig utilgjengelig. Prøv igjen senere." });
        return;
      }

      // Check if email already exists (case-insensitive)
      const [existingUser] = await dbInstance
        .select()
        .from(users)
        .where(sql`LOWER(${users.email}) = LOWER(${trimmedEmail})`)
        .limit(1);

      if (existingUser) {
        console.warn("[Auth] Registration attempt with existing email:", trimmedEmail);
        res.status(400).json({ 
          error: "E-postadressen er allerede registrert",
          hint: "Hvis dette er din konto, kan du logge inn eller bruke 'Glemt passord?' for å tilbakestille passordet."
        });
        return;
      }

      // Create tenant
      const tenantId = `tenant-${nanoid(12)}`;
      const subdomain = trimmedEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + nanoid(6);
      
      await dbInstance.insert(tenants).values({
        id: tenantId,
        name: salonName || `${name || trimmedEmail.split('@')[0]}'s Salong`,
        subdomain,
        email: trimmedEmail,
        phone: phone || null,
        status: 'trial',
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
        emailVerified: true, // Auto-verify for simplicity
        emailVerifiedAt: new Date(),
        onboardingCompleted: false,
        onboardingStep: 'welcome',
      });

      // Hash password and create user
      const passwordHash = await authService.hashPassword(password);
      const openId = `user-${nanoid(16)}`;

      await dbInstance.insert(users).values({
        tenantId,
        openId,
        email: trimmedEmail,
        name: name || trimmedEmail.split('@')[0],
        phone: phone || null,
        passwordHash,
        role: 'owner',
        loginMethod: 'email',
        isActive: true,
        commissionType: 'percentage',
        commissionRate: '50.00',
        uiMode: 'advanced',
        onboardingCompleted: false,
      });

      // Get the created user
      const [newUser] = await dbInstance
        .select()
        .from(users)
        .where(eq(users.openId, openId))
        .limit(1);

      // Create session token
      const sessionToken = await authService.createSessionToken({
        openId,
        appId: ENV.appId,
        name: name || trimmedEmail.split('@')[0],
        email: trimmedEmail,
      }, {
        expiresInMs: ONE_YEAR_MS,
      });

      // Set cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ 
        success: true,
        message: "Registrering vellykket!",
        user: {
          id: newUser?.id,
          name: newUser?.name,
          email: newUser?.email,
          role: newUser?.role,
          tenantId: newUser?.tenantId,
        }
      });
    } catch (error) {
      console.error("[Auth] Registration failed with error:", error);
      res.status(500).json({ 
        error: "Registrering feilet",
        hint: "Vennligst prøv igjen. Hvis problemet vedvarer, kontakt support."
      });
    }
  });

  // Forgot password endpoint
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        res.status(400).json({ error: "E-post er påkrevd" });
        return;
      }

      // Validate and normalize email
      const trimmedEmail = validateEmail(email);
      if (!trimmedEmail) {
        res.status(400).json({ error: "Vennligst oppgi en gyldig e-postadresse" });
        return;
      }
      
      const dbInstance = await db.getDb();
      if (!dbInstance) {
        console.error("[Auth] Database not available for forgot password");
        res.status(500).json({ error: "Tjenesten er midlertidig utilgjengelig. Prøv igjen senere." });
        return;
      }
      
      // Check if user exists (case-insensitive)
      const [user] = await dbInstance
        .select()
        .from(users)
        .where(sql`LOWER(${users.email}) = LOWER(${trimmedEmail})`)
        .limit(1);
      
      // Always return success to prevent email enumeration
      // In production, you would send an email here
      if (user) {
        console.log(`[Auth] Password reset requested for user ${user.id}, email: ${trimmedEmail}`);
        // TODO: Send password reset email with reset token
        // For now, log that the feature needs implementation
        console.warn("[Auth] Password reset email not implemented yet - user should contact support");
      } else {
        console.log(`[Auth] Password reset requested for non-existent email: ${trimmedEmail}`);
      }
      
      res.json({ 
        success: true, 
        message: "Hvis e-postadressen finnes i systemet, vil du motta en e-post med instruksjoner." 
      });
    } catch (error) {
      console.error("[Auth] Forgot password error:", error);
      res.status(500).json({ error: "Noe gikk galt" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      // Revoke refresh token if present
      const cookies = parseCookieHeader(req.headers.cookie || "");
      const refreshToken = cookies[REFRESH_TOKEN_COOKIE_NAME];
      
      if (refreshToken) {
        const { revokeRefreshToken } = await import("./refresh-tokens");
        await revokeRefreshToken(refreshToken, "User logout");
      }

      // Clear cookies
      const cookieOptions = getSessionCookieOptions(req);
      res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      
      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Logout failed", error);
      // Still clear cookies even if revocation fails
      const cookieOptions = getSessionCookieOptions(req);
      res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      res.json({ success: true });
    }
  });

  // Get current user endpoint
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const result = await authService.authenticateRequest(req);
      
      if (!result) {
        res.status(401).json({ error: "Ikke autentisert" });
        return;
      }

      res.json({
        user: {
          id: result.user.id,
          openId: result.user.openId,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          tenantId: result.user.tenantId,
        }
      });
    } catch (error) {
      console.error("[Auth] Get user failed", error);
      res.status(500).json({ error: "Kunne ikke hente bruker" });
    }
  });
}
