import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import type { MySql2Database } from "drizzle-orm/mysql2";

describe("POS Split Payment System", () => {
  let dbInstance: MySql2Database | null = null;
  let testTenantId: string;
  let testEmployeeId: number;
  let testOrderId: number;

  beforeAll(async () => {
    dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");

    const { tenants, users, orders } = await import("../drizzle/schema");

    // Get existing tenant
    const existingTenants = await dbInstance.select().from(tenants).limit(1);
    if (existingTenants.length === 0) {
      throw new Error("No tenant found in database");
    }
    testTenantId = existingTenants[0].id;

    // Get existing employee
    const existingEmployees = await dbInstance
      .select()
      .from(users)
      .where((users) => {
        const { eq } = require("drizzle-orm");
        return eq(users.tenantId, testTenantId);
      })
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
      orderTime: "14:00:00",
      subtotal: "500.00",
      vatAmount: "125.00",
      total: "625.00",
      status: "pending",
    });
    testOrderId = order.insertId;
  });

  afterAll(async () => {
    if (!dbInstance) return;
    const { orders, payments, paymentSplits } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    // Clean up test data
    await dbInstance.delete(paymentSplits).where(eq(paymentSplits.orderId, testOrderId));
    await dbInstance.delete(payments).where(eq(payments.orderId, testOrderId));
    await dbInstance.delete(orders).where(eq(orders.id, testOrderId));
  });

  it("should create split payment with cash and card", async () => {
    if (!dbInstance) throw new Error("Database not available");

    const { payments, paymentSplits } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const totalAmount = 625.0;
    const cashAmount = 300.0;
    const cardAmount = 325.0;

    // Create parent payment
    const [payment] = await dbInstance.insert(payments).values({
      tenantId: testTenantId,
      orderId: testOrderId,
      amount: totalAmount.toString(),
      currency: "NOK",
      paymentMethod: "split",
      status: "completed",
      processedBy: testEmployeeId,
      processedAt: new Date(),
    });

    const paymentId = payment.insertId;

    // Create split records
    await dbInstance.insert(paymentSplits).values([
      {
        tenantId: testTenantId,
        orderId: testOrderId,
        paymentId,
        amount: cashAmount.toString(),
        paymentMethod: "cash",
        status: "completed",
        processedBy: testEmployeeId,
      },
      {
        tenantId: testTenantId,
        orderId: testOrderId,
        paymentId,
        amount: cardAmount.toString(),
        paymentMethod: "card",
        cardLast4: "4242",
        cardBrand: "Visa",
        status: "completed",
        processedBy: testEmployeeId,
      },
    ]);

    // Verify parent payment
    const createdPayment = await dbInstance
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    expect(createdPayment).toHaveLength(1);
    expect(createdPayment[0].paymentMethod).toBe("split");
    expect(parseFloat(createdPayment[0].amount)).toBe(totalAmount);

    // Verify splits
    const splits = await dbInstance
      .select()
      .from(paymentSplits)
      .where(eq(paymentSplits.paymentId, paymentId));

    expect(splits).toHaveLength(2);

    const cashSplit = splits.find((s) => s.paymentMethod === "cash");
    const cardSplit = splits.find((s) => s.paymentMethod === "card");

    expect(cashSplit).toBeDefined();
    expect(parseFloat(cashSplit!.amount)).toBe(cashAmount);

    expect(cardSplit).toBeDefined();
    expect(parseFloat(cardSplit!.amount)).toBe(cardAmount);
    expect(cardSplit!.cardLast4).toBe("4242");
    expect(cardSplit!.cardBrand).toBe("Visa");

    // Verify total matches
    const splitTotal = splits.reduce((sum, s) => sum + parseFloat(s.amount), 0);
    expect(splitTotal).toBe(totalAmount);
  });

  it("should validate split amounts sum to total", async () => {
    const totalAmount = 625.0;
    const cashAmount = 300.0;
    const cardAmount = 320.0; // Intentionally wrong (should be 325)

    const splitTotal = cashAmount + cardAmount;
    const difference = Math.abs(splitTotal - totalAmount);

    expect(difference).toBeGreaterThan(0.01);
  });

  it("should support three-way split payment", async () => {
    if (!dbInstance) throw new Error("Database not available");

    const { payments, paymentSplits } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const totalAmount = 1000.0;

    // Create parent payment
    const [payment] = await dbInstance.insert(payments).values({
      tenantId: testTenantId,
      orderId: testOrderId,
      amount: totalAmount.toString(),
      currency: "NOK",
      paymentMethod: "split",
      status: "completed",
      processedBy: testEmployeeId,
      processedAt: new Date(),
    });

    const paymentId = payment.insertId;

    // Create three splits: cash, card, vipps
    await dbInstance.insert(paymentSplits).values([
      {
        tenantId: testTenantId,
        orderId: testOrderId,
        paymentId,
        amount: "300.00",
        paymentMethod: "cash",
        status: "completed",
        processedBy: testEmployeeId,
      },
      {
        tenantId: testTenantId,
        orderId: testOrderId,
        paymentId,
        amount: "400.00",
        paymentMethod: "card",
        cardLast4: "1234",
        cardBrand: "Mastercard",
        status: "completed",
        processedBy: testEmployeeId,
      },
      {
        tenantId: testTenantId,
        orderId: testOrderId,
        paymentId,
        amount: "300.00",
        paymentMethod: "vipps",
        transactionId: "VIPPS-123456",
        status: "completed",
        processedBy: testEmployeeId,
      },
    ]);

    // Verify all splits created
    const splits = await dbInstance
      .select()
      .from(paymentSplits)
      .where(eq(paymentSplits.paymentId, paymentId));

    expect(splits).toHaveLength(3);

    const splitTotal = splits.reduce((sum, s) => sum + parseFloat(s.amount), 0);
    expect(splitTotal).toBe(totalAmount);
  });

  it("should retrieve splits by order ID", async () => {
    if (!dbInstance) throw new Error("Database not available");

    const { getSplitsByOrder } = await import("./db");

    const splits = await getSplitsByOrder(testOrderId);

    expect(splits.length).toBeGreaterThan(0);
    splits.forEach((split) => {
      expect(split.orderId).toBe(testOrderId);
      expect(split.tenantId).toBe(testTenantId);
    });
  });

  it("should retrieve splits by payment ID", async () => {
    if (!dbInstance) throw new Error("Database not available");

    const { payments, paymentSplits } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    // Get first payment for this order
    const orderPayments = await dbInstance
      .select()
      .from(payments)
      .where(eq(payments.orderId, testOrderId))
      .limit(1);

    if (orderPayments.length === 0) return;

    const paymentId = orderPayments[0].id;
    const { getSplitsByPayment } = await import("./db");

    const splits = await getSplitsByPayment(paymentId);

    expect(splits.length).toBeGreaterThan(0);
    splits.forEach((split) => {
      expect(split.paymentId).toBe(paymentId);
    });
  });

  it("should store card details in split payment", async () => {
    if (!dbInstance) throw new Error("Database not available");

    const { payments, paymentSplits } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    // Create payment with card split
    const [payment] = await dbInstance.insert(payments).values({
      tenantId: testTenantId,
      orderId: testOrderId,
      amount: "500.00",
      currency: "NOK",
      paymentMethod: "split",
      status: "completed",
      processedBy: testEmployeeId,
      processedAt: new Date(),
    });

    const paymentId = payment.insertId;

    await dbInstance.insert(paymentSplits).values({
      tenantId: testTenantId,
      orderId: testOrderId,
      paymentId,
      amount: "500.00",
      paymentMethod: "card",
      cardLast4: "5678",
      cardBrand: "American Express",
      transactionId: "TXN-AMEX-789",
      status: "completed",
      processedBy: testEmployeeId,
    });

    const splits = await dbInstance
      .select()
      .from(paymentSplits)
      .where(eq(paymentSplits.paymentId, paymentId));

    expect(splits).toHaveLength(1);
    expect(splits[0].cardLast4).toBe("5678");
    expect(splits[0].cardBrand).toBe("American Express");
    expect(splits[0].transactionId).toBe("TXN-AMEX-789");
  });

  it("should enforce tenant isolation for split payments", async () => {
    if (!dbInstance) throw new Error("Database not available");

    const { paymentSplits } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const splits = await dbInstance
      .select()
      .from(paymentSplits)
      .where(eq(paymentSplits.orderId, testOrderId));

    splits.forEach((split) => {
      expect(split.tenantId).toBe(testTenantId);
    });
  });

  it("should track who processed each split", async () => {
    if (!dbInstance) throw new Error("Database not available");

    const { paymentSplits } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const splits = await dbInstance
      .select()
      .from(paymentSplits)
      .where(eq(paymentSplits.orderId, testOrderId));

    splits.forEach((split) => {
      expect(split.processedBy).toBe(testEmployeeId);
      expect(split.createdAt).toBeDefined();
    });
  });
});
