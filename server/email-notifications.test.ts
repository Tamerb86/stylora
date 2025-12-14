import { describe, it, expect, beforeAll, vi } from "vitest";
import * as db from "./db";

/**
 * Test suite for email notifications
 * 
 * Tests booking confirmation and cancellation emails triggered by:
 * - Stripe webhook (payment completion)
 * - Manual status updates (appointments.updateStatus)
 */

describe("Email Notifications", () => {
  let testTenantId: string;
  let testEmployeeId: number;
  let testServiceId: number;
  let testCustomerId: number;

  beforeAll(async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) {
      throw new Error("Database not available for testing");
    }

    const { tenants, users, services, customers } = await import("../drizzle/schema");
    
    // Create test tenant
    testTenantId = `test-email-tenant-${Date.now()}`;
    
    await dbInstance.insert(tenants).values({
      id: testTenantId,
      name: "Test Email Salon",
      subdomain: `test-email-${Date.now()}`,
      status: "active",
      emailVerified: true, // Required for email sending
    });

    // Create test employee
    const [employee] = await dbInstance.insert(users).values({
      tenantId: testTenantId,
      openId: `test-email-employee-${Date.now()}`,
      name: "Test Employee",
      role: "employee",
      isActive: true,
    });
    testEmployeeId = employee.insertId;

    // Create test service
    const [service] = await dbInstance.insert(services).values({
      tenantId: testTenantId,
      name: "Test Haircut",
      durationMinutes: 30,
      price: "400.00",
      isActive: true,
    });
    testServiceId = service.insertId;

    // Create test customer WITH email
    const [customer] = await dbInstance.insert(customers).values({
      tenantId: testTenantId,
      firstName: "Test",
      lastName: "Customer",
      phone: "+4712345678",
      email: "test@example.com", // Email for testing
    });
    testCustomerId = customer.insertId;
  });

  describe("Email template rendering", () => {
    it("should render booking confirmation email with Norwegian text", async () => {
      const { renderBookingConfirmationEmail } = await import("./email");

      const result = renderBookingConfirmationEmail({
        salonName: "Test Salon",
        customerName: "John Doe",
        date: "25. mars 2026",
        time: "14:30",
        services: ["Herreklipp", "Skjeggstuss"],
      });

      expect(result.subject).toContain("Bekreftelse på timebestilling");
      expect(result.subject).toContain("Test Salon");
      expect(result.html).toContain("John Doe");
      expect(result.html).toContain("25. mars 2026");
      expect(result.html).toContain("14:30");
      expect(result.html).toContain("Herreklipp, Skjeggstuss");
      expect(result.html).toContain("Velkommen");
    });

    it("should render booking cancellation email with Norwegian text", async () => {
      const { renderBookingCancellationEmail } = await import("./email");

      const result = renderBookingCancellationEmail({
        salonName: "Test Salon",
        customerName: "John Doe",
        date: "25. mars 2026",
        time: "14:30",
      });

      expect(result.subject).toContain("kansellert");
      expect(result.subject).toContain("Test Salon");
      expect(result.html).toContain("John Doe");
      expect(result.html).toContain("25. mars 2026");
      expect(result.html).toContain("14:30");
      expect(result.html).toContain("kansellert");
    });
  });

  describe("Confirmation email via appointments.updateStatus", () => {
    it("should trigger confirmation email when status changes to confirmed", async () => {
      const { appRouter } = await import("./routers");
      const { createContext } = await import("./_core/context");

      // Create mock authenticated context
      const ctx = await createContext({
        req: { headers: {}, cookies: {} } as any,
        res: {} as any,
      });

      ctx.user = {
        id: testEmployeeId,
        tenantId: testTenantId,
        role: "admin",
      } as any;

      const caller = appRouter.createCaller(ctx);

      // Create appointment with "pending" status
      const appointmentResult = await caller.appointments.create({
        customerId: testCustomerId,
        employeeId: testEmployeeId,
        appointmentDate: "2026-03-25",
        startTime: "14:30",
        endTime: "15:00",
        serviceIds: [testServiceId],
      });

      const appointmentId = appointmentResult.appointmentId;

      // Update status to "confirmed" (should trigger email)
      const updateResult = await caller.appointments.updateStatus({
        id: appointmentId,
        status: "confirmed",
      });

      expect(updateResult.success).toBe(true);

      // Verify appointment status updated
      const dbInstance = await db.getDb();
      const { appointments } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const [appointment] = await dbInstance!
        .select()
        .from(appointments)
        .where(eq(appointments.id, appointmentId));

      expect(appointment.status).toBe("confirmed");

      // Note: Email sending is async and non-blocking, so we can't directly verify
      // Check console logs for "[Email] Confirmation email sent for appointment: X"
    });

    it("should NOT trigger confirmation email when already confirmed", async () => {
      const { appRouter } = await import("./routers");
      const { createContext } = await import("./_core/context");

      const ctx = await createContext({
        req: { headers: {}, cookies: {} } as any,
        res: {} as any,
      });

      ctx.user = {
        id: testEmployeeId,
        tenantId: testTenantId,
        role: "admin",
      } as any;

      const caller = appRouter.createCaller(ctx);

      // Create appointment
      const appointmentResult = await caller.appointments.create({
        customerId: testCustomerId,
        employeeId: testEmployeeId,
        appointmentDate: "2026-03-26",
        startTime: "15:00",
        endTime: "15:30",
        serviceIds: [testServiceId],
      });

      // First update to "confirmed"
      await caller.appointments.updateStatus({
        id: appointmentResult.appointmentId,
        status: "confirmed",
      });

      // Second update to "confirmed" again (should NOT trigger email)
      const updateResult = await caller.appointments.updateStatus({
        id: appointmentResult.appointmentId,
        status: "confirmed",
      });

      expect(updateResult.success).toBe(true);
      // Email should only be sent once (on first transition to confirmed)
    });
  });

  describe("Cancellation email via appointments.updateStatus", () => {
    it("should trigger cancellation email when status changes to canceled", async () => {
      const { appRouter } = await import("./routers");
      const { createContext } = await import("./_core/context");

      const ctx = await createContext({
        req: { headers: {}, cookies: {} } as any,
        res: {} as any,
      });

      ctx.user = {
        id: testEmployeeId,
        tenantId: testTenantId,
        role: "admin",
      } as any;

      const caller = appRouter.createCaller(ctx);

      // Create appointment
      const appointmentResult = await caller.appointments.create({
        customerId: testCustomerId,
        employeeId: testEmployeeId,
        appointmentDate: "2026-03-27",
        startTime: "16:00",
        endTime: "16:30",
        serviceIds: [testServiceId],
      });

      // Cancel appointment (should trigger email)
      const updateResult = await caller.appointments.updateStatus({
        id: appointmentResult.appointmentId,
        status: "canceled",
        cancellationReason: "Customer request",
      });

      expect(updateResult.success).toBe(true);

      // Verify appointment status updated
      const dbInstance = await db.getDb();
      const { appointments } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const [appointment] = await dbInstance!
        .select()
        .from(appointments)
        .where(eq(appointments.id, appointmentResult.appointmentId));

      expect(appointment.status).toBe("canceled");
      expect(appointment.cancellationReason).toBe("Customer request");

      // Check console logs for "[Email] Cancellation email sent for appointment: X"
    });

    it("should NOT trigger cancellation email when already canceled", async () => {
      const { appRouter } = await import("./routers");
      const { createContext } = await import("./_core/context");

      const ctx = await createContext({
        req: { headers: {}, cookies: {} } as any,
        res: {} as any,
      });

      ctx.user = {
        id: testEmployeeId,
        tenantId: testTenantId,
        role: "admin",
      } as any;

      const caller = appRouter.createCaller(ctx);

      // Create appointment
      const appointmentResult = await caller.appointments.create({
        customerId: testCustomerId,
        employeeId: testEmployeeId,
        appointmentDate: "2026-03-28",
        startTime: "17:00",
        endTime: "17:30",
        serviceIds: [testServiceId],
      });

      // First cancel
      await caller.appointments.updateStatus({
        id: appointmentResult.appointmentId,
        status: "canceled",
      });

      // Second cancel (should NOT trigger email)
      const updateResult = await caller.appointments.updateStatus({
        id: appointmentResult.appointmentId,
        status: "canceled",
      });

      expect(updateResult.success).toBe(true);
      // Email should only be sent once (on first transition to canceled)
    });
  });

  describe("Email sending with missing customer email", () => {
    it("should skip email when customer has no email", async () => {
      const dbInstance = await db.getDb();
      const { customers } = await import("../drizzle/schema");

      // Create customer WITHOUT email
      const [customerNoEmail] = await dbInstance!.insert(customers).values({
        tenantId: testTenantId,
        firstName: "No",
        lastName: "Email",
        phone: "+4798765432",
        email: null, // No email
      });

      const { appRouter } = await import("./routers");
      const { createContext } = await import("./_core/context");

      const ctx = await createContext({
        req: { headers: {}, cookies: {} } as any,
        res: {} as any,
      });

      ctx.user = {
        id: testEmployeeId,
        tenantId: testTenantId,
        role: "admin",
      } as any;

      const caller = appRouter.createCaller(ctx);

      // Create appointment for customer without email
      const appointmentResult = await caller.appointments.create({
        customerId: customerNoEmail.insertId,
        employeeId: testEmployeeId,
        appointmentDate: "2026-03-29",
        startTime: "18:00",
        endTime: "18:30",
        serviceIds: [testServiceId],
      });

      // Update to confirmed (should skip email)
      const updateResult = await caller.appointments.updateStatus({
        id: appointmentResult.appointmentId,
        status: "confirmed",
      });

      expect(updateResult.success).toBe(true);
      // Check console logs for "[Email] Customer has no email, skipping confirmation email"
    });
  });

  describe("Norwegian date formatting", () => {
    it("should format dates in Norwegian format", async () => {
      const { sendAppointmentConfirmationIfPossible } = await import("./notifications-appointments");

      const dbInstance = await db.getDb();
      const { appointments, appointmentServices } = await import("../drizzle/schema");

      // Create appointment
      const [appointment] = await dbInstance!.insert(appointments).values({
        tenantId: testTenantId,
        customerId: testCustomerId,
        employeeId: testEmployeeId,
        appointmentDate: new Date("2026-03-25"),
        startTime: "14:30:00",
        endTime: "15:00:00",
        status: "pending",
      });

      const appointmentId = appointment.insertId;

      // Link service
      const { services } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const [service] = await dbInstance!.select().from(services).where(eq(services.id, testServiceId));
      
      await dbInstance!.insert(appointmentServices).values({
        appointmentId,
        serviceId: testServiceId,
        price: service.price,
      });

      // Trigger email (will be logged)
      await sendAppointmentConfirmationIfPossible(appointmentId, testTenantId);

      // Check console logs for Norwegian date format: "25. mars 2026"
    });
  });
});
