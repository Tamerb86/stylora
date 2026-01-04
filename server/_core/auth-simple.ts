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
import { logAuth, logError, logInfo, logDb } from "./logger";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

// Email validation regex - RFC 5322 simplified
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  async verifySession(
    cookieValue?: string | null
  ): Promise<SessionPayload | null> {
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
    } catch (error) {
      logAuth.sessionInvalid(String(error));
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

    // Handle impersonation
    if (session.impersonatedTenantId && session.openId === ENV.ownerOpenId) {
      user = { ...user, tenantId: session.impersonatedTenantId };
    }

    await db.upsertUser({
      openId: user.openId,
      tenantId: user.tenantId,
      role: user.role,
      lastSignedIn: new Date(),
    });

    return {
      user,
      impersonatedTenantId: session.impersonatedTenantId ?? null,
    };
  }
}

export const authService = new AuthService();
export const authenticateRequest = (req: Request) =>
  authService.authenticateRequest(req);

export function registerAuthRoutes(app: Express) {
  // Login endpoint
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const clientIp =
      (req.ip as string) ||
      (req.headers["x-forwarded-for"] as string) ||
      "unknown";

    try {
      const { email, password } = req.body ?? {};

      // Validate input
      if (!email || !password) {
        logAuth.loginFailed(
          String(email || "no-email"),
          "Missing credentials",
          clientIp
        );
        res.status(400).json({ 
          error: "E-post og passord er påkrevd",
          messageKey: "errors.missingCredentials"
        });
        return;
      }

      const trimmedEmail = validateEmail(String(email));
      if (!trimmedEmail) {
        logAuth.loginFailed(String(email), "Invalid email format", clientIp);
        res.status(400).json({ 
          error: "Ugyldig e-postadresse",
          messageKey: "errors.invalidEmailFormat"
        });
        return;
      }

      // DB instance
      let dbInstance: Awaited<ReturnType<typeof db.getDb>> | null = null;
      try {
        dbInstance = await db.getDb();
        if (!dbInstance) throw new Error("Database connection returned null");
      } catch (dbError) {
        logDb.error("login-db-connect", dbError as Error);
        res.status(500).json({
          error: "Tjenesten er midlertidig utilgjengelig",
          messageKey: "errors.databaseUnavailable",
          hint: "Vi har problemer med å koble til databasen. Prøv igjen om litt.",
          hintKey: "hints.databaseConnectionIssue"
        });
        return;
      }

      // User lookup (case-insensitive)
      let user: any;
      try {
        [user] = await dbInstance
          .select()
          .from(users)
          .where(sql`LOWER(${users.email}) = LOWER(${trimmedEmail})`)
          .limit(1);
      } catch (queryError) {
        logDb.error("login-user-lookup", queryError as Error);
        res.status(500).json({
          error: "En databasefeil oppstod",
          messageKey: "errors.databaseError",
          hint: "Vennligst prøv igjen senere.",
          hintKey: "hints.tryAgainLater"
        });
        return;
      }

      // Generic message to prevent enumeration
      if (!user || !user.passwordHash) {
        logAuth.loginFailed(
          trimmedEmail,
          "User not found or no password",
          clientIp
        );
        res.status(401).json({
          error: "Ugyldig e-post eller passord",
          messageKey: "errors.invalidCredentials",
          hint: "Sjekk e-post og passord og prøv igjen.",
          hintKey: "hints.checkEmailAndPassword"
        });
        return;
      }

      // Password verify
      let ok = false;
      try {
        ok = await authService.verifyPassword(
          String(password),
          user.passwordHash
        );
      } catch (bcryptError) {
        logError("[Auth] Password verification error", bcryptError as Error, {
          email: trimmedEmail,
          ip: clientIp,
        });
        res.status(500).json({ 
          error: "Autentiseringsfeil. Prøv igjen.",
          messageKey: "errors.authenticationFailed"
        });
        return;
      }

      if (!ok) {
        logAuth.loginFailed(trimmedEmail, "Invalid password", clientIp);
        res.status(401).json({
          error: "Ugyldig e-post eller passord",
          messageKey: "errors.invalidCredentials",
          hint: "Sjekk e-post og passord og prøv igjen.",
          hintKey: "hints.checkEmailAndPassword"
        });
        return;
      }

      // Account active check (if field exists)
      if (user.isActive === false) {
        logAuth.loginFailed(trimmedEmail, "Account deactivated", clientIp);
        res.status(403).json({
          error: "Kontoen er deaktivert",
          messageKey: "errors.accountDeactivated",
          hint: "Kontakt support for å aktivere kontoen.",
          hintKey: "hints.contactSupport"
        });
        return;
      }

      // Tenant check (if you use multi-tenant)
      try {
        const tenant = await db.getTenantById(user.tenantId);
        if (!tenant) {
          logDb.error("login-tenant-missing", new Error("Tenant not found"));
          res.status(500).json({
            error: "Kontokonfigurasjonsfeil",
            messageKey: "errors.accountConfigError",
            hint: "Kontakt support for hjelp.",
            hintKey: "hints.contactSupport"
          });
          return;
        }

        if (tenant.status === "suspended" || tenant.status === "canceled") {
          logAuth.loginFailed(trimmedEmail, `Tenant ${tenant.status}`, clientIp);
          res.status(403).json({
            error:
              tenant.status === "suspended"
                ? "Abonnementet er suspendert"
                : "Abonnementet er avsluttet",
            messageKey:
              tenant.status === "suspended"
                ? "errors.tenantSuspended"
                : "errors.tenantCanceled",
            hint: "Kontakt support for å reaktivere abonnementet.",
            hintKey: "hints.reactivateSubscription"
          });
          return;
        }
      } catch (tenantError) {
        logDb.error("login-tenant-fetch", tenantError as Error);
        res.status(500).json({
          error: "Kunne ikke hente kontoinformasjon",
          messageKey: "errors.couldNotFetchAccount",
          hint: "Prøv igjen senere.",
          hintKey: "hints.tryAgainLater"
        });
        return;
      }

      // Create session
      const sessionToken = await authService.createSessionToken(
        {
          openId: user.openId,
          appId: ENV.appId,
          name: user.name || trimmedEmail,
          email: user.email || undefined,
        },
        { expiresInMs: THIRTY_DAYS_MS }
      );

      // Create refresh token (optional)
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
        logError("[Auth] Failed to create refresh token", refreshError as Error, {
          email: trimmedEmail,
          ip: clientIp,
        });
      }

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

      logAuth.loginSuccess(trimmedEmail, clientIp);

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
        },
      });
    } catch (error) {
      logError("[Auth] Login failed with unexpected error", error as Error, {
        email: req.body?.email,
        ip: clientIp,
      });
      res.status(500).json({
        error: "En uventet feil oppstod",
        hint: "Vennligst prøv igjen. Hvis problemet vedvarer, kontakt support.",
      });
    }
  });

  // Demo login endpoint
  app.post("/api/auth/demo-login", async (req: Request, res: Response) => {
    try {
      const DEMO_EMAIL = "demo@stylora.no";

      const dbInstance = await db.getDb();
      if (!dbInstance) {
        res.status(500).json({ error: "Database ikke tilgjengelig" });
        return;
      }

      const [user] = await dbInstance
        .select()
        .from(users)
        .where(sql`LOWER(${users.email}) = LOWER(${DEMO_EMAIL})`)
        .limit(1);

      if (!user) {
        res.status(404).json({ error: "Demo-konto ikke funnet" });
        return;
      }

      const sessionToken = await authService.createSessionToken(
        {
          openId: user.openId,
          appId: ENV.appId,
          name: user.name || "Demo User",
          email: user.email || undefined,
        },
        { expiresInMs: ONE_YEAR_MS }
      );

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
        },
      });
    } catch (error) {
      logError("[Auth] Demo login failed", error as Error);
      res.status(500).json({ error: "Demo-innlogging feilet" });
    }
  });

  // Register endpoint (kept minimal; adjust as needed)
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, name, salonName, phone } = req.body ?? {};

      if (!email || !password) {
        res.status(400).json({ error: "E-post og passord er påkrevd" });
        return;
      }

      const trimmedEmail = validateEmail(String(email));
      if (!trimmedEmail) {
        res.status(400).json({ error: "Ugyldig e-postadresse" });
        return;
      }

      if (String(password).length < 6) {
        res.status(400).json({ error: "Passordet må være minst 6 tegn" });
        return;
      }

      const dbInstance = await db.getDb();
      if (!dbInstance) {
        res.status(500).json({ error: "Database ikke tilgjengelig" });
        return;
      }

      // Check if email exists (case-insensitive)
      const [existingUser] = await dbInstance
        .select()
        .from(users)
        .where(sql`LOWER(${users.email}) = LOWER(${trimmedEmail})`)
        .limit(1);

      if (existingUser) {
        res.status(400).json({
          error: "E-postadressen er allerede registrert",
          hint: "Logg inn eller bruk 'Glemt passord?'",
        });
        return;
      }

      // Create tenant
      const tenantId = `tenant-${nanoid(12)}`;
      const subdomain =
        trimmedEmail
          .split("@")[0]
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "") +
        "-" +
        nanoid(6);

      await dbInstance.insert(tenants).values({
        id: tenantId,
        name: salonName || `${name || trimmedEmail.split("@")[0]}'s Salong`,
        subdomain,
        email: trimmedEmail,
        phone: phone || null,
        status: "trial",
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        emailVerified: true,
        emailVerifiedAt: new Date(),
        onboardingCompleted: false,
        onboardingStep: "welcome",
      });

      // Create user
      const passwordHash = await authService.hashPassword(String(password));
      const openId = `user-${nanoid(16)}`;

      await dbInstance.insert(users).values({
        tenantId,
        openId,
        email: trimmedEmail,
        name: name || trimmedEmail.split("@")[0],
        phone: phone || null,
        passwordHash,
        role: "owner",
        loginMethod: "email",
        isActive: true,
        commissionType: "percentage",
        commissionRate: "50.00",
        uiMode: "advanced",
        onboardingCompleted: false,
      });

      const sessionToken = await authService.createSessionToken(
        {
          openId,
          appId: ENV.appId,
          name: name || trimmedEmail.split("@")[0],
          email: trimmedEmail,
        },
        { expiresInMs: ONE_YEAR_MS }
      );

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      res.json({ success: true, message: "Registrering vellykket!" });
    } catch (error) {
      logError("[Auth] Registration failed", error as Error);
      res.status(500).json({ error: "Registrering feilet" });
    }
  });

  // Forgot password (safe placeholder: don't reveal if user exists)
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body ?? {};
      const trimmedEmail = email ? validateEmail(String(email)) : null;

      // Always respond success (prevent enumeration)
      if (trimmedEmail) {
        logInfo("[Auth] Password reset requested", { email: trimmedEmail });
        // TODO: implement real reset flow (password_resets table + email sending)
      } else {
        logInfo("[Auth] Password reset requested (invalid email)");
      }

      res.json({
        success: true,
        message:
          "Hvis e-postadressen finnes i systemet, vil du motta en e-post med instruksjoner.",
      });
    } catch (error) {
      logError("[Auth] Forgot password error", error as Error);
      res.status(500).json({ error: "Noe gikk galt" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      const cookies = parseCookieHeader(req.headers.cookie || "");
      const refreshToken = (cookies as any)[REFRESH_TOKEN_COOKIE_NAME];

      if (refreshToken) {
        const { revokeRefreshToken } = await import("./refresh-tokens");
        await revokeRefreshToken(refreshToken, "User logout");
      }

      const cookieOptions = getSessionCookieOptions(req);
      res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });

      res.json({ success: true });
    } catch (error) {
      logError("[Auth] Logout failed", error as Error);
      const cookieOptions = getSessionCookieOptions(req);
      res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      res.json({ success: true });
    }
  });

  // Current user endpoint
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
        },
      });
    } catch (error) {
      logError("[Auth] Get user failed", error as Error);
      res.status(500).json({ error: "Kunne ikke hente bruker" });
    }
  });
}
