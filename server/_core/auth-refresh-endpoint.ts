/**
 * Refresh Token Endpoint
 * Handles automatic session renewal using refresh tokens
 */

import type { Request, Response, Express } from "express";
import { parse as parseCookieHeader } from "cookie";
import {
  COOKIE_NAME,
  THIRTY_DAYS_MS,
  REFRESH_TOKEN_COOKIE_NAME,
} from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { authService } from "./auth-simple";
import { getUserFromRefreshToken } from "./refresh-tokens";
import { ENV } from "./env";
import { logger, logAuth } from "./logger";

/**
 * Register refresh token endpoint
 */
export function registerRefreshEndpoint(app: Express) {
  // Refresh token endpoint
  app.post("/api/auth/refresh", async (req: Request, res: Response) => {
    try {
      // Get refresh token from cookie
      const cookies = parseCookieHeader(req.headers.cookie || "");
      const refreshToken = cookies[REFRESH_TOKEN_COOKIE_NAME];

      if (!refreshToken) {
        res.status(401).json({ 
          error: "Refresh token mangler",
          messageKey: "errors.refreshTokenMissing"
        });
        return;
      }

      // Validate refresh token and get user
      const user = await getUserFromRefreshToken(refreshToken);

      if (!user) {
        res.status(401).json({ 
          error: "Ugyldig eller utløpt refresh token",
          messageKey: "errors.invalidRefreshToken"
        });
        return;
      }

      // Check if user is still active
      if (!user.isActive) {
        res.status(403).json({ 
          error: "Kontoen er deaktivert",
          messageKey: "errors.accountDeactivated"
        });
        return;
      }

      // Create new access token (30 days)
      const sessionToken = await authService.createSessionToken(
        {
          openId: user.openId,
          appId: ENV.appId,
          name: user.name || user.email || "User",
          email: user.email || undefined,
        },
        {
          expiresInMs: THIRTY_DAYS_MS,
        }
      );

      // Set new access token cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: THIRTY_DAYS_MS,
      });

      logAuth.loginSuccess(user.email || user.openId, req.ip);
      logger.info("Access token refreshed", {
        userId: user.id,
        tenantId: user.tenantId,
        ipAddress: req.ip,
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
      console.error("[Auth] Token refresh failed", error);
      logger.error("Token refresh failed", error as Error);
      res.status(500).json({ 
        error: "Token-oppdatering feilet",
        messageKey: "errors.tokenRefreshFailed"
      });
    }
  });

  // Logout from all devices endpoint
  app.post("/api/auth/logout-all", async (req: Request, res: Response) => {
    try {
      // Get current user from session
      const { authenticateRequest } = await import("./auth-simple");
      const result = await authenticateRequest(req);

      if (!result) {
        res.status(401).json({ 
          error: "Ikke autentisert",
          messageKey: "errors.notAuthenticated"
        });
        return;
      }

      // Revoke all refresh tokens for this user
      const { revokeAllUserTokens } = await import("./refresh-tokens");
      const count = await revokeAllUserTokens(
        result.user.id,
        "Logout from all devices"
      );

      // Clear cookies
      const cookieOptions = getSessionCookieOptions(req);
      res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
        ...cookieOptions,
        maxAge: -1,
      });

      logger.info("User logged out from all devices", {
        userId: result.user.id,
        revokedTokens: count,
      });

      res.json({
        success: true,
        revokedCount: count,
      });
    } catch (error) {
      console.error("[Auth] Logout all failed", error);
      res.status(500).json({ 
        error: "Utlogging feilet",
        messageKey: "errors.logoutFailed"
      });
    }
  });
}
