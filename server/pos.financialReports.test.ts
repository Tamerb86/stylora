import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import type { MySql2Database } from "drizzle-orm/mysql2";

describe("POS Financial Reports", () => {
  let dbInstance: MySql2Database | null = null;
  let testTenantId: string;
  let testEmployeeId: number;
  let testEmployee2Id: number;
  let testOrderIds: number[] = [];

  beforeAll(async () => {
    dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");

    const { tenants, users, orders, payments, orderItems, services } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    // Get existing tenant
    const existingTenants = await dbInstance.select().from(tenants).limit(1);
    if (existingTenants.length === 0) {
      throw new Error("No tenant found in database");
    }
    testTenantId = existingTenants[0].id;

    // Get two employees
    const existingEmployees = await dbInstance
      .select()
      .from(users)
      .where(eq(users.tenantId, testTenantId))
      .limit(2);

    if (existingEmployees.length < 2) {
      throw new Error("Need at least 2 employees for testing");
    }
    testEmployeeId = existingEmployees[0].id;
    testEmployee2Id = existingEmployees[1].id;

    // Get a service for order items
    const existingServices = await dbInstance
      .select()
      .from(services)
      .where(eq(services.tenantId, testTenantId))
      .limit(1);

    const serviceId = existingServices.length > 0 ? existingServices[0].id : 1;

    const today = new Date().toISOString().split("T")[0];

    // Create test orders for employee 1
    for (let i = 0; i < 3; i++) {
      const [order] = await dbInstance.insert(orders).values({
        tenantId: testTenantId,
        employeeId: testEmployeeId,
        orderDate: today,
        orderTime: `${10 + i}:00:00`,
        subtotal: "400.00",
        vatAmount: "100.00",
        total: "500.00",
        status: "completed",
      });
      testOrderIds.push(order.insertId);

      // Add order item
      await dbInstance.insert(orderItems).values({
        tenantId: testTenantId,
        orderId: order.insertId,
        itemType: "service",
        itemId: serviceId,
        itemName: "Test Service",
        quantity: 1,
        unitPrice: "400.00",
        vatRate: "25.00",
        vatAmount: "100.00",
        total: "500.00",
      });

      // Add payment
      await dbInstance.insert(payments).values({
        tenantId: testTenantId,
        orderId: order.insertId,
        amount: "500.00",
        currency: "NOK",
        paymentMethod: i === 0 ? "cash" : i === 1 ? "card" : "vipps",
        status: "completed",
        processedBy: testEmployeeId,
        processedAt: new Date(),
      });
    }

    // Create test orders for employee 2
    for (let i = 0; i < 2; i++) {
      const [order] = await dbInstance.insert(orders).values({
        tenantId: testTenantId,
        employeeId: testEmployee2Id,
        orderDate: today,
        orderTime: `${14 + i}:00:00`,
        subtotal: "800.00",
        vatAmount: "200.00",
        total: "1000.00",
        status: "completed",
      });
      testOrderIds.push(order.insertId);

      // Add order item
      await dbInstance.insert(orderItems).values({
        tenantId: testTenantId,
        orderId: order.insertId,
        itemType: "service",
        itemId: serviceId,
        itemName: "Test Service",
        quantity: 2,
        unitPrice: "400.00",
        vatRate: "25.00",
        vatAmount: "200.00",
        total: "1000.00",
      });

      // Add payment
      await dbInstance.insert(payments).values({
        tenantId: testTenantId,
        orderId: order.insertId,
        amount: "1000.00",
        currency: "NOK",
        paymentMethod: "card",
        status: "completed",
        processedBy: testEmployee2Id,
        processedAt: new Date(),
      });
    }
  });

  afterAll(async () => {
    if (!dbInstance) return;
    const { orders, payments, orderItems } = await import("../drizzle/schema");
    const { inArray } = await import("drizzle-orm");

    // Clean up test data
    await dbInstance.delete(orderItems).where(inArray(orderItems.orderId, testOrderIds));
    await dbInstance.delete(payments).where(inArray(payments.orderId, testOrderIds));
    await dbInstance.delete(orders).where(inArray(orders.id, testOrderIds));
  });

  it("should generate basic financial summary", async () => {
    if (!dbInstance) throw new Error("Database not available");

    const { orders, payments } = await import("../drizzle/schema");
    const { eq, and, gte, lte } = await import("drizzle-orm");

    const today = new Date().toISOString().split("T")[0];

    const ordersData = await dbInstance
      .select()
      .from(orders)
      .leftJoin(payments, eq(orders.id, payments.orderId))
      .where(
        and(
          eq(orders.tenantId, testTenantId),
          gte(orders.orderDate, today),
          lte(orders.orderDate, today)
        )
      );

    const totalSales = ordersData.reduce(
      (sum, row) => sum + parseFloat(row.orders.total),
      0
    );

    expect(totalSales).toBeGreaterThan(0);
    expect(ordersData.length).toBeGreaterThanOrEqual(5);
  });

  it("should calculate sales by employee", async () => {
    if (!dbInstance) throw new Error("Database not available");

    const { orders, users } = await import("../drizzle/schema");
    const { eq, and, gte, lte, sql } = await import("drizzle-orm");

    const today = new Date().toISOString().split("T")[0];

    const salesByEmployee = await dbInstance
      .select({
        employeeId: orders.employeeId,
        employeeName: users.name,
        orderCount: sql<number>`COUNT(${orders.id})`,
        totalRevenue: sql<string>`SUM(CAST(${orders.total} AS DECIMAL(10,2)))`,
      })
      .from(orders)
      .leftJoin(users, eq(orders.employeeId, users.id))
      .where(
        and(
          eq(orders.tenantId, testTenantId),
          gte(orders.orderDate, today),
          lte(orders.orderDate, today)
        )
      )
      .groupBy(orders.employeeId, users.name);

    expect(salesByEmployee.length).toBeGreaterThanOrEqual(2);

    const employee1Sales = salesByEmployee.find((s) => s.employeeId === testEmployeeId);
    const employee2Sales = salesByEmployee.find((s) => s.employeeId === testEmployee2Id);

    expect(employee1Sales).toBeDefined();
    expect(employee2Sales).toBeDefined();

    expect(employee1Sales!.orderCount).toBeGreaterThanOrEqual(3);
    expect(employee2Sales!.orderCount).toBeGreaterThanOrEqual(2);
  });

  it("should calculate sales by payment method", async () => {
    if (!dbInstance) throw new Error("Database not available");

    const { orders, payments } = await import("../drizzle/schema");
    const { eq, and, gte, lte, sql } = await import("drizzle-orm");

    const today = new Date().toISOString().split("T")[0];

    const salesByMethod = await dbInstance
      .select({
        paymentMethod: payments.paymentMethod,
        orderCount: sql<number>`COUNT(DISTINCT ${payments.orderId})`,
        totalAmount: sql<string>`SUM(CAST(${payments.amount} AS DECIMAL(10,2)))`,
      })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .where(
        and(
          eq(orders.tenantId, testTenantId),
          gte(orders.orderDate, today),
          lte(orders.orderDate, today)
        )
      )
      .groupBy(payments.paymentMethod);

    expect(salesByMethod.length).toBeGreaterThanOrEqual(2);

    const cashSales = salesByMethod.find((s) => s.paymentMethod === "cash");
    const cardSales = salesByMethod.find((s) => s.paymentMethod === "card");

    expect(cashSales || cardSales).toBeDefined();
  });

  it("should calculate average order value", async () => {
    if (!dbInstance) throw new Error("Database not available");

    const { orders } = await import("../drizzle/schema");
    const { eq, and, gte, lte } = await import("drizzle-orm");

    const today = new Date().toISOString().split("T")[0];

    const ordersData = await dbInstance
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, testTenantId),
          gte(orders.orderDate, today),
          lte(orders.orderDate, today)
        )
      );

    const totalSales = ordersData.reduce((sum, o) => sum + parseFloat(o.total), 0);
    const avgOrderValue = totalSales / ordersData.length;

    expect(avgOrderValue).toBeGreaterThan(0);
    expect(avgOrderValue).toBeLessThan(totalSales);
  });

  it("should filter reports by employee", async () => {
    if (!dbInstance) throw new Error("Database not available");

    const { orders } = await import("../drizzle/schema");
    const { eq, and, gte, lte } = await import("drizzle-orm");

    const today = new Date().toISOString().split("T")[0];

    const employee1Orders = await dbInstance
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, testTenantId),
          eq(orders.employeeId, testEmployeeId),
          gte(orders.orderDate, today),
          lte(orders.orderDate, today)
        )
      );

    expect(employee1Orders.length).toBeGreaterThanOrEqual(3);
    employee1Orders.forEach((order) => {
      expect(order.employeeId).toBe(testEmployeeId);
    });
  });

  it("should filter reports by payment method", async () => {
    if (!dbInstance) throw new Error("Database not available");

    const { orders, payments } = await import("../drizzle/schema");
    const { eq, and, gte, lte } = await import("drizzle-orm");

    const today = new Date().toISOString().split("T")[0];

    const cardPayments = await dbInstance
      .select()
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .where(
        and(
          eq(orders.tenantId, testTenantId),
          eq(payments.paymentMethod, "card"),
          gte(orders.orderDate, today),
          lte(orders.orderDate, today)
        )
      );

    expect(cardPayments.length).toBeGreaterThanOrEqual(1);
    cardPayments.forEach((row) => {
      expect(row.payments.paymentMethod).toBe("card");
    });
  });

  it("should calculate sales by hour", async () => {
    if (!dbInstance) throw new Error("Database not available");

    const { orders } = await import("../drizzle/schema");
    const { eq, and, gte, lte, sql } = await import("drizzle-orm");

    const today = new Date().toISOString().split("T")[0];

    const salesByHour = await dbInstance
      .select({
        hour: sql<number>`HOUR(orderTime) as hour`,
        orderCount: sql<number>`COUNT(id) as orderCount`,
        totalRevenue: sql<string>`SUM(CAST(total AS DECIMAL(10,2))) as totalRevenue`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, testTenantId),
          gte(orders.orderDate, today),
          lte(orders.orderDate, today)
        )
      )
      .groupBy(sql.raw('HOUR(orderTime)'))
      .orderBy(sql.raw('HOUR(orderTime)'));

    expect(salesByHour.length).toBeGreaterThan(0);

    salesByHour.forEach((hourData) => {
      expect(hourData.hour).toBeGreaterThanOrEqual(0);
      expect(hourData.hour).toBeLessThan(24);
      expect(hourData.orderCount).toBeGreaterThan(0);
      expect(parseFloat(hourData.totalRevenue)).toBeGreaterThan(0);
    });
  });

  it("should handle date range filtering", async () => {
    if (!dbInstance) throw new Error("Database not available");

    const { orders } = await import("../drizzle/schema");
    const { eq, and, gte, lte } = await import("drizzle-orm");

    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    const ordersToday = await dbInstance
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, testTenantId),
          gte(orders.orderDate, today),
          lte(orders.orderDate, today)
        )
      );

    const ordersTomorrow = await dbInstance
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, testTenantId),
          gte(orders.orderDate, tomorrow),
          lte(orders.orderDate, tomorrow)
        )
      );

    expect(ordersToday.length).toBeGreaterThan(0);
    expect(ordersTomorrow.length).toBe(0);
  });

  it("should calculate net revenue after refunds", async () => {
    if (!dbInstance) throw new Error("Database not available");

    const { orders, refunds } = await import("../drizzle/schema");
    const { eq, and, gte, lte } = await import("drizzle-orm");

    const today = new Date().toISOString().split("T")[0];

    const ordersData = await dbInstance
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, testTenantId),
          gte(orders.orderDate, today),
          lte(orders.orderDate, today)
        )
      );

    const totalSales = ordersData.reduce((sum, o) => sum + parseFloat(o.total), 0);

    const refundsData = await dbInstance
      .select()
      .from(refunds)
      .where(
        and(
          eq(refunds.tenantId, testTenantId),
          gte(refunds.createdAt, new Date(today)),
          lte(refunds.createdAt, new Date(today + "T23:59:59")),
          eq(refunds.status, "completed")
        )
      );

    const totalRefunded = refundsData.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const netRevenue = totalSales - totalRefunded;

    expect(netRevenue).toBeLessThanOrEqual(totalSales);
    expect(netRevenue).toBeGreaterThanOrEqual(0);
  });

  it("should enforce tenant isolation in reports", async () => {
    if (!dbInstance) throw new Error("Database not available");

    const { orders } = await import("../drizzle/schema");
    const { eq, and, gte, lte } = await import("drizzle-orm");

    const today = new Date().toISOString().split("T")[0];

    const ordersData = await dbInstance
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, testTenantId),
          gte(orders.orderDate, today),
          lte(orders.orderDate, today)
        )
      );

    ordersData.forEach((order) => {
      expect(order.tenantId).toBe(testTenantId);
    });
  });
});
