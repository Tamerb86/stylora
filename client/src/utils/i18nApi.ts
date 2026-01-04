/**
 * I18n utilities for API responses
 * Handles messageKey-based translations for backend responses
 */

import type { TFunction } from "i18next";
import { toast } from "sonner";
import i18n from "@/i18n/config";

/**
 * Extract error message from API response, preferring messageKey
 */
export function getErrorMessage(
  error: any,
  t?: TFunction,
  fallbackKey: string = "errors.generic"
): string {
  const translator = t || i18n.t.bind(i18n);

  // If error has messageKey, use translation
  if (error?.messageKey) {
    return translator(error.messageKey);
  }

  // If TRPCError with data.messageKey
  if (error?.data?.messageKey) {
    return translator(error.data.messageKey);
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
  return translator(fallbackKey);
}

/**
 * Show error toast with i18n support
 */
export function showErrorToast(error: any, t?: TFunction, fallbackKey?: string) {
  const message = getErrorMessage(error, t, fallbackKey);
  toast.error(message);
}

/**
 * Show success toast with i18n support
 */
export function showSuccessToast(
  response: any,
  t?: TFunction,
  fallbackKey: string = "toasts.success.saved"
) {
  const translator = t || i18n.t.bind(i18n);
  const message = response?.messageKey
    ? translator(response.messageKey)
    : response?.message || translator(fallbackKey);
  toast.success(message);
}

/**
 * Get hint message from API response
 */
export function getHintMessage(response: any, t?: TFunction): string {
  const translator = t || i18n.t.bind(i18n);
  if (response?.hintKey) {
    return translator(response.hintKey);
  }
  return response?.hint || "";
}
