/**
 * Security Middleware & Utilities
 * Provides comprehensive security hardening for the application
 */

import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";

/**
 * Rate Limiting Configuration
 */

// General API rate limiter
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: "For mange forespørsler. Vennligst prøv igjen senere.",
    retryAfter: 15,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown";
  },
});

// Strict rate limiter for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: "For mange innloggingsforsøk. Vennligst prøv igjen om 15 minutter.",
    retryAfter: 15,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Rate limiter for password reset
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    error: "For mange tilbakestillingsforespørsler. Vennligst prøv igjen senere.",
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for public booking
export const bookingRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    error: "For mange bestillinger. Vennligst prøv igjen senere.",
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Input Sanitization
 */

const htmlEntities: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char] || char);
}

export function sanitizeString(input: string): string {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .slice(0, 10000);
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === "string"
          ? sanitizeString(item)
          : typeof item === "object" && item !== null
          ? sanitizeObject(item)
          : item
      );
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized as T;
}

export function sanitizeRequestBody(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  next();
}

/**
 * SQL Injection Prevention
 */

const sqlInjectionPatterns = [
  /(\s|^)(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|EXECUTE|UNION|OR|AND)\s/i,
  /--/,
  /;/,
  /\/\*/,
  /\*\//,
  /xp_/i,
  /0x[0-9a-f]+/i,
];

export function containsSqlInjection(input: string): boolean {
  if (typeof input !== "string") return false;
  return sqlInjectionPatterns.some((pattern) => pattern.test(input));
}

export function sqlInjectionProtection(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const checkValue = (value: any): boolean => {
    if (typeof value === "string") {
      return containsSqlInjection(value);
    }
    if (Array.isArray(value)) {
      return value.some(checkValue);
    }
    if (typeof value === "object" && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };

  const hasSqlInjection =
    checkValue(req.body) ||
    checkValue(req.query) ||
    checkValue(req.params);

  if (hasSqlInjection) {
    console.warn("SQL injection attempt detected:", {
      ip: req.ip,
      path: req.path,
    });
    return res.status(400).json({ error: "Ugyldig forespørsel" });
  }
  next();
}

/**
 * XSS Prevention
 */

const xssPatterns = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /\bon\w+\s*=/gi, // Fixed: added word boundary \b
  /vbscript:/gi,
  /expression\s*\(/gi,
];

export function containsXss(input: string): boolean {
  if (typeof input !== "string") return false;
  return xssPatterns.some((pattern) => pattern.test(input));
}

export function xssProtection(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const checkValue = (value: any): boolean => {
    if (typeof value === "string") {
      return containsXss(value);
    }
    if (Array.isArray(value)) {
      return value.some(checkValue);
    }
    if (typeof value === "object" && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };

  if (checkValue(req.body)) {
    console.warn("XSS attempt detected:", { ip: req.ip, path: req.path });
    return res.status(400).json({ error: "Ugyldig innhold oppdaget" });
  }
  next();
}

/**
 * Security Headers
 */
export function securityHeaders(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self), payment=(self)"
  );
  next();
}

/**
 * Request Validation
 */

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Fixed: Norwegian phone validation
export function isValidNorwegianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, "");
  // Norwegian phones: +47 optional, then 8 digits starting with 2-9
  return /^(\+47)?[2-9]\d{7}$/.test(cleaned);
}

export function isStrongPassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (password.length < 8) {
    errors.push("Passordet må være minst 8 tegn");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Passordet må inneholde minst én stor bokstav");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Passordet må inneholde minst én liten bokstav");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Passordet må inneholde minst ett tall");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Passordet må inneholde minst ett spesialtegn");
  }
  return { valid: errors.length === 0, errors };
}

/**
 * CSRF Token Generation
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * IP Blocking
 */
const blockedIps = new Set<string>();
const ipAttempts = new Map<string, { count: number; lastAttempt: number }>();

export function trackFailedAttempt(ip: string): void {
  const now = Date.now();
  const record = ipAttempts.get(ip) || { count: 0, lastAttempt: now };
  if (now - record.lastAttempt > 60 * 60 * 1000) {
    record.count = 0;
  }
  record.count++;
  record.lastAttempt = now;
  ipAttempts.set(ip, record);
  if (record.count >= 10) {
    blockedIps.add(ip);
    console.warn(`IP blocked due to too many failed attempts: ${ip}`);
  }
}

export function isIpBlocked(ip: string): boolean {
  return blockedIps.has(ip);
}

export function unblockIp(ip: string): void {
  blockedIps.delete(ip);
  ipAttempts.delete(ip);
}

export function ipBlockingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const ip = req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown";
  if (isIpBlocked(ip)) {
    return res.status(403).json({ error: "Tilgang nektet" });
  }
  next();
}

/**
 * Audit Logging
 */
export interface AuditLogEntry {
  timestamp: Date;
  userId?: number;
  tenantId?: string;
  action: string;
  resource: string;
  resourceId?: string | number;
  ip: string;
  userAgent?: string;
  details?: Record<string, any>;
  success: boolean;
}

const auditLogs: AuditLogEntry[] = [];

export function logAuditEvent(entry: Omit<AuditLogEntry, "timestamp">): void {
  const logEntry: AuditLogEntry = { ...entry, timestamp: new Date() };
  auditLogs.push(logEntry);
  if (auditLogs.length > 10000) {
    auditLogs.shift();
  }
  if (process.env.NODE_ENV === "development") {
    console.log("Audit:", JSON.stringify(logEntry, null, 2));
  }
}

export function getAuditLogs(filter?: Partial<AuditLogEntry>): AuditLogEntry[] {
  if (!filter) return [...auditLogs];
  return auditLogs.filter((log) => {
    for (const [key, value] of Object.entries(filter)) {
      if (log[key as keyof AuditLogEntry] !== value) {
        return false;
      }
    }
    return true;
  });
}

export const security = {
  apiRateLimiter,
  authRateLimiter,
  passwordResetRateLimiter,
  bookingRateLimiter,
  escapeHtml,
  sanitizeString,
  sanitizeObject,
  sanitizeRequestBody,
  sqlInjectionProtection,
  xssProtection,
  securityHeaders,
  ipBlockingMiddleware,
  isValidEmail,
  isValidNorwegianPhone,
  isStrongPassword,
  containsSqlInjection,
  containsXss,
  generateCsrfToken,
  trackFailedAttempt,
  isIpBlocked,
  unblockIp,
  logAuditEvent,
  getAuditLogs,
};

export default security;
