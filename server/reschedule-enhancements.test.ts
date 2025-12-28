import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

describe("Reschedule Enhancements", () => {
  let testTenantId: string;
  let testCustomerId: number;
  let testEmployeeId: number;
  let testServiceId: number;
  let testAppointmentId: number;
  let testUserEmail: string;

  beforeAll(async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    const { tenants, customers, users, services, appointments, appointmentServices, employeeSchedules } = await import("../drizzle/schema");

    // Create test tenant
    testTenantId = `test-tenant-enhance-${Date.now()}`;
    await dbInstance.insert(tenants).values({
      id: testTenantId,
      name: "Test Enhancement Salon",
      subdomain: `test-enhance-${Date.now()}`,
      cancellationWindowHours: 24,
    });

    // Create test employee
    const [employee] = await dbInstance.insert(users).values({
      tenantId: testTenantId,
      openId: `openid-employee-enhance-${Date.now()}`,
      email: `employee-enhance-${Date.now()}@test.com`,
      name: "Test Employee",
      role: "employee",
      passwordHash: "test",
      isActive: true,
    });
    testEmployeeId = employee.insertId;

    // Create employee schedules for all weekdays
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
    testUserEmail = `customer-enhance-${Date.now()}@test.com`;
    const [customer] = await dbInstance.insert(customers).values({
      tenantId: testTenantId,
      firstName: "Test",
      lastName: "Customer",
      phone: `+47${Date.now().toString().slice(-8)}`,
      email: testUserEmail,
    });
    testCustomerId = customer.insertId;

    // Create test appointment (5 days from now at 10:00)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
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

    const { tenants, customers, users, services, appointments, appointmentServices, employeeSchedules, appointmentHistory } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    // Cleanup
    await dbInstance.delete(appointmentHistory).where(eq(appointmentHistory.appointmentId, testAppointmentId));
    await dbInstance.delete(appointmentServices).where(eq(appointmentServices.appointmentId, testAppointmentId));
    await dbInstance.delete(appointments).where(eq(appointments.id, testAppointmentId));
    await dbInstance.delete(employeeSchedules).where(eq(employeeSchedules.employeeId, testEmployeeId));
    await dbInstance.delete(services).where(eq(services.id, testServiceId));
    await dbInstance.delete(customers).where(eq(customers.id, testCustomerId));
    await dbInstance.delete(users).where(eq(users.id, testEmployeeId));
    await dbInstance.delete(tenants).where(eq(tenants.id, testTenantId));
  });

  it("should return available time slots for a given date", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testCustomerId,
        email: testUserEmail,
        name: "Test Customer",
        role: "user",
        tenantId: testTenantId,
      },
    });

    // Get available slots for 6 days from now (Monday)
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 6);
    // Find next Monday
    while (testDate.getDay() !== 1) {
      testDate.setDate(testDate.getDate() + 1);
    }
    const testDateStr = testDate.toISOString().split("T")[0];

    const slots = await caller.myBookings.getAvailableTimeSlots({
      tenantId: testTenantId,
      appointmentId: testAppointmentId,
      date: testDateStr,
    });

    expect(slots).toBeDefined();
    expect(Array.isArray(slots)).toBe(true);
    expect(slots.length).toBeGreaterThan(0);
    // Should include slots like "09:00", "09:30", etc.
    expect(slots[0]).toMatch(/^\d{2}:\d{2}$/);
  });

  it("should return slots array with valid time format", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testCustomerId,
        email: testUserEmail,
        name: "Test Customer",
        role: "user",
        tenantId: testTenantId,
      },
    });

    // Get slots for a weekday
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 6);
    while (testDate.getDay() !== 1) {
      testDate.setDate(testDate.getDate() + 1);
    }
    const testDateStr = testDate.toISOString().split("T")[0];

    const slots = await caller.myBookings.getAvailableTimeSlots({
      tenantId: testTenantId,
      appointmentId: testAppointmentId,
      date: testDateStr,
    });

    // Verify slots are in HH:MM format
    for (const slot of slots) {
      expect(slot).toMatch(/^\d{2}:\d{2}$/);
      const [hours, minutes] = slot.split(":").map(Number);
      expect(hours).toBeGreaterThanOrEqual(0);
      expect(hours).toBeLessThan(24);
      expect(minutes).toBeGreaterThanOrEqual(0);
      expect(minutes).toBeLessThan(60);
    }
  });

  it("should log appointment history when rescheduling", async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    const caller = appRouter.createCaller({
      user: {
        id: testCustomerId,
        email: testUserEmail,
        name: "Test Customer",
        role: "user",
        tenantId: testTenantId,
      },
    });

    // Reschedule to a new date
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 7);
    while (newDate.getDay() !== 1) {
      newDate.setDate(newDate.getDate() + 1);
    }
    const newDateStr = newDate.toISOString().split("T")[0];

    await caller.myBookings.reschedule({
      tenantId: testTenantId,
      appointmentId: testAppointmentId,
      newDate: newDateStr,
      newTime: "11:00",
    });

    // Check if history was logged
    const { appointmentHistory } = await import("../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");

    const historyRecords = await dbInstance
      .select()
      .from(appointmentHistory)
      .where(
        and(
          eq(appointmentHistory.appointmentId, testAppointmentId),
          eq(appointmentHistory.changeType, "rescheduled")
        )
      );

    expect(historyRecords.length).toBeGreaterThan(0);
    const lastRecord = historyRecords[historyRecords.length - 1];
    expect(lastRecord.changedBy).toBe("customer");
    expect(lastRecord.changedByEmail).toBe(testUserEmail);
    expect(lastRecord.oldValue).toBeDefined();
    expect(lastRecord.newValue).toBeDefined();
  });

  it("should return empty slots for days with no employee schedule", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testCustomerId,
        email: testUserEmail,
        name: "Test Customer",
        role: "user",
        tenantId: testTenantId,
      },
    });

    // Try to get slots for Sunday (day 0) - no schedule
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 7);
    while (testDate.getDay() !== 0) {
      testDate.setDate(testDate.getDate() + 1);
    }
    const testDateStr = testDate.toISOString().split("T")[0];

    const slots = await caller.myBookings.getAvailableTimeSlots({
      tenantId: testTenantId,
      appointmentId: testAppointmentId,
      date: testDateStr,
    });

    expect(slots).toBeDefined();
    expect(Array.isArray(slots)).toBe(true);
    expect(slots.length).toBe(0); // No slots on Sunday
  });
});
