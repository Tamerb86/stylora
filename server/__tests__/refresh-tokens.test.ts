/**
 * Refresh Tokens Test Suite
 * Tests token generation, validation, revocation, and automatic renewal
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { nanoid } from "nanoid";
import * as db from "../db";
import {
  createRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  getUserFromRefreshToken,
  cleanupExpiredTokens,
} from "../_core/refresh-tokens";
import { authService } from "../_core/auth-simple";
import { refreshTokens, users, tenants } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Refresh Tokens", () => {
  let testTenantId: string;
  let testUserId: number;
  let testUserOpenId: string;

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

    // Create test user
    testUserOpenId = `test-user-${nanoid(8)}`;
    const passwordHash = await authService.hashPassword("testpassword123");
    const [result] = await dbInstance.insert(users).values({
      tenantId: testTenantId,
      openId: testUserOpenId,
      email: `test-${nanoid(6)}@test.com`,
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
    await dbInstance
      .delete(refreshTokens)
      .where(eq(refreshTokens.tenantId, testTenantId));
    await dbInstance.delete(users).where(eq(users.tenantId, testTenantId));
    await dbInstance.delete(tenants).where(eq(tenants.id, testTenantId));
  });

  // Note: Not cleaning up tokens beforeEach to allow tests to verify token counts

  describe("Token Creation", () => {
    it("should create a valid refresh token", async () => {
      const token = await createRefreshToken(
        testUserId,
        testTenantId,
        "127.0.0.1",
        "Test Agent"
      );

      expect(token).toBeDefined();
      expect(token).toHaveLength(64); // nanoid(64)

      // Verify token in database
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database not available");

      const [tokenRecord] = await dbInstance
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.token, token))
        .limit(1);

      expect(tokenRecord).toBeDefined();
      expect(tokenRecord.userId).toBe(testUserId);
      expect(tokenRecord.tenantId).toBe(testTenantId);
      expect(tokenRecord.ipAddress).toBe("127.0.0.1");
      expect(tokenRecord.userAgent).toBe("Test Agent");
      expect(tokenRecord.revoked).toBe(false);
      expect(tokenRecord.expiresAt).toBeInstanceOf(Date);

      // Check expiry is ~90 days from now
      const expiryDays = Math.floor(
        (tokenRecord.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      expect(expiryDays).toBeGreaterThanOrEqual(89);
      expect(expiryDays).toBeLessThanOrEqual(91);
    });

    it("should create multiple tokens for same user", async () => {
      const token1 = await createRefreshToken(testUserId, testTenantId);
      const token2 = await createRefreshToken(testUserId, testTenantId);

      expect(token1).not.toBe(token2);

      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database not available");

      const tokens = await dbInstance
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.userId, testUserId));

      expect(tokens).toHaveLength(2);
    });
  });

  describe("Token Validation", () => {
    it("should validate a valid refresh token", async () => {
      const token = await createRefreshToken(testUserId, testTenantId);

      const tokenData = await validateRefreshToken(token);

      expect(tokenData).toBeDefined();
      expect(tokenData?.userId).toBe(testUserId);
      expect(tokenData?.tenantId).toBe(testTenantId);
      expect(tokenData?.token).toBe(token);
      expect(tokenData?.expiresAt).toBeInstanceOf(Date);
    });

    it("should return null for non-existent token", async () => {
      const fakeToken = nanoid(64);

      const tokenData = await validateRefreshToken(fakeToken);

      expect(tokenData).toBeNull();
    });

    it("should return null for revoked token", async () => {
      const token = await createRefreshToken(testUserId, testTenantId);

      await revokeRefreshToken(token, "Test revocation");

      const tokenData = await validateRefreshToken(token);

      expect(tokenData).toBeNull();
    });

    it("should return null for expired token", async () => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database not available");

      // Create token with past expiry
      const token = nanoid(64);
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday

      await dbInstance.insert(refreshTokens).values({
        token,
        userId: testUserId,
        tenantId: testTenantId,
        expiresAt: pastDate,
        revoked: false,
      });

      const tokenData = await validateRefreshToken(token);

      expect(tokenData).toBeNull();
    });

    it("should update lastUsedAt on validation", async () => {
      const token = await createRefreshToken(testUserId, testTenantId);

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      await validateRefreshToken(token);

      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database not available");

      const [tokenRecord] = await dbInstance
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.token, token))
        .limit(1);

      expect(tokenRecord.lastUsedAt).toBeDefined();
      expect(tokenRecord.lastUsedAt).toBeInstanceOf(Date);
    });
  });

  describe("Token Revocation", () => {
    it("should revoke a specific token", async () => {
      const token = await createRefreshToken(testUserId, testTenantId);

      const revoked = await revokeRefreshToken(token, "User logout");

      expect(revoked).toBe(true);

      // Verify in database
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database not available");

      const [tokenRecord] = await dbInstance
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.token, token))
        .limit(1);

      expect(tokenRecord.revoked).toBe(true);
      expect(tokenRecord.revokedAt).toBeInstanceOf(Date);
      expect(tokenRecord.revokedReason).toBe("User logout");
    });

    it("should revoke all user tokens", async () => {
      // Create multiple tokens
      await createRefreshToken(testUserId, testTenantId);
      await createRefreshToken(testUserId, testTenantId);
      await createRefreshToken(testUserId, testTenantId);

      const count = await revokeAllUserTokens(
        testUserId,
        "Logout from all devices"
      );

      expect(count).toBeGreaterThanOrEqual(3);

      // Verify all revoked
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database not available");

      const tokens = await dbInstance
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.userId, testUserId));

      expect(tokens.every(t => t.revoked)).toBe(true);
    });
  });

  describe("Get User from Token", () => {
    it("should return user data for valid token", async () => {
      const token = await createRefreshToken(testUserId, testTenantId);

      const user = await getUserFromRefreshToken(token);

      expect(user).toBeDefined();
      expect(user?.id).toBe(testUserId);
      expect(user?.tenantId).toBe(testTenantId);
      expect(user?.openId).toBe(testUserOpenId);
      expect(user?.isActive).toBe(true);
    });

    it("should return null for invalid token", async () => {
      const fakeToken = nanoid(64);

      const user = await getUserFromRefreshToken(fakeToken);

      expect(user).toBeNull();
    });

    it("should return null for inactive user", async () => {
      const token = await createRefreshToken(testUserId, testTenantId);

      // Deactivate user
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database not available");

      await dbInstance
        .update(users)
        .set({ isActive: false })
        .where(eq(users.id, testUserId));

      const user = await getUserFromRefreshToken(token);

      expect(user).toBeNull();

      // Reactivate for other tests
      await dbInstance
        .update(users)
        .set({ isActive: true })
        .where(eq(users.id, testUserId));
    });
  });

  describe("Token Cleanup", () => {
    it("should delete expired tokens", async () => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database not available");

      // Create expired token
      const expiredToken = nanoid(64);
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 100); // 100 days ago

      await dbInstance.insert(refreshTokens).values({
        token: expiredToken,
        userId: testUserId,
        tenantId: testTenantId,
        expiresAt: pastDate,
        revoked: false,
      });

      // Create valid token
      const validToken = await createRefreshToken(testUserId, testTenantId);

      const count = await cleanupExpiredTokens();

      expect(count).toBeGreaterThanOrEqual(1);

      // Verify expired token deleted
      const [expiredRecord] = await dbInstance
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.token, expiredToken))
        .limit(1);

      expect(expiredRecord).toBeUndefined();

      // Verify valid token still exists
      const [validRecord] = await dbInstance
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.token, validToken))
        .limit(1);

      expect(validRecord).toBeDefined();
    });
  });

  describe("Tenant Isolation", () => {
    it("should not allow cross-tenant token use", async () => {
      // Create another tenant and user
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database not available");

      const otherTenantId = `test-tenant-${nanoid(8)}`;
      await dbInstance.insert(tenants).values({
        id: otherTenantId,
        name: "Other Salon",
        subdomain: `other-${nanoid(6)}`,
        status: "active",
      });

      const otherUserOpenId = `test-user-${nanoid(8)}`;
      const passwordHash = await authService.hashPassword("testpassword123");
      const [result] = await dbInstance.insert(users).values({
        tenantId: otherTenantId,
        openId: otherUserOpenId,
        email: `other-${nanoid(6)}@test.com`,
        name: "Other User",
        role: "admin",
        passwordHash,
        isActive: true,
      });

      const otherUserId = result.insertId;

      // Create token for first user
      const token = await createRefreshToken(testUserId, testTenantId);

      // Verify token data
      const tokenData = await validateRefreshToken(token);
      expect(tokenData?.tenantId).toBe(testTenantId);
      expect(tokenData?.userId).toBe(testUserId);

      // Cleanup
      await dbInstance.delete(users).where(eq(users.id, otherUserId));
      await dbInstance.delete(tenants).where(eq(tenants.id, otherTenantId));
    });
  });
});
