import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import { eq } from "drizzle-orm";
import { paymentSettings, tenants, users } from "../drizzle/schema";
import bcrypt from "bcrypt";

describe("Payment Settings API", () => {
  const testTenantId = "test-payment-tenant-" + Date.now();
  const testUserId = 999999;
  const testEmail = "test-payment@example.com";

  const mockContext = {
    user: {
      id: testUserId,
      tenantId: testTenantId,
      role: "owner" as const,
      email: testEmail,
      name: "Test User",
      openId: "test-open-id",
    },
    tenantId: testTenantId,
  };

  beforeAll(async () => {
    // Create test tenant and user
    const dbInstance = await db.getDb();
    if (dbInstance) {
      // Clean up any existing test data
      await dbInstance
        .delete(paymentSettings)
        .where(eq(paymentSettings.tenantId, testTenantId));
      await dbInstance
        .delete(users)
        .where(eq(users.email, testEmail));
      await dbInstance
        .delete(tenants)
        .where(eq(tenants.id, testTenantId));

      // Create test tenant
      await dbInstance.insert(tenants).values({
        id: testTenantId,
        name: "Test Payment Salon",
        email: testEmail,
        subdomain: "test-payment-" + Date.now(),
        emailVerified: true,
        status: "active",
      });

      // Create test user
      const passwordHash = await bcrypt.hash("test123", 10);
      await dbInstance.insert(users).values({
        id: testUserId,
        tenantId: testTenantId,
        openId: "test-open-id",
        email: testEmail,
        name: "Test User",
        role: "owner",
        passwordHash,
      });
    }
  });

  afterAll(async () => {
    // Clean up test data
    const dbInstance = await db.getDb();
    if (dbInstance) {
      await dbInstance
        .delete(paymentSettings)
        .where(eq(paymentSettings.tenantId, testTenantId));
      await dbInstance
        .delete(users)
        .where(eq(users.email, testEmail));
      await dbInstance
        .delete(tenants)
        .where(eq(tenants.id, testTenantId));
    }
  });

  it("should return default payment settings when none exist", async () => {
    const caller = appRouter.createCaller(mockContext as any);
    const settings = await caller.paymentSettings.get();

    expect(settings).toBeDefined();
    expect(settings.vippsEnabled).toBe(false);
    expect(settings.cardEnabled).toBe(false);
    expect(settings.cashEnabled).toBe(true);
    expect(settings.payAtSalonEnabled).toBe(true);
    expect(settings.defaultPaymentMethod).toBe("pay_at_salon");
  });

  it("should create new payment settings", async () => {
    const caller = appRouter.createCaller(mockContext as any);
    
    const updated = await caller.paymentSettings.update({
      vippsEnabled: true,
      cardEnabled: false,
      cashEnabled: true,
      payAtSalonEnabled: true,
      vippsClientId: "test-client-id",
      vippsClientSecret: "test-secret",
      defaultPaymentMethod: "vipps",
    });

    expect(updated).toBeDefined();
    expect(updated?.vippsEnabled).toBe(true);
    expect(updated?.cardEnabled).toBe(false);
    expect(updated?.vippsClientId).toBe("test-client-id");
    expect(updated?.defaultPaymentMethod).toBe("vipps");
  });

  it("should update existing payment settings", async () => {
    const caller = appRouter.createCaller(mockContext as any);
    
    // Update again
    const updated = await caller.paymentSettings.update({
      vippsEnabled: true,
      cardEnabled: true,
      cashEnabled: false,
      payAtSalonEnabled: true,
      stripePublishableKey: "pk_test_123",
      stripeSecretKey: "sk_test_123",
    });

    expect(updated).toBeDefined();
    expect(updated?.vippsEnabled).toBe(true);
    expect(updated?.cardEnabled).toBe(true);
    expect(updated?.cashEnabled).toBe(false);
    expect(updated?.stripePublishableKey).toBe("pk_test_123");
  });

  it("should retrieve updated payment settings", async () => {
    const caller = appRouter.createCaller(mockContext as any);
    
    const settings = await caller.paymentSettings.get();

    expect(settings).toBeDefined();
    expect(settings.vippsEnabled).toBe(true);
    expect(settings.cardEnabled).toBe(true);
    expect(settings.cashEnabled).toBe(false);
    expect(settings.payAtSalonEnabled).toBe(true);
  });

  it("should return public payment settings without sensitive data", async () => {
    const caller = appRouter.createCaller({} as any); // Public endpoint
    
    const settings = await caller.paymentSettings.getPublic({
      tenantId: testTenantId,
    });

    expect(settings).toBeDefined();
    expect(settings.vippsEnabled).toBe(true);
    expect(settings.cardEnabled).toBe(true);
    expect(settings.cashEnabled).toBe(false);
    expect(settings.payAtSalonEnabled).toBe(true);
    
    // Sensitive fields should not be exposed
    expect((settings as any).vippsClientId).toBeUndefined();
    expect((settings as any).vippsClientSecret).toBeUndefined();
    expect((settings as any).stripeSecretKey).toBeUndefined();
  });

  it("should return default public settings for non-existent tenant", async () => {
    const caller = appRouter.createCaller({} as any);
    
    const settings = await caller.paymentSettings.getPublic({
      tenantId: "non-existent-tenant",
    });

    expect(settings).toBeDefined();
    expect(settings.vippsEnabled).toBe(false);
    expect(settings.cardEnabled).toBe(false);
    expect(settings.cashEnabled).toBe(true);
    expect(settings.payAtSalonEnabled).toBe(true);
    expect(settings.defaultPaymentMethod).toBe("pay_at_salon");
  });
});
