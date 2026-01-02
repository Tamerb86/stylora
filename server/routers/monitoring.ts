/**
 * Monitoring Router
 *
 * Provides endpoints for monitoring system health, integration status,
 * and performance metrics
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getUnimicroSyncMetrics,
  checkUnimicroSyncHealth,
  getRecentSyncFailures,
  getSyncStatsByType,
} from "../services/unimicro-monitor";
import {
  getEmailDeliveryMetrics,
  getSMSDeliveryMetrics,
  getIntegrationEndpointMetrics,
} from "../services/performance-monitor";
import { logDb } from "../_core/logger";
import {
  sendMonitoringAlert,
  alertUnimicroFailure,
  alertLowEmailDeliveryRate,
  alertLowSMSDeliveryRate,
  alertSystemHealthDegraded,
} from "../services/monitoring-alerts";
import { monitoringCache } from "../services/monitoring-cache";

export const monitoringRouter = router({
  /**
   * Get Unimicro sync metrics
   */
  getUnimicroMetrics: protectedProcedure
    .input(
      z.object({
        hoursAgo: z.number().min(1).max(168).default(24), // Max 7 days
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const metrics = await monitoringCache.getOrCompute(
          ctx.user.tenantId,
          "unimicroMetrics",
          () => getUnimicroSyncMetrics(ctx.user.tenantId, input.hoursAgo),
          { hoursAgo: input.hoursAgo }
        );
        return metrics;
      } catch (error) {
        logDb.error("Failed to get Unimicro metrics", {
          error,
          tenantId: ctx.user.tenantId,
        });
        throw new Error("Failed to retrieve Unimicro sync metrics");
      }
    }),

  /**
   * Check Unimicro sync health and get alerts
   */
  checkUnimicroHealth: protectedProcedure.query(async ({ ctx }) => {
    try {
      const alerts = await monitoringCache.getOrCompute(
        ctx.user.tenantId,
        "unimicroHealth",
        () => checkUnimicroSyncHealth(ctx.user.tenantId)
      );
      return { alerts };
    } catch (error) {
      logDb.error("Failed to check Unimicro health", {
        error,
        tenantId: ctx.user.tenantId,
      });
      throw new Error("Failed to check Unimicro sync health");
    }
  }),

  /**
   * Get recent Unimicro sync failures
   */
  getUnimicroFailures: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const failures = await monitoringCache.getOrCompute(
          ctx.user.tenantId,
          "unimicroFailures",
          () => getRecentSyncFailures(ctx.user.tenantId, input.limit),
          { limit: input.limit }
        );
        return { failures };
      } catch (error) {
        logDb.error("Failed to get Unimicro failures", {
          error,
          tenantId: ctx.user.tenantId,
        });
        throw new Error("Failed to retrieve sync failures");
      }
    }),

  /**
   * Get Unimicro sync statistics by type
   */
  getUnimicroStatsByType: protectedProcedure
    .input(
      z.object({
        hoursAgo: z.number().min(1).max(168).default(24),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const stats = await monitoringCache.getOrCompute(
          ctx.user.tenantId,
          "unimicroStats",
          () => getSyncStatsByType(ctx.user.tenantId, input.hoursAgo),
          { hoursAgo: input.hoursAgo }
        );
        return { stats };
      } catch (error) {
        logDb.error("Failed to get Unimicro stats by type", {
          error,
          tenantId: ctx.user.tenantId,
        });
        throw new Error("Failed to retrieve sync statistics");
      }
    }),

  /**
   * Get email delivery metrics
   */
  getEmailMetrics: protectedProcedure
    .input(
      z.object({
        hoursAgo: z.number().min(1).max(168).default(24),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const metrics = await monitoringCache.getOrCompute(
          ctx.user.tenantId,
          "emailMetrics",
          () => getEmailDeliveryMetrics(ctx.user.tenantId, input.hoursAgo),
          { hoursAgo: input.hoursAgo }
        );
        return metrics;
      } catch (error) {
        logDb.error("Failed to get email metrics", {
          error,
          tenantId: ctx.user.tenantId,
        });
        throw new Error("Failed to retrieve email delivery metrics");
      }
    }),

  /**
   * Get SMS delivery metrics
   */
  getSMSMetrics: protectedProcedure
    .input(
      z.object({
        hoursAgo: z.number().min(1).max(168).default(24),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const metrics = await monitoringCache.getOrCompute(
          ctx.user.tenantId,
          "smsMetrics",
          () => getSMSDeliveryMetrics(ctx.user.tenantId, input.hoursAgo),
          { hoursAgo: input.hoursAgo }
        );
        return metrics;
      } catch (error) {
        logDb.error("Failed to get SMS metrics", {
          error,
          tenantId: ctx.user.tenantId,
        });
        throw new Error("Failed to retrieve SMS delivery metrics");
      }
    }),

  /**
   * Get integration endpoint performance metrics
   */
  getEndpointMetrics: protectedProcedure
    .input(
      z.object({
        hoursAgo: z.number().min(1).max(168).default(24),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const metrics = await monitoringCache.getOrCompute(
          ctx.user.tenantId,
          "endpointMetrics",
          () =>
            getIntegrationEndpointMetrics(ctx.user.tenantId, input.hoursAgo),
          { hoursAgo: input.hoursAgo }
        );
        return metrics;
      } catch (error) {
        logDb.error("Failed to get endpoint metrics", {
          error,
          tenantId: ctx.user.tenantId,
        });
        throw new Error("Failed to retrieve endpoint performance metrics");
      }
    }),

  /**
   * Get comprehensive system health overview
   */
  getSystemHealth: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await monitoringCache.getOrCompute(
        ctx.user.tenantId,
        "systemHealth",
        async () => {
          const [
            unimicroMetrics,
            unimicroAlerts,
            emailMetrics,
            smsMetrics,
            endpointMetrics,
          ] = await Promise.all([
            getUnimicroSyncMetrics(ctx.user.tenantId, 24),
            checkUnimicroSyncHealth(ctx.user.tenantId),
            getEmailDeliveryMetrics(ctx.user.tenantId, 24),
            getSMSDeliveryMetrics(ctx.user.tenantId, 24),
            getIntegrationEndpointMetrics(ctx.user.tenantId, 24),
          ]);

          // Calculate overall health score (0-100)
          let healthScore = 100;

          // Deduct points for Unimicro issues
          if (unimicroMetrics.successRate < 80) healthScore -= 20;
          if (unimicroAlerts.filter(a => a.severity === "critical").length > 0)
            healthScore -= 30;

          // Deduct points for email issues
          if (emailMetrics.successRate < 90) healthScore -= 15;

          // Deduct points for SMS issues
          if (smsMetrics.successRate < 90) healthScore -= 15;

          // Deduct points for endpoint issues
          if (endpointMetrics.averageResponseTime > 1000) healthScore -= 10;
          if (endpointMetrics.errorRate > 5) healthScore -= 10;

          const status =
            healthScore >= 90
              ? "healthy"
              : healthScore >= 70
                ? "warning"
                : "critical";

          return {
            healthScore: Math.max(0, healthScore),
            status,
            timestamp: new Date(),
            components: {
              unimicro: {
                status:
                  unimicroMetrics.successRate >= 80 ? "healthy" : "degraded",
                metrics: unimicroMetrics,
                alerts: unimicroAlerts,
              },
              email: {
                status: emailMetrics.successRate >= 90 ? "healthy" : "degraded",
                metrics: emailMetrics,
              },
              sms: {
                status: smsMetrics.successRate >= 90 ? "healthy" : "degraded",
                metrics: smsMetrics,
              },
              endpoints: {
                status: endpointMetrics.errorRate < 5 ? "healthy" : "degraded",
                metrics: endpointMetrics,
              },
            },
          };
        }
      );
    } catch (error) {
      logDb.error("Failed to get system health", {
        error,
        tenantId: ctx.user.tenantId,
      });
      throw new Error("Failed to retrieve system health overview");
    }
  }),

  /**
   * Send test monitoring alert
   */
  sendTestAlert: protectedProcedure
    .input(
      z.object({
        severity: z.enum(["critical", "error", "warning", "info"]),
        recipientEmail: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const success = await sendMonitoringAlert(
          ctx.user.tenantId,
          {
            severity: input.severity,
            component: "Test System",
            title: "Test Monitoring Alert",
            message:
              "Dette er en test-varsling fra systemovervåkingen. Hvis du mottar denne e-posten, fungerer varslingssystemet som det skal.",
            details: {
              "Test tidspunkt": new Date().toLocaleString("no-NO"),
              Bruker: ctx.user.email,
            },
            timestamp: new Date(),
          },
          input.recipientEmail
        );

        return { success };
      } catch (error) {
        logDb.error("Failed to send test alert", {
          error,
          tenantId: ctx.user.tenantId,
        });
        throw new Error("Failed to send test monitoring alert");
      }
    }),

  /**
   * Check and send alerts for current system state
   */
  checkAndSendAlerts: protectedProcedure
    .input(
      z.object({
        recipientEmail: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const alertsSent = [];

        // Check Unimicro sync health
        const unimicroMetrics = await getUnimicroSyncMetrics(
          ctx.user.tenantId,
          24
        );
        if (
          unimicroMetrics.failedCount >= 3 &&
          unimicroMetrics.successRate < 80
        ) {
          const sent = await alertUnimicroFailure(
            ctx.user.tenantId,
            input.recipientEmail,
            unimicroMetrics.failedCount,
            "Multiple sync failures detected"
          );
          if (sent) alertsSent.push("unimicro_failure");
        }

        // Check email delivery rate
        const emailMetrics = await getEmailDeliveryMetrics(
          ctx.user.tenantId,
          24
        );
        if (emailMetrics.successRate < 80 && emailMetrics.totalSent > 10) {
          const sent = await alertLowEmailDeliveryRate(
            ctx.user.tenantId,
            input.recipientEmail,
            emailMetrics.successRate,
            emailMetrics.totalSent,
            emailMetrics.failedCount
          );
          if (sent) alertsSent.push("email_delivery");
        }

        // Check SMS delivery rate
        const smsMetrics = await getSMSDeliveryMetrics(ctx.user.tenantId, 24);
        if (smsMetrics.successRate < 80 && smsMetrics.totalSent > 10) {
          const sent = await alertLowSMSDeliveryRate(
            ctx.user.tenantId,
            input.recipientEmail,
            smsMetrics.successRate,
            smsMetrics.totalSent,
            smsMetrics.failedCount
          );
          if (sent) alertsSent.push("sms_delivery");
        }

        // Check overall system health
        const systemHealth = await monitoringRouter
          .createCaller(ctx)
          .getSystemHealth();
        if (systemHealth.healthScore < 70) {
          const issues = [];
          if (systemHealth.components.unimicro.status === "degraded")
            issues.push("Unimicro");
          if (systemHealth.components.email.status === "degraded")
            issues.push("E-post");
          if (systemHealth.components.sms.status === "degraded")
            issues.push("SMS");
          if (systemHealth.components.endpoints.status === "degraded")
            issues.push("API");

          const sent = await alertSystemHealthDegraded(
            ctx.user.tenantId,
            input.recipientEmail,
            systemHealth.healthScore,
            issues
          );
          if (sent) alertsSent.push("system_health");
        }

        return {
          alertsSent,
          totalAlerts: alertsSent.length,
        };
      } catch (error) {
        logDb.error("Failed to check and send alerts", {
          error,
          tenantId: ctx.user.tenantId,
        });
        throw new Error("Failed to check and send monitoring alerts");
      }
    }),
});
