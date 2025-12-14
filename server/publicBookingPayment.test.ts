import { describe, it, expect, beforeAll } from "vitest";
import { 
  createTestTenant, 
  createTestService, 
  createTestEmployee,
  cleanupTestTenant 
} from "./test-helpers";
import { appRouter } from "./routers";
import * as db from "./db";
import { eq } from "drizzle-orm";
import { appointments, customers } from "../drizzle/schema";

/**
 * Test suite for public booking with payment integration
 * 
 * Tests the combined endpoint that creates a booking and starts Stripe Checkout
 */

describe("Public Booking with Payment", () => {
  let testTenantId: string;
  let testEmployeeId: number;
  let testServiceId: number;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    // Create test tenant
    const { tenantId } = await createTestTenant({
      name: "Test Booking Salon",
      subdomain: `test-booking-${Date.now()}`,
      status: "active",
    });
    testTenantId = tenantId;

    // Create test employee
    const { userId } = await createTestEmployee(testTenantId);
    testEmployeeId = userId;

    // Create test service
    const { serviceId } = await createTestService(testTenantId, {
      name: "Test Haircut with Payment",
      durationMinutes: 45,
      price: "600.00",
      isActive: true,
    });
    testServiceId = serviceId;

    // Create public context
    caller = appRouter.createCaller({ user: null, req: {} as any, res: {} as any });
  });

  it("should create booking and return checkout URL", async () => {
    // Call the combined endpoint
    const result = await caller.publicBooking.createBookingAndStartPayment({
      tenantId: testTenantId,
      serviceId: testServiceId,
      employeeId: testEmployeeId,
      date: "2025-12-15",
      time: "14:00",
      customerInfo: {
        firstName: "Test",
        lastName: "Customer",
        phone: "+4798765432",
        email: "test@example.com",
      },
      successUrl: "https://example.com/booking/success",
      cancelUrl: "https://example.com/booking/cancel",
    });

    // Verify response structure
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.appointmentId).toBeGreaterThan(0);
    expect(result.customerId).toBeGreaterThan(0);
    expect(result.checkoutUrl).toBeDefined();
    expect(result.checkoutUrl).toContain("checkout.stripe.com");
    expect(result.paymentId).toBeGreaterThan(0);
    expect(result.sessionId).toBeDefined();
    expect(result.sessionId).toContain("cs_");

    // Verify appointment was created with status "pending"
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("DB not available");

    const [appointment] = await dbInstance
      .select()
      .from(appointments)
      .where(eq(appointments.id, result.appointmentId));

    expect(appointment).toBeDefined();
    expect(appointment.status).toBe("pending");
    expect(appointment.tenantId).toBe(testTenantId);
    expect(appointment.employeeId).toBe(testEmployeeId);

    // Verify payment was created with status "pending"
    const payment = await db.getPaymentById(result.paymentId);
    expect(payment).toBeDefined();
    expect(payment?.status).toBe("pending");
    expect(payment?.appointmentId).toBe(result.appointmentId);
    expect(payment?.amount).toBe("600.00");
    expect(payment?.currency).toBe("NOK");
    expect(payment?.paymentMethod).toBe("stripe");
    expect(payment?.gatewaySessionId).toBe(result.sessionId);
  });

  it("should create customer if phone doesn't exist", async () => {
    const uniquePhone = `+47${Date.now().toString().slice(-8)}`;

    const result = await caller.publicBooking.createBookingAndStartPayment({
      tenantId: testTenantId,
      serviceId: testServiceId,
      employeeId: testEmployeeId,
      date: "2025-12-16",
      time: "15:00",
      customerInfo: {
        firstName: "New",
        lastName: "Customer",
        phone: uniquePhone,
        email: "newcustomer@example.com",
      },
      successUrl: "https://example.com/success",
      cancelUrl: "https://example.com/cancel",
    });

    expect(result.success).toBe(true);
    expect(result.customerId).toBeGreaterThan(0);

    // Verify customer was created
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("DB not available");

    const [customer] = await dbInstance
      .select()
      .from(customers)
      .where(eq(customers.id, result.customerId));

    expect(customer).toBeDefined();
    expect(customer.phone).toBe(uniquePhone);
    expect(customer.firstName).toBe("New");
    expect(customer.lastName).toBe("Customer");
  });

  it("should reuse existing customer if phone matches", async () => {
    const existingPhone = "+4712341234";

    // First booking - creates customer
    const firstResult = await caller.publicBooking.createBookingAndStartPayment({
      tenantId: testTenantId,
      serviceId: testServiceId,
      employeeId: testEmployeeId,
      date: "2025-12-17",
      time: "10:00",
      customerInfo: {
        firstName: "Returning",
        lastName: "Customer",
        phone: existingPhone,
        email: "returning@example.com",
      },
      successUrl: "https://example.com/success",
      cancelUrl: "https://example.com/cancel",
    });

    const firstCustomerId = firstResult.customerId;

    // Second booking - reuses customer
    const secondResult = await caller.publicBooking.createBookingAndStartPayment({
      tenantId: testTenantId,
      serviceId: testServiceId,
      employeeId: testEmployeeId,
      date: "2025-12-18",
      time: "11:00",
      customerInfo: {
        firstName: "Returning",
        lastName: "Customer",
        phone: existingPhone,
        email: "returning@example.com",
      },
      successUrl: "https://example.com/success",
      cancelUrl: "https://example.com/cancel",
    });

    // Should reuse the same customer
    expect(secondResult.customerId).toBe(firstCustomerId);
  });

  it("should reject booking with invalid service", async () => {
    await expect(
      caller.publicBooking.createBookingAndStartPayment({
        tenantId: testTenantId,
        serviceId: 999999, // Non-existent service
        employeeId: testEmployeeId,
        date: "2025-12-20",
        time: "12:00",
        customerInfo: {
          firstName: "Test",
          lastName: "Customer",
          phone: "+4799999999",
          email: "test@example.com",
        },
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
      })
    ).rejects.toThrow("Service not found");
  });

  it("should calculate correct end time based on service duration", async () => {
    const result = await caller.publicBooking.createBookingAndStartPayment({
      tenantId: testTenantId,
      serviceId: testServiceId, // 45 minutes duration
      employeeId: testEmployeeId,
      date: "2025-12-21",
      time: "14:30",
      customerInfo: {
        firstName: "Time",
        lastName: "Test",
        phone: "+4788888888",
      },
      successUrl: "https://example.com/success",
      cancelUrl: "https://example.com/cancel",
    });

    // Verify appointment end time
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("DB not available");

    const [appointment] = await dbInstance
      .select()
      .from(appointments)
      .where(eq(appointments.id, result.appointmentId));

    expect(appointment.startTime).toBe("14:30:00"); // Database stores HH:MM:SS format
    expect(appointment.endTime).toBe("15:15:00"); // 14:30 + 45 minutes = 15:15
  });
});
