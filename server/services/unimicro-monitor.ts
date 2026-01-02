/**
 * Unimicro Sync Monitoring Service
 *
 * Provides comprehensive monitoring and alerting for Unimicro integration
 * - Real-time sync status tracking
 * - Error detection and logging
 * - Performance metrics
 * - Automated alerts for failures
 */

import { getDb } from "../db";
import { logSecurity, logDb } from "../_core/logger";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { unimicroSyncLog } from "../../drizzle/schema";

export interface SyncMetrics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  successRate: number;
  averageDuration: number;
  lastSyncTime: Date | null;
  lastSyncStatus: string | null;
}

export interface SyncAlert {
  severity: "info" | "warning" | "error" | "critical";
  message: string;
  timestamp: Date;
  tenantId: string;
  syncLogId?: number;
  details?: any;
}

/**
 * Get sync metrics for a tenant within a time period
 */
export async function getUnimicroSyncMetrics(
  tenantId: string,
  hoursAgo: number = 24
): Promise<SyncMetrics> {
  try {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");
    const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

    // Get all sync logs for the period
    const syncLogs = await dbInstance
      .select()
      .from(unimicroSyncLog)
      .where(
        and(
          eq(unimicroSyncLog.tenantId, tenantId),
          gte(unimicroSyncLog.syncStartedAt, cutoffTime)
        )
      )
      .orderBy(desc(unimicroSyncLog.syncStartedAt));

    if (syncLogs.length === 0) {
      return {
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        successRate: 0,
        averageDuration: 0,
        lastSyncTime: null,
        lastSyncStatus: null,
      };
    }

    const successfulSyncs = syncLogs.filter(
      log => log.status === "success"
    ).length;
    const failedSyncs = syncLogs.filter(log => log.status === "failed").length;

    // Calculate average duration (only for completed syncs)
    const completedSyncs = syncLogs.filter(
      log => log.syncCompletedAt && log.syncStartedAt
    );
    const totalDuration = completedSyncs.reduce((sum, log) => {
      if (log.syncCompletedAt && log.syncStartedAt) {
        return (
          sum + (log.syncCompletedAt.getTime() - log.syncStartedAt.getTime())
        );
      }
      return sum;
    }, 0);
    const averageDuration =
      completedSyncs.length > 0
        ? totalDuration / completedSyncs.length / 1000 // Convert to seconds
        : 0;

    const lastSync = syncLogs[0];

    return {
      totalSyncs: syncLogs.length,
      successfulSyncs,
      failedSyncs,
      successRate:
        syncLogs.length > 0 ? (successfulSyncs / syncLogs.length) * 100 : 0,
      averageDuration: Math.round(averageDuration * 100) / 100,
      lastSyncTime: lastSync.syncStartedAt,
      lastSyncStatus: lastSync.status,
    };
  } catch (error) {
    logDb.error("Failed to get Unimicro sync metrics", {
      error,
      tenantId,
      hoursAgo,
    });
    throw error;
  }
}

/**
 * Check for sync failures and generate alerts
 */
export async function checkUnimicroSyncHealth(
  tenantId: string
): Promise<SyncAlert[]> {
  const alerts: SyncAlert[] = [];

  try {
    const metrics = await getUnimicroSyncMetrics(tenantId, 24);

    // Alert: No syncs in last 24 hours
    if (metrics.totalSyncs === 0) {
      alerts.push({
        severity: "warning",
        message: "No Unimicro syncs detected in the last 24 hours",
        timestamp: new Date(),
        tenantId,
        details: { metrics },
      });
    }

    // Alert: Success rate below 80%
    if (metrics.successRate < 80 && metrics.totalSyncs > 0) {
      alerts.push({
        severity: "error",
        message: `Unimicro sync success rate is low: ${metrics.successRate.toFixed(1)}%`,
        timestamp: new Date(),
        tenantId,
        details: { metrics },
      });
    }

    // Alert: Last sync failed
    if (metrics.lastSyncStatus === "failed") {
      alerts.push({
        severity: "error",
        message: "Last Unimicro sync failed",
        timestamp: new Date(),
        tenantId,
        details: {
          lastSyncTime: metrics.lastSyncTime,
          metrics,
        },
      });
    }

    // Alert: Multiple consecutive failures
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");
    const recentSyncs = await dbInstance
      .select()
      .from(unimicroSyncLog)
      .where(eq(unimicroSyncLog.tenantId, tenantId))
      .orderBy(desc(unimicroSyncLog.syncStartedAt))
      .limit(5);

    const consecutiveFailures = recentSyncs.filter(
      log => log.status === "failed"
    ).length;
    if (consecutiveFailures >= 3) {
      alerts.push({
        severity: "critical",
        message: `${consecutiveFailures} consecutive Unimicro sync failures detected`,
        timestamp: new Date(),
        tenantId,
        details: {
          consecutiveFailures,
          recentSyncs: recentSyncs.map(s => ({
            id: s.id,
            status: s.status,
            startedAt: s.syncStartedAt,
            error: s.errorMessage,
          })),
        },
      });
    }

    // Alert: Average sync duration too high (>60 seconds)
    if (metrics.averageDuration > 60) {
      alerts.push({
        severity: "warning",
        message: `Unimicro sync duration is high: ${metrics.averageDuration.toFixed(1)}s average`,
        timestamp: new Date(),
        tenantId,
        details: { metrics },
      });
    }

    // Log alerts
    if (alerts.length > 0) {
      logSecurity.warn("Unimicro sync health alerts generated", {
        tenantId,
        alertCount: alerts.length,
        alerts: alerts.map(a => ({ severity: a.severity, message: a.message })),
      });
    }

    return alerts;
  } catch (error) {
    logDb.error(
      "Failed to check Unimicro sync health",
      error instanceof Error ? error : new Error(String(error))
    );
    return [
      {
        severity: "error",
        message: "Failed to check Unimicro sync health",
        timestamp: new Date(),
        tenantId,
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      },
    ];
  }
}

