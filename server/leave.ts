import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { eq, and, gte, lte, or, between } from "drizzle-orm";

/**
 * Leave & Holiday Management System
 * Handles employee leave requests, approvals, and salon holidays
 */

/**
 * Calculate leave balance for an employee
 */
export async function getLeaveBalance(employeeId: number, tenantId: string) {
  const dbInstance = await getDb();
  if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

  const { users, employeeLeaves } = await import("../drizzle/schema");

  // Get employee info
  const [employee] = await dbInstance
    .select()
    .from(users)
    .where(and(eq(users.id, employeeId), eq(users.tenantId, tenantId)))
    .limit(1);

  if (!employee) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Employee not found" });
  }

  // Get approved annual leaves for current year
  const currentYear = new Date().getFullYear();
  const yearStart = new Date(currentYear, 0, 1);
  const yearEnd = new Date(currentYear, 11, 31);

  const approvedLeaves = await dbInstance
    .select()
    .from(employeeLeaves)
    .where(
      and(
        eq(employeeLeaves.employeeId, employeeId),
        eq(employeeLeaves.status, "approved"),
        gte(employeeLeaves.startDate, yearStart),
        lte(employeeLeaves.endDate, yearEnd)
      )
    );

  // Calculate total days used
  let annualDaysUsed = 0;
  let sickDaysUsed = 0;

  for (const leave of approvedLeaves) {
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (leave.leaveType === "annual") {
      annualDaysUsed += days;
    } else if (leave.leaveType === "sick") {
      sickDaysUsed += days;
    }
  }

  const annualLeaveTotal = employee.annualLeaveTotal || 25;
  const annualLeaveRemaining = annualLeaveTotal - annualDaysUsed;

  return {
    annualLeaveTotal,
    annualLeaveUsed: annualDaysUsed,
    annualLeaveRemaining,
    sickLeaveUsed: sickDaysUsed,
  };
}

/**
 * Check if employee is on leave for a specific date range
 */
export async function isEmployeeOnLeave(
  employeeId: number,
  startDate: Date,
  endDate: Date
): Promise<boolean> {
  const dbInstance = await getDb();
  if (!dbInstance) return false;

  const { employeeLeaves } = await import("../drizzle/schema");

  const overlappingLeaves = await dbInstance
    .select()
    .from(employeeLeaves)
    .where(
      and(
        eq(employeeLeaves.employeeId, employeeId),
        eq(employeeLeaves.status, "approved"),
        or(
          // Leave starts during the period
          and(
            gte(employeeLeaves.startDate, startDate),
            lte(employeeLeaves.startDate, endDate)
          ),
          // Leave ends during the period
          and(
            gte(employeeLeaves.endDate, startDate),
            lte(employeeLeaves.endDate, endDate)
          ),
          // Leave spans the entire period
          and(
            lte(employeeLeaves.startDate, startDate),
            gte(employeeLeaves.endDate, endDate)
          )
        )
      )
    )
    .limit(1);

  return overlappingLeaves.length > 0;
}

/**
 * Check if a date is a salon holiday
 */
export async function isSalonHoliday(tenantId: string, date: Date): Promise<boolean> {
  const dbInstance = await getDb();
  if (!dbInstance) return false;

  const { salonHolidays } = await import("../drizzle/schema");

  // Check exact date match
  const holidays = await dbInstance
    .select()
    .from(salonHolidays)
    .where(
      and(
        eq(salonHolidays.tenantId, tenantId),
        eq(salonHolidays.date, date)
      )
    )
    .limit(1);

  if (holidays.length > 0) return true;

  // Check recurring holidays (same month and day, any year)
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const recurringHolidays = await dbInstance
    .select()
    .from(salonHolidays)
    .where(
      and(
        eq(salonHolidays.tenantId, tenantId),
        eq(salonHolidays.isRecurring, true)
      )
    );

  for (const holiday of recurringHolidays) {
    const holidayDate = new Date(holiday.date);
    if (holidayDate.getMonth() + 1 === month && holidayDate.getDate() === day) {
      return true;
    }
  }

  return false;
}

/**
 * Get all leaves for an employee
 */
export async function getEmployeeLeaves(
  employeeId: number,
  tenantId: string,
  status?: "pending" | "approved" | "rejected"
) {
  const dbInstance = await getDb();
  if (!dbInstance) return [];

  const { employeeLeaves, users } = await import("../drizzle/schema");

  let query = dbInstance
    .select({
      id: employeeLeaves.id,
      employeeId: employeeLeaves.employeeId,
      leaveType: employeeLeaves.leaveType,
      startDate: employeeLeaves.startDate,
      endDate: employeeLeaves.endDate,
      status: employeeLeaves.status,
      reason: employeeLeaves.reason,
      approvedBy: employeeLeaves.approvedBy,
      approvedAt: employeeLeaves.approvedAt,
      rejectionReason: employeeLeaves.rejectionReason,
      createdAt: employeeLeaves.createdAt,
      approverName: users.name,
    })
    .from(employeeLeaves)
    .leftJoin(users, eq(employeeLeaves.approvedBy, users.id))
    .where(
      and(
        eq(employeeLeaves.tenantId, tenantId),
        eq(employeeLeaves.employeeId, employeeId)
      )
    )
    .$dynamic();

  if (status) {
    query = query.where(eq(employeeLeaves.status, status));
  }

  return query.orderBy(employeeLeaves.createdAt);
}

