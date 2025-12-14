import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { tenants, users, emailVerifications } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

describe("Email Verification System", () => {
  let testTenantId: string;
  let testUserId: string;
  let testUserOpenId: string;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test tenant
    testTenantId = nanoid();
    await db.insert(tenants).values({
      id: testTenantId,
      name: "Test Salon",
      subdomain: `test-${Date.now()}`,
      phone: "12345678",
      email: "test@example.com",
      status: "trial",
      timezone: "Europe/Oslo",
      currency: "NOK",
      vatRate: "25.00",
      emailVerified: false, // Not verified
    });

    // Create a test user
    testUserOpenId = `test-user-${nanoid()}`;
    await db.insert(users).values({
      tenantId: testTenantId,
      openId: testUserOpenId,
      email: "test@example.com",
      name: "Test User",
      phone: "12345678",
      role: "owner",
      loginMethod: "email",
      isActive: true,
    });
    
    // Get the created user ID
    const [user] = await db.select().from(users).where(eq(users.openId, testUserOpenId)).limit(1);
    testUserId = user.id.toString();
  });

  it("should block unverified tenant from accessing protected routes", async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: {
        id: testUserId,
        tenantId: testTenantId,
        openId: testUserOpenId,
        email: "test@example.com",
        name: "Test User",
        phone: "12345678",
        role: "owner",
        loginMethod: "email",
        isActive: true,
        createdAt: new Date(),
      },
    });

    // Try to access a protected route (e.g., customers.list)
    await expect(caller.customers.list()).rejects.toThrow("EMAIL_NOT_VERIFIED");
  });

  it("should allow verified tenant to access protected routes", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Mark tenant as verified
    await db
      .update(tenants)
      .set({ 
        emailVerified: true,
        emailVerifiedAt: new Date()
      })
      .where(eq(tenants.id, testTenantId));

    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: {
        id: testUserId,
        tenantId: testTenantId,
        openId: testUserOpenId,
        email: "test@example.com",
        name: "Test User",
        phone: "12345678",
        role: "owner",
        loginMethod: "email",
        isActive: true,
        createdAt: new Date(),
      },
    });

    // Should now succeed
    const result = await caller.customers.list();
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should allow public procedures without email verification", async () => {
    const caller = appRouter.createCaller({
      req: { headers: {}, protocol: "http" } as any,
      res: { cookie: () => {} } as any,
      user: null,
    });

    // Public procedures should work without authentication
    const result = await caller.signup.createTenant({
      salonName: "Public Test Salon",
      ownerEmail: `public-${Date.now()}@example.com`,
      ownerPhone: "87654321",
    });

    expect(result.success).toBe(true);
    expect(result.tenantId).toBeDefined();
  });

  it("should send verification email on signup", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const caller = appRouter.createCaller({
      req: { headers: {}, protocol: "http" } as any,
      res: { cookie: () => {} } as any,
      user: null,
    });

    const uniqueEmail = `verify-test-${Date.now()}@example.com`;
    
    const result = await caller.signup.createTenant({
      salonName: "Verification Test Salon",
      ownerEmail: uniqueEmail,
      ownerPhone: "99887766",
    });

    expect(result.success).toBe(true);

    // Check that verification record was created
    const [verification] = await db
      .select()
      .from(emailVerifications)
      .where(eq(emailVerifications.email, uniqueEmail))
      .limit(1);

    expect(verification).toBeDefined();
    expect(verification.token).toBeDefined();
    expect(verification.tenantId).toBe(result.tenantId);
  });

  it("should verify email with valid token", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a new unverified tenant
    const newTenantId = nanoid();
    await db.insert(tenants).values({
      id: newTenantId,
      name: "Token Test Salon",
      subdomain: `token-test-${Date.now()}`,
      phone: "11223344",
      email: "token@example.com",
      status: "trial",
      timezone: "Europe/Oslo",
      currency: "NOK",
      vatRate: "25.00",
      emailVerified: false,
    });

    // Create verification token
    const token = nanoid(32);
    await db.insert(emailVerifications).values({
      tenantId: newTenantId,
      email: "token@example.com",
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    const caller = appRouter.createCaller({
      req: { headers: {}, protocol: "http" } as any,
      res: {} as any,
      user: null,
    });

    // Verify the token
    const result = await caller.signup.verifyEmail({ token });
    expect(result.success).toBe(true);

    // Check that tenant is now verified
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, newTenantId))
      .limit(1);

    expect(tenant.emailVerified).toBe(true);
    expect(tenant.emailVerifiedAt).toBeDefined();
  });

  it("should reject expired verification token", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a new unverified tenant
    const newTenantId = nanoid();
    await db.insert(tenants).values({
      id: newTenantId,
      name: "Expired Token Salon",
      subdomain: `expired-${Date.now()}`,
      phone: "55667788",
      email: "expired@example.com",
      status: "trial",
      timezone: "Europe/Oslo",
      currency: "NOK",
      vatRate: "25.00",
      emailVerified: false,
    });

    // Create expired verification token
    const expiredToken = nanoid(32);
    await db.insert(emailVerifications).values({
      tenantId: newTenantId,
      email: "expired@example.com",
      token: expiredToken,
      expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
    });

    const caller = appRouter.createCaller({
      req: { headers: {}, protocol: "http" } as any,
      res: {} as any,
      user: null,
    });

    // Try to verify with expired token
    const result = await caller.signup.verifyEmail({ token: expiredToken });
    expect(result.success).toBe(false);
    expect(result.message).toContain("utløpt");
  });
});
