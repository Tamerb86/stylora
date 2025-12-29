/**
 * Performance Monitoring Service
 * 
 * Tracks performance metrics for:
 * - Email delivery (AWS SES + SMTP)
 * - SMS delivery (PSWinCom, LinkMobility, Twilio)
 * - Integration API endpoints (response times, error rates)
 */

import { getDb } from '../db';
import { logDb, logPayment } from '../_core/logger';
import { eq, and, gte, desc, sql } from 'drizzle-orm';
import { notifications } from '../../drizzle/schema';

export interface DeliveryMetrics {
  totalSent: number;
  successful: number;
  failed: number;
  pending: number;
  successRate: number;
  averageDeliveryTime: number; // in seconds
  lastDeliveryTime: Date | null;
}

export interface EndpointMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRate: number;
  averageResponseTime: number; // in milliseconds
  p95ResponseTime: number;
  p99ResponseTime: number;
  slowestEndpoint: string | null;
}

/**
 * Get email delivery metrics
 */
export async function getEmailDeliveryMetrics(
  tenantId: string,
  hoursAgo: number = 24
): Promise<DeliveryMetrics> {
  try {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error('Database not available');
    const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

    const emailNotifications = await dbInstance
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.tenantId, tenantId),
          eq(notifications.notificationType, 'email'),
          gte(notifications.createdAt, cutoffTime)
        )
      )
      .orderBy(desc(notifications.createdAt));

    if (emailNotifications.length === 0) {
      return {
        totalSent: 0,
        successful: 0,
        failed: 0,
        pending: 0,
        successRate: 0,
        averageDeliveryTime: 0,
        lastDeliveryTime: null,
      };
    }

    const successful = emailNotifications.filter(n => n.status === 'sent').length;
    const failed = emailNotifications.filter(n => n.status === 'failed').length;
    const pending = emailNotifications.filter(n => n.status === 'pending').length;

    // Calculate average delivery time (from created to sent)
    const deliveredEmails = emailNotifications.filter(
      n => n.status === 'sent' && n.sentAt && n.createdAt
    );
    const totalDeliveryTime = deliveredEmails.reduce((sum, n) => {
      if (n.sentAt && n.createdAt) {
        return sum + (n.sentAt.getTime() - n.createdAt.getTime());
      }
      return sum;
    }, 0);
    const averageDeliveryTime = deliveredEmails.length > 0
      ? totalDeliveryTime / deliveredEmails.length / 1000 // Convert to seconds
      : 0;

    const lastDelivery = emailNotifications.find(n => n.sentAt);

    return {
      totalSent: emailNotifications.length,
      successful,
      failed,
      pending,
      successRate: emailNotifications.length > 0 ? (successful / emailNotifications.length) * 100 : 0,
      averageDeliveryTime: Math.round(averageDeliveryTime * 100) / 100,
      lastDeliveryTime: lastDelivery?.sentAt || null,
    };
  } catch (error) {
    logDb.error('Failed to get email delivery metrics', { error, tenantId, hoursAgo });
    throw error;
  }
}

/**
 * Get SMS delivery metrics
 */
export async function getSMSDeliveryMetrics(
  tenantId: string,
  hoursAgo: number = 24
): Promise<DeliveryMetrics> {
  try {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error('Database not available');
    const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

    const smsNotifications = await dbInstance
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.tenantId, tenantId),
          eq(notifications.notificationType, 'sms'),
          gte(notifications.createdAt, cutoffTime)
        )
      )
      .orderBy(desc(notifications.createdAt));

    if (smsNotifications.length === 0) {
      return {
        totalSent: 0,
        successful: 0,
        failed: 0,
        pending: 0,
        successRate: 0,
        averageDeliveryTime: 0,
        lastDeliveryTime: null,
      };
    }

    const successful = smsNotifications.filter(n => n.status === 'sent').length;
    const failed = smsNotifications.filter(n => n.status === 'failed').length;
    const pending = smsNotifications.filter(n => n.status === 'pending').length;

    // Calculate average delivery time
    const deliveredSMS = smsNotifications.filter(
      n => n.status === 'sent' && n.sentAt && n.createdAt
    );
    const totalDeliveryTime = deliveredSMS.reduce((sum, n) => {
      if (n.sentAt && n.createdAt) {
        return sum + (n.sentAt.getTime() - n.createdAt.getTime());
      }
      return sum;
    }, 0);
    const averageDeliveryTime = deliveredSMS.length > 0
      ? totalDeliveryTime / deliveredSMS.length / 1000
      : 0;

    const lastDelivery = smsNotifications.find(n => n.sentAt);

    return {
      totalSent: smsNotifications.length,
      successful,
      failed,
      pending,
      successRate: smsNotifications.length > 0 ? (successful / smsNotifications.length) * 100 : 0,
      averageDeliveryTime: Math.round(averageDeliveryTime * 100) / 100,
      lastDeliveryTime: lastDelivery?.sentAt || null,
    };
  } catch (error) {
    logDb.error('Failed to get SMS delivery metrics', { error, tenantId, hoursAgo });
    throw error;
  }
}

/**
 * Get integration endpoint performance metrics
 * 
 * Note: This requires implementing request logging middleware
 * For now, we'll return mock data structure
 */
