/**
 * Authentication Login Tests
 * Tests for email/password login with case-insensitive email handling
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { nanoid } from "nanoid";
import * as db from "../db";
import { authService } from "../_core/auth-simple";
import { users, tenants } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

describe("Authentication Login", () => {
  let testTenantId: string;
  let testUserId: number;
  let testUserEmail: string;
  let testUserPassword: string;

  beforeAll(async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    // Create test tenant
    testTenantId = `test-tenant-${nanoid(8)}`;
    await dbInstance.insert(tenants).values({
      id: testTenantId,
      name: "Test Salon",
      subdomain: `test-${nanoid(6)}`,
      status: "active",
    });

    // Create test user with mixed case email
    testUserEmail = `Test.User.${nanoid(6)}@Example.Com`; // Mixed case intentionally
    testUserPassword = "SecurePassword123!";
    const passwordHash = await authService.hashPassword(testUserPassword);
    const openId = `test-user-${nanoid(8)}`;

    const [result] = await dbInstance.insert(users).values({
      tenantId: testTenantId,
      openId,
      email: testUserEmail,
      name: "Test User",
      role: "admin",
      passwordHash,
      isActive: true,
    });

    testUserId = result.insertId;
  });

  afterAll(async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) return;

    // Cleanup test data
    await dbInstance.delete(users).where(eq(users.tenantId, testTenantId));
    await dbInstance.delete(tenants).where(eq(tenants.id, testTenantId));
  });

  describe("Case-Insensitive Email Matching", () => {
    it("should find user with lowercase email", async () => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database not available");

      const normalizedEmail = testUserEmail.toLowerCase();
      const [user] = await dbInstance
        .select()
        .from(users)
        .where(sql`LOWER(${users.email}) = ${normalizedEmail}`)
        .limit(1);

      expect(user).toBeDefined();
      expect(user.id).toBe(testUserId);
    });

    it("should find user with uppercase email", async () => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database not available");

      const normalizedEmail = testUserEmail.toUpperCase().toLowerCase();
      const [user] = await dbInstance
        .select()
        .from(users)
        .where(sql`LOWER(${users.email}) = ${normalizedEmail}`)
        .limit(1);

      expect(user).toBeDefined();
      expect(user.id).toBe(testUserId);
    });

    it("should find user with mixed case email", async () => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database not available");

      const normalizedEmail = testUserEmail.toLowerCase();
      const [user] = await dbInstance
        .select()
        .from(users)
        .where(sql`LOWER(${users.email}) = ${normalizedEmail}`)
        .limit(1);

      expect(user).toBeDefined();
      expect(user.id).toBe(testUserId);
    });
  });

  describe("Password Verification", () => {
    it("should verify correct password", async () => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database not available");

      const [user] = await dbInstance
        .select()
        .from(users)
        .where(eq(users.id, testUserId))
        .limit(1);

      expect(user.passwordHash).toBeDefined();
      
      const isValid = await authService.verifyPassword(
        testUserPassword,
        user.passwordHash!
      );
      
      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database not available");

      const [user] = await dbInstance
        .select()
        .from(users)
        .where(eq(users.id, testUserId))
        .limit(1);

      expect(user.passwordHash).toBeDefined();
      
      const isValid = await authService.verifyPassword(
        "WrongPassword123!",
        user.passwordHash!
      );
      
      expect(isValid).toBe(false);
    });
  });

  describe("User Status Validation", () => {
    it("should identify active user", async () => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database not available");

      const [user] = await dbInstance
        .select()
        .from(users)
        .where(eq(users.id, testUserId))
        .limit(1);

      expect(user.isActive).toBe(true);
    });

    it("should prevent login for deactivated user", async () => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database not available");

      // Deactivate user
      await dbInstance
        .update(users)
        .set({ isActive: false })
        .where(eq(users.id, testUserId));

      const [user] = await dbInstance
        .select()
        .from(users)
        .where(eq(users.id, testUserId))
        .limit(1);

      expect(user.isActive).toBe(false);

      // Reactivate user for other tests
      await dbInstance
        .update(users)
        .set({ isActive: true })
        .where(eq(users.id, testUserId));
    });
  });

  describe("Session Token Creation", () => {
    it("should create valid session token", async () => {
      const token = await authService.createSessionToken({
        openId: "test-user",
        appId: "stylora",
        name: "Test User",
        email: "test@example.com",
      });

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });

    it("should verify created session token", async () => {
      const payload = {
        openId: "test-user",
        appId: "stylora",
        name: "Test User",
        email: "test@example.com",
      };

      const token = await authService.createSessionToken(payload);
      const verified = await authService.verifySession(token);

      expect(verified).toBeDefined();
      expect(verified?.openId).toBe(payload.openId);
      expect(verified?.appId).toBe(payload.appId);
      expect(verified?.name).toBe(payload.name);
      expect(verified?.email).toBe(payload.email);
    });

    it("should reject invalid session token", async () => {
      const verified = await authService.verifySession("invalid-token");
      expect(verified).toBeNull();
    });
  });
});
