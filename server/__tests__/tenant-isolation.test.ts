import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../db";
import * as db from "../db";
import type { MySql2Database } from "drizzle-orm/mysql2";

/**
 * Critical Security Test: Multi-Tenant Isolation
 *
 * These tests verify that tenant data is properly isolated and that
 * one tenant cannot access another tenant's data through any database query.
 */

describe("Multi-Tenant Isolation Security Tests", () => {
  let dbInstance: MySql2Database | null = null;
  let tenantA: string;
  let tenantB: string;
  let customerA: number;
  let customerB: number;
  let serviceA: number;
  let serviceB: number;
  let appointmentA: number;
  let appointmentB: number;
  let orderA: number;
  let orderB: number;
  let paymentA: number;
  let paymentB: number;
  let employeeA: number;
  let employeeB: number;

  beforeAll(async () => {
    dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");

    const {
      tenants,
      users,
      customers,
      services,
      appointments,
      orders,
      payments,
    } = await import("../../drizzle/schema");

    // Create two test tenants
    tenantA = `test-tenant-a-${Date.now()}`;
    tenantB = `test-tenant-b-${Date.now()}`;

    await dbInstance.insert(tenants).values([
      {
        id: tenantA,
        name: "Tenant A Salon",
        subdomain: `tenant-a-${Date.now()}`,
        status: "active",
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
      {
        id: tenantB,
        name: "Tenant B Salon",
        subdomain: `tenant-b-${Date.now()}`,
        status: "active",
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    ]);

    // Create employees for both tenants
    const [empA] = await dbInstance.insert(users).values({
      tenantId: tenantA,
      openId: `employee-a-${Date.now()}`,
      name: "Employee A",
      role: "employee",
      isActive: true,
    });
    employeeA = empA.insertId;

    const [empB] = await dbInstance.insert(users).values({
      tenantId: tenantB,
      openId: `employee-b-${Date.now()}`,
      name: "Employee B",
      role: "employee",
      isActive: true,
    });
    employeeB = empB.insertId;

    // Create customers for both tenants
    const [custA] = await dbInstance.insert(customers).values({
      tenantId: tenantA,
      firstName: "Customer",
      lastName: "A",
      phone: "+4712345001",
      email: "customer-a@test.com",
    });
    customerA = custA.insertId;

    const [custB] = await dbInstance.insert(customers).values({
      tenantId: tenantB,
      firstName: "Customer",
      lastName: "B",
      phone: "+4712345002",
      email: "customer-b@test.com",
    });
    customerB = custB.insertId;

    // Create services for both tenants
    const [srvA] = await dbInstance.insert(services).values({
      tenantId: tenantA,
      name: "Service A",
      durationMinutes: 30,
      price: "300.00",
      isActive: true,
    });
    serviceA = srvA.insertId;

    const [srvB] = await dbInstance.insert(services).values({
      tenantId: tenantB,
      name: "Service B",
      durationMinutes: 45,
      price: "450.00",
      isActive: true,
    });
    serviceB = srvB.insertId;

    // Create appointments for both tenants
    const today = new Date().toISOString().split("T")[0];
    const [aptA] = await dbInstance.insert(appointments).values({
      tenantId: tenantA,
      customerId: customerA,
      employeeId: employeeA,
      appointmentDate: today,
      startTime: "10:00:00",
      endTime: "10:30:00",
      status: "confirmed",
    });
    appointmentA = aptA.insertId;

    const [aptB] = await dbInstance.insert(appointments).values({
      tenantId: tenantB,
      customerId: customerB,
      employeeId: employeeB,
      appointmentDate: today,
      startTime: "11:00:00",
      endTime: "11:45:00",
      status: "confirmed",
    });
    appointmentB = aptB.insertId;

    // Create orders for both tenants
    const [ordA] = await dbInstance.insert(orders).values({
      tenantId: tenantA,
      employeeId: employeeA,
      customerId: customerA,
      orderDate: today,
      orderTime: "10:00:00",
      subtotal: "300.00",
      vatAmount: "75.00",
      total: "375.00",
      status: "completed",
    });
    orderA = ordA.insertId;

    const [ordB] = await dbInstance.insert(orders).values({
      tenantId: tenantB,
      employeeId: employeeB,
      customerId: customerB,
      orderDate: today,
      orderTime: "11:00:00",
      subtotal: "450.00",
      vatAmount: "112.50",
      total: "562.50",
      status: "completed",
    });
    orderB = ordB.insertId;

    // Create payments for both tenants
    const [payA] = await dbInstance.insert(payments).values({
      tenantId: tenantA,
      appointmentId: appointmentA,
      orderId: orderA,
      amount: "375.00",
      currency: "NOK",
      paymentMethod: "card",
      status: "completed",
      processedBy: employeeA,
      processedAt: new Date(),
    });
    paymentA = payA.insertId;

    const [payB] = await dbInstance.insert(payments).values({
      tenantId: tenantB,
      appointmentId: appointmentB,
      orderId: orderB,
      amount: "562.50",
      currency: "NOK",
      paymentMethod: "cash",
      status: "completed",
      processedBy: employeeB,
      processedAt: new Date(),
    });
    paymentB = payB.insertId;
  });

  afterAll(async () => {
    if (!dbInstance) return;

    const {
      tenants,
      users,
      customers,
      services,
      appointments,
      orders,
      payments,
    } = await import("../../drizzle/schema");
    const { eq, or } = await import("drizzle-orm");

    // Clean up test data
    await dbInstance
      .delete(payments)
      .where(
        or(eq(payments.tenantId, tenantA), eq(payments.tenantId, tenantB))
      );
    await dbInstance
      .delete(orders)
      .where(or(eq(orders.tenantId, tenantA), eq(orders.tenantId, tenantB)));
    await dbInstance
      .delete(appointments)
      .where(
        or(
          eq(appointments.tenantId, tenantA),
          eq(appointments.tenantId, tenantB)
        )
      );
    await dbInstance
      .delete(services)
      .where(
        or(eq(services.tenantId, tenantA), eq(services.tenantId, tenantB))
      );
    await dbInstance
      .delete(customers)
      .where(
        or(eq(customers.tenantId, tenantA), eq(customers.tenantId, tenantB))
      );
    await dbInstance
      .delete(users)
      .where(or(eq(users.tenantId, tenantA), eq(users.tenantId, tenantB)));
    await dbInstance
      .delete(tenants)
      .where(or(eq(tenants.id, tenantA), eq(tenants.id, tenantB)));
  });

  describe("Customer Isolation", () => {
    it("should NOT allow tenant A to access tenant B's customer", async () => {
      const result = await db.getCustomerById(customerB, tenantA);
      expect(result).toBeUndefined();
    });

    it("should allow tenant A to access their own customer", async () => {
      const result = await db.getCustomerById(customerA, tenantA);
      expect(result).toBeDefined();
      expect(result?.tenantId).toBe(tenantA);
    });

    it("should NOT allow tenant B to access tenant A's customer", async () => {
      const result = await db.getCustomerById(customerA, tenantB);
      expect(result).toBeUndefined();
    });
  });

  describe("Service Isolation", () => {
    it("should NOT allow tenant A to access tenant B's service", async () => {
      const result = await db.getServiceById(serviceB, tenantA);
      expect(result).toBeUndefined();
    });

    it("should allow tenant A to access their own service", async () => {
      const result = await db.getServiceById(serviceA, tenantA);
      expect(result).toBeDefined();
      expect(result?.tenantId).toBe(tenantA);
    });

    it("should NOT allow tenant B to access tenant A's service", async () => {
      const result = await db.getServiceById(serviceA, tenantB);
      expect(result).toBeUndefined();
    });
  });

  describe("Appointment Isolation", () => {
    it("should NOT allow tenant A to access tenant B's appointment", async () => {
      const result = await db.getAppointmentById(appointmentB, tenantA);
      expect(result).toBeUndefined();
    });

    it("should allow tenant A to access their own appointment", async () => {
      const result = await db.getAppointmentById(appointmentA, tenantA);
      expect(result).toBeDefined();
      expect(result?.tenantId).toBe(tenantA);
    });

    it("should NOT allow tenant B to access tenant A's appointment", async () => {
      const result = await db.getAppointmentById(appointmentA, tenantB);
      expect(result).toBeUndefined();
    });
  });

  describe("Order Isolation", () => {
    it("should NOT allow tenant A to access tenant B's order", async () => {
      const result = await db.getOrderById(orderB, tenantA);
      expect(result).toBeUndefined();
    });

    it("should allow tenant A to access their own order", async () => {
      const result = await db.getOrderById(orderA, tenantA);
      expect(result).toBeDefined();
      expect(result?.tenantId).toBe(tenantA);
    });

    it("should NOT allow tenant B to access tenant A's order", async () => {
      const result = await db.getOrderById(orderA, tenantB);
      expect(result).toBeUndefined();
    });
  });

  describe("Payment Isolation", () => {
    it("should NOT allow tenant A to access tenant B's payment", async () => {
      const result = await db.getPaymentById(paymentB, tenantA);
      expect(result).toBeUndefined();
    });

    it("should allow tenant A to access their own payment", async () => {
      const result = await db.getPaymentById(paymentA, tenantA);
      expect(result).toBeDefined();
      expect(result?.tenantId).toBe(tenantA);
    });

    it("should NOT allow tenant B to access tenant A's payment", async () => {
      const result = await db.getPaymentById(paymentA, tenantB);
      expect(result).toBeUndefined();
    });
  });

  describe("Order Items Isolation", () => {
    it("should NOT allow tenant A to access tenant B's order items", async () => {
      const result = await db.getOrderItems(orderB, tenantA);
      expect(result).toEqual([]);
    });

    it("should allow tenant A to access their own order items", async () => {
      const result = await db.getOrderItems(orderA, tenantA);
      expect(result).toBeDefined();
      // Items array might be empty if no items were added, but should not throw error
    });
  });

  describe("Refunds Isolation", () => {
    it("should NOT allow tenant A to access tenant B's refunds by order", async () => {
      const result = await db.getRefundsByOrder(orderB, tenantA);
      expect(result).toEqual([]);
    });

    it("should NOT allow tenant A to access tenant B's refunds by payment", async () => {
      const result = await db.getRefundsByPayment(paymentB, tenantA);
      expect(result).toEqual([]);
    });
  });

  describe("Split Payments Isolation", () => {
    it("should NOT allow tenant A to access tenant B's split payments by order", async () => {
      const result = await db.getSplitsByOrder(orderB, tenantA);
      expect(result).toEqual([]);
    });

    it("should NOT allow tenant A to access tenant B's split payments by payment", async () => {
      const result = await db.getSplitsByPayment(paymentB, tenantA);
      expect(result).toEqual([]);
    });
  });

  describe("Payments by Appointment Isolation", () => {
    it("should NOT allow tenant A to access tenant B's appointment payments", async () => {
      const result = await db.getPaymentsByAppointment(appointmentB, tenantA);
      expect(result).toEqual([]);
    });

    it("should allow tenant A to access their own appointment payments", async () => {
      const result = await db.getPaymentsByAppointment(appointmentA, tenantA);
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      result.forEach(payment => {
        expect(payment.tenantId).toBe(tenantA);
      });
    });
  });
});
