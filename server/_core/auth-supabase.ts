/**
 * Production-ready authentication system with Supabase
 * Includes password hashing, email verification, and password reset
 */

import { SignJWT, jwtVerify } from "jose";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Request, Response, Express } from "express";
import { parse as parseCookieHeader } from "cookie";
import * as db from "../db";
import { ENV } from "./env";
import { getSessionCookieOptions } from "./cookies";
import { getSupabaseClient, getSupabaseAdmin } from "./supabase";
import bcrypt from "bcrypt";

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
 * Supabase authentication service
 */
class SupabaseAuthService {
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

export const supabaseAuthService = new SupabaseAuthService();

/**
 * Register Supabase authentication routes
 */
export function registerSupabaseAuthRoutes(app: Express) {
  // Register endpoint
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({ error: "Password must be at least 8 characters" });
        return;
      }

      const supabase = getSupabaseAdmin();

      // Create user in Supabase
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: false, // Require email verification
        user_metadata: {
          name: name || email.split('@')[0],
        },
      });

      if (authError || !authData.user) {
        console.error("[Auth] Supabase registration error:", authError);
        res.status(500).json({ error: "Failed to create user" });
        return;
      }

      // Create user in our database
      const openId = authData.user.id;
      await db.upsertUser({
        openId,
        tenantId: 'default-tenant', // TODO: Implement proper tenant selection
        role: 'employee',
        name: name || email.split('@')[0],
        email,
        loginMethod: 'email',
        lastSignedIn: new Date(),
      });

      res.json({ 
        success: true,
        message: "Registration successful. Please check your email to verify your account.",
        userId: authData.user.id,
      });
    } catch (error) {
      console.error("[Auth] Registration failed", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      // Authenticate with Supabase
      const supabase = getSupabaseClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        console.error("[Auth] Login error:", authError);
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      // Check if email is verified
      if (!authData.user.email_confirmed_at) {
        res.status(403).json({ error: "Please verify your email before logging in" });
        return;
      }

      // Get or create user in our database
      const openId = authData.user.id;
      let user = await db.getUserByOpenId(openId);
      
      if (!user) {
        await db.upsertUser({
          openId,
          tenantId: 'default-tenant',
          role: 'employee',
          name: authData.user.user_metadata?.name || email.split('@')[0],
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
      const sessionToken = await supabaseAuthService.createSessionToken({
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
      const result = await supabaseAuthService.authenticateRequest(req);
      
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

  // Password reset request endpoint
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: "Email is required" });
        return;
      }

      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${req.protocol}://${req.get('host')}/reset-password`,
      });

      if (error) {
        console.error("[Auth] Password reset error:", error);
        // Don't reveal if email exists or not for security
      }

      res.json({ 
        success: true,
        message: "If an account exists with that email, a password reset link has been sent.",
      });
    } catch (error) {
      console.error("[Auth] Password reset failed", error);
      res.status(500).json({ error: "Password reset failed" });
    }
  });

  // Update password endpoint (after reset)
  app.post("/api/auth/update-password", async (req: Request, res: Response) => {
    try {
      const { access_token, new_password } = req.body;

      if (!access_token || !new_password) {
        res.status(400).json({ error: "Access token and new password are required" });
        return;
      }

      if (new_password.length < 8) {
        res.status(400).json({ error: "Password must be at least 8 characters" });
        return;
      }

      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.updateUser({
        password: new_password,
      });

      if (error) {
        console.error("[Auth] Update password error:", error);
        res.status(400).json({ error: "Failed to update password" });
        return;
      }

      res.json({ 
        success: true,
        message: "Password updated successfully",
      });
    } catch (error) {
      console.error("[Auth] Update password failed", error);
      res.status(500).json({ error: "Failed to update password" });
    }
  });
}
