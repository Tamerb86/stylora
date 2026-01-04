/**
 * I18n utilities for API responses
 * Handles messageKey-based translations for backend responses
 */

import type { TFunction } from "i18next";
import { toast } from "sonner";

/**
 * Extract error message from API response, preferring messageKey
 */
export function getErrorMessage(
  error: any,
  t: TFunction,
  fallbackKey: string = "errors.generic"
): string {
  // If error has messageKey, use translation
  if (error?.messageKey) {
    return t(error.messageKey);
  }

  // If TRPCError with data.messageKey
  if (error?.data?.messageKey) {
    return t(error.data.messageKey);
  }

  // Fallback to raw message if available
  if (error?.message) {
    return error.message;
  }

  // Fallback to error string itself
  if (typeof error === "string") {
    return error;
  }

  // Final fallback to generic error
  return t(fallbackKey);
}

/**
 * Show error toast with i18n support
 */
export function showErrorToast(error: any, t: TFunction, fallbackKey?: string) {
  const message = getErrorMessage(error, t, fallbackKey);
  toast.error(message);
}

/**
 * Show success toast with i18n support
 */
export function showSuccessToast(
  response: any,
  t: TFunction,
  fallbackKey: string = "toasts.success.saved"
) {
  const message = response?.messageKey
    ? t(response.messageKey)
    : response?.message || t(fallbackKey);
  toast.success(message);
}

/**
 * Get hint message from API response
 */
export function getHintMessage(response: any, t: TFunction): string {
  if (response?.hintKey) {
    return t(response.hintKey);
  }
  return response?.hint || "";
}