/**
 * Get recent sync failures with details
 */
export async function getRecentSyncFailures(
  tenantId: string,
  limit: number = 10
): Promise<any[]> {
  try {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");

    const failures = await dbInstance
      .select()
      .from(unimicroSyncLog)
      .where(
        and(
          eq(unimicroSyncLog.tenantId, tenantId),
          eq(unimicroSyncLog.status, "failed")
        )
      )
      .orderBy(desc(unimicroSyncLog.syncStartedAt))
      .limit(limit);

    return failures.map(failure => ({
      id: failure.id,
      startedAt: failure.syncStartedAt,
      completedAt: failure.syncCompletedAt,
      syncType: failure.syncType,
      errorMessage: failure.errorMessage,
      errorDetails: failure.errorDetails,
      recordsSynced: failure.recordsSynced,
    }));
  } catch (error) {
    logDb.error("Failed to get recent sync failures", {
      error,
      tenantId,
      limit,
    });
    throw error;
  }
}

/**
 * Get sync statistics by type (invoices, customers, products, etc.)
 */
export async function getSyncStatsByType(
  tenantId: string,
  hoursAgo: number = 24
): Promise<Record<string, SyncMetrics>> {
  try {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");
    const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

    const syncLogs = await dbInstance
      .select()
      .from(unimicroSyncLog)
      .where(
        and(
          eq(unimicroSyncLog.tenantId, tenantId),
          gte(unimicroSyncLog.syncStartedAt, cutoffTime)
        )
      );

    // Group by sync type
    const statsByType: Record<string, any[]> = {};
    syncLogs.forEach(log => {
      const type = log.syncType || "unknown";
      if (!statsByType[type]) {
        statsByType[type] = [];
      }
      statsByType[type].push(log);
    });

    // Calculate metrics for each type
    const result: Record<string, SyncMetrics> = {};
    for (const [type, logs] of Object.entries(statsByType)) {
      const successfulSyncs = logs.filter(
        log => log.status === "success"
      ).length;
      const failedSyncs = logs.filter(log => log.status === "failed").length;

      const completedSyncs = logs.filter(
        log => log.syncCompletedAt && log.syncStartedAt
      );
      const totalDuration = completedSyncs.reduce((sum, log) => {
        if (log.syncCompletedAt && log.syncStartedAt) {
          return (
            sum + (log.syncCompletedAt.getTime() - log.syncStartedAt.getTime())
          );
        }
        return sum;
      }, 0);
      const averageDuration =
        completedSyncs.length > 0
          ? totalDuration / completedSyncs.length / 1000
          : 0;

      const lastSync = logs.sort(
        (a, b) => b.syncStartedAt.getTime() - a.syncStartedAt.getTime()
      )[0];

      result[type] = {
        totalSyncs: logs.length,
        successfulSyncs,
        failedSyncs,
        successRate:
          logs.length > 0 ? (successfulSyncs / logs.length) * 100 : 0,
        averageDuration: Math.round(averageDuration * 100) / 100,
        lastSyncTime: lastSync.syncStartedAt,
        lastSyncStatus: lastSync.status,
      };
    }

    return result;
  } catch (error) {
    logDb.error("Failed to get sync stats by type", {
      error,
      tenantId,
      hoursAgo,
    });
    throw error;
  }
}

/**
 * Monitor sync performance and log warnings
 */
export async function monitorSyncPerformance(tenantId: string): Promise<void> {
  try {
    const metrics = await getUnimicroSyncMetrics(tenantId, 24);
    const alerts = await checkUnimicroSyncHealth(tenantId);

    // Log performance summary
    logDb.info("Unimicro sync performance summary", {
      tenantId,
      metrics,
      alertCount: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === "critical").length,
    });

    // Log critical alerts separately
    const criticalAlerts = alerts.filter(a => a.severity === "critical");
    if (criticalAlerts.length > 0) {
      logSecurity.error("Critical Unimicro sync alerts", {
        tenantId,
        alerts: criticalAlerts,
      });
    }
  } catch (error) {
    logDb.error("Failed to monitor sync performance", { error, tenantId });
  }
}

/**
 * Schedule periodic monitoring (call this from a cron job or scheduler)
 */
export async function scheduleUnimicroMonitoring(): Promise<void> {
  try {
    // Get all tenants with Unimicro enabled
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");

    // This would need to query tenants with Unimicro settings
    // For now, we'll log that monitoring is scheduled
    console.log("Unimicro monitoring scheduled", new Date());

    // TODO: Implement tenant query and monitoring loop
    // const tenants = await getTenantsWithUnimicro();
    // for (const tenant of tenants) {
    //   await monitorSyncPerformance(tenant.id);
    // }
  } catch (error) {
    logDb.error(
      "Failed to schedule Unimicro monitoring",
      error instanceof Error ? error : new Error(String(error))
    );
  }
}
