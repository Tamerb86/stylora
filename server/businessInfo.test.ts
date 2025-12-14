import { describe, it, expect } from "vitest";
import { z } from "zod";

describe("Business Information in Print Settings", () => {
  const printSettingsSchema = z.object({
    printerType: z.enum(["thermal_80mm", "a4"]).optional(),
    fontSize: z.enum(["small", "medium", "large"]),
    showLogo: z.boolean(),
    customFooterText: z.string().max(200),
    orgNumber: z.string().max(50).optional(),
    bankAccount: z.string().max(50).optional(),
    website: z.string().url().max(200).optional().or(z.literal("")),
    businessHours: z.string().max(200).optional(),
  });

  it("should validate print settings with all business info fields", () => {
    const validSettings = {
      printerType: "thermal_80mm" as const,
      fontSize: "medium" as const,
      showLogo: true,
      customFooterText: "Takk for besøket!",
      orgNumber: "123 456 789",
      bankAccount: "1234 56 78901",
      website: "https://www.eksempel.no",
      businessHours: "Man-Fre: 09:00-18:00",
    };

    const result = printSettingsSchema.safeParse(validSettings);
    expect(result.success).toBe(true);
  });

  it("should validate print settings without optional business info", () => {
    const minimalSettings = {
      fontSize: "medium" as const,
      showLogo: true,
      customFooterText: "Takk!",
    };

    const result = printSettingsSchema.safeParse(minimalSettings);
    expect(result.success).toBe(true);
  });

  it("should reject invalid website URL", () => {
    const invalidSettings = {
      fontSize: "medium" as const,
      showLogo: true,
      customFooterText: "Takk!",
      website: "not-a-valid-url",
    };

    const result = printSettingsSchema.safeParse(invalidSettings);
    expect(result.success).toBe(false);
  });

  it("should accept empty string for website", () => {
    const settingsWithEmptyWebsite = {
      fontSize: "medium" as const,
      showLogo: true,
      customFooterText: "Takk!",
      website: "",
    };

    const result = printSettingsSchema.safeParse(settingsWithEmptyWebsite);
    expect(result.success).toBe(true);
  });

  it("should reject org number exceeding max length", () => {
    const invalidSettings = {
      fontSize: "medium" as const,
      showLogo: true,
      customFooterText: "Takk!",
      orgNumber: "a".repeat(51), // Exceeds 50 char limit
    };

    const result = printSettingsSchema.safeParse(invalidSettings);
    expect(result.success).toBe(false);
  });

  it("should reject business hours exceeding max length", () => {
    const invalidSettings = {
      fontSize: "medium" as const,
      showLogo: true,
      customFooterText: "Takk!",
      businessHours: "a".repeat(201), // Exceeds 200 char limit
    };

    const result = printSettingsSchema.safeParse(invalidSettings);
    expect(result.success).toBe(false);
  });
});
