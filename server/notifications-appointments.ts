import { getDb } from "./db";
import {
  appointments,
  customers,
  tenants,
  appointmentServices,
  services,
} from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import {
  sendEmail,
  renderBookingConfirmationEmail,
  renderBookingCancellationEmail,
  renderBookingRescheduleEmail,
} from "./email";

/**
 * Send appointment confirmation email if possible
 *
 * Called when an appointment status transitions to "confirmed"
 * - Manually via appointments.updateStatus
 * - Automatically via Stripe webhook
 *
 * @param appointmentId Appointment ID
 * @param tenantId Tenant ID (for multi-tenant isolation)
 */
export async function sendAppointmentConfirmationIfPossible(
  appointmentId: number,
  tenantId: string
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Email] Database not available");
      return;
    }

    // Load appointment
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.id, appointmentId),
          eq(appointments.tenantId, tenantId)
        )
      );

    if (!appointment) {
      console.warn("[Email] Appointment not found:", appointmentId);
      return;
    }

    // Load customer
    const [customer] = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.id, appointment.customerId),
          eq(customers.tenantId, tenantId)
        )
      );

    if (!customer || !customer.email) {
      console.log("[Email] Customer has no email, skipping confirmation email");
      return;
    }

    // Load tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));

    if (!tenant) {
      console.warn("[Email] Tenant not found:", tenantId);
      return;
    }

    // Load services
    const serviceRows = await db
      .select({
        name: services.name,
      })
      .from(appointmentServices)
      .innerJoin(services, eq(appointmentServices.serviceId, services.id))
      .where(eq(appointmentServices.appointmentId, appointment.id));

    const servicesNames = serviceRows.map(s => s.name);

    // Format date and time
    const dateStr = formatNorwegianDate(appointment.appointmentDate);
    const timeStr = appointment.startTime.slice(0, 5); // HH:MM from HH:MM:SS

    // Render and send email
    const { subject, html } = renderBookingConfirmationEmail({
      salonName: tenant.name,
      customerName:
        `${customer.firstName} ${customer.lastName}`.trim() || customer.phone,
      date: dateStr,
      time: timeStr,
      services: servicesNames.length > 0 ? servicesNames : ["Timebestilling"],
    });

    await sendEmail({
      to: customer.email,
      subject,
      html,
    });

    console.log(
      "[Email] Confirmation email sent for appointment:",
      appointmentId
    );
  } catch (error) {
    console.error("[Email] Failed to send confirmation email:", error);
    // Don't throw - email failure should not break main logic
  }
}

/**
 * Send appointment cancellation email if possible
 *
 * Called when an appointment status transitions to "canceled"
 *
 * @param appointmentId Appointment ID
 * @param tenantId Tenant ID (for multi-tenant isolation)
 */
export async function sendAppointmentCancellationIfPossible(
  appointmentId: number,
  tenantId: string
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Email] Database not available");
      return;
    }

    // Load appointment
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.id, appointmentId),
          eq(appointments.tenantId, tenantId)
        )
      );

    if (!appointment) {
      console.warn("[Email] Appointment not found:", appointmentId);
      return;
    }

    // Load customer
    const [customer] = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.id, appointment.customerId),
          eq(customers.tenantId, tenantId)
        )
      );

    if (!customer || !customer.email) {
      console.log("[Email] Customer has no email, skipping cancellation email");
      return;
    }

    // Load tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));

    if (!tenant) {
      console.warn("[Email] Tenant not found:", tenantId);
      return;
    }

    // Format date and time
    const dateStr = formatNorwegianDate(appointment.appointmentDate);
    const timeStr = appointment.startTime.slice(0, 5); // HH:MM from HH:MM:SS

    // Render and send email
    const { subject, html } = renderBookingCancellationEmail({
      salonName: tenant.name,
      customerName:
        `${customer.firstName} ${customer.lastName}`.trim() || customer.phone,
      date: dateStr,
      time: timeStr,
    });

    await sendEmail({
      to: customer.email,
      subject,
      html,
    });

    console.log(
      "[Email] Cancellation email sent for appointment:",
      appointmentId
    );
  } catch (error) {
    console.error("[Email] Failed to send cancellation email:", error);
    // Don't throw - email failure should not break main logic
  }
}

/**
 * Send appointment reschedule email if possible
 *
 * Called when an appointment date/time is changed
 *
 * @param appointmentId Appointment ID
 * @param tenantId Tenant ID (for multi-tenant isolation)
 * @param oldDateTime ISO string of old appointment date/time
 * @param newDateTime ISO string of new appointment date/time
 */
export async function sendAppointmentRescheduleIfPossible(
  appointmentId: number,
  tenantId: string,
  oldDateTime: string,
  newDateTime: string
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Email] Database not available");
      return;
    }

    // Load appointment
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.id, appointmentId),
          eq(appointments.tenantId, tenantId)
        )
      );

    if (!appointment) {
      console.warn("[Email] Appointment not found:", appointmentId);
      return;
    }

    // Load customer
    const [customer] = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.id, appointment.customerId),
          eq(customers.tenantId, tenantId)
        )
      );

    if (!customer || !customer.email) {
      console.log("[Email] Customer has no email, skipping reschedule email");
      return;
    }

    // Load tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));

    if (!tenant) {
      console.warn("[Email] Tenant not found:", tenantId);
      return;
    }

    // Load services
    const serviceRows = await db
      .select({
        name: services.name,
      })
      .from(appointmentServices)
      .innerJoin(services, eq(appointmentServices.serviceId, services.id))
      .where(eq(appointmentServices.appointmentId, appointment.id));

    const servicesNames = serviceRows.map(s => s.name);

    // Format old and new dates/times
    const oldDate = new Date(oldDateTime);
    const newDate = new Date(newDateTime);

    const oldDateStr = formatNorwegianDate(oldDate);
    const oldTimeStr = oldDate.toTimeString().slice(0, 5); // HH:MM

    const newDateStr = formatNorwegianDate(newDate);
    const newTimeStr = newDate.toTimeString().slice(0, 5); // HH:MM

    // Render and send email
    const { subject, html } = renderBookingRescheduleEmail({
      salonName: tenant.name,
      customerName:
        `${customer.firstName} ${customer.lastName}`.trim() || customer.phone,
      oldDate: oldDateStr,
      oldTime: oldTimeStr,
      newDate: newDateStr,
      newTime: newTimeStr,
      services: servicesNames.length > 0 ? servicesNames : ["Timebestilling"],
    });

    await sendEmail({
      to: customer.email,
      subject,
      html,
    });

    console.log(
      "[Email] Reschedule email sent for appointment:",
      appointmentId
    );

    // Send SMS if customer has phone number
    if (customer.phone) {
      const { sendRescheduleSMS } = await import("./sms");

      await sendRescheduleSMS(
        customer.phone,
        tenant.name,
        oldDateStr,
        oldTimeStr,
        newDateStr,
        newTimeStr,
        tenantId
      );
      console.log(`[SMS] Reschedule SMS sent for appointment ${appointmentId}`);
    }
  } catch (error) {
    console.error("[Email] Failed to send reschedule email:", error);
    // Don't throw - email failure should not break main logic
  }
}

/**
 * Format date in Norwegian format
 *
 * @param date Date object
 * @returns Formatted string like "25. mars 2026"
 */
function formatNorwegianDate(date: Date): string {
  const months = [
    "januar",
    "februar",
    "mars",
    "april",
    "mai",
    "juni",
    "juli",
    "august",
    "september",
    "oktober",
    "november",
    "desember",
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day}. ${month} ${year}`;
}
