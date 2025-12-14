import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("POS createOrder", () => {
  beforeAll(async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) {
      throw new Error("Database not initialized");
    }
  });

  it("should create order with proper date formatting", async () => {
    // Arrange
    const testOrderData = {
      tenantId: "test-tenant",
      appointmentId: null,
      customerId: null,
      employeeId: 1,
      orderDate: "2025-12-08", // YYYY-MM-DD format
      orderTime: "19:00",
      subtotal: "200.00",
      vatAmount: "50.00",
      total: "250.00",
      status: "pending" as const,
    };

    const testItems = [
      {
        itemType: "service" as const,
        itemId: 1,
        itemName: "Test Service",
        quantity: 1,
        unitPrice: "200.00",
        vatRate: "25.00",
        total: "200.00",
      },
    ];

    // Act
    const result = await db.createOrderWithItems(testOrderData, testItems);

    // Assert
    expect(result).toBeDefined();
    expect(result.order).toBeDefined();
    expect(result.order.id).toBeGreaterThan(0);
    expect(result.order.tenantId).toBe(testOrderData.tenantId);
    expect(result.order.employeeId).toBe(testOrderData.employeeId);
    expect(result.order.subtotal).toBe(testOrderData.subtotal);
    expect(result.order.total).toBe(testOrderData.total);
    expect(result.order.status).toBe("pending");
    
    expect(result.items).toBeDefined();
    expect(result.items.length).toBe(1);
    expect(result.items[0].itemType).toBe("service");
    expect(result.items[0].quantity).toBe(1);
    expect(result.items[0].unitPrice).toBe("200.00");

    console.log("✅ Order created successfully:", result.order.id);
  });

  it("should handle date conversion from Date object", async () => {
    // Arrange
    const now = new Date();
    const formattedDate = now.toISOString().split('T')[0];
    const formattedTime = now.toTimeString().split(' ')[0].substring(0, 5);

    const testOrderData = {
      tenantId: "test-tenant-2",
      appointmentId: null,
      customerId: null,
      employeeId: 1,
      orderDate: formattedDate, // Converted from Date to string
      orderTime: formattedTime,
      subtotal: "100.00",
      vatAmount: "25.00",
      total: "125.00",
      status: "pending" as const,
    };

    const testItems = [
      {
        itemType: "product" as const,
        itemId: 1,
        itemName: "Test Product",
        quantity: 2,
        unitPrice: "50.00",
        vatRate: "25.00",
        total: "100.00",
      },
    ];

    // Act
    const result = await db.createOrderWithItems(testOrderData, testItems);

    // Assert
    expect(result).toBeDefined();
    expect(result.order.id).toBeGreaterThan(0);
    console.log("✅ Order with date conversion created successfully:", result.order.id);
  });
});
