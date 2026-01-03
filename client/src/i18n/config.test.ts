import { describe, it, expect, beforeEach, afterEach } from "vitest";
import i18n from "./config";
import { setupLocalStorageMock, cleanupLocalStorageMock } from "./testUtils";

describe("i18n Configuration", () => {
  beforeEach(async () => {
    // Setup localStorage mock
    setupLocalStorageMock();
    // Reset to default language before each test
    await i18n.changeLanguage("no");
  });

  afterEach(() => {
    // Clean up localStorage mock
    cleanupLocalStorageMock();
  });

  it("should load with Norwegian as default language", () => {
    expect(i18n.language).toBe("no");
  });

  it("should have all required languages configured", () => {
    const languages = Object.keys(i18n.options.resources || {});
    expect(languages).toContain("no");
    expect(languages).toContain("en");
    expect(languages).toContain("ar");
    expect(languages).toContain("uk");
  });

  it("should translate simple keys in Norwegian", () => {
    expect(i18n.t("welcome")).toBe("Velkommen");
    expect(i18n.t("language_switch")).toBe("Bytt språk");
    expect(i18n.t("contact_us")).toBe("Kontakt oss");
  });

  it("should translate simple keys in English", async () => {
    await i18n.changeLanguage("en");
    expect(i18n.t("welcome")).toBe("Welcome");
    expect(i18n.t("language_switch")).toBe("Switch Language");
    expect(i18n.t("contact_us")).toBe("Contact Us");
  });

  it("should translate simple keys in Arabic", async () => {
    await i18n.changeLanguage("ar");
    expect(i18n.t("welcome")).toBe("مرحبًا");
    expect(i18n.t("language_switch")).toBe("تغيير اللغة");
    expect(i18n.t("contact_us")).toBe("اتصل بنا");
  });

  it("should translate simple keys in Ukrainian", async () => {
    await i18n.changeLanguage("uk");
    expect(i18n.t("welcome")).toBe("Ласкаво просимо");
    expect(i18n.t("language_switch")).toBe("Змінити мову");
    expect(i18n.t("contact_us")).toBe("Зв'яжіться з нами");
  });

  it("should switch languages dynamically", async () => {
    expect(i18n.language).toBe("no");
    expect(i18n.t("welcome")).toBe("Velkommen");

    await i18n.changeLanguage("en");
    expect(i18n.language).toBe("en");
    expect(i18n.t("welcome")).toBe("Welcome");

    await i18n.changeLanguage("ar");
    expect(i18n.language).toBe("ar");
    expect(i18n.t("welcome")).toBe("مرحبًا");
  });

  it("should translate nested keys", () => {
    expect(i18n.t("dashboard.title")).toBe("Dashbord");
    expect(i18n.t("nav.dashboard")).toBe("Dashbord");
    expect(i18n.t("common.loading")).toBe("Laster...");
  });

  it("should fallback to Norwegian for missing translations", async () => {
    await i18n.changeLanguage("no");
    // This key doesn't exist, so it should return the key itself
    const result = i18n.t("non_existent_key");
    expect(result).toBe("non_existent_key");
  });

  it("should handle language change with persistence", async () => {
    // Change language
    await i18n.changeLanguage("en");
    
    // Verify it was saved to localStorage
    expect(localStorage.getItem("i18nextLng")).toBe("en");
    
    // Change to another language
    await i18n.changeLanguage("ar");
    expect(localStorage.getItem("i18nextLng")).toBe("ar");
  });
});
