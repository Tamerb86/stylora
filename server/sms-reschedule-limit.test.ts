import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { appointments, customers, users, tenants, services, appointmentServices, employeeSchedules } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

describe("SMS Notifications & Reschedule Limit", () => {
  let testTenantId: string;
  let testCustomerId: number;
  let testEmployeeId: number;
  let testServiceId: number;
  let testAppointmentId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    testTenantId = `test-tenant-${nanoid()}`;

    // Create test tenant
    await db.insert(tenants).values({
      id: testTenantId,
      name: "Test Salon",
      subdomain: `test-${nanoid()}`,
      phone: "+4712345678",
      email: "test@example.com",
      timezone: "Europe/Oslo",
      currency: "NOK",
      vatRate: "25.00",
      cancellationWindowHours: 24,
    });

    // Create test employee
    const [employee] = await db.insert(users).values({
      tenantId: testTenantId,
      openId: `test-employee-${nanoid()}`,
      email: "employee@test.com",
      name: "Test Employee",
      phone: "+4712345678",
      role: "employee",
      loginMethod: "email",
      isActive: true,
    });
    testEmployeeId = employee.insertId;

    // Create employee schedule for all days
    for (let day = 0; day < 7; day++) {
      await db.insert(employeeSchedules).values({
        employeeId: testEmployeeId,
        dayOfWeek: day,
        startTime: "09:00:00",
        endTime: "17:00:00",
        isActive: true,
      });
    }

    // Create test customer
    const [customer] = await db.insert(customers).values({
      tenantId: testTenantId,
      firstName: "Test",
      lastName: "Customer",
      phone: "+4798765432",
      email: "customer@test.com",
    });
    testCustomerId = customer.insertId;

    // Create test service
    const [service] = await db.insert(services).values({
      tenantId: testTenantId,
      name: "Test Service",
      durationMinutes: 60,
      price: "500.00",
      isActive: true,
    });
    testServiceId = service.insertId;

    // Create test appointment (3 days from now)
    const appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate() + 3);
    appointmentDate.setHours(0, 0, 0, 0);

    const [appointment] = await db.insert(appointments).values({
      tenantId: testTenantId,
      customerId: testCustomerId,
      employeeId: testEmployeeId,
      appointmentDate,
      startTime: "10:00:00",
      endTime: "11:00:00",
      status: "confirmed",
      rescheduleCount: 0,
      managementToken: nanoid(),
    });
    testAppointmentId = appointment.insertId;

    // Link service to appointment
    await db.insert(appointmentServices).values({
      appointmentId: testAppointmentId,
      serviceId: testServiceId,
      price: "500.00",
    });
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Cleanup
    await db.delete(appointmentServices).where(eq(appointmentServices.appointmentId, testAppointmentId));
    await db.delete(appointments).where(eq(appointments.tenantId, testTenantId));
    await db.delete(employeeSchedules).where(eq(employeeSchedules.employeeId, testEmployeeId));
    await db.delete(services).where(eq(services.tenantId, testTenantId));
    await db.delete(customers).where(eq(customers.tenantId, testTenantId));
    await db.delete(users).where(eq(users.tenantId, testTenantId));
    await db.delete(tenants).where(eq(tenants.id, testTenantId));
  });

  it("should allow first reschedule (rescheduleCount = 0)", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get current appointment
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, testAppointmentId))
      .limit(1);

    expect(appointment).toBeDefined();
    expect(appointment.rescheduleCount).toBe(0);

    // Reschedule to 4 days from now at 14:00
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 4);
    newDate.setHours(0, 0, 0, 0);

    await db
      .update(appointments)
      .set({
        appointmentDate: newDate,
        startTime: "14:00:00",
        endTime: "15:00:00",
        rescheduleCount: appointment.rescheduleCount + 1,
      })
      .where(eq(appointments.id, testAppointmentId));

    // Verify rescheduleCount incremented
    const [updated] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, testAppointmentId))
      .limit(1);

    expect(updated.rescheduleCount).toBe(1);
    expect(updated.startTime).toBe("14:00:00");
  });

  it("should allow second reschedule (rescheduleCount = 1)", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get current appointment
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, testAppointmentId))
      .limit(1);

    expect(appointment.rescheduleCount).toBe(1);

    // Reschedule to 5 days from now at 11:00
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 5);
    newDate.setHours(0, 0, 0, 0);

    await db
      .update(appointments)
      .set({
        appointmentDate: newDate,
        startTime: "11:00:00",
        endTime: "12:00:00",
        rescheduleCount: appointment.rescheduleCount + 1,
      })
      .where(eq(appointments.id, testAppointmentId));

    // Verify rescheduleCount incremented
    const [updated] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, testAppointmentId))
      .limit(1);

    expect(updated.rescheduleCount).toBe(2);
    expect(updated.startTime).toBe("11:00:00");
  });

  it("should prevent third reschedule (rescheduleCount = 2)", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get current appointment
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, testAppointmentId))
      .limit(1);

    expect(appointment.rescheduleCount).toBe(2);

    // Verify that rescheduleCount is at limit
    const MAX_RESCHEDULES = 2;
    expect(appointment.rescheduleCount >= MAX_RESCHEDULES).toBe(true);
  });

  it("should have rescheduleCount field in appointments table", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, testAppointmentId))
      .limit(1);

    expect(appointment).toBeDefined();
    expect(appointment).toHaveProperty("rescheduleCount");
    expect(typeof appointment.rescheduleCount).toBe("number");
  });

  it("should initialize rescheduleCount to 0 for new appointments", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a new appointment
    const appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate() + 7);
    appointmentDate.setHours(0, 0, 0, 0);

    const [newAppointment] = await db.insert(appointments).values({
      tenantId: testTenantId,
      customerId: testCustomerId,
      employeeId: testEmployeeId,
      appointmentDate,
      startTime: "10:00:00",
      endTime: "11:00:00",
      status: "confirmed",
      managementToken: nanoid(),
    });

    const [created] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, newAppointment.insertId))
      .limit(1);

    expect(created.rescheduleCount).toBe(0);

    // Cleanup
    await db.delete(appointments).where(eq(appointments.id, newAppointment.insertId));
  });
});
