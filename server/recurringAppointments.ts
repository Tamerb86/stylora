/**
 * Recurring Appointments Helper Functions
 * Generate and manage recurring appointment series
 */

import { getDb } from "./db";
import { appointments, recurrenceRules } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export type RecurrenceFrequency = "weekly" | "biweekly" | "monthly";

export interface RecurrencePattern {
  frequency: RecurrenceFrequency;
  startDate: Date;
  endDate?: Date;
  maxOccurrences?: number;
  preferredDayOfWeek?: number; // 0-6 (Sunday-Saturday)
  preferredTime: string; // HH:MM format
}

export interface RecurringAppointmentData {
  tenantId: string;
  customerId: number;
  employeeId: number;
  serviceId: number;
  duration: number; // in minutes
  pattern: RecurrencePattern;
  notes?: string;
}

/**
 * Calculate next occurrence date based on frequency
 */
function getNextOccurrence(
  currentDate: Date,
  frequency: RecurrenceFrequency
): Date {
  const next = new Date(currentDate);
  
  switch (frequency) {
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "biweekly":
      next.setDate(next.getDate() + 14);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
  }
  
  return next;
}

/**
 * Generate all appointment dates for a recurring series
 */
export function generateRecurrenceDates(pattern: RecurrencePattern): Date[] {
  const dates: Date[] = [];
  let currentDate = new Date(pattern.startDate);
  let count = 0;
  
  // Maximum 100 occurrences to prevent infinite loops
  const maxIterations = pattern.maxOccurrences || 100;
  
  while (count < maxIterations) {
    // Check if we've reached the end date
    if (pattern.endDate && currentDate > pattern.endDate) {
      break;
    }
    
    dates.push(new Date(currentDate));
    count++;
    
    // Get next occurrence
    currentDate = getNextOccurrence(currentDate, pattern.frequency);
  }
  
  return dates;
}

/**
 * Create a recurring appointment series
 */
export async function createRecurringAppointments(
  data: RecurringAppointmentData
): Promise<{ ruleId: number; appointmentIds: number[] }> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Create recurrence rule
  const [rule] = await db.insert(recurrenceRules).values({
    tenantId: data.tenantId,
    customerId: data.customerId,
    employeeId: data.employeeId,
    serviceId: data.serviceId,
    frequency: data.pattern.frequency,
    preferredDayOfWeek: data.pattern.preferredDayOfWeek,
    preferredTime: data.pattern.preferredTime,
    startDate: data.pattern.startDate,
    endDate: data.pattern.endDate,
    maxOccurrences: data.pattern.maxOccurrences,
    currentOccurrences: 0,
    isActive: true,
  });

  const ruleId = rule.insertId;

  // Generate all occurrence dates
  const dates = generateRecurrenceDates(data.pattern);

  // Create appointments for each date
  const appointmentIds: number[] = [];
  
  for (const date of dates) {
    // Calculate start and end times
    const [hours, minutes] = data.pattern.preferredTime.split(":").map(Number);
    const startTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;
    
    const endMinutes = hours * 60 + minutes + data.duration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}:00`;

    const [appointment] = await db.insert(appointments).values({
      tenantId: data.tenantId,
      customerId: data.customerId,
      employeeId: data.employeeId,
      appointmentDate: date,
      startTime,
      endTime,
      status: "confirmed",
      recurrenceRuleId: ruleId,
      notes: data.notes,
    });

    appointmentIds.push(appointment.insertId);
  }

  // Update occurrence count
  await db
    .update(recurrenceRules)
    .set({ currentOccurrences: dates.length })
    .where(eq(recurrenceRules.id, ruleId));

  return { ruleId, appointmentIds };
}

/**
 * Get all appointments in a recurring series
 */
export async function getRecurringSeriesAppointments(
  ruleId: number
): Promise<any[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(appointments)
    .where(eq(appointments.recurrenceRuleId, ruleId))
    .orderBy(appointments.appointmentDate);
}

/**
 * Update entire recurring series
 */
export async function updateRecurringSeries(
  ruleId: number,
  updates: {
    employeeId?: number;
    notes?: string;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Update all future appointments in the series
  const now = new Date();
  
  await db
    .update(appointments)
    .set(updates)
    .where(
      and(
        eq(appointments.recurrenceRuleId, ruleId),
        eq(appointments.appointmentDate, now)
      )
    );
}

/**
 * Cancel entire recurring series
 */
export async function cancelRecurringSeries(
  ruleId: number,
  reason: string
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Deactivate the rule
  await db
    .update(recurrenceRules)
    .set({ isActive: false })
    .where(eq(recurrenceRules.id, ruleId));

  // Cancel all future appointments
  const now = new Date();
  
  await db
    .update(appointments)
    .set({
      status: "canceled",
      cancellationReason: reason,
      canceledBy: "customer",
      canceledAt: new Date(),
    })
    .where(
      and(
        eq(appointments.recurrenceRuleId, ruleId),
        eq(appointments.appointmentDate, now),
        eq(appointments.status, "confirmed")
      )
    );
}

/**
 * Delete single occurrence from series
 */
export async function deleteSingleOccurrence(
  appointmentId: number,
  reason: string
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(appointments)
    .set({
      status: "canceled",
      cancellationReason: reason,
      canceledBy: "customer",
      canceledAt: new Date(),
    })
    .where(eq(appointments.id, appointmentId));
}

/**
 * Check if appointment is part of recurring series
 */
export async function isRecurringAppointment(
  appointmentId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const [appointment] = await db
    .select({ recurrenceRuleId: appointments.recurrenceRuleId })
    .from(appointments)
    .where(eq(appointments.id, appointmentId))
    .limit(1);

  return appointment?.recurrenceRuleId !== null;
}
