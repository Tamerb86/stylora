/**
 * Professional logging system using Winston
 * Replaces console.log with structured logging for production
 */

import winston from "winston";
import path from "path";

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

// Tell winston about our colors
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(
    info =>
      `[${info.timestamp}] ${info.level}: ${info.message}${info.stack ? "\n" + info.stack : ""}`
  )
);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || "development";
  const isDevelopment = env === "development";
  return isDevelopment ? "debug" : "info";
};

// Create logs directory path
const logsDir = path.join(process.cwd(), "logs");

// Define transports based on environment
const transports: winston.transport[] = [
  // Console transport for all environments
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

// Only add file transports in development or if we have write permissions
// In production (Railway, etc.), the filesystem may be read-only
const isDevelopment = (process.env.NODE_ENV || "development") === "development";
if (isDevelopment) {
  try {
    // File transport for errors
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, "error.log"),
        level: "error",
        format,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );

    // File transport for all logs
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, "combined.log"),
        format,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );
  } catch (error) {
    // If file transports fail, just use console
    console.warn(
      "Could not initialize file logging, using console only:",
      error
    );
  }
}

// Create the logger
export const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logger
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper functions for common logging patterns
export const logError = (
  message: string,
  error?: Error | unknown,
  context?: Record<string, unknown>
) => {
  if (error instanceof Error) {
    logger.error(message, {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      ...context,
    });
  } else {
    logger.error(message, { error, ...context });
  }
};

export const logInfo = (message: string, context?: Record<string, unknown>) => {
  logger.info(message, context);
};

export const logWarn = (message: string, context?: Record<string, unknown>) => {
  logger.warn(message, context);
};

export const logDebug = (
  message: string,
  context?: Record<string, unknown>
) => {
  logger.debug(message, context);
};

// Log authentication events
export const logAuth = {
  loginSuccess: (email: string, ip?: string) => {
    logger.info("Login successful", { email, ip, event: "auth.login.success" });
  },
  loginFailed: (email: string, reason: string, ip?: string) => {
    logger.warn("Login failed", {
      email,
      reason,
      ip,
      event: "auth.login.failed",
    });
  },
  logout: (email: string, ip?: string) => {
    logger.info("User logged out", { email, ip, event: "auth.logout" });
  },
  tokenExpired: (email?: string) => {
    logger.info("Session token expired", {
      email,
      event: "auth.token.expired",
    });
  },
};

// Log database events
export const logDb = {
  connected: (database: string) => {
    logger.info("Database connected", { database, event: "db.connected" });
  },
  info: (message: string, context?: Record<string, unknown>) => {
    logger.info(message, { ...context, event: "db.info" });
  },
  error: (operation: string, error?: Error | Record<string, unknown>) => {
    if (error instanceof Error) {
      logError(`Database error during ${operation}`, error, {
        event: "db.error",
      });
    } else {
      logger.error(`Database error during ${operation}`, {
        error,
        event: "db.error",
      });
    }
  },
  queryError: (query: string, error: Error) => {
    logError("Database query failed", error, {
      query,
      event: "db.query.error",
    });
  },
};

// Log payment events
export const logPayment = {
  created: (
    paymentId: number,
    amount: string,
    method: string,
    tenantId: string
  ) => {
    logger.info("Payment created", {
      paymentId,
      amount,
      method,
      tenantId,
      event: "payment.created",
    });
  },
  completed: (paymentId: number, tenantId: string) => {
    logger.info("Payment completed", {
      paymentId,
      tenantId,
      event: "payment.completed",
    });
  },
  failed: (paymentId: number, reason: string, tenantId: string) => {
    logger.error("Payment failed", {
      paymentId,
      reason,
      tenantId,
      event: "payment.failed",
    });
  },
  refunded: (paymentId: number, amount: string, tenantId: string) => {
    logger.info("Payment refunded", {
      paymentId,
      amount,
      tenantId,
      event: "payment.refunded",
    });
  },
};

// Log security events
export const logSecurity = {
  tenantIsolationViolation: (
    tenantId: string,
    attemptedResource: string,
    resourceTenantId: string
  ) => {
    logger.error("Tenant isolation violation attempt", {
      tenantId,
      attemptedResource,
      resourceTenantId,
      event: "security.tenant_isolation.violation",
    });
  },
  unauthorizedAccess: (path: string, ip?: string, userId?: string) => {
    logger.warn("Unauthorized access attempt", {
      path,
      ip,
      userId,
      event: "security.unauthorized_access",
    });
  },
  rateLimitExceeded: (ip: string, endpoint: string) => {
    logger.warn("Rate limit exceeded", {
      ip,
      endpoint,
      event: "security.rate_limit.exceeded",
    });
  },
  error: (message: string, context?: Record<string, unknown>) => {
    logger.error(message, { ...context, event: "security.error" });
  },
};

export default logger;
