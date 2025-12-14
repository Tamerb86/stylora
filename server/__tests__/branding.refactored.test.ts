/**
 * Branding Settings Tests (Refactored with Test Helpers)
 * 
 * This is a refactored version of branding.test.ts showing how to use
 * the centralized test helpers for cleaner, more maintainable tests.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "../routers";
import {
  createTestEnvironment,
  createTestEmployee,
  cleanupTestTenant,
  TEST_TIMEOUTS,
} from "../test-helpers";

describe("Branding Settings (Refactored)", () => {
  let tenantId: string;
  let userId: number;
  let mockContext: any;
  let employeeId: number;
  let employeeContext: any;

  beforeAll(async () => {
    // Create complete test environment with verified tenant and admin user
    const env = await createTestEnvironment();
    tenantId = env.tenantId;
    userId = env.userId;
    mockContext = env.mockContext;

    // Create an employee for permission testing
    const employee = await createTestEmployee(tenantId);
    employeeId = employee.userId;
    employeeContext = {
      user: {
        id: employee.userId,
        tenantId: employee.user.tenantId,
        openId: employee.user.openId,
        email: employee.user.email,
        name: employee.user.name,
        role: employee.user.role,
      },
      req: {} as any,
      res: {} as any,
    };
  }, TEST_TIMEOUTS.MEDIUM);

  afterAll(async () => {
    await cleanupTestTenant(tenantId);
  });

  it("should return default branding when no settings exist", async () => {
    const caller = appRouter.createCaller(mockContext);
    const branding = await caller.salonSettings.getBranding();

    expect(branding).toEqual({
      logoUrl: null,
      receiptLogoUrl: null,
      primaryColor: "#2563eb",
      accentColor: "#ea580c",
      welcomeTitle: "Velkommen!",
      welcomeSubtitle: "Bestill din time på nett.",
      showStaffSection: true,
      showSummaryCard: true,
    });
  });

  it("should save branding settings", async () => {
    const caller = appRouter.createCaller(mockContext);

    const newBranding = {
      logoUrl: "https://example.com/logo.png",
      receiptLogoUrl: null,
      primaryColor: "#ff0000",
      accentColor: "#00ff00",
      welcomeTitle: "Hei!",
      welcomeSubtitle: "Book din time nå",
      showStaffSection: false,
      showSummaryCard: true,
    };

    const result = await caller.salonSettings.updateBranding(newBranding);

    expect(result.success).toBe(true);
    // Note: result.branding doesn't include receiptLogoUrl in the response
    expect(result.branding).toMatchObject({
      logoUrl: "https://example.com/logo.png",
      primaryColor: "#ff0000",
      accentColor: "#00ff00",
      welcomeTitle: "Hei!",
      welcomeSubtitle: "Book din time nå",
      showStaffSection: false,
      showSummaryCard: true,
    });
  });

  it("should retrieve saved branding settings", async () => {
    const caller = appRouter.createCaller(mockContext);
    const branding = await caller.salonSettings.getBranding();

    expect(branding.logoUrl).toBe("https://example.com/logo.png");
    expect(branding.primaryColor).toBe("#ff0000");
    expect(branding.accentColor).toBe("#00ff00");
    expect(branding.welcomeTitle).toBe("Hei!");
    expect(branding.showStaffSection).toBe(false);
  });

  it("should update existing branding settings", async () => {
    const caller = appRouter.createCaller(mockContext);

    const updatedBranding = {
      logoUrl: "https://example.com/new-logo.png",
      receiptLogoUrl: null,
      primaryColor: "#0000ff",
      accentColor: "#ffff00",
      welcomeTitle: "Velkommen tilbake!",
      welcomeSubtitle: "Vi gleder oss til å se deg",
      showStaffSection: true,
      showSummaryCard: false,
    };

    await caller.salonSettings.updateBranding(updatedBranding);
    const branding = await caller.salonSettings.getBranding();

    expect(branding).toEqual(updatedBranding);
  });

  it("should validate color format (hex)", async () => {
    const caller = appRouter.createCaller(mockContext);

    const invalidBranding = {
      logoUrl: null,
      primaryColor: "red", // Invalid: not hex
      accentColor: "#00ff00",
      welcomeTitle: "Test",
      welcomeSubtitle: "Test",
      showStaffSection: true,
      showSummaryCard: true,
    };

    await expect(
      caller.salonSettings.updateBranding(invalidBranding as any)
    ).rejects.toThrow();
  });

  it("should validate title length", async () => {
    const caller = appRouter.createCaller(mockContext);

    const invalidBranding = {
      logoUrl: null,
      primaryColor: "#ff0000",
      accentColor: "#00ff00",
      welcomeTitle: "", // Invalid: empty
      welcomeSubtitle: "Test",
      showStaffSection: true,
      showSummaryCard: true,
    };

    await expect(
      caller.salonSettings.updateBranding(invalidBranding)
    ).rejects.toThrow();
  });

  it("should reject non-admin users from updating branding", async () => {
    const caller = appRouter.createCaller(employeeContext);

    const branding = {
      logoUrl: null,
      primaryColor: "#ff0000",
      accentColor: "#00ff00",
      welcomeTitle: "Test",
      welcomeSubtitle: "Test",
      showStaffSection: true,
      showSummaryCard: true,
    };

    await expect(
      caller.salonSettings.updateBranding(branding)
    ).rejects.toThrow("Admin access required");
  });

  it("should allow employees to read branding", async () => {
    const caller = appRouter.createCaller(employeeContext);
    const branding = await caller.salonSettings.getBranding();

    expect(branding).toBeDefined();
    expect(branding.primaryColor).toBeDefined();
  });
});
