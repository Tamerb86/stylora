import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

/**
 * Test suite for payments router - Stripe Checkout integration
 * 
 * Tests the createCheckoutSession mutation that creates a Stripe Checkout
 * session for appointment prepayment.
 */

describe("Payments Router - Stripe Checkout", () => {
  let testTenantId: string;
  let testAppointmentId: number;
  let testCustomerId: number;
  let testEmployeeId: number;
  let testServiceId: number;

  beforeAll(async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) {
      throw new Error("Database not available for testing");
    }

    // Create test tenant
    const { tenants, users, customers, services, appointments, appointmentServices } = await import("../drizzle/schema");
    
    testTenantId = `test-tenant-${Date.now()}`;
    
    await dbInstance.insert(tenants).values({
      id: testTenantId,
      name: "Test Salon",
      subdomain: `test-${Date.now()}`,
      status: "active",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });

    // Create test employee
    const [employee] = await dbInstance.insert(users).values({
      tenantId: testTenantId,
      openId: `test-employee-${Date.now()}`,
      name: "Test Employee",
      role: "employee",
      isActive: true,
    });
    testEmployeeId = employee.insertId;

    // Create test customer
    const [customer] = await dbInstance.insert(customers).values({
      tenantId: testTenantId,
      firstName: "Test",
      lastName: "Customer",
      phone: "+4712345678",
    });
    testCustomerId = customer.insertId;

    // Create test service
    const [service] = await dbInstance.insert(services).values({
      tenantId: testTenantId,
      name: "Test Haircut",
      durationMinutes: 30,
      price: "500.00",
      isActive: true,
    });
    testServiceId = service.insertId;

    // Create test appointment
    const [appointment] = await dbInstance.insert(appointments).values({
      tenantId: testTenantId,
      customerId: testCustomerId,
      employeeId: testEmployeeId,
      appointmentDate: new Date("2025-12-01"),
      startTime: "10:00:00",
      endTime: "10:30:00",
      status: "pending",
    });
    testAppointmentId = appointment.insertId;

    // Link service to appointment
    await dbInstance.insert(appointmentServices).values({
      appointmentId: testAppointmentId,
      serviceId: testServiceId,
      price: "500.00",
    });
  });

  it("should create a Stripe Checkout session for an appointment", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testEmployeeId,
        tenantId: testTenantId,
        role: "employee",
        openId: `test-employee-${Date.now()}`,
        name: "Test Employee",
        email: null,
        phone: null,
        loginMethod: null,
        isActive: true,
        deactivatedAt: null,
        commissionType: "percentage",
        commissionRate: null,
        pin: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.payments.createCheckoutSession({
      appointmentId: testAppointmentId,
      successUrl: "https://example.com/success",
      cancelUrl: "https://example.com/cancel",
    });

    // Verify the result structure
    expect(result).toHaveProperty("url");
    expect(result).toHaveProperty("paymentId");
    expect(result).toHaveProperty("sessionId");

    // Verify Stripe session URL is returned
    expect(result.url).toMatch(/^https:\/\/checkout\.stripe\.com/);
    
    // Verify session ID format
    expect(result.sessionId).toMatch(/^cs_test_/);

    // Verify payment was created in database
    const payment = await db.getPaymentById(result.paymentId);
    expect(payment).toBeDefined();
    expect(payment?.tenantId).toBe(testTenantId);
    expect(payment?.appointmentId).toBe(testAppointmentId);
    expect(payment?.paymentMethod).toBe("stripe");
    expect(payment?.paymentGateway).toBe("stripe");
    expect(payment?.amount).toBe("500.00");
    expect(payment?.currency).toBe("NOK");
    expect(payment?.status).toBe("pending");
    expect(payment?.gatewaySessionId).toBe(result.sessionId);
  });

  it("should throw NOT_FOUND error for non-existent appointment", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testEmployeeId,
        tenantId: testTenantId,
        role: "employee",
        openId: `test-employee-${Date.now()}`,
        name: "Test Employee",
        email: null,
        phone: null,
        loginMethod: null,
        isActive: true,
        deactivatedAt: null,
        commissionType: "percentage",
        commissionRate: null,
        pin: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {} as any,
      res: {} as any,
    });

    await expect(
      caller.payments.createCheckoutSession({
        appointmentId: 999999,
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
      })
    ).rejects.toThrow("Appointment not found");
  });

  it("should enforce multi-tenant isolation", async () => {
    // Create another tenant
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("DB not available");

    const { tenants } = await import("../drizzle/schema");
    const otherTenantId = `other-tenant-${Date.now()}`;
    
    await dbInstance.insert(tenants).values({
      id: otherTenantId,
      name: "Other Salon",
      subdomain: `other-${Date.now()}`,
      status: "active",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });

    // Try to access appointment from different tenant
    const caller = appRouter.createCaller({
      user: {
        id: 999,
        tenantId: otherTenantId, // Different tenant
        role: "employee",
        openId: `other-employee-${Date.now()}`,
        name: "Other Employee",
        email: null,
        phone: null,
        loginMethod: null,
        isActive: true,
        deactivatedAt: null,
        commissionType: "percentage",
        commissionRate: null,
        pin: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {} as any,
      res: {} as any,
    });

    await expect(
      caller.payments.createCheckoutSession({
        appointmentId: testAppointmentId, // Appointment from different tenant
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
      })
    ).rejects.toThrow("Appointment not found");
  });
});