/**
 * Get all pending leave requests for a tenant (for admin approval)
 */
export async function getPendingLeaveRequests(tenantId: string) {
  const dbInstance = await getDb();
  if (!dbInstance) return [];

  const { employeeLeaves, users } = await import("../drizzle/schema");

  return dbInstance
    .select({
      id: employeeLeaves.id,
      employeeId: employeeLeaves.employeeId,
      employeeName: users.name,
      employeeEmail: users.email,
      leaveType: employeeLeaves.leaveType,
      startDate: employeeLeaves.startDate,
      endDate: employeeLeaves.endDate,
      status: employeeLeaves.status,
      reason: employeeLeaves.reason,
      createdAt: employeeLeaves.createdAt,
    })
    .from(employeeLeaves)
    .innerJoin(users, eq(employeeLeaves.employeeId, users.id))
    .where(
      and(
        eq(employeeLeaves.tenantId, tenantId),
        eq(employeeLeaves.status, "pending")
      )
    )
    .orderBy(employeeLeaves.createdAt);
}

/**
 * Create a leave request
 */
export async function createLeaveRequest(
  employeeId: number,
  tenantId: string,
  leaveType: "annual" | "sick" | "emergency" | "unpaid",
  startDate: Date,
  endDate: Date,
  reason?: string
) {
  const dbInstance = await getDb();
  if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

  const { employeeLeaves } = await import("../drizzle/schema");

  // Validate dates
  if (endDate < startDate) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "End date must be after start date",
    });
  }

  // Check for overlapping leaves
  const hasOverlap = await isEmployeeOnLeave(employeeId, startDate, endDate);
  if (hasOverlap) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "You already have an approved leave during this period",
    });
  }

  // Create leave request
  await dbInstance.insert(employeeLeaves).values({
    tenantId,
    employeeId,
    leaveType,
    startDate,
    endDate,
    reason: reason || null,
    status: "pending",
  });

  return { success: true };
}

/**
 * Approve or reject a leave request
 */
export async function approveLeaveRequest(
  leaveId: number,
  tenantId: string,
  approvedBy: number,
  approved: boolean,
  rejectionReason?: string
) {
  const dbInstance = await getDb();
  if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

  const { employeeLeaves, users } = await import("../drizzle/schema");

  // Get leave request
  const [leave] = await dbInstance
    .select()
    .from(employeeLeaves)
    .where(
      and(
        eq(employeeLeaves.id, leaveId),
        eq(employeeLeaves.tenantId, tenantId)
      )
    )
    .limit(1);

  if (!leave) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Leave request not found" });
  }

  if (leave.status !== "pending") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Leave request has already been processed",
    });
  }

  // Update leave status
  await dbInstance
    .update(employeeLeaves)
    .set({
      status: approved ? "approved" : "rejected",
      approvedBy,
      approvedAt: new Date(),
      rejectionReason: approved ? null : (rejectionReason || null),
    })
    .where(eq(employeeLeaves.id, leaveId));

  // If approved, update employee's leave balance
  if (approved && leave.leaveType === "annual") {
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    await dbInstance
      .update(users)
      .set({
        annualLeaveUsed: leave.employeeId, // This will be incremented
      })
      .where(eq(users.id, leave.employeeId));
  }

  return { success: true, approved };
}

/**
 * Get all salon holidays
 */
export async function getSalonHolidays(tenantId: string) {
  const dbInstance = await getDb();
  if (!dbInstance) return [];

  const { salonHolidays } = await import("../drizzle/schema");

  return dbInstance
    .select()
    .from(salonHolidays)
    .where(eq(salonHolidays.tenantId, tenantId))
    .orderBy(salonHolidays.date);
}

/**
 * Create a salon holiday
 */
export async function createSalonHoliday(
  tenantId: string,
  name: string,
  date: Date,
  isRecurring: boolean,
  description?: string
) {
  const dbInstance = await getDb();
  if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

  const { salonHolidays } = await import("../drizzle/schema");

  await dbInstance.insert(salonHolidays).values({
    tenantId,
    name,
    date,
    isRecurring,
    description: description || null,
  });

  return { success: true };
}

/**
 * Delete a salon holiday
 */
export async function deleteSalonHoliday(holidayId: number, tenantId: string) {
  const dbInstance = await getDb();
  if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

  const { salonHolidays } = await import("../drizzle/schema");

  await dbInstance
    .delete(salonHolidays)
    .where(
      and(
        eq(salonHolidays.id, holidayId),
        eq(salonHolidays.tenantId, tenantId)
      )
    );

  return { success: true };
}
