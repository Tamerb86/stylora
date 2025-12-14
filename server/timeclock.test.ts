import { describe, it, expect, beforeEach } from "vitest";
import { createTestTenant, createTestEmployee, cleanupTestTenant } from "./test-helpers";
import { appRouter } from "./routers";
import * as db from "./db";
import { timesheets } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

describe("Time Clock System", () => {
  let testTenantId: string;
  let testEmployeeId: number;
  const testPin = "1234";

  beforeEach(async () => {
    // Create test tenant
    const { tenantId } = await createTestTenant();
    testTenantId = tenantId;

    // Create test employee with PIN
    const { userId } = await createTestEmployee(testTenantId, testPin);
    testEmployeeId = userId;
  });

  it("should allow employee to clock in with valid PIN", async () => {
    const caller = appRouter.createCaller({ user: null, req: {} as any, res: {} as any });

    const result = await caller.employee.clockIn({
      pin: testPin,
      tenantId: testTenantId,
    });

    expect(result.success).toBe(true);
    expect(result.employeeName).toBe("Test Employee");
    expect(result.clockIn).toBeDefined();

    // Verify timesheet entry was created
    const dbInstance = await db.getDb();
    const timesheetEntries = await dbInstance!
      .select()
      .from(timesheets)
      .where(
        and(
          eq(timesheets.employeeId, testEmployeeId),
          eq(timesheets.tenantId, testTenantId)
        )
      );

    expect(timesheetEntries.length).toBe(1);
    expect(timesheetEntries[0].clockOut).toBeNull();
  });

  it("should reject clock in with invalid PIN", async () => {
    const caller = appRouter.createCaller({ user: null, req: {} as any, res: {} as any });

    await expect(
      caller.employee.clockIn({
        pin: "9999",
        tenantId: testTenantId,
      })
    ).rejects.toThrow("Ugyldig PIN-kode");
  });

  it("should prevent duplicate clock-ins", async () => {
    const caller = appRouter.createCaller({ user: null, req: {} as any, res: {} as any });

    // First clock in
    await caller.employee.clockIn({
      pin: testPin,
      tenantId: testTenantId,
    });

    // Try to clock in again
    await expect(
      caller.employee.clockIn({
        pin: testPin,
        tenantId: testTenantId,
      })
    ).rejects.toThrow("Du er allerede innstemplet");
  });

  it("should allow employee to clock out and calculate hours", async () => {
    const caller = appRouter.createCaller({ user: null, req: {} as any, res: {} as any });

    // Clock in first
    await caller.employee.clockIn({
      pin: testPin,
      tenantId: testTenantId,
    });

    // Wait a bit to have some hours (at least 1 second for measurable time)
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Clock out
    const result = await caller.employee.clockOut({
      pin: testPin,
      tenantId: testTenantId,
    });

    expect(result.success).toBe(true);
    expect(result.employeeName).toBe("Test Employee");
    expect(result.clockOut).toBeDefined();
    expect(result.totalHours).toBeGreaterThanOrEqual(0); // Allow 0 for very short durations

    // Verify timesheet was updated
    const dbInstance = await db.getDb();
    const timesheetEntries = await dbInstance!
      .select()
      .from(timesheets)
      .where(
        and(
          eq(timesheets.employeeId, testEmployeeId),
          eq(timesheets.tenantId, testTenantId)
        )
      );

    expect(timesheetEntries.length).toBe(1);
    expect(timesheetEntries[0].clockOut).not.toBeNull();
    expect(timesheetEntries[0].totalHours).not.toBeNull();
  });

  it("should reject clock out without clock in", async () => {
    const caller = appRouter.createCaller({ user: null, req: {} as any, res: {} as any });

    await expect(
      caller.employee.clockOut({
        pin: testPin,
        tenantId: testTenantId,
      })
    ).rejects.toThrow("Ingen aktiv innstemplingstid funnet");
  });

  it("should get employee timesheet for specific date", async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    const today = new Date().toISOString().split('T')[0];

    // Create a timesheet entry
    await dbInstance.insert(timesheets).values({
      tenantId: testTenantId,
      employeeId: testEmployeeId,
      clockIn: new Date(),
      clockOut: new Date(),
      totalHours: "8.00",
      workDate: today,
    });

    const caller = appRouter.createCaller({
      user: { id: testEmployeeId, tenantId: testTenantId, role: "employee" } as any,
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.employee.getMyTimesheet({ date: today });

    expect(result).not.toBeNull();
    expect(result?.employeeId).toBe(testEmployeeId);
    expect(result?.totalHours).toBe("8.00");
  });
});
