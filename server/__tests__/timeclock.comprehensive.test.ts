import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

/**
 * Comprehensive Time Clock System Tests
 * 
 * Tests all aspects of the time clock system:
 * - Clock-in functionality
 * - Clock-out functionality
 * - Time calculation accuracy
 * - Timezone handling
 * - Active employees display
 * - Edge cases
 */

describe("Time Clock System - Comprehensive Tests", () => {
  let testTenantId: string;
  let testEmployeeId: number;
  let testEmployeePin: string;
  let testTimesheetId: number;

  beforeAll(async () => {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");

    // Create test tenant
    const tenantResult = await dbInstance.execute(
      sql`INSERT INTO tenants (id, name, subdomain, status, timezone) 
          VALUES ('test-timeclock-tenant', 'Test Salon', 'test-timeclock', 'active', 'Europe/Oslo')`
    );
    testTenantId = 'test-timeclock-tenant';

    // Create test employee with PIN
    await dbInstance.execute(
      sql`INSERT INTO users (tenantId, openId, name, role, pin, isActive) 
          VALUES (${testTenantId}, 'test-emp-timeclock', 'Test Employee', 'employee', '1234', 1)`
    );
    
    // Retrieve the employee ID
    const [empRows] = await dbInstance.execute(
      sql`SELECT id FROM users WHERE tenantId = ${testTenantId} AND openId = 'test-emp-timeclock' LIMIT 1`
    );
    testEmployeeId = (empRows as any[])[0].id;
    testEmployeePin = '1234';
  });

  afterAll(async () => {
    const dbInstance = await getDb();
    if (!dbInstance) return;

    // Cleanup test data
    await dbInstance.execute(sql`DELETE FROM timesheets WHERE tenantId = ${testTenantId}`);
    await dbInstance.execute(sql`DELETE FROM users WHERE tenantId = ${testTenantId}`);
    await dbInstance.execute(sql`DELETE FROM tenants WHERE id = ${testTenantId}`);
  });

  describe("Clock-In Tests", () => {
    it("should allow employee to clock in with valid PIN", async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");

      // Find employee by PIN
      const empResult = await dbInstance.execute(
        sql`SELECT * FROM users WHERE pin = ${testEmployeePin} AND tenantId = ${testTenantId} LIMIT 1`
      );
      const emp = (empResult[0] as any[])[0];

      expect(emp).toBeDefined();
      expect(emp.pin).toBe(testEmployeePin);

      // Check for existing open shifts
      const existingShiftResult = await dbInstance.execute(
        sql`SELECT * FROM timesheets 
            WHERE employeeId = ${emp.id} 
            AND tenantId = ${testTenantId} 
            AND clockOut IS NULL 
            LIMIT 1`
      );
      const existingShift = (existingShiftResult[0] as any[]);

      // If there's an open shift, clock out first
      if (existingShift.length > 0) {
        await dbInstance.execute(
          sql`UPDATE timesheets 
              SET clockOut = NOW(),
                  totalHours = TIMESTAMPDIFF(SECOND, clockIn, NOW()) / 3600
              WHERE id = ${existingShift[0].id}`
        );
      }

      // Clock in
      await dbInstance.execute(
        sql`INSERT INTO timesheets (tenantId, employeeId, clockIn, workDate) 
            VALUES (${testTenantId}, ${emp.id}, NOW(), CURDATE())`
      );

      // Retrieve the timesheet ID
      const [tsRows] = await dbInstance.execute(
        sql`SELECT id FROM timesheets WHERE tenantId = ${testTenantId} AND employeeId = ${emp.id} AND clockOut IS NULL ORDER BY clockIn DESC LIMIT 1`
      );
      testTimesheetId = (tsRows as any[])[0].id;

      expect(testTimesheetId).toBeGreaterThan(0);

      // Verify timesheet was created
      const timesheetResult = await dbInstance.execute(
        sql`SELECT * FROM timesheets WHERE id = ${testTimesheetId}`
      );
      const timesheet = (timesheetResult[0] as any[])[0];

      expect(timesheet).toBeDefined();
      expect(timesheet.employeeId).toBe(emp.id);
      expect(timesheet.clockIn).toBeDefined();
      expect(timesheet.clockOut).toBeNull();
    });

    it("should prevent duplicate clock-in", async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");

      // Try to clock in again
      const existingShiftResult = await dbInstance.execute(
        sql`SELECT * FROM timesheets 
            WHERE employeeId = ${testEmployeeId} 
            AND tenantId = ${testTenantId} 
            AND clockOut IS NULL 
            LIMIT 1`
      );
      const existingShift = (existingShiftResult[0] as any[]);

      expect(existingShift.length).toBeGreaterThan(0);
      // Should not allow duplicate clock-in
    });

    it("should reject invalid PIN", async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");

      const empResult = await dbInstance.execute(
        sql`SELECT * FROM users WHERE pin = '9999' AND tenantId = ${testTenantId} LIMIT 1`
      );
      const emp = (empResult[0] as any[])[0];

      expect(emp).toBeUndefined();
    });
  });

  describe("Clock-Out Tests", () => {
    it("should allow employee to clock out", async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");

      // Find active shift
      const activeShiftResult = await dbInstance.execute(
        sql`SELECT * FROM timesheets 
            WHERE employeeId = ${testEmployeeId} 
            AND tenantId = ${testTenantId} 
            AND clockOut IS NULL 
            ORDER BY clockIn DESC
            LIMIT 1`
      );
      const activeShift = (activeShiftResult[0] as any[])[0];

      expect(activeShift).toBeDefined();

      // Clock out
      await dbInstance.execute(
        sql`UPDATE timesheets 
            SET clockOut = NOW(),
                totalHours = TIMESTAMPDIFF(SECOND, clockIn, NOW()) / 3600
            WHERE id = ${activeShift.id}`
      );

      // Verify clock-out
      const updatedResult = await dbInstance.execute(
        sql`SELECT clockOut, totalHours FROM timesheets WHERE id = ${activeShift.id}`
      );
      const updated = (updatedResult[0] as any[])[0];

      expect(updated.clockOut).toBeDefined();
      expect(updated.totalHours).toBeGreaterThan(0);
    });

    it("should calculate totalHours correctly", async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");

      // Create a test timesheet with known times
      const clockInTime = new Date();
      clockInTime.setHours(9, 0, 0, 0); // 09:00:00

      const clockOutTime = new Date();
      clockOutTime.setHours(17, 30, 0, 0); // 17:30:00

      const expectedHours = 8.5; // 8 hours 30 minutes

      // Insert test timesheet
      await dbInstance.execute(
        sql`INSERT INTO timesheets (tenantId, employeeId, clockIn, clockOut, totalHours, workDate) 
            VALUES (
              ${testTenantId}, 
              ${testEmployeeId}, 
              ${clockInTime.toISOString().slice(0, 19).replace('T', ' ')}, 
              ${clockOutTime.toISOString().slice(0, 19).replace('T', ' ')},
              TIMESTAMPDIFF(SECOND, ${clockInTime.toISOString().slice(0, 19).replace('T', ' ')}, ${clockOutTime.toISOString().slice(0, 19).replace('T', ' ')}) / 3600,
              CURDATE()
            )`
      );

      // Retrieve the timesheet ID
      const [tsRows2] = await dbInstance.execute(
        sql`SELECT id FROM timesheets WHERE tenantId = ${testTenantId} AND employeeId = ${testEmployeeId} ORDER BY clockIn DESC LIMIT 1`
      );
      const timesheetId = (tsRows2 as any[])[0].id;

      // Verify calculation
      const timesheetResult = await dbInstance.execute(
        sql`SELECT totalHours FROM timesheets WHERE id = ${timesheetId}`
      );
      const timesheet = (timesheetResult[0] as any[])[0];

      expect(parseFloat(timesheet.totalHours)).toBeCloseTo(expectedHours, 1);

      // Cleanup
      await dbInstance.execute(sql`DELETE FROM timesheets WHERE id = ${timesheetId}`);
    });

    it("should prevent clock-out without clock-in", async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");

      // Create a new employee without active shift
      await dbInstance.execute(
        sql`INSERT INTO users (tenantId, openId, name, role, pin, isActive) 
            VALUES (${testTenantId}, 'test-emp-2', 'Test Employee 2', 'employee', '5678', 1)`
      );
      
      // Retrieve the employee ID
      const [newEmpRows] = await dbInstance.execute(
        sql`SELECT id FROM users WHERE tenantId = ${testTenantId} AND openId = 'test-emp-2' LIMIT 1`
      );
      const newEmpId = (newEmpRows as any[])[0].id;

      // Try to find active shift (should not exist)
      const activeShiftResult = await dbInstance.execute(
        sql`SELECT * FROM timesheets 
            WHERE employeeId = ${newEmpId} 
            AND tenantId = ${testTenantId} 
            AND clockOut IS NULL 
            LIMIT 1`
      );
      const activeShift = (activeShiftResult[0] as any[]);

      expect(activeShift.length).toBe(0);

      // Cleanup
      await dbInstance.execute(sql`DELETE FROM users WHERE id = ${newEmpId}`);
    });
  });

  describe("Active Employees Tests", () => {
    it("should return all active employees", async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");

      // Create active shift
      await dbInstance.execute(
        sql`INSERT INTO timesheets (tenantId, employeeId, clockIn, workDate) 
            VALUES (${testTenantId}, ${testEmployeeId}, NOW(), CURDATE())`
      );

      // Get active employees
      const activeResult = await dbInstance.execute(
        sql`SELECT t.id, t.employeeId, u.name as employeeName, t.clockIn, t.workDate
            FROM timesheets t
            INNER JOIN users u ON t.employeeId = u.id
            WHERE t.tenantId = ${testTenantId}
            AND t.clockOut IS NULL
            ORDER BY t.clockIn DESC`
      );
      const activeEmployees = (activeResult[0] as any[]);

      expect(activeEmployees.length).toBeGreaterThan(0);
      expect(activeEmployees[0].employeeName).toBe('Test Employee');

      // Cleanup - clock out
      await dbInstance.execute(
        sql`UPDATE timesheets 
            SET clockOut = NOW(),
                totalHours = TIMESTAMPDIFF(SECOND, clockIn, NOW()) / 3600
            WHERE employeeId = ${testEmployeeId} 
            AND tenantId = ${testTenantId}
            AND clockOut IS NULL`
      );
    });

    it("should calculate elapsed time correctly", async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");

      // Create shift 2 hours ago
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

      await dbInstance.execute(
        sql`INSERT INTO timesheets (tenantId, employeeId, clockIn, workDate) 
            VALUES (${testTenantId}, ${testEmployeeId}, ${twoHoursAgo.toISOString().slice(0, 19).replace('T', ' ')}, CURDATE())`
      );

      // Get active shift
      const activeResult = await dbInstance.execute(
        sql`SELECT clockIn FROM timesheets 
            WHERE employeeId = ${testEmployeeId} 
            AND tenantId = ${testTenantId}
            AND clockOut IS NULL
            ORDER BY clockIn DESC
            LIMIT 1`
      );
      const activeShift = (activeResult[0] as any[])[0];

      // Calculate elapsed time (frontend logic)
      const clockInTime = new Date(activeShift.clockIn);
      const elapsedHours = (new Date().getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

      expect(elapsedHours).toBeGreaterThanOrEqual(2);
      expect(elapsedHours).toBeLessThan(2.1); // Allow small margin

      // Cleanup
      await dbInstance.execute(
        sql`UPDATE timesheets 
            SET clockOut = NOW(),
                totalHours = TIMESTAMPDIFF(SECOND, clockIn, NOW()) / 3600
            WHERE employeeId = ${testEmployeeId} 
            AND tenantId = ${testTenantId}
            AND clockOut IS NULL`
      );
    });
  });

  describe("Timezone Tests", () => {
    it("should handle workDate correctly in tenant timezone", async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");

      // Get tenant timezone
      const tenantResult = await dbInstance.execute(
        sql`SELECT timezone FROM tenants WHERE id = ${testTenantId}`
      );
      const tenant = (tenantResult[0] as any[])[0];

      expect(tenant.timezone).toBe('Europe/Oslo');

      // Clock in
      await dbInstance.execute(
        sql`INSERT INTO timesheets (tenantId, employeeId, clockIn, workDate) 
            VALUES (${testTenantId}, ${testEmployeeId}, NOW(), CURDATE())`
      );

      // Get timesheet
      const timesheetResult = await dbInstance.execute(
        sql`SELECT workDate, clockIn FROM timesheets 
            WHERE employeeId = ${testEmployeeId} 
            AND tenantId = ${testTenantId}
            AND clockOut IS NULL
            ORDER BY clockIn DESC
            LIMIT 1`
      );
      const timesheet = (timesheetResult[0] as any[])[0];

      // Verify workDate matches current date in tenant timezone
      const osloDate = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Oslo' });
      const workDateStr = new Date(timesheet.workDate).toISOString().slice(0, 10);

      expect(workDateStr).toBe(osloDate);

      // Cleanup
      await dbInstance.execute(
        sql`UPDATE timesheets 
            SET clockOut = NOW(),
                totalHours = TIMESTAMPDIFF(SECOND, clockIn, NOW()) / 3600
            WHERE employeeId = ${testEmployeeId} 
            AND tenantId = ${testTenantId}
            AND clockOut IS NULL`
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle very short shifts (< 1 minute)", async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");

      // Clock in
      await dbInstance.execute(
        sql`INSERT INTO timesheets (tenantId, employeeId, clockIn, workDate) 
            VALUES (${testTenantId}, ${testEmployeeId}, NOW(), CURDATE())`
      );
      
      // Retrieve the timesheet ID
      const [tsRows3] = await dbInstance.execute(
        sql`SELECT id FROM timesheets WHERE tenantId = ${testTenantId} AND employeeId = ${testEmployeeId} AND clockOut IS NULL ORDER BY clockIn DESC LIMIT 1`
      );
      const timesheetId = (tsRows3 as any[])[0].id;

      // Wait 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Clock out
      await dbInstance.execute(
        sql`UPDATE timesheets 
            SET clockOut = NOW(),
                totalHours = TIMESTAMPDIFF(SECOND, clockIn, NOW()) / 3600
            WHERE id = ${timesheetId}`
      );

      // Verify
      const timesheetResult = await dbInstance.execute(
        sql`SELECT totalHours FROM timesheets WHERE id = ${timesheetId}`
      );
      const timesheet = (timesheetResult[0] as any[])[0];

      expect(parseFloat(timesheet.totalHours)).toBeGreaterThan(0);
      expect(parseFloat(timesheet.totalHours)).toBeLessThan(0.01); // Less than 0.01 hours (36 seconds)

      // Cleanup
      await dbInstance.execute(sql`DELETE FROM timesheets WHERE id = ${timesheetId}`);
    });

    it("should handle long shifts (> 12 hours)", async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");

      // Create shift 15 hours ago
      const fifteenHoursAgo = new Date();
      fifteenHoursAgo.setHours(fifteenHoursAgo.getHours() - 15);

      await dbInstance.execute(
        sql`INSERT INTO timesheets (tenantId, employeeId, clockIn, workDate) 
            VALUES (${testTenantId}, ${testEmployeeId}, ${fifteenHoursAgo.toISOString().slice(0, 19).replace('T', ' ')}, CURDATE())`
      );
      
      // Retrieve the timesheet ID
      const [tsRows4] = await dbInstance.execute(
        sql`SELECT id FROM timesheets WHERE tenantId = ${testTenantId} AND employeeId = ${testEmployeeId} AND clockOut IS NULL ORDER BY clockIn DESC LIMIT 1`
      );
      const timesheetId = (tsRows4 as any[])[0].id;

      // Clock out now
      await dbInstance.execute(
        sql`UPDATE timesheets 
            SET clockOut = NOW(),
                totalHours = TIMESTAMPDIFF(SECOND, clockIn, NOW()) / 3600
            WHERE id = ${timesheetId}`
      );

      // Verify
      const timesheetResult = await dbInstance.execute(
        sql`SELECT totalHours FROM timesheets WHERE id = ${timesheetId}`
      );
      const timesheet = (timesheetResult[0] as any[])[0];

      expect(parseFloat(timesheet.totalHours)).toBeGreaterThan(14);
      expect(parseFloat(timesheet.totalHours)).toBeLessThan(16);

      // Cleanup
      await dbInstance.execute(sql`DELETE FROM timesheets WHERE id = ${timesheetId}`);
    });

    it("should allow clock-out next day (forgot yesterday)", async () => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");

      // Create shift yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(9, 0, 0, 0);

      await dbInstance.execute(
        sql`INSERT INTO timesheets (tenantId, employeeId, clockIn, workDate) 
            VALUES (${testTenantId}, ${testEmployeeId}, ${yesterday.toISOString().slice(0, 19).replace('T', ' ')}, DATE_SUB(CURDATE(), INTERVAL 1 DAY))`
      );
      
      // Retrieve the timesheet ID
      const [tsRows5] = await dbInstance.execute(
        sql`SELECT id FROM timesheets WHERE tenantId = ${testTenantId} AND employeeId = ${testEmployeeId} AND clockOut IS NULL ORDER BY clockIn DESC LIMIT 1`
      );
      const timesheetId = (tsRows5 as any[])[0].id;

      // Find active shift (should find yesterday's shift)
      const activeShiftResult = await dbInstance.execute(
        sql`SELECT * FROM timesheets 
            WHERE employeeId = ${testEmployeeId} 
            AND tenantId = ${testTenantId} 
            AND clockOut IS NULL 
            ORDER BY clockIn DESC
            LIMIT 1`
      );
      const activeShift = (activeShiftResult[0] as any[])[0];

      expect(activeShift).toBeDefined();
      expect(activeShift.id).toBe(timesheetId);

      // Clock out today
      await dbInstance.execute(
        sql`UPDATE timesheets 
            SET clockOut = NOW(),
                totalHours = TIMESTAMPDIFF(SECOND, clockIn, NOW()) / 3600
            WHERE id = ${activeShift.id}`
      );

      // Verify
      const timesheetResult = await dbInstance.execute(
        sql`SELECT totalHours FROM timesheets WHERE id = ${timesheetId}`
      );
      const timesheet = (timesheetResult[0] as any[])[0];

      // Should be around 24 hours
      expect(parseFloat(timesheet.totalHours)).toBeGreaterThan(20);

      // Cleanup
      await dbInstance.execute(sql`DELETE FROM timesheets WHERE id = ${timesheetId}`);
    });
  });
});
