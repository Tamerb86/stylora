import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

describe("myBookings.reschedule", () => {
  let testTenantId: string;
  let testCustomerId: number;
  let testEmployeeId: number;
  let testServiceId: number;
  let testAppointmentId: number;
  let testUserEmail: string;

  beforeAll(async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    const {
      tenants,
      customers,
      users,
      services,
      appointments,
      appointmentServices,
      employeeSchedules,
    } = await import("../drizzle/schema");

    // Create test tenant
    testTenantId = `test-tenant-reschedule-${Date.now()}`;
    await dbInstance.insert(tenants).values({
      id: testTenantId,
      name: "Test Reschedule Salon",
      subdomain: `test-reschedule-${Date.now()}`,
      cancellationWindowHours: 24,
    });

    // Create test employee
    const [employee] = await dbInstance.insert(users).values({
      tenantId: testTenantId,
      openId: `openid-employee-reschedule-${Date.now()}`,
      email: `employee-reschedule-${Date.now()}@test.com`,
      name: "Test Employee",
      role: "employee",
      passwordHash: "test",
      isActive: true,
    });
    testEmployeeId = employee.insertId;

    // Create employee schedules for all weekdays (Monday-Friday)
    for (let day = 1; day <= 5; day++) {
      await dbInstance.insert(employeeSchedules).values({
        employeeId: testEmployeeId,
        dayOfWeek: day,
        startTime: "09:00:00",
        endTime: "17:00:00",
        isActive: true,
      });
    }

    // Create test service
    const [service] = await dbInstance.insert(services).values({
      tenantId: testTenantId,
      name: "Test Haircut",
      durationMinutes: 60,
      price: "500",
    });
    testServiceId = service.insertId;

    // Create test customer with email
    testUserEmail = `customer-reschedule-${Date.now()}@test.com`;
    const [customer] = await dbInstance.insert(customers).values({
      tenantId: testTenantId,
      firstName: "Test",
      lastName: "Customer",
      phone: `+47${Date.now().toString().slice(-8)}`,
      email: testUserEmail,
    });
    testCustomerId = customer.insertId;

    // Create test appointment (3 days from now at 10:00)
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
    testAppointmentId = appointment.insertId;

    // Link service to appointment
    await dbInstance.insert(appointmentServices).values({
      appointmentId: testAppointmentId,
      serviceId: testServiceId,
      price: "500",
    });
  });

  afterAll(async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) return;

    const {
      tenants,
      customers,
      users,
      services,
      appointments,
      appointmentServices,
      employeeSchedules,
    } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    // Cleanup
    await dbInstance
      .delete(appointmentServices)
      .where(eq(appointmentServices.appointmentId, testAppointmentId));
    await dbInstance
      .delete(appointments)
      .where(eq(appointments.id, testAppointmentId));
    await dbInstance
      .delete(employeeSchedules)
      .where(eq(employeeSchedules.employeeId, testEmployeeId));
    await dbInstance.delete(services).where(eq(services.id, testServiceId));
    await dbInstance.delete(customers).where(eq(customers.id, testCustomerId));
    await dbInstance.delete(users).where(eq(users.id, testEmployeeId));
    await dbInstance.delete(tenants).where(eq(tenants.id, testTenantId));
  });

  it("should reschedule appointment to valid future date/time", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testCustomerId,
        email: testUserEmail,
        name: "Test Customer",
        role: "user",
        tenantId: testTenantId,
      },
    });

    // Reschedule to 4 days from now at 14:00 (Monday)
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 4);
    // Find next Monday
    while (newDate.getDay() !== 1) {
      newDate.setDate(newDate.getDate() + 1);
    }
    const newDateStr = newDate.toISOString().split("T")[0];

    const result = await caller.myBookings.reschedule({
      tenantId: testTenantId,
      appointmentId: testAppointmentId,
      newDate: newDateStr,
      newTime: "14:00",
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("successfully");
    expect(result.newDate).toBe(newDateStr);
    expect(result.newTime).toBe("14:00");
  });

  it("should reject reschedule to past date/time", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testCustomerId,
        email: testUserEmail,
        name: "Test Customer",
        role: "user",
        tenantId: testTenantId,
      },
    });

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    const pastDateStr = pastDate.toISOString().split("T")[0];

    await expect(
      caller.myBookings.reschedule({
        tenantId: testTenantId,
        appointmentId: testAppointmentId,
        newDate: pastDateStr,
        newTime: "10:00",
      })
    ).rejects.toThrow("must be in the future");
  });

  it("should reject reschedule within cancellation window", async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    const { appointments } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    // Update appointment to be tomorrow (within 24h window)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    await dbInstance
      .update(appointments)
      .set({
        appointmentDate: tomorrow,
        startTime: "10:00:00",
      })
      .where(eq(appointments.id, testAppointmentId));

    const caller = appRouter.createCaller({
      user: {
        id: testCustomerId,
        email: testUserEmail,
        name: "Test Customer",
        role: "user",
        tenantId: testTenantId,
      },
    });

    // Try to reschedule to 2 days from now
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 2);
    const newDateStr = newDate.toISOString().split("T")[0];

    await expect(
      caller.myBookings.reschedule({
        tenantId: testTenantId,
        appointmentId: testAppointmentId,
        newDate: newDateStr,
        newTime: "14:00",
      })
    ).rejects.toThrow("Cannot reschedule within");
  });

  it("should reject reschedule to time outside employee working hours", async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    const { appointments } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    // Reset appointment to 3 days from now
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    futureDate.setHours(10, 0, 0, 0);

    await dbInstance
      .update(appointments)
      .set({
        appointmentDate: futureDate,
        startTime: "10:00:00",
      })
      .where(eq(appointments.id, testAppointmentId));

    const caller = appRouter.createCaller({
      user: {
        id: testCustomerId,
        email: testUserEmail,
        name: "Test Customer",
        role: "user",
        tenantId: testTenantId,
      },
    });

    // Try to reschedule to next Monday at 18:00 (outside 09:00-17:00 working hours)
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 4);
    while (newDate.getDay() !== 1) {
      newDate.setDate(newDate.getDate() + 1);
    }
    const newDateStr = newDate.toISOString().split("T")[0];

    await expect(
      caller.myBookings.reschedule({
        tenantId: testTenantId,
        appointmentId: testAppointmentId,
        newDate: newDateStr,
        newTime: "18:00", // Outside working hours
      })
    ).rejects.toThrow("outside employee's working hours");
  });

  it("should reject reschedule if customer not found", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: 99999,
        email: "nonexistent@test.com",
        name: "Nonexistent Customer",
        role: "user",
        tenantId: testTenantId,
      },
    });

    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 4);
    const newDateStr = newDate.toISOString().split("T")[0];

    await expect(
      caller.myBookings.reschedule({
        tenantId: testTenantId,
        appointmentId: testAppointmentId,
        newDate: newDateStr,
        newTime: "14:00",
      })
    ).rejects.toThrow("Customer not found");
  });

  it("should reject reschedule of canceled appointment", async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    const { appointments } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    // Mark appointment as canceled
    await dbInstance
      .update(appointments)
      .set({ status: "canceled" })
      .where(eq(appointments.id, testAppointmentId));

    const caller = appRouter.createCaller({
      user: {
        id: testCustomerId,
        email: testUserEmail,
        name: "Test Customer",
        role: "user",
        tenantId: testTenantId,
      },
    });

    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 4);
    const newDateStr = newDate.toISOString().split("T")[0];

    await expect(
      caller.myBookings.reschedule({
        tenantId: testTenantId,
        appointmentId: testAppointmentId,
        newDate: newDateStr,
        newTime: "14:00",
      })
    ).rejects.toThrow("Cannot reschedule a canceled appointment");

    // Reset status for other tests
    await dbInstance
      .update(appointments)
      .set({ status: "confirmed" })
      .where(eq(appointments.id, testAppointmentId));
  });
});
