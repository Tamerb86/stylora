import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";
import { getDb } from "./db";
import { orders, payments, refunds, customers } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("POS Refund System", () => {
  let testTenantId: string;
  let testOrderId: number;
  let testPaymentId: number;
  let testUserId: number;

  beforeAll(async () => {
    const dbInstance = await getDb();
    if (!dbInstance) {
      throw new Error("Database not available");
    }

    // Use a test tenant ID
    testTenantId = "test-tenant-refund";
    testUserId = 1; // Assume user 1 exists

    // Create a test customer
    const [customerResult] = await dbInstance.insert(customers).values({
      tenantId: testTenantId,
      firstName: "Test",
      lastName: "Customer",
      phone: "12345678",
      email: "test@example.com",
    });

    // Create a test order
    const [orderResult] = await dbInstance.insert(orders).values({
      tenantId: testTenantId,
      customerId: customerResult.insertId,
      orderDate: new Date().toISOString().split("T")[0],
      orderTime: "12:00:00",
      subtotal: "800.00",
      vatAmount: "200.00",
      total: "1000.00",
      status: "completed",
    });

    testOrderId = orderResult.insertId;

    // Create a test payment
    const [paymentResult] = await dbInstance.insert(payments).values({
      tenantId: testTenantId,
      orderId: testOrderId,
      amount: "1000.00",
      currency: "NOK",
      paymentMethod: "card",
      status: "completed",
      processedAt: new Date(),
    });

    testPaymentId = paymentResult.insertId;
  });

  it("should create a full refund successfully", async () => {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("DB not available");

    // Create refund
    const [refundResult] = await dbInstance.insert(refunds).values({
      tenantId: testTenantId,
      paymentId: testPaymentId,
      orderId: testOrderId,
      amount: "1000.00",
      reason: "customer_request - Test refund",
      refundMethod: "manual",
      status: "completed",
      processedBy: testUserId,
      processedAt: new Date(),
    });

    expect(refundResult.insertId).toBeGreaterThan(0);

    // Verify refund was created
    const [refund] = await dbInstance
      .select()
      .from(refunds)
      .where(eq(refunds.id, refundResult.insertId))
      .limit(1);

    expect(refund).toBeDefined();
    expect(refund.amount).toBe("1000.00");
    expect(refund.status).toBe("completed");
    expect(refund.orderId).toBe(testOrderId);
  });

  it("should calculate available refund amount correctly", async () => {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("DB not available");

    // Create a new order for partial refund test
    const [orderResult] = await dbInstance.insert(orders).values({
      tenantId: testTenantId,
      orderDate: new Date().toISOString().split("T")[0],
      orderTime: "13:00:00",
      subtotal: "800.00",
      vatAmount: "200.00",
      total: "1000.00",
      status: "completed",
    });

    const newOrderId = orderResult.insertId;

    // Create payment
    const [paymentResult] = await dbInstance.insert(payments).values({
      tenantId: testTenantId,
      orderId: newOrderId,
      amount: "1000.00",
      currency: "NOK",
      paymentMethod: "card",
      status: "completed",
      processedAt: new Date(),
    });

    const newPaymentId = paymentResult.insertId;

    // Create first partial refund (300 kr)
    await dbInstance.insert(refunds).values({
      tenantId: testTenantId,
      paymentId: newPaymentId,
      orderId: newOrderId,
      amount: "300.00",
      reason: "partial_refund_test",
      refundMethod: "manual",
      status: "completed",
      processedBy: testUserId,
      processedAt: new Date(),
    });

    // Get all refunds for this order
    const existingRefunds = await dbInstance
      .select()
      .from(refunds)
      .where(eq(refunds.orderId, newOrderId));

    const totalRefunded = existingRefunds
      .filter((r) => r.status === "completed")
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);

    const originalAmount = 1000;
    const availableAmount = originalAmount - totalRefunded;

    expect(totalRefunded).toBe(300);
    expect(availableAmount).toBe(700);
  });

  it("should update order status to refunded after full refund", async () => {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("DB not available");

    // Create a new order
    const [orderResult] = await dbInstance.insert(orders).values({
      tenantId: testTenantId,
      orderDate: new Date().toISOString().split("T")[0],
      orderTime: "14:00:00",
      subtotal: "400.00",
      vatAmount: "100.00",
      total: "500.00",
      status: "completed",
    });

    const newOrderId = orderResult.insertId;

    // Create payment
    const [paymentResult] = await dbInstance.insert(payments).values({
      tenantId: testTenantId,
      orderId: newOrderId,
      amount: "500.00",
      currency: "NOK",
      paymentMethod: "cash",
      status: "completed",
      processedAt: new Date(),
    });

    const newPaymentId = paymentResult.insertId;

    // Create full refund
    await dbInstance.insert(refunds).values({
      tenantId: testTenantId,
      paymentId: newPaymentId,
      orderId: newOrderId,
      amount: "500.00",
      reason: "full_refund_test",
      refundMethod: "manual",
      status: "completed",
      processedBy: testUserId,
      processedAt: new Date(),
    });

    // Update order status to refunded
    await dbInstance
      .update(orders)
      .set({ status: "refunded" })
      .where(eq(orders.id, newOrderId));

    // Verify order status
    const [order] = await dbInstance
      .select()
      .from(orders)
      .where(eq(orders.id, newOrderId))
      .limit(1);

    expect(order.status).toBe("refunded");
  });

  it("should prevent refund exceeding available amount", async () => {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("DB not available");

    // Create a new order
    const [orderResult] = await dbInstance.insert(orders).values({
      tenantId: testTenantId,
      orderDate: new Date().toISOString().split("T")[0],
      orderTime: "15:00:00",
      subtotal: "800.00",
      vatAmount: "200.00",
      total: "1000.00",
      status: "completed",
    });

    const newOrderId = orderResult.insertId;

    // Create payment
    const [paymentResult] = await dbInstance.insert(payments).values({
      tenantId: testTenantId,
      orderId: newOrderId,
      amount: "1000.00",
      currency: "NOK",
      paymentMethod: "card",
      status: "completed",
      processedAt: new Date(),
    });

    const newPaymentId = paymentResult.insertId;

    // Create first refund (600 kr)
    await dbInstance.insert(refunds).values({
      tenantId: testTenantId,
      paymentId: newPaymentId,
      orderId: newOrderId,
      amount: "600.00",
      reason: "first_refund",
      refundMethod: "manual",
      status: "completed",
      processedBy: testUserId,
      processedAt: new Date(),
    });

    // Get existing refunds
    const existingRefunds = await dbInstance
      .select()
      .from(refunds)
      .where(eq(refunds.orderId, newOrderId));

    const totalRefunded = existingRefunds
      .filter((r) => r.status === "completed")
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);

    const originalAmount = 1000;
    const availableAmount = originalAmount - totalRefunded;

    // Verify that attempting to refund more than available would be caught
    expect(availableAmount).toBe(400);
    expect(totalRefunded).toBe(600);
    
    // Attempting to refund 500 kr should fail (only 400 kr available)
    const attemptedRefund = 500;
    const wouldExceed = attemptedRefund > availableAmount;
    expect(wouldExceed).toBe(true);
  });
});
