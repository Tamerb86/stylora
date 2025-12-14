import * as db from "./db";
import { sql } from "drizzle-orm";

/**
 * Auto Clock-Out Scheduler
 * Automatically clocks out all employees at the configured end-of-shift time
 */

let schedulerInterval: NodeJS.Timeout | null = null;

export async function startAutoClockOutScheduler() {
  // Run every minute to check if it's time to auto clock-out
  schedulerInterval = setInterval(async () => {
    try {
      await checkAndAutoClockOut();
    } catch (error) {
      console.error("[AutoClockOut] Error:", error);
    }
  }, 60 * 1000); // Check every minute

  console.log("[AutoClockOut] Scheduler started");
}

export function stopAutoClockOutScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[AutoClockOut] Scheduler stopped");
  }
}

async function checkAndAutoClockOut() {
  const dbInstance = await db.getDb();
  if (!dbInstance) return;

  const { salonSettings, timesheets } = await import("../drizzle/schema");

  // Get all tenants with their auto clock-out time
  const settings = await dbInstance
    .select({
      tenantId: salonSettings.tenantId,
      autoClockOutTime: salonSettings.autoClockOutTime,
    })
    .from(salonSettings);

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  for (const setting of settings) {
    if (!setting.autoClockOutTime) continue;

    // Check if current time matches auto clock-out time (within 1 minute window)
    const autoTime = setting.autoClockOutTime;
    
    // Compare times (format: "HH:MM")
    if (currentTime === autoTime.substring(0, 5)) {
      // Auto clock-out all employees for this tenant
      const result = await dbInstance.execute(
        sql`UPDATE timesheets 
            SET clockOut = NOW(),
                totalHours = TIMESTAMPDIFF(SECOND, clockIn, NOW()) / 3600
            WHERE tenantId = ${setting.tenantId} 
            AND clockOut IS NULL`
      );

      const affectedRows = (result as any).rowsAffected || 0;
      
      if (affectedRows > 0) {
        console.log(`[AutoClockOut] Clocked out ${affectedRows} employees for tenant ${setting.tenantId} at ${currentTime}`);
      }
    }
  }
}
