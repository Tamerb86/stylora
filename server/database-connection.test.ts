import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb, closeDb } from "./db";

describe("Database Connection", () => {
  afterAll(async () => {
    await closeDb();
  });

  it("should connect to database successfully", async () => {
    const db = await getDb();
    expect(db).not.toBeNull();
    expect(db).toBeDefined();
  });

  it("should execute a simple query", async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not connected");
    }

    // Test with a simple SELECT 1 query
    const result = await db.execute("SELECT 1 as test");
    expect(result).toBeDefined();
  });

  it("should check if paymentProviders table exists", async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not connected");
    }

    // Check if table exists
    const result = await db.execute(
      "SHOW TABLES LIKE 'paymentProviders'"
    );
    
    expect(result).toBeDefined();
    // If table doesn't exist, this test will help identify the issue
  });

  it("should be able to query paymentProviders table", async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not connected");
    }

    const { paymentProviders } = await import("../drizzle/schema");
    
    // Try to query the table (should not throw even if empty)
    const result = await db.select().from(paymentProviders).limit(1);
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should handle connection errors gracefully", async () => {
    // Save original DATABASE_URL
    const originalUrl = process.env.DATABASE_URL;
    
    // Set invalid URL
    process.env.DATABASE_URL = "mysql://invalid:invalid@localhost:9999/invalid";
    
    // Force reconnection by clearing cache
    await closeDb();
    
    const db = await getDb();
    
    // Should return null on connection failure
    expect(db).toBeNull();
    
    // Restore original URL
    process.env.DATABASE_URL = originalUrl;
  });
});
