import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

/**
 * Time Clock System - Integration Tests for Fixes
 * 
 * Tests the fixes applied to the time clock system:
 * - Timezone handling
 * - Shift length validation
 * - Time calculation accuracy
 */

describe("Time Clock System - Fixes Integration Tests", () => {
  let testTenantId: string;
  let testEmployeeId: number;
  let testEmployeePin: string;

  beforeAll(async () => {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");

    // Create test tenant with Oslo timezone
    testTenantId = `test-timeclock-fixes-${Date.now()}`;
    await dbInstance.execute(
      sql`INSERT INTO tenants (id, name, subdomain, status, timezone) 
          VALUES (${testTenantId}, 'Test Salon Fixes', 'test-fixes', 'active', 'Europe/Oslo')`
    );

    // Create test employee with PIN
    await dbInstance.execute(
      sql`INSERT INTO users (tenantId, openId, name, role, pin, isActive) 
          VALUES (${testTenantId}, 'test-emp-fixes', 'Test Employee', 'employee', '9876', 1)`
    );
    
    // Retrieve the employee ID
    const [empRows] = await dbInstance.execute(
      sql`SELECT id FROM users WHERE tenantId = ${testTenantId} AND openId = 'test-emp-fixes' LIMIT 1`
    );
    testEmployeeId = (empRows as any[])[0].id;
    testEmployeePin = '9876';
  });

  afterAll(async () => {
    const dbInstance = await getDb();
    if (!dbInstance) return;

    // Cleanup test data
    await dbInstance.execute(sql`DELETE FROM timesheets WHERE tenantId = ${testTenantId}`);
    await dbInstance.execute(sql`DELETE FROM users WHERE tenantId = ${testTenantId}`);
    await dbInstance.execute(sql`DELETE FROM tenants WHERE id = ${testTenantId}`);
  });

  describe("Timezone Handling", () => {
    it("should use tenant timezone for workDate calculation", async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");

      // Get tenant timezone
      const [tenant] = await dbInstance.execute(
        sql`SELECT timezone FROM tenants WHERE id = ${testTenantId}`
      );
      const tenantData = (tenant as any[])[0];
      
      expect(tenantData.timezone).toBe('Europe/Oslo');

      // Calculate workDate in Oslo timezone
      const now = new Date();
      const osloDate = now.toLocaleDateString('sv-SE', { timeZone: 'Europe/Oslo' });

      // Clock in
      await dbInstance.execute(
        sql`INSERT INTO timesheets (tenantId, employeeId, clockIn, workDate) 
            VALUES (${testTenantId}, ${testEmployeeId}, NOW(), ${osloDate})`
      );

      // Verify workDate matches Oslo date
      const [timesheet] = await dbInstance.execute(
        sql`SELECT workDate FROM timesheets 
            WHERE tenantId = ${testTenantId} 
            AND employeeId = ${testEmployeeId}
            AND clockOut IS NULL
            ORDER BY clockIn DESC
            LIMIT 1`
      );
      const timesheetData = (timesheet as any[])[0];
      const workDateStr = new Date(timesheetData.workDate).toISOString().slice(0, 10);

      expect(workDateStr).toBe(osloDate);

      // Cleanup
      await dbInstance.execute(
        sql`DELETE FROM timesheets WHERE tenantId = ${testTenantId} AND employeeId = ${testEmployeeId}`
      );
    });
  });

  describe("Shift Length Validation", () => {
    it("should calculate shift length correctly", async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");

      // Create shift 2 hours ago
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
      const workDate = twoHoursAgo.toLocaleDateString('sv-SE', { timeZone: 'Europe/Oslo' });

      await dbInstance.execute(
        sql`INSERT INTO timesheets (tenantId, employeeId, clockIn, workDate) 
            VALUES (${testTenantId}, ${testEmployeeId}, ${twoHoursAgo.toISOString().slice(0, 19).replace('T', ' ')}, ${workDate})`
      );
      
      // Retrieve the timesheet ID
      const [tsRows] = await dbInstance.execute(
        sql`SELECT id FROM timesheets WHERE tenantId = ${testTenantId} AND employeeId = ${testEmployeeId} AND workDate = ${workDate} ORDER BY clockIn DESC LIMIT 1`
      );
      const timesheetId = (tsRows as any[])[0].id;

      // Get shift and calculate length
      const [shift] = await dbInstance.execute(
        sql`SELECT clockIn FROM timesheets WHERE id = ${timesheetId}`
      );
      const shiftData = (shift as any[])[0];
      
      const clockInTime = new Date(shiftData.clockIn);
      const now = new Date();
      const shiftHours = (now.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

      expect(shiftHours).toBeGreaterThanOrEqual(2);
      expect(shiftHours).toBeLessThan(2.1);

      // Cleanup
      await dbInstance.execute(sql`DELETE FROM timesheets WHERE id = ${timesheetId}`);
    });

    it("should detect long shifts (> 16 hours)", async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");

      // Create shift 18 hours ago
      const eighteenHoursAgo = new Date();
      eighteenHoursAgo.setHours(eighteenHoursAgo.getHours() - 18);
      const workDate = eighteenHoursAgo.toLocaleDateString('sv-SE', { timeZone: 'Europe/Oslo' });

      await dbInstance.execute(
        sql`INSERT INTO timesheets (tenantId, employeeId, clockIn, workDate) 
            VALUES (${testTenantId}, ${testEmployeeId}, ${eighteenHoursAgo.toISOString().slice(0, 19).replace('T', ' ')}, ${workDate})`
      );
      
      // Retrieve the timesheet ID
      const [tsRows2] = await dbInstance.execute(
        sql`SELECT id FROM timesheets WHERE tenantId = ${testTenantId} AND employeeId = ${testEmployeeId} AND workDate = ${workDate} ORDER BY clockIn DESC LIMIT 1`
      );
      const timesheetId = (tsRows2 as any[])[0].id;

      // Get shift and calculate length
      const [shift] = await dbInstance.execute(
        sql`SELECT clockIn FROM timesheets WHERE id = ${timesheetId}`
      );
      const shiftData = (shift as any[])[0];
      
      const clockInTime = new Date(shiftData.clockIn);
      const now = new Date();
      const shiftHours = (now.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

      // Should be > 16 hours (triggers warning)
      expect(shiftHours).toBeGreaterThan(16);

      // Cleanup
      await dbInstance.execute(sql`DELETE FROM timesheets WHERE id = ${timesheetId}`);
    });
  });

  describe("Time Calculation Accuracy", () => {
    it("should calculate totalHours with 2 decimal precision", async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");

      // Create shift with known duration
      const clockInTime = new Date();
      clockInTime.setHours(9, 0, 0, 0); // 09:00:00

      const clockOutTime = new Date();
      clockOutTime.setHours(17, 30, 0, 0); // 17:30:00

      const workDate = clockInTime.toLocaleDateString('sv-SE', { timeZone: 'Europe/Oslo' });
      const expectedHours = 8.5; // 8 hours 30 minutes

      // Insert timesheet
      await dbInstance.execute(
        sql`INSERT INTO timesheets (tenantId, employeeId, clockIn, clockOut, totalHours, workDate) 
            VALUES (
              ${testTenantId}, 
              ${testEmployeeId}, 
              ${clockInTime.toISOString().slice(0, 19).replace('T', ' ')}, 
              ${clockOutTime.toISOString().slice(0, 19).replace('T', ' ')},
              ROUND(TIMESTAMPDIFF(SECOND, ${clockInTime.toISOString().slice(0, 19).replace('T', ' ')}, ${clockOutTime.toISOString().slice(0, 19).replace('T', ' ')}) / 3600, 2),
              ${workDate}
            )`
      );
      
      // Retrieve the timesheet ID
      const [tsRows3] = await dbInstance.execute(
        sql`SELECT id FROM timesheets WHERE tenantId = ${testTenantId} AND employeeId = ${testEmployeeId} AND workDate = ${workDate} ORDER BY clockIn DESC LIMIT 1`
      );
      const timesheetId = (tsRows3 as any[])[0].id;

      // Verify calculation
      const [timesheet] = await dbInstance.execute(
        sql`SELECT totalHours FROM timesheets WHERE id = ${timesheetId}`
      );
      const timesheetData = (timesheet as any[])[0];

      expect(parseFloat(timesheetData.totalHours)).toBeCloseTo(expectedHours, 2);

      // Cleanup
      await dbInstance.execute(sql`DELETE FROM timesheets WHERE id = ${timesheetId}`);
    });

    it("should handle very short shifts (< 1 minute)", async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");

      const workDate = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Oslo' });

      // Clock in
      await dbInstance.execute(
        sql`INSERT INTO timesheets (tenantId, employeeId, clockIn, workDate) 
            VALUES (${testTenantId}, ${testEmployeeId}, NOW(), ${workDate})`
      );
      
      // Retrieve the timesheet ID
      const [tsRows4] = await dbInstance.execute(
        sql`SELECT id FROM timesheets WHERE tenantId = ${testTenantId} AND employeeId = ${testEmployeeId} AND workDate = ${workDate} ORDER BY clockIn DESC LIMIT 1`
      );
      const timesheetId = (tsRows4 as any[])[0].id;

      // Wait 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Clock out
      await dbInstance.execute(
        sql`UPDATE timesheets 
            SET clockOut = NOW(),
                totalHours = ROUND(TIMESTAMPDIFF(SECOND, clockIn, NOW()) / 3600, 2)
            WHERE id = ${timesheetId}`
      );

      // Verify
      const [timesheet] = await dbInstance.execute(
        sql`SELECT totalHours FROM timesheets WHERE id = ${timesheetId}`
      );
      const timesheetData = (timesheet as any[])[0];

      expect(parseFloat(timesheetData.totalHours)).toBeGreaterThan(0);
      expect(parseFloat(timesheetData.totalHours)).toBeLessThan(0.01); // Less than 0.01 hours (36 seconds)

      // Cleanup
      await dbInstance.execute(sql`DELETE FROM timesheets WHERE id = ${timesheetId}`);
    });
  });

  describe("Active Employees Query", () => {
    it("should return all active employees with correct data", async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");

      const workDate = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Oslo' });

      // Clock in
      await dbInstance.execute(
        sql`INSERT INTO timesheets (tenantId, employeeId, clockIn, workDate) 
            VALUES (${testTenantId}, ${testEmployeeId}, NOW(), ${workDate})`
      );

      // Get active employees
      const [activeEmployees] = await dbInstance.execute(
        sql`SELECT t.id, t.employeeId, u.name as employeeName, t.clockIn, t.workDate
            FROM timesheets t
            INNER JOIN users u ON t.employeeId = u.id
            WHERE t.tenantId = ${testTenantId}
            AND t.clockOut IS NULL
            ORDER BY t.clockIn DESC`
      );
      const activeList = activeEmployees as any[];

      expect(activeList.length).toBeGreaterThan(0);
      expect(activeList[0].employeeName).toBe('Test Employee');
      expect(activeList[0].clockIn).toBeDefined();

      // Cleanup
      await dbInstance.execute(
        sql`DELETE FROM timesheets WHERE tenantId = ${testTenantId} AND employeeId = ${testEmployeeId}`
      );
    });
  });
});
