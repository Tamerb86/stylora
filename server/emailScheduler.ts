/**
 * Email Notification Scheduler
 * Runs every hour to check for upcoming appointments and send reminder emails
 */

import { getDb } from "./db";
import { appointments, customers, services, users, notifications, tenants } from "../drizzle/schema";
import { eq, and, gte, lte, sql, inArray } from "drizzle-orm";

// Email templates
const EMAIL_TEMPLATES = {
  reminder_24h: {
    subject: (salonName: string) => `Påminnelse: Din time i morgen hos ${salonName}`,
    body: (data: {
      customerName: string;
      salonName: string;
      serviceName: string;
      employeeName: string;
      appointmentDate: string;
      appointmentTime: string;
      salonPhone: string;
    }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .appointment-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
    .detail-row { margin: 10px 0; }
    .label { font-weight: bold; color: #667eea; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🕐 Påminnelse om din time</h1>
    </div>
    <div class="content">
      <p>Hei ${data.customerName},</p>
      <p>Dette er en påminnelse om din time i morgen hos <strong>${data.salonName}</strong>.</p>
      
      <div class="appointment-box">
        <div class="detail-row">
          <span class="label">📅 Dato:</span> ${data.appointmentDate}
        </div>
        <div class="detail-row">
          <span class="label">🕐 Tid:</span> ${data.appointmentTime}
        </div>
        <div class="detail-row">
          <span class="label">✂️ Tjeneste:</span> ${data.serviceName}
        </div>
        <div class="detail-row">
          <span class="label">👤 Frisør:</span> ${data.employeeName}
        </div>
      </div>

      <p>Vi gleder oss til å se deg!</p>
      <p>Hvis du trenger å endre eller avbestille timen, vennligst kontakt oss så snart som mulig på telefon <strong>${data.salonPhone}</strong>.</p>

      <div class="footer">
        <p>Med vennlig hilsen,<br><strong>${data.salonName}</strong></p>
        <p style="font-size: 12px; color: #999;">Dette er en automatisk påminnelse. Ikke svar på denne e-posten.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim(),
  },
  reminder_2h: {
    subject: (salonName: string) => `⏰ Din time starter om 2 timer - ${salonName}`,
    body: (data: {
      customerName: string;
      salonName: string;
      serviceName: string;
      employeeName: string;
      appointmentDate: string;
      appointmentTime: string;
      salonPhone: string;
      salonAddress: string;
    }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .urgent-box { background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f5576c; }
    .appointment-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f5576c; }
    .detail-row { margin: 10px 0; }
    .label { font-weight: bold; color: #f5576c; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Din time starter snart!</h1>
    </div>
    <div class="content">
      <div class="urgent-box">
        <p style="margin: 0; font-size: 18px; font-weight: bold; color: #856404;">
          ⚠️ Din time starter om 2 timer!
        </p>
      </div>

      <p>Hei ${data.customerName},</p>
      <p>Dette er en påminnelse om at din time hos <strong>${data.salonName}</strong> starter om 2 timer.</p>
      
      <div class="appointment-box">
        <div class="detail-row">
          <span class="label">📅 Dato:</span> ${data.appointmentDate}
        </div>
        <div class="detail-row">
          <span class="label">🕐 Tid:</span> ${data.appointmentTime}
        </div>
        <div class="detail-row">
          <span class="label">✂️ Tjeneste:</span> ${data.serviceName}
        </div>
        <div class="detail-row">
          <span class="label">👤 Frisør:</span> ${data.employeeName}
        </div>
        <div class="detail-row">
          <span class="label">📍 Adresse:</span> ${data.salonAddress}
        </div>
      </div>

      <p><strong>Vennligst møt opp 5 minutter før avtalt tid.</strong></p>
      <p>Hvis du ikke kan møte, vennligst kontakt oss umiddelbart på telefon <strong>${data.salonPhone}</strong>.</p>

      <div class="footer">
        <p>Vi ser frem til å se deg!<br><strong>${data.salonName}</strong></p>
        <p style="font-size: 12px; color: #999;">Dette er en automatisk påminnelse. Ikke svar på denne e-posten.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim(),
  },
};

/**
 * Mock email sending function (replace with real email service)
 */
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  // TODO: Replace with real email service (SendGrid, AWS SES, etc.)
  console.log(`[EMAIL] Sending to: ${to}`);
  console.log(`[EMAIL] Subject: ${subject}`);
  console.log(`[EMAIL] Body length: ${html.length} characters`);
  
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Simulate 95% success rate
  return Math.random() > 0.05;
}

/**
 * Check for appointments that need 24-hour reminders
 */
async function send24HourReminders() {
  const db = await getDb();
  if (!db) {
    console.error("[24H REMINDER] Database not available");
    return;
  }
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  console.log(`[24H REMINDER] Checking appointments between ${in24Hours.toISOString()} and ${in25Hours.toISOString()}`);

  // Find appointments scheduled between 24-25 hours from now
  const upcomingAppointments = await db
    .select({
      appointmentId: appointments.id,
      appointmentDate: appointments.appointmentDate,
      startTime: appointments.startTime,
      tenantId: appointments.tenantId,
      customerId: appointments.customerId,
      employeeId: appointments.employeeId,
      customerName: sql<string>`CONCAT(${customers.firstName}, ' ', COALESCE(${customers.lastName}, ''))`.as('customerName'),
      customerEmail: customers.email,
      employeeName: users.name,
      salonName: tenants.name,
      salonPhone: tenants.phone,
      salonAddress: tenants.address,
    })
    .from(appointments)
    .innerJoin(customers, eq(appointments.customerId, customers.id))
    .innerJoin(users, eq(appointments.employeeId, users.id))
    .innerJoin(tenants, eq(appointments.tenantId, tenants.id))
    .where(
      and(
        gte(appointments.appointmentDate, sql`DATE(${in24Hours})`),
        lte(appointments.appointmentDate, sql`DATE(${in25Hours})`),
        eq(appointments.status, "confirmed")
      )
    );

  console.log(`[24H REMINDER] Found ${upcomingAppointments.length} appointments`);

  for (const apt of upcomingAppointments) {
    if (!apt.customerEmail) {
      console.log(`[24H REMINDER] Skipping appointment ${apt.appointmentId} - no customer email`);
      continue;
    }

    // Check if reminder already sent
    const existingNotification = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.tenantId, apt.tenantId),
          eq(notifications.recipientId, apt.customerId),
          eq(notifications.template, "reminder_24h"),
          eq(notifications.status, "sent"),
          gte(notifications.createdAt, sql`DATE_SUB(NOW(), INTERVAL 1 DAY)`)
        )
      )
      .limit(1);

    if (existingNotification.length > 0) {
      console.log(`[24H REMINDER] Skipping appointment ${apt.appointmentId} - reminder already sent`);
      continue;
    }

    // Get service name
    const serviceData = await db
      .select({ name: services.name })
      .from(services)
      .where(eq(services.id, apt.appointmentId))
      .limit(1);

    const serviceName = serviceData[0]?.name || "Tjeneste";

    // Format date and time
    const aptDate = new Date(apt.appointmentDate);
    const formattedDate = aptDate.toLocaleDateString("nb-NO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const emailData = {
      customerName: apt.customerName,
      salonName: apt.salonName,
      serviceName,
      employeeName: apt.employeeName || "Frisør",
      appointmentDate: formattedDate,
      appointmentTime: apt.startTime,
      salonPhone: apt.salonPhone || "Ikke oppgitt",
    };

    const subject = EMAIL_TEMPLATES.reminder_24h.subject(apt.salonName);
    const body = EMAIL_TEMPLATES.reminder_24h.body(emailData);

    // Create notification record
    const [notification] = await db.insert(notifications).values({
      tenantId: apt.tenantId,
      recipientType: "customer",
      recipientId: apt.customerId,
      notificationType: "email",
      template: "reminder_24h",
      recipientContact: apt.customerEmail,
      subject,
      content: body,
      status: "pending",
      scheduledAt: now,
    });

    // Send email
    try {
      const success = await sendEmail(apt.customerEmail, subject, body);
      
      if (success) {
        await db
          .update(notifications)
          .set({
            status: "sent",
            sentAt: new Date(),
            attempts: 1,
          })
          .where(eq(notifications.id, notification.insertId));
        
        console.log(`[24H REMINDER] ✅ Sent to ${apt.customerEmail} for appointment ${apt.appointmentId}`);
      } else {
        throw new Error("Email sending failed");
      }
    } catch (error) {
      await db
        .update(notifications)
        .set({
          status: "failed",
          attempts: 1,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        })
        .where(eq(notifications.id, notification.insertId));
      
      console.error(`[24H REMINDER] ❌ Failed to send to ${apt.customerEmail}:`, error);
    }
  }
}

