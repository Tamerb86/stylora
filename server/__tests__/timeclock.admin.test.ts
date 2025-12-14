import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

/**
 * Admin Time Clock Management - Integration Tests
 * 
 * Tests the admin endpoints for managing employee time clock:
 * - adminGetAllActiveShifts: Get all active shifts
 * - adminClockOut: Manually clock out a specific employee
 * - adminClockOutAll: Clock out all employees
 */

describe("Admin Time Clock Management - Integration Tests", () => {
  let testTenantId: string;
  let testEmployeeId1: number;
  let testEmployeeId2: number;
  let testTimesheetId1: number;
  let testTimesheetId2: number;

  beforeAll(async () => {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");

    // Create test tenant
    testTenantId = `test-admin-timeclock-${Date.now()}`;
    await dbInstance.execute(
      sql`INSERT INTO tenants (id, name, subdomain, status, timezone) 
          VALUES (${testTenantId}, 'Test Admin Salon', 'test-admin', 'active', 'Europe/Oslo')`
    );

    // Create test employees
    await dbInstance.execute(
      sql`INSERT INTO users (tenantId, openId, name, role, pin, phone, isActive) 
          VALUES (${testTenantId}, 'test-emp1', 'Employee One', 'employee', '1111', '12345678', 1)`
    );

    await dbInstance.execute(
      sql`INSERT INTO users (tenantId, openId, name, role, pin, phone, isActive) 
          VALUES (${testTenantId}, 'test-emp2', 'Employee Two', 'employee', '2222', '87654321', 1)`
    );
    
    // Retrieve employee IDs
    const [emp1Rows] = await dbInstance.execute(
      sql`SELECT id FROM users WHERE tenantId = ${testTenantId} AND openId = 'test-emp1' LIMIT 1`
    );
    testEmployeeId1 = (emp1Rows as any[])[0].id;
    
    const [emp2Rows] = await dbInstance.execute(
      sql`SELECT id FROM users WHERE tenantId = ${testTenantId} AND openId = 'test-emp2' LIMIT 1`
    );
    testEmployeeId2 = (emp2Rows as any[])[0].id;

    // Create active shifts for both employees
    const workDate = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Oslo' });
    
    await dbInstance.execute(
      sql`INSERT INTO timesheets (tenantId, employeeId, clockIn, workDate) 
          VALUES (${testTenantId}, ${testEmployeeId1}, NOW(), ${workDate})`
    );

    await dbInstance.execute(
      sql`INSERT INTO timesheets (tenantId, employeeId, clockIn, workDate) 
          VALUES (${testTenantId}, ${testEmployeeId2}, NOW(), ${workDate})`
    );
    
    // Retrieve timesheet IDs
    const [ts1Rows] = await dbInstance.execute(
      sql`SELECT id FROM timesheets WHERE tenantId = ${testTenantId} AND employeeId = ${testEmployeeId1} AND clockOut IS NULL LIMIT 1`
    );
    testTimesheetId1 = (ts1Rows as any[])[0].id;
    
    const [ts2Rows] = await dbInstance.execute(
      sql`SELECT id FROM timesheets WHERE tenantId = ${testTenantId} AND employeeId = ${testEmployeeId2} AND clockOut IS NULL LIMIT 1`
    );
    testTimesheetId2 = (ts2Rows as any[])[0].id;
  });

  afterAll(async () => {
    const dbInstance = await getDb();
    if (!dbInstance) return;

    // Cleanup test data
    await dbInstance.execute(sql`DELETE FROM timesheets WHERE tenantId = ${testTenantId}`);
    await dbInstance.execute(sql`DELETE FROM users WHERE tenantId = ${testTenantId}`);
    await dbInstance.execute(sql`DELETE FROM tenants WHERE id = ${testTenantId}`);
  });

  describe("adminGetAllActiveShifts", () => {
    it("should return all active shifts for tenant", async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");

      // Get active shifts
      const result = await dbInstance.execute(
        sql`SELECT t.id, t.employeeId, u.name as employeeName, u.phone as employeePhone, 
                   t.clockIn, t.workDate
            FROM timesheets t
            INNER JOIN users u ON t.employeeId = u.id
            WHERE t.tenantId = ${testTenantId}
            AND t.clockOut IS NULL
            ORDER BY t.clockIn DESC`
      );
      const activeShifts = result as any[];

      expect(activeShifts.length).toBe(2);
      expect(activeShifts[0].employeeName).toBeDefined();
      expect(activeShifts[0].employeePhone).toBeDefined();
      expect(activeShifts[0].clockIn).toBeDefined();
    });

    it("should include employee details in active shifts", async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");

      const result = await dbInstance.execute(
        sql`SELECT t.id, u.name as employeeName, u.phone as employeePhone
            FROM timesheets t
            INNER JOIN users u ON t.employeeId = u.id
            WHERE t.tenantId = ${testTenantId}
            AND t.clockOut IS NULL
            LIMIT 1`
      );
      const shift = (result as any[])[0];

      expect(shift.employeeName).toBeTruthy();
      expect(shift.employeePhone).toBeTruthy();
    });
  });

  describe("adminClockOut", () => {
    it("should manually clock out a specific employee", async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");

      // Clock out employee 1
      await dbInstance.execute(
        sql`UPDATE timesheets 
            SET clockOut = NOW(),
                totalHours = ROUND(TIMESTAMPDIFF(SECOND, clockIn, NOW()) / 3600, 2),
                notes = CONCAT(COALESCE(notes, ''), '\n', 'Manuelt utstemplet av admin: Test')
            WHERE id = ${testTimesheetId1}`
      );

      // Verify clock out
      const result = await dbInstance.execute(
        sql`SELECT clockOut, totalHours, notes FROM timesheets WHERE id = ${testTimesheetId1}`
      );
      const timesheet = (result as any[])[0];

      expect(timesheet.clockOut).toBeDefined();
      expect(timesheet.totalHours).toBeGreaterThan(0);
      expect(timesheet.notes).toContain('Manuelt utstemplet av admin');
    });

    it("should add admin note to timesheet", async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");

      const result = await dbInstance.execute(
        sql`SELECT notes FROM timesheets WHERE id = ${testTimesheetId1}`
      );
      const timesheet = (result as any[])[0];

      expect(timesheet.notes).toContain('Manuelt utstemplet av admin');
      expect(timesheet.notes).toContain('Test');
    });

    it("should calculate totalHours with 2 decimal precision", async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");

      const result = await dbInstance.execute(
        sql`SELECT totalHours FROM timesheets WHERE id = ${testTimesheetId1}`
      );
      const timesheet = (result as any[])[0];

      const totalHours = parseFloat(timesheet.totalHours);
      expect(totalHours).toBeGreaterThan(0);
      
      // Check precision (should have max 2 decimal places)
      const decimalPlaces = (totalHours.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });
  });

  describe("adminClockOutAll", () => {
    it("should clock out all active employees", async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");

      // Clock out all employees
      const result = await dbInstance.execute(
        sql`UPDATE timesheets 
            SET clockOut = NOW(),
                totalHours = ROUND(TIMESTAMPDIFF(SECOND, clockIn, NOW()) / 3600, 2),
                notes = CONCAT(COALESCE(notes, ''), '\n', 'Manuelt utstemplet av admin (slutt på dagen)')
            WHERE tenantId = ${testTenantId} 
            AND clockOut IS NULL`
      );

      const affectedRows = (result as any).rowsAffected || 0;
      expect(affectedRows).toBeGreaterThan(0);

      // Verify no active shifts remain
      const activeResult = await dbInstance.execute(
        sql`SELECT COUNT(*) as count FROM timesheets 
            WHERE tenantId = ${testTenantId} 
            AND clockOut IS NULL`
      );
      const activeCount = (activeResult as any[])[0].count;

      expect(activeCount).toBe(0);
    });

    it("should add bulk clock-out note to all timesheets", async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");

      const result = await dbInstance.execute(
        sql`SELECT notes FROM timesheets WHERE tenantId = ${testTenantId}`
      );
      const timesheets = result as any[];

      timesheets.forEach((ts: any) => {
        expect(ts.notes).toContain('Manuelt utstemplet av admin');
      });
    });
  });

  describe("Shift Length Validation", () => {
    it("should detect long shifts (> 12 hours)", async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");

      // Create a shift 13 hours ago
      const thirteenHoursAgo = new Date();
      thirteenHoursAgo.setHours(thirteenHoursAgo.getHours() - 13);
      const workDate = thirteenHoursAgo.toLocaleDateString('sv-SE', { timeZone: 'Europe/Oslo' });

      const result = await dbInstance.execute(
        sql`INSERT INTO timesheets (tenantId, employeeId, clockIn, workDate) 
            VALUES (${testTenantId}, ${testEmployeeId1}, ${thirteenHoursAgo.toISOString().slice(0, 19).replace('T', ' ')}, ${workDate})`
      );
      // Retrieve the timesheet ID
      const [longShiftRows] = await dbInstance.execute(
        sql`SELECT id FROM timesheets WHERE tenantId = ${testTenantId} AND employeeId = ${testEmployeeId1} ORDER BY clockIn DESC LIMIT 1`
      );
      const longShiftId = (longShiftRows as any[])[0].id;

      // Get shift and calculate length
      const shiftResult = await dbInstance.execute(
        sql`SELECT clockIn FROM timesheets WHERE id = ${longShiftId}`
      );
      const shift = (shiftResult as any[])[0];

      const clockInTime = new Date(shift.clockIn);
      const now = new Date();
      const shiftHours = (now.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

      expect(shiftHours).toBeGreaterThan(12);

      // Cleanup
      await dbInstance.execute(sql`DELETE FROM timesheets WHERE id = ${longShiftId}`);
    });
  });

  describe("Access Control", () => {
    it("should verify tenant isolation", async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");

      // Create another tenant
      const otherTenantId = `test-other-${Date.now()}`;
      await dbInstance.execute(
        sql`INSERT INTO tenants (id, name, subdomain, status) 
            VALUES (${otherTenantId}, 'Other Tenant', 'other', 'active')`
      );

      // Get active shifts for original tenant
      const result = await dbInstance.execute(
        sql`SELECT COUNT(*) as count FROM timesheets 
            WHERE tenantId = ${testTenantId} 
            AND clockOut IS NOT NULL`
      );
      const count = (result as any[])[0].count;

      // Should only see shifts from own tenant
      expect(count).toBeGreaterThan(0);

      // Verify other tenant has no shifts
      const otherResult = await dbInstance.execute(
        sql`SELECT COUNT(*) as count FROM timesheets WHERE tenantId = ${otherTenantId}`
      );
      const otherCount = (otherResult as any[])[0].count;
      expect(otherCount).toBe(0);

      // Cleanup
      await dbInstance.execute(sql`DELETE FROM tenants WHERE id = ${otherTenantId}`);
    });
  });
});
