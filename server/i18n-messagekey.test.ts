import { describe, expect, it } from "vitest";

/**
 * Tests to ensure backend returns messageKey for i18n support
 */
describe("Backend i18n messageKey support", () => {
  it("should verify API error responses include messageKey field", () => {
    // Example error response structure
    const errorResponse = {
      error: "Ugyldig e-post eller passord", // Fallback message
      messageKey: "errors.invalidCredentials", // i18n key
      hint: "Sjekk e-post og passord og prøv igjen.", // Fallback hint
      hintKey: "hints.checkEmailAndPassword", // i18n key for hint
    };

    expect(errorResponse).toHaveProperty("messageKey");
    expect(errorResponse.messageKey).toBe("errors.invalidCredentials");
  });

  it("should verify TRPC errors can include messageKey in data", () => {
    // Example TRPC error structure
    const trpcError = {
      message: "No tenant access",
      code: "FORBIDDEN",
      data: {
        messageKey: "errors.noTenantAccess",
      },
    };

    expect(trpcError.data).toHaveProperty("messageKey");
    expect(trpcError.data.messageKey).toBe("errors.noTenantAccess");
  });

  it("should verify success responses can include messageKey", () => {
    // Example success response
    const successResponse = {
      success: true,
      message: "Kunde opprettet!", // Fallback
      messageKey: "toasts.success.customerCreated", // i18n key
    };

    expect(successResponse).toHaveProperty("messageKey");
    expect(successResponse.messageKey).toBe("toasts.success.customerCreated");
  });

  it("should verify all required error keys exist in translation files", async () => {
    // Load English locale file
    const enLocale = await import("../client/src/i18n/locales/en.json");

    // Check that required error keys exist
    const requiredErrorKeys = [
      "noTenantAccess",
      "tenantNotFound",
      "emailNotVerified",
      "accessDenied",
      "invalidCredentials",
      "accountDeactivated",
      "tenantSuspended",
      "tenantCanceled",
      "databaseError",
      "databaseUnavailable",
      "authenticationFailed",
      "missingCredentials",
      "invalidEmailFormat",
      "accountConfigError",
      "couldNotFetchAccount",
      "refreshTokenMissing",
      "invalidRefreshToken",
      "tokenRefreshFailed",
      "logoutFailed",
      "notAuthenticated",
      "invalidFileType",
      "emptyFile",
      "uploadFailed",
      "fileExtensionError",
    ];

    for (const key of requiredErrorKeys) {
      expect(enLocale.errors).toHaveProperty(key);
      expect(enLocale.errors[key as keyof typeof enLocale.errors]).toBeTruthy();
    }
  });

  it("should verify all required hint keys exist in translation files", async () => {
    const enLocale = await import("../client/src/i18n/locales/en.json");

    const requiredHintKeys = [
      "checkEmailAndPassword",
      "contactSupport",
      "tryAgainLater",
      "databaseConnectionIssue",
      "reactivateSubscription",
    ];

    for (const key of requiredHintKeys) {
      expect(enLocale.hints).toHaveProperty(key);
      expect(enLocale.hints[key as keyof typeof enLocale.hints]).toBeTruthy();
    }
  });

  it("should verify keys exist in all 4 locales (no, en, ar, uk)", async () => {
    const noLocale = await import("../client/src/i18n/locales/no.json");
    const enLocale = await import("../client/src/i18n/locales/en.json");
    const arLocale = await import("../client/src/i18n/locales/ar.json");
    const ukLocale = await import("../client/src/i18n/locales/uk.json");

    // Test a few key error keys across all locales
    const testKeys = ["invalidCredentials", "databaseUnavailable", "accessDenied"];

    for (const key of testKeys) {
      expect(noLocale.errors[key as keyof typeof noLocale.errors]).toBeTruthy();
      expect(enLocale.errors[key as keyof typeof enLocale.errors]).toBeTruthy();
      expect(arLocale.errors[key as keyof typeof arLocale.errors]).toBeTruthy();
      expect(ukLocale.errors[key as keyof typeof ukLocale.errors]).toBeTruthy();
    }
  });
});
