import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../routers";
import { getDb } from "../db";
import { tenants, users, salonSettings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Branding Settings", () => {
  const testTenantId = `test-tenant-branding-${Date.now()}`;
  const testUserId = Math.floor(Math.random() * 1000000) + 900000;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("DB not available");

    // Create test tenant
    await db.insert(tenants).values({
      id: testTenantId,
      name: "Test Branding Salon",
      subdomain: `branding-test-${Date.now()}`,
      orgNumber: `${Date.now()}`.slice(0, 9),
      status: "active",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });

    // Create test admin user
    await db.insert(users).values({
      id: testUserId,
      tenantId: testTenantId,
      openId: `test-branding-${Date.now()}`,
      email: `branding-${Date.now()}@test.com`,
      name: "Test Admin",
      role: "admin",
      isActive: true,
    });
  });

  it("should return default branding when no settings exist", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        tenantId: testTenantId,
        role: "admin",
        openId: `test-${Date.now()}`,
        email: "test@test.com",
        name: "Test User",
      },
    });

    const branding = await caller.salonSettings.getBranding();

    expect(branding).toEqual({
      logoUrl: null,
      primaryColor: "#2563eb",
      accentColor: "#ea580c",
      welcomeTitle: "Velkommen!",
      welcomeSubtitle: "Bestill din time på nett.",
      showStaffSection: true,
      showSummaryCard: true,
    });
  });

  it("should save branding settings", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        tenantId: testTenantId,
        role: "admin",
        openId: `test-${Date.now()}`,
        email: "test@test.com",
        name: "Test User",
      },
    });

    const newBranding = {
      logoUrl: "https://example.com/logo.png",
      primaryColor: "#ff0000",
      accentColor: "#00ff00",
      welcomeTitle: "Hei!",
      welcomeSubtitle: "Book din time nå",
      showStaffSection: false,
      showSummaryCard: true,
    };

    const result = await caller.salonSettings.updateBranding(newBranding);

    expect(result.success).toBe(true);
    expect(result.branding).toEqual(newBranding);
  });

  it("should retrieve saved branding settings", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        tenantId: testTenantId,
        role: "admin",
        openId: `test-${Date.now()}`,
        email: "test@test.com",
        name: "Test User",
      },
    });

    const branding = await caller.salonSettings.getBranding();

    expect(branding.logoUrl).toBe("https://example.com/logo.png");
    expect(branding.primaryColor).toBe("#ff0000");
    expect(branding.accentColor).toBe("#00ff00");
    expect(branding.welcomeTitle).toBe("Hei!");
    expect(branding.showStaffSection).toBe(false);
  });

  it("should update existing branding settings", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        tenantId: testTenantId,
        role: "admin",
        openId: `test-${Date.now()}`,
        email: "test@test.com",
        name: "Test User",
      },
    });

    const updatedBranding = {
      logoUrl: "https://example.com/new-logo.png",
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
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        tenantId: testTenantId,
        role: "admin",
        openId: `test-${Date.now()}`,
        email: "test@test.com",
        name: "Test User",
      },
    });

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
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        tenantId: testTenantId,
        role: "admin",
        openId: `test-${Date.now()}`,
        email: "test@test.com",
        name: "Test User",
      },
    });

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
    const db = await getDb();
    if (!db) throw new Error("DB not available");

    // Create non-admin user
    const employeeId = testUserId + 1;
    await db.insert(users).values({
      id: employeeId,
      tenantId: testTenantId,
      openId: `test-employee-${Date.now()}`,
      email: `employee-${Date.now()}@test.com`,
      name: "Test Employee",
      role: "employee",
      isActive: true,
    });

    const caller = appRouter.createCaller({
      user: {
        id: employeeId,
        tenantId: testTenantId,
        role: "employee",
        openId: `test-${Date.now()}`,
        email: "employee@test.com",
        name: "Test Employee",
      },
    });

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
    const caller = appRouter.createCaller({
      user: {
        id: testUserId + 1,
        tenantId: testTenantId,
        role: "employee",
        openId: `test-${Date.now()}`,
        email: "employee@test.com",
        name: "Test Employee",
      },
    });

    const branding = await caller.salonSettings.getBranding();

    expect(branding).toBeDefined();
    expect(branding.primaryColor).toBeDefined();
  });
});
