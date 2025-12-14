import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(tenantId: string, role: "admin" | "user" = "admin"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: `test-user-${tenantId}`,
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    tenantId,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    tenantId,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Print Settings Management", () => {
  let testTenantId: string;

  beforeAll(async () => {
    // Create test tenant
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    const { tenants } = await import("../drizzle/schema");
    testTenantId = `test-tenant-${Date.now()}`;

    await dbInstance.insert(tenants).values({
      id: testTenantId,
      name: "Test Salon for Print Settings",
      subdomain: `test-print-${Date.now()}`,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });
  });

  it("should return default print settings when none exist", async () => {
    const ctx = createTestContext(testTenantId);
    const caller = appRouter.createCaller(ctx);

    const settings = await caller.salonSettings.getPrintSettings();

    expect(settings).toEqual({
      printerType: "thermal_80mm",
      fontSize: "medium",
      showLogo: true,
      customFooterText: "Takk for besøket! Velkommen tilbake!",
    });
  });

  it("should save and retrieve custom print settings", async () => {
    const ctx = createTestContext(testTenantId);
    const caller = appRouter.createCaller(ctx);

    const customSettings = {
      printerType: "a4" as const,
      fontSize: "large" as const,
      showLogo: false,
      customFooterText: "Vi setter pris på ditt besøk! Ha en fin dag!",
    };

    // Save settings
    const saveResult = await caller.salonSettings.updatePrintSettings(customSettings);

    expect(saveResult.success).toBe(true);
    expect(saveResult.printSettings).toEqual(customSettings);

    // Retrieve settings
    const retrievedSettings = await caller.salonSettings.getPrintSettings();

    expect(retrievedSettings).toEqual(customSettings);
  });

  it("should update existing print settings", async () => {
    const ctx = createTestContext(testTenantId);
    const caller = appRouter.createCaller(ctx);

    // First save
    await caller.salonSettings.updatePrintSettings({
      printerType: "thermal_80mm",
      fontSize: "small",
      showLogo: true,
      customFooterText: "First message",
    });

    // Update
    const updatedSettings = {
      printerType: "a4" as const,
      fontSize: "medium" as const,
      showLogo: false,
      customFooterText: "Updated message",
    };

    const updateResult = await caller.salonSettings.updatePrintSettings(updatedSettings);

    expect(updateResult.success).toBe(true);
    expect(updateResult.printSettings).toEqual(updatedSettings);

    // Verify update
    const retrievedSettings = await caller.salonSettings.getPrintSettings();
    expect(retrievedSettings).toEqual(updatedSettings);
  });

  it("should validate font size enum", async () => {
    const ctx = createTestContext(testTenantId);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.salonSettings.updatePrintSettings({
        printerType: "thermal_80mm",
        fontSize: "invalid" as any,
        showLogo: true,
        customFooterText: "Test",
      })
    ).rejects.toThrow();
  });

  it("should validate custom footer text length", async () => {
    const ctx = createTestContext(testTenantId);
    const caller = appRouter.createCaller(ctx);

    const longText = "a".repeat(201); // Exceeds 200 character limit

    await expect(
      caller.salonSettings.updatePrintSettings({
        printerType: "thermal_80mm",
        fontSize: "medium",
        showLogo: true,
        customFooterText: longText,
      })
    ).rejects.toThrow();
  });

  it("should accept empty custom footer text", async () => {
    const ctx = createTestContext(testTenantId);
    const caller = appRouter.createCaller(ctx);

    const settings = {
      printerType: "thermal_80mm" as const,
      fontSize: "medium" as const,
      showLogo: true,
      customFooterText: "",
    };

    const result = await caller.salonSettings.updatePrintSettings(settings);

    expect(result.success).toBe(true);
    expect(result.printSettings.customFooterText).toBe("");
  });

  it("should isolate settings between tenants", async () => {
    // Create second tenant
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    const { tenants } = await import("../drizzle/schema");
    const tenant2Id = `test-tenant-2-${Date.now()}`;

    await dbInstance.insert(tenants).values({
      id: tenant2Id,
      name: "Second Test Salon",
      subdomain: `test-print-2-${Date.now()}`,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });

    const ctx1 = createTestContext(testTenantId);
    const caller1 = appRouter.createCaller(ctx1);

    const ctx2 = createTestContext(tenant2Id);
    const caller2 = appRouter.createCaller(ctx2);

    // Save different settings for each tenant
    await caller1.salonSettings.updatePrintSettings({
      printerType: "thermal_80mm",
      fontSize: "small",
      showLogo: true,
      customFooterText: "Tenant 1 message",
    });

    await caller2.salonSettings.updatePrintSettings({
      printerType: "a4",
      fontSize: "large",
      showLogo: false,
      customFooterText: "Tenant 2 message",
    });

    // Verify isolation
    const tenant1Settings = await caller1.salonSettings.getPrintSettings();
    const tenant2Settings = await caller2.salonSettings.getPrintSettings();

    expect(tenant1Settings.printerType).toBe("thermal_80mm");
    expect(tenant1Settings.fontSize).toBe("small");
    expect(tenant1Settings.customFooterText).toBe("Tenant 1 message");

    expect(tenant2Settings.printerType).toBe("a4");
    expect(tenant2Settings.fontSize).toBe("large");
    expect(tenant2Settings.customFooterText).toBe("Tenant 2 message");
  });
});
