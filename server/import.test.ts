import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { importCustomersFromFile, importServicesFromFile, importProductsFromFile, listImports } from "./import";
import { getDb } from "./db";
import { tenants, users, customers, services, products } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import * as XLSX from "xlsx";

describe("Data Import System", () => {
  let testTenantId: string;
  let testUserId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Create test tenant
    testTenantId = `test-import-tenant-${Date.now()}`;
    await db.insert(tenants).values({
      id: testTenantId,
      name: "Test Import Salon",
      subdomain: `test-import-${Date.now()}`,
      status: "active",
      plan: "premium",
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    // Create test user
    const userResult = await db.insert(users).values({
      tenantId: testTenantId,
      openId: `test-import-openid-${Date.now()}`,
      name: "Test Admin",
      email: `admin-import-${Date.now()}@test.com`,
      role: "admin",
      passwordHash: await bcrypt.hash("test123", 10),
      isActive: true,
    });

    const insertedId = Array.isArray(userResult) ? userResult[0]?.insertId : (userResult as any).insertId;
    testUserId = Number(insertedId);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    try {
      await db.delete(customers).where(eq(customers.tenantId, testTenantId));
      await db.delete(services).where(eq(services.tenantId, testTenantId));
      await db.delete(products).where(eq(products.tenantId, testTenantId));
      await db.delete(users).where(eq(users.tenantId, testTenantId));
      await db.delete(tenants).where(eq(tenants.id, testTenantId));
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  });

  it("should import customers from CSV file", async () => {
    // Create CSV data
    const csvData = [
      { firstName: "Ola", lastName: "Nordmann", phone: "12345678", email: "ola@test.com", notes: "Test customer" },
      { firstName: "Kari", lastName: "Hansen", phone: "87654321", email: "kari@test.com", notes: "" },
    ];

    // Convert to Excel buffer
    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Import
    const result = await importCustomersFromFile(
      testTenantId,
      buffer,
      "customers.xlsx",
      testUserId
    );

    expect(result.success).toBe(true);
    expect(result.total).toBe(2);
    expect(result.imported).toBe(2);
    expect(result.failed).toBe(0);

    // Verify customers were created
    const db = await getDb();
    const importedCustomers = await db!
      .select()
      .from(customers)
      .where(eq(customers.tenantId, testTenantId));

    expect(importedCustomers.length).toBe(2);
    expect(importedCustomers[0].firstName).toBe("Ola");
    expect(importedCustomers[1].firstName).toBe("Kari");
  });

  it("should import services from Excel file", async () => {
    // Create Excel data
    const serviceData = [
      { name: "Herreklipp", description: "Standard herreklipp", price: 350, duration: 30 },
      { name: "Dameklipp", description: "Standard dameklipp", price: 450, duration: 45 },
    ];

    // Convert to Excel buffer
    const worksheet = XLSX.utils.json_to_sheet(serviceData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Services");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Import
    const result = await importServicesFromFile(
      testTenantId,
      buffer,
      "services.xlsx",
      testUserId
    );

    expect(result.success).toBe(true);
    expect(result.total).toBe(2);
    expect(result.imported).toBe(2);
    expect(result.failed).toBe(0);

    // Verify services were created
    const db = await getDb();
    const importedServices = await db!
      .select()
      .from(services)
      .where(eq(services.tenantId, testTenantId));

    expect(importedServices.length).toBe(2);
    expect(importedServices[0].name).toBe("Herreklipp");
    expect(importedServices[1].name).toBe("Dameklipp");
  });

  it("should import products from Excel file", async () => {
    // Create Excel data
    const productData = [
      { name: "Shampoo", description: "Profesjonell shampoo", price: 150, costPrice: 75, stock: 50, lowStockThreshold: 10, sku: "SH001" },
      { name: "Voks", description: "Stylingvoks", price: 120, costPrice: 60, stock: 30, lowStockThreshold: 5, sku: "WX001" },
    ];

    // Convert to Excel buffer
    const worksheet = XLSX.utils.json_to_sheet(productData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Import
    const result = await importProductsFromFile(
      testTenantId,
      buffer,
      "products.xlsx",
      testUserId
    );

    expect(result.success).toBe(true);
    expect(result.total).toBe(2);
    expect(result.imported).toBe(2);
    expect(result.failed).toBe(0);

    // Verify products were created
    const db = await getDb();
    const importedProducts = await db!
      .select()
      .from(products)
      .where(eq(products.tenantId, testTenantId));

    expect(importedProducts.length).toBe(2);
    expect(importedProducts[0].name).toBe("Shampoo");
    expect(importedProducts[1].name).toBe("Voks");
  });

  it("should handle duplicate customers gracefully", async () => {
    // Create CSV with duplicate phone number
    const csvData = [
      { firstName: "Duplicate", lastName: "User", phone: "12345678", email: "dup@test.com" }, // Same phone as first test
    ];

    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const result = await importCustomersFromFile(
      testTenantId,
      buffer,
      "duplicates.xlsx",
      testUserId
    );

    expect(result.success).toBe(true);
    expect(result.total).toBe(1);
    expect(result.imported).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].error).toContain("already exists");
  });

  it("should handle missing required fields", async () => {
    // Create CSV with missing required field (phone)
    const csvData = [
      { firstName: "Missing", lastName: "Phone", email: "missing@test.com" }, // No phone
    ];

    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const result = await importCustomersFromFile(
      testTenantId,
      buffer,
      "missing-fields.xlsx",
      testUserId
    );

    expect(result.success).toBe(true);
    expect(result.total).toBe(1);
    expect(result.imported).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors[0].error).toContain("Missing required fields");
  });

  it("should list all imports for tenant", async () => {
    const imports = await listImports(testTenantId);

    expect(Array.isArray(imports)).toBe(true);
    expect(imports.length).toBeGreaterThan(0);
    
    // Check that all imports belong to this tenant
    imports.forEach(imp => {
      expect(imp.tenantId).toBe(testTenantId);
    });
  });
});
