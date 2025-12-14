import { describe, it, expect, beforeAll } from "vitest";
import { 
  createTestTenant, 
  createTestService, 
  createTestEmployee,
  createTestCustomer,
  cleanupTestTenant 
} from "./test-helpers";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { appointments, payments } from "../drizzle/schema";

/**
 * Cancellation & Refund System Tests
 * Tests cancellation policy, refund calculations, and Stripe integration
 */

describe("Cancellation & Refund System", () => {
  let testTenantId: string;
  let testCustomerId: number;
  let testEmployeeId: number;
  let testServiceId: number;
  let testAppointmentId: number;

  beforeAll(async () => {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");

    // Create test tenant with cancellation policy
    const { tenantId } = await createTestTenant({
      name: "Test Salon Cancellation",
      subdomain: `test-cancel-${Date.now()}`,
      status: "active",
    });
    testTenantId = tenantId;

    // Update tenant with cancellation window
    const { tenants } = await import("../drizzle/schema");
    await dbInstance.update(tenants)
      .set({ cancellationWindowHours: 24 })
      .where(eq(tenants.id, testTenantId));

    // Create test customer
    const { customerId } = await createTestCustomer(testTenantId, {
      firstName: "Test",
      lastName: "Customer",
      phone: "+4712345678",
      email: "test@example.com",
    });
    testCustomerId = customerId;

    // Create test employee
    const { userId } = await createTestEmployee(testTenantId);
    testEmployeeId = userId;

    // Create test service
    const { serviceId } = await createTestService(testTenantId, {
      name: "Test Haircut",
      price: "500.00",
      durationMinutes: 60,
    });
    testServiceId = serviceId;

    // Create test appointment (3 days from now at 10:00 - well outside 24h window)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    futureDate.setHours(10, 0, 0, 0);

    const [appointment] = await dbInstance.insert(appointments).values({
      tenantId: testTenantId,
      customerId: testCustomerId,
      employeeId: testEmployeeId,
      appointmentDate: futureDate,
      startTime: "10:00:00",
      endTime: "11:00:00",
      status: "confirmed",
    });
    testAppointmentId = Number(appointment.insertId);

    // Create test payment
    await dbInstance.insert(payments).values({
      tenantId: testTenantId,
      appointmentId: testAppointmentId,
      paymentMethod: "stripe",
      amount: "500.00",
      currency: "NOK",
      status: "completed",
      paymentGateway: "stripe",
      gatewayPaymentId: "pi_test_123456789",
      processedBy: testEmployeeId,
      processedAt: new Date(),
    });
  });

  it("should calculate free cancellation (more than 24h before)", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testEmployeeId,
        tenantId: testTenantId,
        role: "employee",
        openId: "test-openid",
        email: "test@example.com",
        name: "Test Employee",
        loginMethod: "manus",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    const result = await caller.appointments.calculateRefund({
      appointmentId: testAppointmentId,
      cancellationType: "staff",
    });

    expect(result).toBeDefined();
    expect(result.originalAmount).toBe(500);
    expect(result.isLateCancellation).toBe(false);
    expect(result.feePercent).toBe(0);
    expect(result.refundAmount).toBe(500);
  });

  it("should calculate late cancellation fee (less than 24h before)", async () => {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");

    // Update appointment to be in 2 hours (late cancellation)
    const soon = new Date();
    soon.setHours(soon.getHours() + 2);
    
    await dbInstance.update(appointments)
      .set({
        appointmentDate: soon,
        startTime: `${soon.getHours().toString().padStart(2, "0")}:00:00`,
      })
      .where(eq(appointments.id, testAppointmentId));

    const caller = appRouter.createCaller({
      user: {
        id: testEmployeeId,
        tenantId: testTenantId,
        role: "employee",
        openId: "test-openid",
        email: "test@example.com",
        name: "Test Employee",
        loginMethod: "manus",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    const result = await caller.appointments.calculateRefund({
      appointmentId: testAppointmentId,
      cancellationType: "staff",
    });

    expect(result).toBeDefined();
    expect(result.originalAmount).toBe(500);
    expect(result.isLateCancellation).toBe(true);
    expect(result.feePercent).toBe(50); // 50% late cancellation fee
    expect(result.feeAmount).toBe(250);
    expect(result.refundAmount).toBe(250);
  });

  it("should calculate no-show fee (100%)", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testEmployeeId,
        tenantId: testTenantId,
        role: "employee",
        openId: "test-openid",
        email: "test@example.com",
        name: "Test Employee",
        loginMethod: "manus",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    const result = await caller.appointments.calculateRefund({
      appointmentId: testAppointmentId,
      cancellationType: "no_show",
    });

    expect(result).toBeDefined();
    expect(result.originalAmount).toBe(500);
    expect(result.feePercent).toBe(100); // 100% no-show fee
    expect(result.feeAmount).toBe(500);
    expect(result.refundAmount).toBe(0);
  });

  it("should cancel appointment without payment", async () => {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");

    // Create appointment without payment
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    const [appointment] = await dbInstance.insert(appointments).values({
      tenantId: testTenantId,
      customerId: testCustomerId,
      employeeId: testEmployeeId,
      appointmentDate: tomorrow,
      startTime: "14:00:00",
      endTime: "15:00:00",
      status: "confirmed",
    });
    const noPaymentAppointmentId = Number(appointment.insertId);

    const caller = appRouter.createCaller({
      user: {
        id: testEmployeeId,
        tenantId: testTenantId,
        role: "employee",
        openId: "test-openid",
        email: "test@example.com",
        name: "Test Employee",
        loginMethod: "manus",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    const result = await caller.appointments.cancelWithRefund({
      appointmentId: noPaymentAppointmentId,
      reason: "Customer requested cancellation",
      cancellationType: "customer",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.refundProcessed).toBe(false);
    expect(result.refundAmount).toBe(0);
  });

  it("should record manual refund", async () => {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");

    // Create cash payment
    const [payment] = await dbInstance.insert(payments).values({
      tenantId: testTenantId,
      appointmentId: testAppointmentId,
      paymentMethod: "cash",
      amount: "300.00",
      currency: "NOK",
      status: "completed",
      processedBy: testEmployeeId,
      processedAt: new Date(),
    });
    const cashPaymentId = Number(payment.insertId);

    const caller = appRouter.createCaller({
      user: {
        id: testEmployeeId,
        tenantId: testTenantId,
        role: "admin",
        openId: "test-openid",
        email: "test@example.com",
        name: "Test Admin",
        loginMethod: "manus",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    const result = await caller.refunds.createManual({
      paymentId: cashPaymentId,
      appointmentId: testAppointmentId,
      amount: 300,
      reason: "Manual cash refund",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("should list refund history", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testEmployeeId,
        tenantId: testTenantId,
        role: "employee",
        openId: "test-openid",
        email: "test@example.com",
        name: "Test Employee",
        loginMethod: "manus",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });

    const refunds = await caller.refunds.list({});

    expect(refunds).toBeDefined();
    expect(Array.isArray(refunds)).toBe(true);
    // Should have at least the manual refund we created
    expect(refunds.length).toBeGreaterThan(0);
  });
});
