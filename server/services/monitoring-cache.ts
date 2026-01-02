/**
 * Monitoring Cache Service
 *
 * Implements in-memory caching for monitoring queries to improve performance
 * and reduce database load. Cache TTL is configurable per metric type.
 */

import { logDb } from "../_core/logger";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class MonitoringCache {
  private cache: Map<string, CacheEntry<any>>;
  private readonly defaultTTL: number = 60 * 1000; // 1 minute default

  // TTL configuration for different metric types (in milliseconds)
  private readonly ttlConfig = {
    systemHealth: 30 * 1000, // 30 seconds - frequently updated
    unimicroMetrics: 60 * 1000, // 1 minute
    unimicroHealth: 30 * 1000, // 30 seconds - critical alerts
    unimicroFailures: 60 * 1000, // 1 minute
    unimicroStats: 60 * 1000, // 1 minute
    emailMetrics: 120 * 1000, // 2 minutes - less critical
    smsMetrics: 120 * 1000, // 2 minutes - less critical
    endpointMetrics: 60 * 1000, // 1 minute
  };

  constructor() {
    this.cache = new Map();

    // Clean up expired entries every 5 minutes
    setInterval(
      () => {
        this.cleanupExpired();
      },
      5 * 60 * 1000
    );
  }

  /**
   * Generate cache key from tenant ID and query parameters
   */
  private generateKey(
    tenantId: string,
    metricType: keyof typeof this.ttlConfig,
    params?: Record<string, any>
  ): string {
    const paramStr = params ? JSON.stringify(params) : "";
    return `${tenantId}:${metricType}:${paramStr}`;
  }

  /**
   * Get cached data if available and not expired
   */
  get<T>(
    tenantId: string,
    metricType: keyof typeof this.ttlConfig,
    params?: Record<string, any>
  ): T | null {
    const key = this.generateKey(tenantId, metricType, params);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      // Entry expired, remove it
      this.cache.delete(key);
      logDb.info(`Cache expired for ${metricType}`, { tenantId, key });
      return null;
    }

    logDb.info(`Cache hit for ${metricType}`, {
      tenantId,
      key,
      age: Math.round((now - entry.timestamp) / 1000) + "s",
    });
    return entry.data as T;
  }

  /**
   * Set cached data with TTL
   */
  set<T>(
    tenantId: string,
    metricType: keyof typeof this.ttlConfig,
    data: T,
    params?: Record<string, any>
  ): void {
    const key = this.generateKey(tenantId, metricType, params);
    const now = Date.now();
    const ttl = this.ttlConfig[metricType] || this.defaultTTL;

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    };

    this.cache.set(key, entry);
    logDb.info(`Cache set for ${metricType}`, {
      tenantId,
      key,
      ttl: Math.round(ttl / 1000) + "s",
    });
  }

  /**
   * Invalidate cache for specific metric type and tenant
   */
  invalidate(tenantId: string, metricType?: keyof typeof this.ttlConfig): void {
    if (metricType) {
      // Invalidate specific metric type
      const prefix = `${tenantId}:${metricType}:`;
      let count = 0;

      for (const key of this.cache.keys()) {
        if (key.startsWith(prefix)) {
          this.cache.delete(key);
          count++;
        }
      }

      logDb.info(`Cache invalidated for ${metricType}`, {
        tenantId,
        entriesRemoved: count,
      });
    } else {
      // Invalidate all entries for tenant
      const prefix = `${tenantId}:`;
      let count = 0;

      for (const key of this.cache.keys()) {
        if (key.startsWith(prefix)) {
          this.cache.delete(key);
          count++;
        }
      }

      logDb.info(`Cache invalidated for all metrics`, {
        tenantId,
        entriesRemoved: count,
      });
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logDb.info(`Cache cleared`, { entriesRemoved: size });
  }

  /**
   * Remove expired entries from cache
   */
  private cleanupExpired(): void {
    const now = Date.now();
    let count = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      logDb.info(`Cache cleanup completed`, { entriesRemoved: count });
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEntries: number;
    expiredEntries: number;
    cacheSize: number;
    hitRate?: number;
  } {
    const now = Date.now();
    let expiredCount = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expiredCount++;
      }
    }

    return {
      totalEntries: this.cache.size,
      expiredEntries: expiredCount,
      cacheSize: this.cache.size - expiredCount,
    };
  }

  /**
   * Get or compute cached value
   * If cache miss, execute computeFn and cache the result
   */
  async getOrCompute<T>(
    tenantId: string,
    metricType: keyof typeof this.ttlConfig,
    computeFn: () => Promise<T>,
    params?: Record<string, any>
  ): Promise<T> {
    // Try to get from cache
    const cached = this.get<T>(tenantId, metricType, params);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - compute value
    logDb.info(`Cache miss for ${metricType}, computing...`, { tenantId });
    const startTime = Date.now();

    try {
      const data = await computeFn();
      const duration = Date.now() - startTime;

      // Cache the result
      this.set(tenantId, metricType, data, params);

      logDb.info(`Computed and cached ${metricType}`, {
        tenantId,
        duration: duration + "ms",
      });

      return data;
    } catch (error) {
      logDb.error(`Failed to compute ${metricType}`, { error, tenantId });
      throw error;
    }
  }
}

// Export singleton instance
export const monitoringCache = new MonitoringCache();

/**
 * Decorator function to add caching to monitoring functions
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  metricType: keyof (typeof monitoringCache)["ttlConfig"],
  fn: T
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const tenantId = args[0] as string;
    const params = args.length > 1 ? { params: args.slice(1) } : undefined;

    return await monitoringCache.getOrCompute(
      tenantId,
      metricType,
      () => fn(...args),
      params
    );
  }) as T;
}
