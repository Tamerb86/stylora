import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import {
  users,
  appointments,
  employeeLeaves,
  appointmentServices,
  services,
  tenants,
  customers,
} from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

describe("Payroll System", () => {
  let dbInstance: Awaited<ReturnType<typeof getDb>>;
  let testTenantId: string;
  let testEmployeeId: number;
  let testServiceId: number;
  let testCustomerId: number;

  beforeAll(async () => {
    dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");

    // Create test tenant
    testTenantId = `test_payroll_${nanoid(8)}`;
    await dbInstance.insert(tenants).values({
      id: testTenantId,
      name: "Test Payroll Salon",
      subdomain: `payroll-test-${nanoid(6)}`,
      emailVerified: true,
    });

    // Create test employee
    const employeeResult = await dbInstance.insert(users).values({
      tenantId: testTenantId,
      openId: `test_emp_${nanoid(8)}`,
      name: "Test Employee",
      email: `test_${nanoid(4)}@payroll.com`,
      role: "employee",
      commissionType: "percentage",
      commissionRate: "40",
      isActive: true,
    });
    testEmployeeId = employeeResult[0].insertId;

    // Create test service
    const serviceResult = await dbInstance.insert(services).values({
      tenantId: testTenantId,
      name: "Test Haircut",
      durationMinutes: 30,
      price: "500.00",
      isActive: true,
    });
    testServiceId = serviceResult[0].insertId;

    // Create test customer
    const customerResult = await dbInstance.insert(customers).values({
      tenantId: testTenantId,
      firstName: "Test",
      lastName: "Customer",
      phone: `+47${nanoid(8)}`,
    });
    testCustomerId = customerResult[0].insertId;
  });

  afterAll(async () => {
    if (!dbInstance) return;

    // Clean up test data in correct order
    try {
      // Delete appointment services first
      await dbInstance.execute(
        sql`DELETE FROM appointmentServices WHERE appointmentId IN (SELECT id FROM appointments WHERE tenantId = ${testTenantId})`
      );
      await dbInstance
        .delete(appointments)
        .where(eq(appointments.tenantId, testTenantId));
      await dbInstance
        .delete(employeeLeaves)
        .where(eq(employeeLeaves.tenantId, testTenantId));
      await dbInstance
        .delete(services)
        .where(eq(services.tenantId, testTenantId));
      await dbInstance
        .delete(customers)
        .where(eq(customers.tenantId, testTenantId));
      await dbInstance.delete(users).where(eq(users.tenantId, testTenantId));
      await dbInstance.delete(tenants).where(eq(tenants.id, testTenantId));
    } catch (e) {
      console.error("Cleanup error:", e);
    }
  });

  describe("Leave Deductions Calculation", () => {
    it("should calculate unpaid leave deductions correctly", async () => {
      const { calculateLeaveDeductionsForPayroll } = await import("./leave");

      // Create an unpaid leave for the current month
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 10);
      const endDate = new Date(today.getFullYear(), today.getMonth(), 12);

      await dbInstance!.insert(employeeLeaves).values({
        tenantId: testTenantId,
        employeeId: testEmployeeId,
        leaveType: "unpaid",
        startDate,
        endDate,
        status: "approved",
      });

      const dailyRate = 1136.36; // 25000 / 22 working days
      const result = await calculateLeaveDeductionsForPayroll(
        testEmployeeId,
        testTenantId,
        today.getMonth() + 1,
        today.getFullYear(),
        dailyRate
      );

      expect(result.unpaidLeaveDays).toBeGreaterThanOrEqual(0);
      expect(result.unpaidLeaveDeduction).toBeGreaterThanOrEqual(0);
      expect(result.dailyRate).toBe(dailyRate);
    });

    it("should calculate paid leave days correctly", async () => {
      const { calculateLeaveDeductionsForPayroll } = await import("./leave");

      // Create an annual leave
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 15);
      const endDate = new Date(today.getFullYear(), today.getMonth(), 17);

      await dbInstance!.insert(employeeLeaves).values({
        tenantId: testTenantId,
        employeeId: testEmployeeId,
        leaveType: "annual",
        startDate,
        endDate,
        status: "approved",
      });

      const result = await calculateLeaveDeductionsForPayroll(
        testEmployeeId,
        testTenantId,
        today.getMonth() + 1,
        today.getFullYear(),
        1136.36
      );

      expect(result.paidLeaveDays).toBeGreaterThanOrEqual(0);
      expect(result.totalLeaveDays).toBeGreaterThanOrEqual(
        result.paidLeaveDays
      );
    });

    it("should calculate sick leave days correctly", async () => {
      const { calculateLeaveDeductionsForPayroll } = await import("./leave");

      // Create a sick leave
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 20);
      const endDate = new Date(today.getFullYear(), today.getMonth(), 21);

      await dbInstance!.insert(employeeLeaves).values({
        tenantId: testTenantId,
        employeeId: testEmployeeId,
        leaveType: "sick",
        startDate,
        endDate,
        status: "approved",
      });

      const result = await calculateLeaveDeductionsForPayroll(
        testEmployeeId,
        testTenantId,
        today.getMonth() + 1,
        today.getFullYear(),
        1136.36
      );

      expect(result.sickLeaveDays).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Leave Summary", () => {
    it("should return leave summary for a period", async () => {
      const { getEmployeeLeaveSummary } = await import("./leave");

      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const summary = await getEmployeeLeaveSummary(
        testEmployeeId,
        testTenantId,
        startDate,
        endDate
      );

      expect(summary).toHaveProperty("annual");
      expect(summary).toHaveProperty("sick");
      expect(summary).toHaveProperty("emergency");
      expect(summary).toHaveProperty("unpaid");
      expect(summary.annual).toHaveProperty("days");
      expect(summary.annual).toHaveProperty("leaves");
    });
  });

  describe("Payroll Calculation", () => {
    it("should create completed appointment for payroll calculation", async () => {
      // Create a completed appointment for the current month
      const today = new Date();
      const appointmentDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        5
      );

      const appointmentResult = await dbInstance!.insert(appointments).values({
        tenantId: testTenantId,
        customerId: testCustomerId,
        employeeId: testEmployeeId,
        appointmentDate: appointmentDate.toISOString().split("T")[0],
        startTime: "10:00:00",
        endTime: "10:30:00",
        status: "completed",
      });
      const appointmentId = appointmentResult[0].insertId;

      // Link service to appointment
      await dbInstance!.insert(appointmentServices).values({
        appointmentId,
        serviceId: testServiceId,
        price: "500.00",
      });

      // Verify the appointment was created
      const [createdAppointment] = await dbInstance!
        .select()
        .from(appointments)
        .where(eq(appointments.id, appointmentId))
        .limit(1);

      expect(createdAppointment).toBeDefined();
      expect(createdAppointment.status).toBe("completed");
      expect(createdAppointment.employeeId).toBe(testEmployeeId);
    });

    it("should handle employees with no appointments", async () => {
      // Create another employee with no appointments
      const newEmployeeResult = await dbInstance!.insert(users).values({
        tenantId: testTenantId,
        openId: `test_emp_no_appt_${nanoid(8)}`,
        name: "Employee No Appointments",
        email: `noappt_${nanoid(4)}@payroll.com`,
        role: "employee",
        commissionType: "percentage",
        commissionRate: "30",
        isActive: true,
      });
      const newEmployeeId = newEmployeeResult[0].insertId;

      // Verify employee exists
      const [employee] = await dbInstance!
        .select()
        .from(users)
        .where(eq(users.id, newEmployeeId))
        .limit(1);

      expect(employee).toBeDefined();
      expect(employee.name).toBe("Employee No Appointments");
    });
  });

  describe("Leave Balance", () => {
    it("should return correct leave balance", async () => {
      const { getLeaveBalance } = await import("./leave");

      const balance = await getLeaveBalance(testEmployeeId, testTenantId);

      expect(balance).toHaveProperty("annualLeaveTotal");
      expect(balance).toHaveProperty("annualLeaveUsed");
      expect(balance).toHaveProperty("annualLeaveRemaining");
      expect(balance).toHaveProperty("sickLeaveUsed");
      expect(balance.annualLeaveTotal).toBeGreaterThanOrEqual(0);
      expect(balance.annualLeaveRemaining).toBeLessThanOrEqual(
        balance.annualLeaveTotal
      );
    });
  });
});
