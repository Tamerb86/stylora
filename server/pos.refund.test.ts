import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import type { MySql2Database } from "drizzle-orm/mysql2";

describe("POS Refund System", () => {
  let dbInstance: MySql2Database | null = null;
  let testTenantId: string;
  let testEmployeeId: number;
  let testOrderId: number;
  let testPaymentId: number;

  beforeAll(async () => {
    dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");

    const { tenants, users, orders, payments } = await import("../drizzle/schema");

    // Get existing tenant
    const existingTenants = await dbInstance.select().from(tenants).limit(1);
    if (existingTenants.length === 0) {
      throw new Error("No tenant found in database");
    }
    testTenantId = existingTenants[0].id;

    // Get existing employee
    const { eq } = await import("drizzle-orm");
    const existingEmployees = await dbInstance
      .select()
      .from(users)
      .where(eq(users.tenantId, testTenantId))
      .limit(1);

    if (existingEmployees.length === 0) {
      throw new Error("No employee found for tenant");
    }
    testEmployeeId = existingEmployees[0].id;

    // Create test order
    const [order] = await dbInstance.insert(orders).values({
      tenantId: testTenantId,
      employeeId: testEmployeeId,
      orderDate: new Date().toISOString().split("T")[0],
      orderTime: "15:00:00",
      subtotal: "800.00",
      vatAmount: "200.00",
      total: "1000.00",
      status: "completed",
    });
    testOrderId = order.insertId;

    // Create test payment
    const [payment] = await dbInstance.insert(payments).values({
      tenantId: testTenantId,
      orderId: testOrderId,
      amount: "1000.00",
      currency: "NOK",
      paymentMethod: "card",
      status: "completed",
      processedBy: testEmployeeId,
      processedAt: new Date(),
    });
    testPaymentId = payment.insertId;
  });

  afterAll(async () => {
    if (!dbInstance) return;
    const { orders, payments, refunds } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    // Clean up test data
    await dbInstance.delete(refunds).where(eq(refunds.orderId, testOrderId));
    await dbInstance.delete(payments).where(eq(payments.orderId, testOrderId));
    await dbInstance.delete(orders).where(eq(orders.id, testOrderId));
  });

  it("should create full refund", async () => {
    if (!dbInstance) throw new Error("Database not available");

    const { createRefund } = await import("./db");

    const refundData = {
      tenantId: testTenantId,
      paymentId: testPaymentId,
      orderId: testOrderId,
      amount: 1000.0,
      reason: "Customer requested full refund",
      refundMethod: "manual" as const,
      processedBy: testEmployeeId,
    };

    const result = await createRefund(refundData);

    expect(result).toBeDefined();
    expect(result.insertId).toBeGreaterThan(0);

    // Verify refund was created
    const { refunds } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const [createdRefund] = await dbInstance
      .select()
      .from(refunds)
      .where(eq(refunds.id, result.insertId))
      .limit(1);

    expect(createdRefund).toBeDefined();
    expect(parseFloat(createdRefund.amount)).toBe(1000.0);
    expect(createdRefund.reason).toBe("Customer requested full refund");
    expect(createdRefund.refundMethod).toBe("manual");
    expect(createdRefund.status).toBe("pending");
    expect(createdRefund.processedBy).toBe(testEmployeeId);
  });

  it("should create partial refund", async () => {
    if (!dbInstance) throw new Error("Database not available");

    const { createRefund } = await import("./db");

    const refundData = {
      tenantId: testTenantId,
      paymentId: testPaymentId,
      orderId: testOrderId,
      amount: 300.0,
      reason: "Partial refund for service cancellation",
      refundMethod: "manual" as const,
      processedBy: testEmployeeId,
    };

    const result = await createRefund(refundData);

    expect(result).toBeDefined();

    // Verify partial refund amount
    const { refunds } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const [createdRefund] = await dbInstance
      .select()
      .from(refunds)
      .where(eq(refunds.id, result.insertId))
      .limit(1);

    expect(parseFloat(createdRefund.amount)).toBe(300.0);
  });

  it("should retrieve refunds by order ID", async () => {
    if (!dbInstance) throw new Error("Database not available");

    const { getRefundsByOrder } = await import("./db");

    const refunds = await getRefundsByOrder(testOrderId);

    expect(refunds.length).toBeGreaterThan(0);
    refunds.forEach((refund) => {
      expect(refund.orderId).toBe(testOrderId);
      expect(refund.tenantId).toBe(testTenantId);
    });
  });

  it("should retrieve refunds by payment ID", async () => {
    if (!dbInstance) throw new Error("Database not available");

    const { getRefundsByPayment } = await import("./db");

    const refunds = await getRefundsByPayment(testPaymentId);

    expect(refunds.length).toBeGreaterThan(0);
    refunds.forEach((refund) => {
      expect(refund.paymentId).toBe(testPaymentId);
    });
  });

  it("should update refund status", async () => {
    if (!dbInstance) throw new Error("Database not available");

    const { createRefund, updateRefundStatus } = await import("./db");

    // Create refund
    const refundData = {
      tenantId: testTenantId,
      paymentId: testPaymentId,
      orderId: testOrderId,
      amount: 200.0,
      reason: "Test refund status update",
      refundMethod: "manual" as const,
      processedBy: testEmployeeId,
    };

    const result = await createRefund(refundData);
    const refundId = result.insertId;

    // Update to completed
    await updateRefundStatus(refundId, "completed");

    // Verify status updated
    const { refunds } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const [updatedRefund] = await dbInstance
      .select()
      .from(refunds)
      .where(eq(refunds.id, refundId))
      .limit(1);

    expect(updatedRefund.status).toBe("completed");
    expect(updatedRefund.processedAt).toBeDefined();
  });

  it("should handle failed refund status", async () => {
    if (!dbInstance) throw new Error("Database not available");

    const { createRefund, updateRefundStatus } = await import("./db");

    // Create refund
    const refundData = {
      tenantId: testTenantId,
      paymentId: testPaymentId,
      orderId: testOrderId,
      amount: 150.0,
      reason: "Test failed refund",
      refundMethod: "stripe" as const,
      processedBy: testEmployeeId,
    };

    const result = await createRefund(refundData);
    const refundId = result.insertId;

    // Update to failed with error message
    await updateRefundStatus(refundId, "failed", "Stripe API error: insufficient funds");

    // Verify status and error message
    const { refunds } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const [updatedRefund] = await dbInstance
      .select()
      .from(refunds)
      .where(eq(refunds.id, refundId))
      .limit(1);

    expect(updatedRefund.status).toBe("failed");
    expect(updatedRefund.errorMessage).toBe("Stripe API error: insufficient funds");
  });

  it("should calculate total refunded amount for payment", async () => {
    if (!dbInstance) throw new Error("Database not available");

    const { refunds } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const paymentRefunds = await dbInstance
      .select()
      .from(refunds)
      .where(eq(refunds.paymentId, testPaymentId));

    const totalRefunded = paymentRefunds
      .filter((r) => r.status === "completed" || r.status === "pending")
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);

    expect(totalRefunded).toBeGreaterThan(0);
  });

  it("should enforce tenant isolation for refunds", async () => {
    if (!dbInstance) throw new Error("Database not available");

    const { refunds } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const tenantRefunds = await dbInstance
      .select()
      .from(refunds)
      .where(eq(refunds.orderId, testOrderId));

    tenantRefunds.forEach((refund) => {
      expect(refund.tenantId).toBe(testTenantId);
    });
  });

  it("should track who processed each refund", async () => {
    if (!dbInstance) throw new Error("Database not available");

    const { refunds } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const orderRefunds = await dbInstance
      .select()
      .from(refunds)
      .where(eq(refunds.orderId, testOrderId));

    orderRefunds.forEach((refund) => {
      expect(refund.processedBy).toBe(testEmployeeId);
      expect(refund.createdAt).toBeDefined();
    });
  });

  it("should support multiple partial refunds", async () => {
    if (!dbInstance) throw new Error("Database not available");

    const { createRefund } = await import("./db");

    // Create multiple partial refunds
    const refund1 = await createRefund({
      tenantId: testTenantId,
      paymentId: testPaymentId,
      orderId: testOrderId,
      amount: 100.0,
      reason: "First partial refund",
      refundMethod: "manual" as const,
      processedBy: testEmployeeId,
    });

    const refund2 = await createRefund({
      tenantId: testTenantId,
      paymentId: testPaymentId,
      orderId: testOrderId,
      amount: 50.0,
      reason: "Second partial refund",
      refundMethod: "manual" as const,
      processedBy: testEmployeeId,
    });

    expect(refund1.insertId).toBeDefined();
    expect(refund2.insertId).toBeDefined();

    // Verify both refunds exist
    const { refunds } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const allRefunds = await dbInstance
      .select()
      .from(refunds)
      .where(eq(refunds.paymentId, testPaymentId));

    const partialRefunds = allRefunds.filter(
      (r) => r.id === refund1.insertId || r.id === refund2.insertId
    );

    expect(partialRefunds).toHaveLength(2);

    const totalPartialAmount = partialRefunds.reduce(
      (sum, r) => sum + parseFloat(r.amount),
      0
    );
    expect(totalPartialAmount).toBe(150.0);
  });
});