export async function getIntegrationEndpointMetrics(
  tenantId: string,
  hoursAgo: number = 24
): Promise<EndpointMetrics> {
  try {
    // TODO: Implement actual endpoint metrics collection
    // This would require:
    // 1. Request logging middleware
    // 2. Performance tracking table
    // 3. Response time measurement
    
    logDb.info('Getting endpoint metrics (placeholder)', { tenantId, hoursAgo });

    // Return placeholder metrics for now
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      errorRate: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      slowestEndpoint: null,
    };
  } catch (error) {
    logDb.error('Failed to get endpoint metrics', { error, tenantId, hoursAgo });
    throw error;
  }
}

/**
 * Get delivery metrics by provider (for SMS)
 */
export async function getSMSMetricsByProvider(
  tenantId: string,
  hoursAgo: number = 24
): Promise<Record<string, DeliveryMetrics>> {
  try {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error('Database not available');
    const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

    const smsNotifications = await dbInstance
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.tenantId, tenantId),
          eq(notifications.notificationType, 'sms'),
          gte(notifications.createdAt, cutoffTime)
        )
      );

    // Group by provider (extracted from metadata)
    const byProvider: Record<string, any[]> = {};
    smsNotifications.forEach(notification => {
      // Assuming provider is stored in metadata
      const provider = (notification.metadata as any)?.provider || 'unknown';
      if (!byProvider[provider]) {
        byProvider[provider] = [];
      }
      byProvider[provider].push(notification);
    });

    // Calculate metrics for each provider
    const result: Record<string, DeliveryMetrics> = {};
    for (const [provider, notifications] of Object.entries(byProvider)) {
      const successful = notifications.filter(n => n.status === 'sent').length;
      const failed = notifications.filter(n => n.status === 'failed').length;
      const pending = notifications.filter(n => n.status === 'pending').length;

      const deliveredSMS = notifications.filter(
        n => n.status === 'sent' && n.sentAt && n.createdAt
      );
      const totalDeliveryTime = deliveredSMS.reduce((sum, n) => {
        if (n.sentAt && n.createdAt) {
          return sum + (n.sentAt.getTime() - n.createdAt.getTime());
        }
        return sum;
      }, 0);
      const averageDeliveryTime = deliveredSMS.length > 0
        ? totalDeliveryTime / deliveredSMS.length / 1000
        : 0;

      const lastDelivery = notifications
        .filter(n => n.sentAt)
        .sort((a, b) => (b.sentAt?.getTime() || 0) - (a.sentAt?.getTime() || 0))[0];

      result[provider] = {
        totalSent: notifications.length,
        successful,
        failed,
        pending,
        successRate: notifications.length > 0 ? (successful / notifications.length) * 100 : 0,
        averageDeliveryTime: Math.round(averageDeliveryTime * 100) / 100,
        lastDeliveryTime: lastDelivery?.sentAt || null,
      };
    }

    return result;
  } catch (error) {
    logDb.error('Failed to get SMS metrics by provider', { error, tenantId, hoursAgo });
    throw error;
  }
}

/**
 * Check if delivery metrics are healthy
 */
export function isDeliveryHealthy(metrics: DeliveryMetrics): boolean {
  // Consider healthy if:
  // - Success rate >= 95%
  // - Average delivery time < 10 seconds
  // - No pending messages older than 5 minutes (not checked here)
  return metrics.successRate >= 95 && metrics.averageDeliveryTime < 10;
}

/**
 * Get delivery health status
 */
export function getDeliveryHealthStatus(metrics: DeliveryMetrics): {
  status: 'healthy' | 'warning' | 'critical';
  message: string;
} {
  if (metrics.successRate >= 95 && metrics.averageDeliveryTime < 10) {
    return {
      status: 'healthy',
      message: 'Delivery performance is excellent',
    };
  }

  if (metrics.successRate >= 85 && metrics.averageDeliveryTime < 30) {
    return {
      status: 'warning',
      message: 'Delivery performance is degraded',
    };
  }

  return {
    status: 'critical',
    message: 'Delivery performance is critical',
  };
}

/**
 * Monitor all delivery systems and log warnings
 */
export async function monitorDeliveryPerformance(tenantId: string): Promise<void> {
  try {
    const [emailMetrics, smsMetrics] = await Promise.all([
      getEmailDeliveryMetrics(tenantId, 24),
      getSMSDeliveryMetrics(tenantId, 24),
    ]);

    const emailHealth = getDeliveryHealthStatus(emailMetrics);
    const smsHealth = getDeliveryHealthStatus(smsMetrics);

    // Log performance summary
    logDb.info('Delivery performance summary', {
      tenantId,
      email: {
        metrics: emailMetrics,
        health: emailHealth,
      },
      sms: {
        metrics: smsMetrics,
        health: smsHealth,
      },
    });

    // Log warnings for critical issues
    if (emailHealth.status === 'critical') {
      logDb.error('Critical email delivery issues', {
        tenantId,
        metrics: emailMetrics,
      });
    }

    if (smsHealth.status === 'critical') {
      logDb.error('Critical SMS delivery issues', {
        tenantId,
        metrics: smsMetrics,
      });
    }
  } catch (error) {
    logDb.error('Failed to monitor delivery performance', { error, tenantId });
  }
}