/**
 * Check for appointments that need 2-hour reminders
 */
async function send2HourReminders() {
  const db = await getDb();
  if (!db) {
    console.error("[2H REMINDER] Database not available");
    return;
  }
  const now = new Date();
  const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const in3Hours = new Date(now.getTime() + 3 * 60 * 60 * 1000);

  console.log(`[2H REMINDER] Checking appointments between ${in2Hours.toISOString()} and ${in3Hours.toISOString()}`);

  // Find appointments scheduled between 2-3 hours from now
  const upcomingAppointments = await db
    .select({
      appointmentId: appointments.id,
      appointmentDate: appointments.appointmentDate,
      startTime: appointments.startTime,
      tenantId: appointments.tenantId,
      customerId: appointments.customerId,
      employeeId: appointments.employeeId,
      customerName: sql<string>`CONCAT(${customers.firstName}, ' ', COALESCE(${customers.lastName}, ''))`.as('customerName'),
      customerEmail: customers.email,
      employeeName: users.name,
      salonName: tenants.name,
      salonPhone: tenants.phone,
      salonAddress: tenants.address,
    })
    .from(appointments)
    .innerJoin(customers, eq(appointments.customerId, customers.id))
    .innerJoin(users, eq(appointments.employeeId, users.id))
    .innerJoin(tenants, eq(appointments.tenantId, tenants.id))
    .where(
      and(
        eq(appointments.appointmentDate, sql`DATE(${now})`),
        eq(appointments.status, "confirmed")
      )
    );

  // Filter by time (2-3 hours from now)
  const filtered = upcomingAppointments.filter((apt: typeof upcomingAppointments[0]) => {
    const [hours, minutes] = apt.startTime.split(":").map(Number);
    const aptDateTime = new Date(apt.appointmentDate);
    aptDateTime.setHours(hours, minutes, 0, 0);
    
    return aptDateTime >= in2Hours && aptDateTime < in3Hours;
  });

  console.log(`[2H REMINDER] Found ${filtered.length} appointments`);

  for (const apt of filtered) {
    if (!apt.customerEmail) {
      console.log(`[2H REMINDER] Skipping appointment ${apt.appointmentId} - no customer email`);
      continue;
    }

    // Check if reminder already sent
    const existingNotification = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.tenantId, apt.tenantId),
          eq(notifications.recipientId, apt.customerId),
          eq(notifications.template, "reminder_2h"),
          eq(notifications.status, "sent"),
          gte(notifications.createdAt, sql`DATE_SUB(NOW(), INTERVAL 4 HOUR)`)
        )
      )
      .limit(1);

    if (existingNotification.length > 0) {
      console.log(`[2H REMINDER] Skipping appointment ${apt.appointmentId} - reminder already sent`);
      continue;
    }

    // Get service name
    const serviceData = await db
      .select({ name: services.name })
      .from(services)
      .where(eq(services.id, apt.appointmentId))
      .limit(1);

    const serviceName = serviceData[0]?.name || "Tjeneste";

    // Format date and time
    const aptDate = new Date(apt.appointmentDate);
    const formattedDate = aptDate.toLocaleDateString("nb-NO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const emailData = {
      customerName: apt.customerName,
      salonName: apt.salonName,
      serviceName,
      employeeName: apt.employeeName || "Frisør",
      appointmentDate: formattedDate,
      appointmentTime: apt.startTime,
      salonPhone: apt.salonPhone || "Ikke oppgitt",
      salonAddress: apt.salonAddress || "Ikke oppgitt",
    };

    const subject = EMAIL_TEMPLATES.reminder_2h.subject(apt.salonName);
    const body = EMAIL_TEMPLATES.reminder_2h.body(emailData);

    // Create notification record
    const [notification] = await db.insert(notifications).values({
      tenantId: apt.tenantId,
      recipientType: "customer",
      recipientId: apt.customerId,
      notificationType: "email",
      template: "reminder_2h",
      recipientContact: apt.customerEmail,
      subject,
      content: body,
      status: "pending",
      scheduledAt: now,
    });

    // Send email
    try {
      const success = await sendEmail(apt.customerEmail, subject, body);
      
      if (success) {
        await db
          .update(notifications)
          .set({
            status: "sent",
            sentAt: new Date(),
            attempts: 1,
          })
          .where(eq(notifications.id, notification.insertId));
        
        console.log(`[2H REMINDER] ✅ Sent to ${apt.customerEmail} for appointment ${apt.appointmentId}`);
      } else {
        throw new Error("Email sending failed");
      }
    } catch (error) {
      await db
        .update(notifications)
        .set({
          status: "failed",
          attempts: 1,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        })
        .where(eq(notifications.id, notification.insertId));
      
      console.error(`[2H REMINDER] ❌ Failed to send to ${apt.customerEmail}:`, error);
    }
  }
}

