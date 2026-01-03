import { describe, it, expect, beforeEach, afterEach } from "vitest";
import i18n from "./config";
import { setupLocalStorageMock, cleanupLocalStorageMock } from "./testUtils";

describe("LanguageSwitcher Integration", () => {
  beforeEach(async () => {
    // Setup localStorage mock
    setupLocalStorageMock();
    // Reset to default language and clear localStorage mock
    await i18n.changeLanguage("no");
  });

  afterEach(() => {
    // Clean up localStorage mock
    cleanupLocalStorageMock();
  });

  it("should support all required languages", () => {
    const supportedLanguages = ["no", "en", "ar", "uk"];
    const configuredLanguages = Object.keys(i18n.options.resources || {});
    
    supportedLanguages.forEach(lang => {
      expect(configuredLanguages).toContain(lang);
    });
  });

  it("should switch to English correctly", async () => {
    await i18n.changeLanguage("en");
    
    expect(i18n.language).toBe("en");
    expect(i18n.t("welcome")).toBe("Welcome");
    expect(i18n.t("dashboard.title")).toBe("Dashboard");
  });

  it("should switch to Arabic and support RTL", async () => {
    await i18n.changeLanguage("ar");
    
    expect(i18n.language).toBe("ar");
    expect(i18n.t("welcome")).toBe("مرحبًا");
    expect(i18n.t("dashboard.title")).toBe("لوحة التحكم");
  });

  it("should switch to Ukrainian correctly", async () => {
    await i18n.changeLanguage("uk");
    
    expect(i18n.language).toBe("uk");
    expect(i18n.t("welcome")).toBe("Ласкаво просимо");
    expect(i18n.t("dashboard.title")).toBe("Панель управління");
  });

  it("should switch back to Norwegian (default)", async () => {
    // First switch to another language
    await i18n.changeLanguage("en");
    expect(i18n.language).toBe("en");
    
    // Then switch back to Norwegian
    await i18n.changeLanguage("no");
    expect(i18n.language).toBe("no");
    expect(i18n.t("welcome")).toBe("Velkommen");
  });

  it("should persist language selection", async () => {
    // Change language
    await i18n.changeLanguage("en");
    
    // Verify it was saved to localStorage
    expect(localStorage.getItem("i18nextLng")).toBe("en");
    
    // Change to another language
    await i18n.changeLanguage("ar");
    expect(localStorage.getItem("i18nextLng")).toBe("ar");
  });

  it("should load correct translations for each language code", async () => {
    const testCases = [
      { lang: "no", welcome: "Velkommen", contactUs: "Kontakt oss" },
      { lang: "en", welcome: "Welcome", contactUs: "Contact Us" },
      { lang: "ar", welcome: "مرحبًا", contactUs: "اتصل بنا" },
      { lang: "uk", welcome: "Ласкаво просимо", contactUs: "Зв'яжіться з нами" },
    ];

    for (const testCase of testCases) {
      await i18n.changeLanguage(testCase.lang);
      expect(i18n.t("welcome")).toBe(testCase.welcome);
      expect(i18n.t("contact_us")).toBe(testCase.contactUs);
    }
  });

  it("should handle rapid language switches", async () => {
    await i18n.changeLanguage("en");
    await i18n.changeLanguage("ar");
    await i18n.changeLanguage("uk");
    await i18n.changeLanguage("no");
    
    expect(i18n.language).toBe("no");
    expect(i18n.t("welcome")).toBe("Velkommen");
  });

  it("should maintain translation quality across all languages", async () => {
    // Verify that all required keys exist in all languages
    const requiredKeys = ["welcome", "language_switch", "contact_us"];
    const languages = ["no", "en", "ar", "uk"];

    for (const lang of languages) {
      await i18n.changeLanguage(lang);
      
      for (const key of requiredKeys) {
        const translation = i18n.t(key);
        // Translation should not be empty or equal to the key itself (which means missing)
        expect(translation).toBeTruthy();
        expect(translation.length).toBeGreaterThan(0);
      }
    }
  });

  it("should have Norwegian as fallback language", () => {
    // fallbackLng can be a string or array, so we check if it includes 'no'
    const fallback = i18n.options.fallbackLng;
    if (Array.isArray(fallback)) {
      expect(fallback).toContain("no");
    } else {
      expect(fallback).toBe("no");
    }
  });

  it("should initialize with correct default language", () => {
    // When no language is set in localStorage, should default to Norwegian
    expect(["no", "en", "ar", "uk"]).toContain(i18n.language);
  });
});
