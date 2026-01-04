/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

/**
 * I18n-ready API response types
 * Backend returns messageKey, frontend translates using i18n
 */
export interface ApiErrorResponse {
  error: string; // Fallback message (for backward compatibility)
  messageKey?: string; // i18n key for translation (e.g., "errors.invalidCredentials")
  hint?: string; // Additional hint (legacy, can also have hintKey)
  hintKey?: string; // i18n key for hint
  code?: string; // Error code (e.g., "UNAUTHORIZED", "VALIDATION_ERROR")
}

export interface ApiSuccessResponse<T = unknown> {
  success: boolean;
  message?: string; // Fallback message
  messageKey?: string; // i18n key for success message
  data?: T;
}
