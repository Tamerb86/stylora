/**
 * Email Notifications Test
 * Test email scheduler and recurring appointments
 */

import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import { appointments, customers, users, tenants, services } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { runEmailScheduler } from "./emailScheduler";
import { createRecurringAppointments } from "./recurringAppointments";

describe("Email Notifications & Recurring Appointments", () => {
  let testTenantId: string;
  let testCustomerId: number;
  let testEmployeeId: number;
  let testServiceId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [tenant] = await db.select().from(tenants).limit(1);
    testTenantId = tenant.id;

    const [customer] = await db.select().from(customers).where(eq(customers.tenantId, testTenantId)).limit(1);
    testCustomerId = customer.id;

    const [employee] = await db.select().from(users).where(eq(users.tenantId, testTenantId)).limit(1);
    testEmployeeId = employee.id;

    const [service] = await db.select().from(services).where(eq(services.tenantId, testTenantId)).limit(1);
    testServiceId = service.id;
  });

  it("should run email scheduler without errors", async () => {
    await expect(runEmailScheduler()).resolves.not.toThrow();
  });

  it("should create weekly recurring appointments", async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7);

    const result = await createRecurringAppointments({
      tenantId: testTenantId,
      customerId: testCustomerId,
      employeeId: testEmployeeId,
      serviceId: testServiceId,
      duration: 60,
      pattern: {
        frequency: "weekly",
        startDate,
        maxOccurrences: 4,
        preferredTime: "10:00",
      },
    });

    expect(result.ruleId).toBeGreaterThan(0);
    expect(result.appointmentIds).toHaveLength(4);
  });
});
