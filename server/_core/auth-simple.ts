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
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logAuth, logError, logInfo, logDb } from "./logger";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

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
    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        logAuth.loginFailed(email || 'no-email', 'Missing credentials', clientIp);
        res.status(400).json({ error: "E-post og passord er påkrevd" });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        logAuth.loginFailed(email, 'Invalid email format', clientIp);
        res.status(400).json({ error: "Ugyldig e-postformat" });
        return;
      }

      // Get database connection
      const dbInstance = await db.getDb();
      if (!dbInstance) {
        logDb.error('login', new Error('Database connection unavailable'));
        res.status(500).json({ error: "Database ikke tilgjengelig. Vennligst prøv igjen senere." });
        return;
      }

      // Get user from database
      let user;
      try {
        const result = await dbInstance
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        user = result[0];
      } catch (dbError) {
        logDb.error('user lookup', dbError as Error);
        res.status(500).json({ error: "Database feil. Vennligst prøv igjen senere." });
        return;
      }

      if (!user) {
        logAuth.loginFailed(email, 'User not found', clientIp);
        // Use generic message to prevent email enumeration
        res.status(401).json({ error: "Ugyldig e-post eller passord" });
        return;
      }

      // Check if password hash exists
      if (!user.passwordHash) {
        logAuth.loginFailed(email, 'No password hash', clientIp);
        res.status(401).json({ error: "Denne kontoen bruker en annen innloggingsmetode" });
        return;
      }

      // Verify password
      let isValidPassword = false;
      try {
        isValidPassword = await authService.verifyPassword(password, user.passwordHash);
      } catch (bcryptError) {
        logError('[Auth] Password verification error', bcryptError as Error, { email });
        res.status(500).json({ error: "Autentiseringsfeil. Vennligst prøv igjen." });
        return;
      }

      if (!isValidPassword) {
        logAuth.loginFailed(email, 'Invalid password', clientIp);
        res.status(401).json({ error: "Ugyldig e-post eller passord" });
        return;
      }

      // Check if user is active
      if (!user.isActive) {
        logAuth.loginFailed(email, 'Account deactivated', clientIp);
        res.status(403).json({ 
          error: "Kontoen er deaktivert. Vennligst kontakt administrator." 
        });
        return;
      }

      // Create session token (30 days)
      const sessionToken = await authService.createSessionToken({
        openId: user.openId,
        appId: ENV.appId,
        name: user.name || email,
        email: user.email || undefined,
      }, {
        expiresInMs: THIRTY_DAYS_MS,
      });

      // Create refresh token (90 days)
      const { createRefreshToken } = await import("./refresh-tokens");
      const refreshToken = await createRefreshToken(
        user.id,
        user.tenantId,
        req.ip,
        req.headers["user-agent"]
      );

      // Set cookies
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: THIRTY_DAYS_MS });
      res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, { ...cookieOptions, maxAge: 90 * 24 * 60 * 60 * 1000 }); // 90 days

      // Log successful login
      logAuth.loginSuccess(email, clientIp);

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
      logError('[Auth] Login failed with unexpected error', error as Error, { 
        email: req.body?.email,
        ip: clientIp 
      });
      res.status(500).json({ error: "Innlogging feilet. Vennligst prøv igjen senere." });
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

      if (password.length < 6) {
        res.status(400).json({ error: "Passordet må være minst 6 tegn" });
        return;
      }

      const dbInstance = await db.getDb();
      if (!dbInstance) {
        res.status(500).json({ error: "Database ikke tilgjengelig" });
        return;
      }

      // Check if email already exists
      const [existingUser] = await dbInstance
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser) {
        res.status(400).json({ error: "E-postadressen er allerede registrert" });
        return;
      }

      // Create tenant
      const tenantId = `tenant-${nanoid(12)}`;
      const subdomain = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + nanoid(6);
      
      await dbInstance.insert(tenants).values({
        id: tenantId,
        name: salonName || `${name || email.split('@')[0]}'s Salong`,
        subdomain,
        email,
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
        email,
        name: name || email.split('@')[0],
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
        name: name || email.split('@')[0],
        email,
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
      console.error("[Auth] Registration failed", error);
      res.status(500).json({ error: "Registrering feilet" });
    }
  });

  // Forgot password endpoint
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      
      if (!email) {
        res.status(400).json({ error: "E-post er påkrevd" });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ error: "Ugyldig e-postformat" });
        return;
      }
      
      const dbInstance = await db.getDb();
      if (!dbInstance) {
        logDb.error('forgot-password', new Error('Database not available'));
        res.status(500).json({ error: "Database ikke tilgjengelig" });
        return;
      }
      
      // Check if user exists
      const [user] = await dbInstance
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      // Always return success to prevent email enumeration
      if (user) {
        logInfo(`[Auth] Password reset requested for ${email}`, { ip: clientIp });
        
        // Create a temporary reset token (valid for 1 hour)
        const resetToken = nanoid(32);
        const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        
        // Store token in session (or you could create a password_resets table)
        // For now, we'll use JWT to encode the reset token
        const resetJWT = await authService.createSessionToken({
          openId: user.openId,
          appId: ENV.appId,
          name: user.name || email,
          email: user.email || undefined,
        }, {
          expiresInMs: 60 * 60 * 1000, // 1 hour
        });
        
        // Send password reset email
        try {
          const { sendEmail } = await import("../email");
          const baseUrl = process.env.VITE_APP_URL || "http://localhost:3000";
          const resetUrl = `${baseUrl}/reset-password?token=${resetJWT}`;
          
          await sendEmail({
            to: email,
            subject: "Tilbakestill passord - Stylora",
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
                    <h1 style="color: #2563eb; margin-bottom: 20px;">Tilbakestill passord</h1>
                    <p>Hei ${user.name || 'bruker'},</p>
                    <p>Vi har mottatt en forespørsel om å tilbakestille passordet ditt for Stylora-kontoen din.</p>
                    <p>Klikk på knappen nedenfor for å tilbakestille passordet ditt:</p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                        Tilbakestill passord
                      </a>
                    </div>
                    <p style="color: #666; font-size: 14px;">
                      Eller kopier og lim inn denne lenken i nettleseren din:
                      <br>
                      <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
                    </p>
                    <p style="color: #666; font-size: 14px; margin-top: 30px;">
                      <strong>Viktig:</strong> Denne lenken utløper om 1 time.
                    </p>
                    <p style="color: #666; font-size: 14px;">
                      Hvis du ikke ba om å tilbakestille passordet ditt, kan du ignorere denne e-posten.
                    </p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px; text-align: center;">
                      © ${new Date().getFullYear()} Stylora. Alle rettigheter reservert.
                    </p>
                  </div>
                </body>
              </html>
            `,
          });
          
          logInfo(`[Auth] Password reset email sent to ${email}`);
        } catch (emailError) {
          logError('[Auth] Failed to send password reset email', emailError as Error, { email });
          // Don't reveal that email sending failed
        }
      } else {
        logInfo(`[Auth] Password reset requested for non-existent email: ${email}`, { ip: clientIp });
      }
      
      // Always return success message to prevent email enumeration
      res.json({ 
        success: true, 
        message: "Hvis e-postadressen finnes i systemet, vil du motta en e-post med instruksjoner." 
      });
    } catch (error) {
      logError("[Auth] Forgot password error", error as Error);
      res.status(500).json({ error: "Noe gikk galt. Vennligst prøv igjen senere." });
    }
  });

  // Reset password endpoint
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;
      const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';

      if (!token || !newPassword) {
        res.status(400).json({ error: "Token og nytt passord er påkrevd" });
        return;
      }

      // Validate password strength
      if (newPassword.length < 6) {
        res.status(400).json({ error: "Passordet må være minst 6 tegn" });
        return;
      }

      if (!/[A-Z]/.test(newPassword)) {
        res.status(400).json({ error: "Passordet må inneholde minst én stor bokstav" });
        return;
      }

      if (!/[a-z]/.test(newPassword)) {
        res.status(400).json({ error: "Passordet må inneholde minst én liten bokstav" });
        return;
      }

      if (!/[0-9]/.test(newPassword)) {
        res.status(400).json({ error: "Passordet må inneholde minst ett tall" });
        return;
      }

      // Verify the reset token (it's a JWT)
      const session = await authService.verifySession(token);
      if (!session || !session.email) {
        logAuth.loginFailed(session?.email || 'unknown', 'Invalid reset token', clientIp);
        res.status(401).json({ error: "Ugyldig eller utløpt tilbakestillingslenke" });
        return;
      }

      const dbInstance = await db.getDb();
      if (!dbInstance) {
        logDb.error('reset-password', new Error('Database not available'));
        res.status(500).json({ error: "Database ikke tilgjengelig" });
        return;
      }

      // Get user by email
      const [user] = await dbInstance
        .select()
        .from(users)
        .where(eq(users.email, session.email))
        .limit(1);

      if (!user) {
        logAuth.loginFailed(session.email, 'User not found for reset', clientIp);
        res.status(401).json({ error: "Bruker ikke funnet" });
        return;
      }

      // Hash the new password
      const newPasswordHash = await authService.hashPassword(newPassword);

      // Update the user's password
      await dbInstance
        .update(users)
        .set({ 
          passwordHash: newPasswordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      logInfo(`[Auth] Password reset successful for ${session.email}`, { ip: clientIp });

      res.json({ 
        success: true,
        message: "Passordet er tilbakestilt. Du kan nå logge inn med det nye passordet." 
      });
    } catch (error) {
      logError("[Auth] Reset password error", error as Error);
      res.status(500).json({ error: "Kunne ikke tilbakestille passord. Vennligst prøv igjen." });
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
