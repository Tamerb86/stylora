/**
 * Simple email/password authentication system
 * Uses bcrypt for password hashing and JWT for sessions
 */

import { SignJWT, jwtVerify } from "jose";
import {
  COOKIE_NAME,
  THIRTY_DAYS_MS,
  NINETY_DAYS_MS,
  REFRESH_TOKEN_COOKIE_NAME,
  ONE_YEAR_MS,
} from "@shared/const";
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
 */
function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed || !EMAIL_REGEX.test(trimmed)) return null;
  return trimmed.toLowerCase();
}

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
  email?: string;
  impersonatedTenantId?: string | null;
};

const SALT_ROUNDS = 10;

class AuthService {
  private getSessionSecret() {
    return new TextEncoder().encode(ENV.cookieSecret);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async createSessionToken(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const expiresInMs = options.expiresInMs ?? THIRTY_DAYS_MS;
    const expirationSeconds = Math.floor((Date.now() + expiresInMs) / 1000);

    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name,
      email: payload.email,
      impersonatedTenantId: payload.impersonatedTenantId ?? null,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(this.getSessionSecret());
  }

  async verifySession(cookieValue?: string | null): Promise<SessionPayload | null> {
    if (!cookieValue) return null;
    try {
      const { payload } = await jwtVerify(cookieValue, this.getSessionSecret(), {
        algorithms: ["HS256"],
      });

      const { openId, appId, name, email, impersonatedTenantId } =
        payload as Record<string, unknown>;

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
        email: typeof email === "string" ? email : undefined,
        impersonatedTenantId:
          typeof impersonatedTenantId === "string"
            ? impersonatedTenantId
            : null,
      };
    } catch {
      return null;
    }
  }

  private parseCookies(cookieHeader?: string) {
    if (!cookieHeader) return new Map<string, string>();
    return new Map(Object.entries(parseCookieHeader(cookieHeader)));
  }

  async authenticateRequest(req: Request) {
    const cookies = this.parseCookies(req.headers.cookie);
    const session = await this.verifySession(cookies.get(COOKIE_NAME));
    if (!session) return null;

    let user = await db.getUserByOpenId(session.openId);
    if (!user) return null;

    if (session.impersonatedTenantId && session.openId === ENV.ownerOpenId) {
      user = { ...user, tenantId: session.impersonatedTenantId };
    }

    await db.upsertUser({
      openId: user.openId,
      tenantId: user.tenantId,
      role: user.role,
      lastSignedIn: new Date(),
    });

    return { user, impersonatedTenantId: session.impersonatedTenantId ?? null };
  }
}

export const authService = new AuthService();
export const authenticateRequest = (req: Request) =>
  authService.authenticateRequest(req);

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: "E-post og passord er påkrevd" });
        return;
      }

      const trimmedEmail = validateEmail(email);
      if (!trimmedEmail) {
        res.status(400).json({ error: "Ugyldig e-postadresse" });
        return;
      }

      // DB connect
      let dbInstance;
      try {
        dbInstance = await db.getDb();
        if (!dbInstance) throw new Error("DB null");
      } catch {
        res.status(500).json({ error: "Database utilgjengelig" });
        return;
      }

      let user;
      try {
        [user] = await dbInstance
          .select()
          .from(users)
          .where(sql`LOWER(${users.email}) = LOWER(${trimmedEmail})`)
          .limit(1);
      } catch {
        res.status(500).json({ error: "Databasefeil" });
        return;
      }

      if (!user || !user.passwordHash) {
        res.status(401).json({ error: "Ugyldig e-post eller passord" });
        return;
      }

      if (!(await authService.verifyPassword(password, user.passwordHash))) {
        res.status(401).json({ error: "Ugyldig e-post eller passord" });
        return;
      }

      let tenant;
      try {
        tenant = await db.getTenantById(user.tenantId);
        if (!tenant) throw new Error("Tenant missing");
      } catch {
        res.status(500).json({ error: "Kontokonfigurasjonsfeil" });
        return;
      }

      const sessionToken = await authService.createSessionToken(
        {
          openId: user.openId,
          appId: ENV.appId,
          name: user.name || trimmedEmail,
          email: user.email || undefined,
        },
        { expiresInMs: THIRTY_DAYS_MS }
      );

      let refreshToken: string | null = null;
      try {
        const { createRefreshToken } = await import("./refresh-tokens");
        refreshToken = await createRefreshToken(
          user.id,
          user.tenantId,
          req.ip,
          req.headers["user-agent"]
        );
      } catch {}

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: THIRTY_DAYS_MS,
      });

      if (refreshToken) {
        res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
          ...cookieOptions,
          maxAge: NINETY_DAYS_MS,
        });
      }

      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Uventet feil" });
    }
  });
}
