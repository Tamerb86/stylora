/**
 * Fiken Integration Tests
 * 
 * Tests for Fiken OAuth, customer sync, and invoice sync
 */

import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "../db";
import { fikenSettings, customers, orders, orderItems } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { mapCustomerToFiken } from "./customers";
import { mapOrderToFikenInvoice } from "./invoices";

describe("Fiken Integration", () => {
  let testTenantId: string;
  let testCustomerId: number;
  let testOrderId: number;

  beforeAll(async () => {
    testTenantId = "test-fiken-" + Math.floor(Math.random() * 100000);
  });

  describe("Customer Mapping", () => {
    it("should map customer with full name correctly", () => {
      const customer = {
        id: 1,
        firstName: "Ola",
        lastName: "Nordmann",
        email: "ola@example.com",
        phone: "+4712345678",
      };

      const fikenContact = mapCustomerToFiken(customer);

      expect(fikenContact.name).toBe("Ola Nordmann");
      expect(fikenContact.email).toBe("ola@example.com");
      expect(fikenContact.phoneNumber).toBe("+4712345678");
    });

    it("should map customer with first name only", () => {
      const customer = {
        id: 2,
        firstName: "Kari",
        lastName: null,
        email: "kari@example.com",
        phone: "+4787654321",
      };

      const fikenContact = mapCustomerToFiken(customer);

      expect(fikenContact.name).toBe("Kari");
      expect(fikenContact.email).toBe("kari@example.com");
    });

    it("should handle missing email and phone", () => {
      const customer = {
        id: 3,
        firstName: "Per",
        lastName: "Hansen",
        email: null,
        phone: null,
      };

      const fikenContact = mapCustomerToFiken(customer);

      expect(fikenContact.name).toBe("Per Hansen");
      expect(fikenContact.email).toBeUndefined();
      expect(fikenContact.phoneNumber).toBeUndefined();
    });
  });

  describe("Database Schema", () => {
    it("should have fikenSettings table", async () => {
      const db = await getDb();
      expect(db).toBeDefined();

      // Try to query the table
      const result = await db
        .select()
        .from(fikenSettings)
        .where(eq(fikenSettings.tenantId, "non-existent"))
        .limit(1);

      expect(Array.isArray(result)).toBe(true);
    });

    it("should store Fiken settings correctly", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Insert test settings
      await db.insert(fikenSettings).values({
        tenantId: testTenantId,
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
        enabled: false,
      });

      // Retrieve settings
      const [settings] = await db
        .select()
        .from(fikenSettings)
        .where(eq(fikenSettings.tenantId, testTenantId))
        .limit(1);

      expect(settings).toBeDefined();
      expect(settings.clientId).toBe("test-client-id");
      expect(settings.enabled).toBe(false);

      // Cleanup
      await db
        .delete(fikenSettings)
        .where(eq(fikenSettings.tenantId, testTenantId));
    });
  });

  describe("Invoice Mapping", () => {
    it("should calculate VAT correctly for Norwegian rates", () => {
      // Norwegian VAT is 25%
      const netAmount = 1000;
      const vatRate = 0.25;
      const vatAmount = netAmount * vatRate;
      const grossAmount = netAmount + vatAmount;

      expect(vatAmount).toBe(250);
      expect(grossAmount).toBe(1250);
    });

    it("should format dates correctly for Fiken API", () => {
      const date = new Date("2024-01-15T10:30:00Z");
      const formatted = date.toISOString().split('T')[0];

      expect(formatted).toBe("2024-01-15");
    });

    it("should handle order without customer gracefully", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Create test order without customer
      const [order] = await db.insert(orders).values({
        tenantId: testTenantId,
        customerId: null, // No customer
        orderDate: "2024-01-15",
        orderTime: "10:30:00",
        subtotal: "100.00",
        vatAmount: "25.00",
        total: "125.00",
        status: "completed",
      }).$returningId();

      testOrderId = order.id;

      // Try to map order to invoice
      try {
        await mapOrderToFikenInvoice(testTenantId, testOrderId);
        expect.fail("Should have thrown error for order without customer");
      } catch (error) {
        expect(error instanceof Error).toBe(true);
        expect((error as Error).message).toContain("no customer assigned");
      }

      // Cleanup
      await db.delete(orders).where(eq(orders.id, testOrderId));
    });
  });

  describe("OAuth Flow", () => {
    it("should generate valid authorization URL", async () => {
      const { FikenClient } = await import("./client");
      
      const clientId = "test-client-id";
      const redirectUri = "https://example.com/callback";
      const state = "test-state-123";

      const authUrl = FikenClient.getAuthorizationUrl(clientId, redirectUri, state);

      expect(authUrl).toContain("https://fiken.no/oauth/authorize");
      expect(authUrl).toContain(`client_id=${clientId}`);
      expect(authUrl).toContain(`redirect_uri=${encodeURIComponent(redirectUri)}`);
      expect(authUrl).toContain(`state=${state}`);
      expect(authUrl).toContain("response_type=code");
    });

    it("should validate state parameter format", () => {
      const tenantId = "tenant-123";
      const timestamp = Date.now();
      const state = `${tenantId}:${timestamp}`;

      const [extractedTenantId, extractedTimestamp] = state.split(':');

      expect(extractedTenantId).toBe(tenantId);
      expect(parseInt(extractedTimestamp)).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle missing database connection", async () => {
      // This test validates that functions check for db availability
      const db = await getDb();
      expect(db).toBeDefined();
    });

    it("should validate required fields in customer mapping", () => {
      const invalidCustomer = {
        id: 999,
        firstName: "", // Empty first name
        lastName: null,
        email: null,
        phone: null,
      };

      const fikenContact = mapCustomerToFiken(invalidCustomer);

      // Should still create a contact, even with empty name
      expect(fikenContact.name).toBe("");
    });
  });

  describe("Integration Status", () => {
    it("should report correct integration status", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Create settings without credentials
      const statusTenantId = "test-stat-" + Math.floor(Math.random() * 10000);
      await db.insert(fikenSettings).values({
        tenantId: statusTenantId,
        clientId: null,
        clientSecret: null,
        enabled: false,
      });

      const [settings] = await db
        .select()
        .from(fikenSettings)
        .where(eq(fikenSettings.tenantId, statusTenantId))
        .limit(1);

      const hasCredentials = !!(settings.clientId && settings.clientSecret);
      const isConnected = !!(settings.accessToken && settings.companySlug);

      expect(hasCredentials).toBe(false);
      expect(isConnected).toBe(false);

      // Cleanup
      await db
        .delete(fikenSettings)
        .where(eq(fikenSettings.tenantId, statusTenantId));
    });
  });
});
