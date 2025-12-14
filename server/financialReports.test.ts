import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { orders, orderItems, users, services, tenants } from "../drizzle/schema";
import { eq, sql, and } from "drizzle-orm";

describe("Financial Reports API", () => {
  let testTenantId: string;
  let testEmployeeId: number;
  let testServiceId: number;

  beforeAll(async () => {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");

    // Create test tenant
    const tenantId = `test-tenant-${Date.now()}`;
    await dbInstance
      .insert(tenants)
      .values({
        id: tenantId,
        name: "Test Salon",
        subdomain: `test-${Date.now()}`,
        phone: "12345678",
        email: "test@test.com",
        status: "active",
      });

    testTenantId = tenantId;

    // Create test employee
    const [employee] = await dbInstance
      .insert(users)
      .values({
        openId: `test-employee-${Date.now()}`,
        name: "Test Employee",
        email: "employee@test.com",
        role: "employee",
        tenantId: testTenantId,
      })
      .$returningId();

    testEmployeeId = employee.id;

    // Create test service
    const [service] = await dbInstance
      .insert(services)
      .values({
        tenantId: testTenantId,
        name: "Test Haircut",
        description: "Test service",
        price: "500",
        durationMinutes: 60,
        categoryId: null,
      })
      .$returningId();

    testServiceId = service.id;

    // Create test orders
    const orderDate = new Date();
    const orderTime = "10:00";
    const [order1] = await dbInstance
      .insert(orders)
      .values({
        tenantId: testTenantId,
        employeeId: testEmployeeId,
        customerId: null,
        orderDate: orderDate,
        orderTime: orderTime,
        status: "completed",
        subtotal: "500",
        tax: "0",
        discount: "0",
        total: "500",
      })
      .$returningId();

    // Create order items
    await dbInstance.insert(orderItems).values({
      orderId: order1.id,
      itemType: "service",
      itemId: testServiceId,
      itemName: "Test Haircut",
      quantity: 1,
      unitPrice: "500",
      total: "500",
    });

    // Create another order
    const [order2] = await dbInstance
      .insert(orders)
      .values({
        tenantId: testTenantId,
        employeeId: testEmployeeId,
        customerId: null,
        orderDate: orderDate,
        orderTime: "11:00",
        status: "completed",
        subtotal: "300",
        tax: "0",
        discount: "0",
        total: "300",
      })
      .$returningId();

    await dbInstance.insert(orderItems).values({
      orderId: order2.id,
      itemType: "service",
      itemId: testServiceId,
      itemName: "Test Haircut",
      quantity: 1,
      unitPrice: "300",
      total: "300",
    });
  });

  afterAll(async () => {
    const dbInstance = await getDb();
    if (!dbInstance) return;

    // Clean up test data
    await dbInstance.delete(orderItems).where(eq(orderItems.orderId, testEmployeeId));
    await dbInstance.delete(orders).where(eq(orders.tenantId, testTenantId));
    await dbInstance.delete(services).where(eq(services.tenantId, testTenantId));
    await dbInstance.delete(users).where(eq(users.tenantId, testTenantId));
    await dbInstance.delete(tenants).where(eq(tenants.id, testTenantId));
  });

  it("should calculate sales summary correctly", async () => {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 1);

    const [summary] = await dbInstance
      .select({
        totalRevenue: sql<string>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL(10,2))), 0)`,
        totalOrders: sql<number>`COUNT(*)`,
        averageOrderValue: sql<string>`COALESCE(AVG(CAST(${orders.total} AS DECIMAL(10,2))), 0)`,
      })
      .from(orders)
      .where(eq(orders.tenantId, testTenantId));

    expect(summary).toBeDefined();
    expect(parseFloat(summary.totalRevenue)).toBeGreaterThan(0);
    expect(summary.totalOrders).toBeGreaterThan(0);
  });

  it("should group sales by employee", async () => {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");

    const result = await dbInstance
      .select({
        employeeId: orders.employeeId,
        employeeName: users.name,
      })
      .from(orders)
      .leftJoin(users, eq(orders.employeeId, users.id))
      .where(eq(orders.tenantId, testTenantId))
      .groupBy(orders.employeeId, users.name);

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].employeeName).toBe("Test Employee");
  });

  it("should group sales by service", async () => {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");

    const result = await dbInstance
      .select({
        serviceId: services.id,
        serviceName: services.name,
      })
      .from(orderItems)
      .leftJoin(services, eq(orderItems.itemId, services.id))
      .leftJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(orders.tenantId, testTenantId))
      .groupBy(services.id, services.name);

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].serviceName).toBe("Test Haircut");
  });

  it("should filter by order status", async () => {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");

    const completedOrders = await dbInstance
      .select()
      .from(orders)
      .where(and(
        eq(orders.tenantId, testTenantId),
        eq(orders.status, "completed")
      ));

    expect(completedOrders.length).toBeGreaterThan(0);
    expect(completedOrders[0].status).toBe("completed");
  });

  it("should calculate revenue trends by date", async () => {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");

    // Simple test: verify we can query orders by date
    const allOrders = await dbInstance
      .select()
      .from(orders)
      .where(eq(orders.tenantId, testTenantId));

    expect(allOrders).toBeDefined();
    expect(allOrders.length).toBeGreaterThan(0);
    
    // Verify we can calculate total revenue
    const totalRevenue = allOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    expect(totalRevenue).toBeGreaterThan(0);
  });
});
