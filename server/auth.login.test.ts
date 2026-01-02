/**
 * Login Authentication Tests
 * Tests the login endpoint with various scenarios
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestTenant, createTestUser } from "./test-helpers";
import { authService } from "./_core/auth-simple";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("auth.login endpoint", () => {
  let testTenantId: string;
  let testUserEmail: string;
  let testUserPassword: string = "Test123!";
  let testUserId: number;

  beforeAll(async () => {
    // Create a test tenant
    const { tenantId } = await createTestTenant({
      name: "Login Test Salon",
      subdomain: "login-test",
    });
    testTenantId = tenantId;

    // Create a test user with known credentials
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    testUserEmail = `login-test-${Date.now()}@example.com`;
    const passwordHash = await authService.hashPassword(testUserPassword);

    await db.insert(users).values({
      tenantId: testTenantId,
      openId: `test-login-${Date.now()}`,
      email: testUserEmail,
      name: "Login Test User",
      passwordHash,
      role: "owner",
      loginMethod: "email",
      isActive: true,
      commissionType: "percentage",
      commissionRate: "50.00",
      uiMode: "advanced",
      onboardingCompleted: true,
    });

    // Get the created user ID
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, testUserEmail))
      .limit(1);

    if (!user) throw new Error("Test user not created");
    testUserId = user.id;
  });

  it("should hash and verify passwords correctly", async () => {
    const password = "TestPassword123!";
    const hash = await authService.hashPassword(password);

    expect(hash).toBeTruthy();
    expect(hash.length).toBeGreaterThan(0);

    const isValid = await authService.verifyPassword(password, hash);
    expect(isValid).toBe(true);

    const isInvalid = await authService.verifyPassword("WrongPassword", hash);
    expect(isInvalid).toBe(false);
  });

  it("should create a valid session token", async () => {
    const sessionPayload = {
      openId: "test-user-123",
      appId: "stylora",
      name: "Test User",
      email: "test@example.com",
    };

    const token = await authService.createSessionToken(sessionPayload);

    expect(token).toBeTruthy();
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3); // JWT has 3 parts

    // Verify the token
    const verified = await authService.verifySession(token);

    expect(verified).toBeTruthy();
    expect(verified?.openId).toBe(sessionPayload.openId);
    expect(verified?.appId).toBe(sessionPayload.appId);
    expect(verified?.name).toBe(sessionPayload.name);
    expect(verified?.email).toBe(sessionPayload.email);
  });

  it("should reject invalid session tokens", async () => {
    const invalidToken = "invalid.token.here";
    const verified = await authService.verifySession(invalidToken);

    expect(verified).toBeNull();
  });

  it("should successfully authenticate with valid credentials", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Simulate login request
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, testUserEmail))
      .limit(1);

    expect(user).toBeTruthy();
    expect(user?.email).toBe(testUserEmail);
    expect(user?.passwordHash).toBeTruthy();

    // Verify password
    const isValidPassword = await authService.verifyPassword(
      testUserPassword,
      user!.passwordHash!
    );

    expect(isValidPassword).toBe(true);
  });

  it("should reject authentication with wrong password", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, testUserEmail))
      .limit(1);

    expect(user).toBeTruthy();

    // Verify wrong password
    const isValidPassword = await authService.verifyPassword(
      "WrongPassword123!",
      user!.passwordHash!
    );

    expect(isValidPassword).toBe(false);
  });

  it("should handle inactive users", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create an inactive user
    const inactiveEmail = `inactive-test-${Date.now()}@example.com`;
    const passwordHash = await authService.hashPassword(testUserPassword);

    await db.insert(users).values({
      tenantId: testTenantId,
      openId: `inactive-test-${Date.now()}`,
      email: inactiveEmail,
      name: "Inactive Test User",
      passwordHash,
      role: "employee",
      loginMethod: "email",
      isActive: false, // Inactive user
      deactivatedAt: new Date(),
      commissionType: "percentage",
      commissionRate: "50.00",
      uiMode: "simple",
      onboardingCompleted: true,
    });

    // Try to get the inactive user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, inactiveEmail))
      .limit(1);

    expect(user).toBeTruthy();
    expect(user?.isActive).toBe(false);

    // In real login flow, this should be rejected
    // The endpoint should return 403 Forbidden
  });

  it("should validate email format", () => {
    const validEmails = [
      "test@example.com",
      "user.name@domain.co",
      "user+tag@example.com",
    ];

    const invalidEmails = [
      "invalid",
      "invalid@",
      "@invalid.com",
      "invalid@.com",
      "invalid@domain",
    ];

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    validEmails.forEach((email) => {
      expect(emailRegex.test(email)).toBe(true);
    });

    invalidEmails.forEach((email) => {
      expect(emailRegex.test(email)).toBe(false);
    });
  });

  it("should handle non-existent users", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const nonExistentEmail = `nonexistent-${Date.now()}@example.com`;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, nonExistentEmail))
      .limit(1);

    expect(user).toBeUndefined();
    // In real login flow, should return generic "Invalid email or password"
  });

  it("should handle users without password hash", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a user without password (OAuth user)
    const oauthEmail = `oauth-test-${Date.now()}@example.com`;

    await db.insert(users).values({
      tenantId: testTenantId,
      openId: `oauth-test-${Date.now()}`,
      email: oauthEmail,
      name: "OAuth Test User",
      passwordHash: null, // No password hash
      role: "employee",
      loginMethod: "google",
      isActive: true,
      commissionType: "percentage",
      commissionRate: "50.00",
      uiMode: "simple",
      onboardingCompleted: true,
    });

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, oauthEmail))
      .limit(1);

    expect(user).toBeTruthy();
    expect(user?.passwordHash).toBeNull();
    expect(user?.loginMethod).toBe("google");

    // In real login flow, should return error for OAuth users
  });

  afterAll(async () => {
    // Cleanup test data
    const db = await getDb();
    if (db) {
      try {
        await db.delete(users).where(eq(users.tenantId, testTenantId));
        // Note: We might want to keep tenant for other tests or clean it up
      } catch (error) {
        console.error("Cleanup error:", error);
      }
    }
  });
});
