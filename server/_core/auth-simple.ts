/**
 * Simple JWT-based authentication system
 * Replaces Manus OAuth for external deployment
 * 
 * This is a basic implementation. For production, consider:
 * - Adding password hashing with bcrypt
 * - Implementing refresh tokens
 * - Adding rate limiting
 * - Using a proper OAuth provider (Auth0, Supabase, etc.)
 */

import { SignJWT, jwtVerify } from "jose";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Request, Response, Express } from "express";
import { parse as parseCookieHeader } from "cookie";
import * as db from "../db";
import { ENV } from "./env";
import { getSessionCookieOptions } from "./cookies";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
  email?: string;
  impersonatedTenantId?: string | null;
};

/**
 * Simple authentication service
 */
class AuthService {
  private getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }

  /**
   * Create a session token
   */
  async createSessionToken(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
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
      console.warn("[Auth] Missing session cookie");
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
        console.warn("[Auth] Session payload missing required fields");
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
      console.warn("[Auth] User not found in database");
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

/**
 * Register simple authentication routes
 * 
 * IMPORTANT: This is a placeholder implementation.
 * For production, you should implement:
 * 1. Email/password registration
 * 2. Email verification
 * 3. Password reset
 * 4. Or integrate with a proper OAuth provider (Google, GitHub, etc.)
 */
export function registerAuthRoutes(app: Express) {
  // Simple login endpoint (for testing only)
  // In production, replace this with proper authentication
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      // TODO: Implement proper password verification
      // For now, this is a placeholder that accepts any credentials
      console.warn("[Auth] WARNING: Using placeholder authentication - implement proper auth before production!");

      // Generate a unique openId (in production, this would come from your auth provider)
      const openId = `user_${email.replace('@', '_').replace('.', '_')}`;

      // Check if user exists or create new user
      let user = await db.getUserByOpenId(openId);
      
      if (!user) {
        // Create new user
        await db.upsertUser({
          openId,
          tenantId: 'default-tenant', // TODO: Implement proper tenant selection
          role: 'employee',
          name: name || email.split('@')[0],
          email,
          loginMethod: 'email',
          lastSignedIn: new Date(),
        });
        
        user = await db.getUserByOpenId(openId);
      }

      if (!user) {
        res.status(500).json({ error: "Failed to create user" });
        return;
      }

      // Create session token
      const sessionToken = await authService.createSessionToken({
        openId: user.openId,
        appId: ENV.appId,
        name: user.name || email,
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
        }
      });
    } catch (error) {
      console.error("[Auth] Login failed", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });

  // Get current user endpoint
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const result = await authService.authenticateRequest(req);
      
      if (!result) {
        res.status(401).json({ error: "Not authenticated" });
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
      res.status(500).json({ error: "Failed to get user" });
    }
  });
}
