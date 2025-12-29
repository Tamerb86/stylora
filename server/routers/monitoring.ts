/**
 * Monitoring Router
 * 
 * Provides endpoints for monitoring system health, integration status,
 * and performance metrics
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import {
  getUnimicroSyncMetrics,
  checkUnimicroSyncHealth,
  getRecentSyncFailures,
  getSyncStatsByType,
} from '../services/unimicro-monitor';
import {
  getEmailDeliveryMetrics,
  getSMSDeliveryMetrics,
  getIntegrationEndpointMetrics,
} from '../services/performance-monitor';
import { logDb } from '../_core/logger';

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
        const metrics = await getUnimicroSyncMetrics(ctx.user.tenantId, input.hoursAgo);
        return metrics;
      } catch (error) {
        logDb.error('Failed to get Unimicro metrics', { error, tenantId: ctx.user.tenantId });
        throw new Error('Failed to retrieve Unimicro sync metrics');
      }
    }),

  /**
   * Check Unimicro sync health and get alerts
   */
  checkUnimicroHealth: protectedProcedure.query(async ({ ctx }) => {
    try {
      const alerts = await checkUnimicroSyncHealth(ctx.user.tenantId);
      return { alerts };
    } catch (error) {
      logDb.error('Failed to check Unimicro health', { error, tenantId: ctx.user.tenantId });
      throw new Error('Failed to check Unimicro sync health');
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
        const failures = await getRecentSyncFailures(ctx.user.tenantId, input.limit);
        return { failures };
      } catch (error) {
        logDb.error('Failed to get Unimicro failures', { error, tenantId: ctx.user.tenantId });
        throw new Error('Failed to retrieve sync failures');
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
        const stats = await getSyncStatsByType(ctx.user.tenantId, input.hoursAgo);
        return { stats };
      } catch (error) {
        logDb.error('Failed to get Unimicro stats by type', { error, tenantId: ctx.user.tenantId });
        throw new Error('Failed to retrieve sync statistics');
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
        const metrics = await getEmailDeliveryMetrics(ctx.user.tenantId, input.hoursAgo);
        return metrics;
      } catch (error) {
        logDb.error('Failed to get email metrics', { error, tenantId: ctx.user.tenantId });
        throw new Error('Failed to retrieve email delivery metrics');
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
        const metrics = await getSMSDeliveryMetrics(ctx.user.tenantId, input.hoursAgo);
        return metrics;
      } catch (error) {
        logDb.error('Failed to get SMS metrics', { error, tenantId: ctx.user.tenantId });
        throw new Error('Failed to retrieve SMS delivery metrics');
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
        const metrics = await getIntegrationEndpointMetrics(ctx.user.tenantId, input.hoursAgo);
        return metrics;
      } catch (error) {
        logDb.error('Failed to get endpoint metrics', { error, tenantId: ctx.user.tenantId });
        throw new Error('Failed to retrieve endpoint performance metrics');
      }
    }),

  /**
   * Get comprehensive system health overview
   */
  getSystemHealth: protectedProcedure.query(async ({ ctx }) => {
    try {
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
      if (unimicroAlerts.filter(a => a.severity === 'critical').length > 0) healthScore -= 30;
      
      // Deduct points for email issues
      if (emailMetrics.successRate < 90) healthScore -= 15;
      
      // Deduct points for SMS issues
      if (smsMetrics.successRate < 90) healthScore -= 15;
      
      // Deduct points for endpoint issues
      if (endpointMetrics.averageResponseTime > 1000) healthScore -= 10;
      if (endpointMetrics.errorRate > 5) healthScore -= 10;

      const status = healthScore >= 90 ? 'healthy' : healthScore >= 70 ? 'warning' : 'critical';

      return {
        healthScore: Math.max(0, healthScore),
        status,
        timestamp: new Date(),
        components: {
          unimicro: {
            status: unimicroMetrics.successRate >= 80 ? 'healthy' : 'degraded',
            metrics: unimicroMetrics,
            alerts: unimicroAlerts,
          },
          email: {
            status: emailMetrics.successRate >= 90 ? 'healthy' : 'degraded',
            metrics: emailMetrics,
          },
          sms: {
            status: smsMetrics.successRate >= 90 ? 'healthy' : 'degraded',
            metrics: smsMetrics,
          },
          endpoints: {
            status: endpointMetrics.errorRate < 5 ? 'healthy' : 'degraded',
            metrics: endpointMetrics,
          },
        },
      };
    } catch (error) {
      logDb.error('Failed to get system health', { error, tenantId: ctx.user.tenantId });
      throw new Error('Failed to retrieve system health overview');
    }
  }),
});
