import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import { users, timesheets } from "../drizzle/schema";
import type { Context } from "./_core/context";
import { eq } from "drizzle-orm";

describe("Attendance Report API", () => {
  let adminContext: Context;
  let tenantId: number;
  let employeeId1: number;
  let employeeId2: number;

  beforeEach(async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    // Clean up
    await dbInstance.delete(timesheets);
    await dbInstance.delete(users).where(eq(users.openId, "test-admin-attendance"));
    await dbInstance.delete(users).where(eq(users.openId, "test-employee1-attendance"));
    await dbInstance.delete(users).where(eq(users.openId, "test-employee2-attendance"));

    // Create admin user with tenantId
    await dbInstance.insert(users).values({
      openId: "test-admin-attendance",
      name: "Test Admin",
      role: "admin",
      loginMethod: "oauth",
      tenantId: 1, // Use a test tenant ID
    });
    
    // Retrieve admin ID
    const [adminUser] = await dbInstance.select().from(users).where(eq(users.openId, "test-admin-attendance")).limit(1);
    const adminId = adminUser.id;
    tenantId = 1; // Use the same tenantId we set above

    // Create employees
    await dbInstance.insert(users).values({
      openId: "test-employee1-attendance",
      name: "Employee One",
      role: "employee",
      loginMethod: "oauth",
      tenantId,
      pin: "1111",
    });
    
    // Retrieve employee 1 ID
    const [emp1] = await dbInstance.select().from(users).where(eq(users.openId, "test-employee1-attendance")).limit(1);
    employeeId1 = emp1.id;

    await dbInstance.insert(users).values({
      openId: "test-employee2-attendance",
      name: "Employee Two",
      role: "employee",
      loginMethod: "oauth",
      tenantId,
      pin: "2222",
    });
    
    // Retrieve employee 2 ID
    const [emp2] = await dbInstance.select().from(users).where(eq(users.openId, "test-employee2-attendance")).limit(1);
    employeeId2 = emp2.id;

    adminContext = {
      user: {
        id: adminId,
        openId: "test-admin-attendance",
        name: "Test Admin",
        role: "admin",
        tenantId,
      },
    };
  });

  it("should get all timesheets for tenant", async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    // Create timesheets
    const today = new Date().toISOString().split("T")[0];
    await dbInstance.insert(timesheets).values({
      tenantId,
      employeeId: employeeId1,
      workDate: today,
      clockIn: new Date("2025-01-01T08:00:00"),
      clockOut: new Date("2025-01-01T16:00:00"),
      totalHours: "8.00",
    });

    await dbInstance.insert(timesheets).values({
      tenantId,
      employeeId: employeeId2,
      workDate: today,
      clockIn: new Date("2025-01-01T09:00:00"),
      clockOut: new Date("2025-01-01T17:00:00"),
      totalHours: "8.00",
    });

    const caller = appRouter.createCaller(adminContext);
    const result = await caller.attendance.getAllTimesheets({});

    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0]).toHaveProperty("employeeName");
    expect(result[0]).toHaveProperty("totalHours");
  });

  it("should filter timesheets by employee", async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    const today = new Date().toISOString().split("T")[0];
    await dbInstance.insert(timesheets).values({
      tenantId,
      employeeId: employeeId1,
      workDate: today,
      clockIn: new Date(),
      clockOut: new Date(),
      totalHours: "8.00",
    });

    const caller = appRouter.createCaller(adminContext);
    const result = await caller.attendance.getAllTimesheets({
      employeeId: employeeId1,
    });

    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.every((t: any) => t.employeeId === employeeId1)).toBe(true);
  });

  it("should calculate employee totals", async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    const today = new Date().toISOString().split("T")[0];
    
    // Add multiple shifts for employee 1
    await dbInstance.insert(timesheets).values({
      tenantId,
      employeeId: employeeId1,
      workDate: today,
      clockIn: new Date(),
      clockOut: new Date(),
      totalHours: "8.00",
    });

    await dbInstance.insert(timesheets).values({
      tenantId,
      employeeId: employeeId1,
      workDate: today,
      clockIn: new Date(),
      clockOut: new Date(),
      totalHours: "4.00",
    });

    const caller = appRouter.createCaller(adminContext);
    const result = await caller.attendance.getEmployeeTotals({});

    const emp1Total = result.find((e: any) => e.employeeId === employeeId1);
    expect(emp1Total).toBeDefined();
    expect(parseFloat(emp1Total.totalHours)).toBeGreaterThanOrEqual(12);
    expect(emp1Total.shiftCount).toBeGreaterThanOrEqual(2);
  });

  it("should filter by date range", async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    await dbInstance.insert(timesheets).values({
      tenantId,
      employeeId: employeeId1,
      workDate: "2025-01-15",
      clockIn: new Date("2025-01-15T08:00:00"),
      clockOut: new Date("2025-01-15T16:00:00"),
      totalHours: "8.00",
    });

    const caller = appRouter.createCaller(adminContext);
    const result = await caller.attendance.getAllTimesheets({
      startDate: "2025-01-01",
      endDate: "2025-01-31",
    });

    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});