/**
 * Retry failed notifications
 */
async function retryFailedNotifications() {
  const db = await getDb();
  if (!db) {
    console.error("[RETRY] Database not available");
    return;
  }
  const failedNotifications = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.status, "failed"),
        sql`${notifications.attempts} < ${notifications.maxAttempts}`
      )
    )
    .limit(50);

  console.log(`[RETRY] Found ${failedNotifications.length} failed notifications to retry`);

  for (const notif of failedNotifications) {
    if (notif.notificationType !== "email" || !notif.subject || !notif.content) {
      continue;
    }

    try {
      const success = await sendEmail(notif.recipientContact, notif.subject, notif.content);
      
      if (success) {
        await db
          .update(notifications)
          .set({
            status: "sent",
            sentAt: new Date(),
            attempts: (notif.attempts || 0) + 1,
            errorMessage: null,
          })
          .where(eq(notifications.id, notif.id));
        
        console.log(`[RETRY] ✅ Successfully sent notification ${notif.id}`);
      } else {
        throw new Error("Email sending failed");
      }
    } catch (error) {
      await db
        .update(notifications)
        .set({
          attempts: (notif.attempts || 0) + 1,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        })
        .where(eq(notifications.id, notif.id));
      
      console.error(`[RETRY] ❌ Failed to send notification ${notif.id}:`, error);
    }
  }
}

/**
 * Main scheduler function - runs every hour
 */
export async function runEmailScheduler() {
  console.log(`\n========================================`);
  console.log(`[SCHEDULER] Running at ${new Date().toISOString()}`);
  console.log(`========================================\n`);

  try {
    await send24HourReminders();
    await send2HourReminders();
    await retryFailedNotifications();
    
    console.log(`\n[SCHEDULER] ✅ Completed successfully\n`);
  } catch (error) {
    console.error(`\n[SCHEDULER] ❌ Error:`, error);
  }
}

// Start scheduler (runs every hour)
let schedulerInterval: NodeJS.Timeout | null = null;

export function startEmailScheduler() {
  if (schedulerInterval) {
    console.log("[SCHEDULER] Already running");
    return;
  }

  console.log("[SCHEDULER] Starting email notification scheduler (runs every hour)");
  
  // Run immediately on start
  runEmailScheduler();
  
  // Then run every hour
  schedulerInterval = setInterval(runEmailScheduler, 60 * 60 * 1000);
}

export function stopEmailScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[SCHEDULER] Stopped");
  }
}
