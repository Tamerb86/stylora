import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import { tenants } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("salonSettings router", () => {
  let testTenantId: string;
  let testUserId: number;

  beforeAll(async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    // Create test tenant
    testTenantId = `test-tenant-${Date.now()}`;
    await dbInstance.insert(tenants).values({
      id: testTenantId,
      name: "Test Salon",
      subdomain: `test-salon-${Date.now()}`,
      cancellationWindowHours: 24,
      noShowThresholdForPrepayment: 2,
      requirePrepayment: false,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });

    // Create test user
    const { users } = await import("../drizzle/schema");
    const result = await dbInstance
      .insert(users)
      .values({
        tenantId: testTenantId,
        openId: `test-user-${Date.now()}`,
        email: "test@example.com",
        name: "Test User",
        role: "admin",
      });
    testUserId = Number(result.insertId);
  });

  afterAll(async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) return;

    // Cleanup
    const { users } = await import("../drizzle/schema");
    await dbInstance.delete(users).where(eq(users.tenantId, testTenantId));
    await dbInstance.delete(tenants).where(eq(tenants.id, testTenantId));
  });

  it("should get booking settings for tenant", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, tenantId: testTenantId, role: "admin" },
      tenantId: testTenantId,
      req: {} as any,
      res: {} as any,
    });

    const settings = await caller.salonSettings.getBookingSettings();

    expect(settings).toBeDefined();
    expect(settings.id).toBe(testTenantId);
    expect(settings.requirePrepayment).toBe(false);
    expect(settings.cancellationWindowHours).toBe(24);
    expect(settings.noShowThresholdForPrepayment).toBe(2);
  });

  it("should update booking settings", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, tenantId: testTenantId, role: "admin" },
      tenantId: testTenantId,
      req: {} as any,
      res: {} as any,
    });

    const updated = await caller.salonSettings.updateBookingSettings({
      requirePrepayment: true,
      cancellationWindowHours: 48,
      noShowThresholdForPrepayment: 3,
    });

    expect(updated).toBeDefined();
    expect(updated.requirePrepayment).toBe(true);
    expect(updated.cancellationWindowHours).toBe(48);
    expect(updated.noShowThresholdForPrepayment).toBe(3);

    // Verify the changes persisted
    const settings = await caller.salonSettings.getBookingSettings();
    expect(settings.requirePrepayment).toBe(true);
    expect(settings.cancellationWindowHours).toBe(48);
    expect(settings.noShowThresholdForPrepayment).toBe(3);
  });

  it("should validate cancellationWindowHours range", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, tenantId: testTenantId, role: "admin" },
      tenantId: testTenantId,
      req: {} as any,
      res: {} as any,
    });

    // Test minimum value (should fail)
    await expect(
      caller.salonSettings.updateBookingSettings({
        requirePrepayment: false,
        cancellationWindowHours: 0,
      })
    ).rejects.toThrow();

    // Test maximum value (should fail)
    await expect(
      caller.salonSettings.updateBookingSettings({
        requirePrepayment: false,
        cancellationWindowHours: 200,
      })
    ).rejects.toThrow();

    // Test valid values
    await expect(
      caller.salonSettings.updateBookingSettings({
        requirePrepayment: false,
        cancellationWindowHours: 1,
      })
    ).resolves.toBeDefined();

    await expect(
      caller.salonSettings.updateBookingSettings({
        requirePrepayment: false,
        cancellationWindowHours: 168,
      })
    ).resolves.toBeDefined();
  });

  it("should only update settings for the current tenant", async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    // Create another tenant
    const otherTenantId = `test-tenant-other-${Date.now()}`;
    await dbInstance.insert(tenants).values({
      id: otherTenantId,
      name: "Other Salon",
      subdomain: `other-salon-${Date.now()}`,
      cancellationWindowHours: 12,
      requirePrepayment: false,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });

    const caller = appRouter.createCaller({
      user: { id: testUserId, tenantId: testTenantId, role: "admin" },
      tenantId: testTenantId,
      req: {} as any,
      res: {} as any,
    });

    // Update settings for testTenantId
    await caller.salonSettings.updateBookingSettings({
      requirePrepayment: true,
      cancellationWindowHours: 36,
    });

    // Verify other tenant's settings were not changed
    const [otherTenant] = await dbInstance
      .select()
      .from(tenants)
      .where(eq(tenants.id, otherTenantId));

    expect(otherTenant.requirePrepayment).toBe(false);
    expect(otherTenant.cancellationWindowHours).toBe(12);

    // Cleanup
    await dbInstance.delete(tenants).where(eq(tenants.id, otherTenantId));
  });
});
