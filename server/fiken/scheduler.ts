import { FikenClient } from "./client";
import { getDb } from "../db";
import { fikenSettings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { syncCustomerToFiken, bulkSyncCustomers } from "./customers";
import { syncOrderToFiken, bulkSyncOrders } from "./invoices";
import { syncServiceToFiken, syncProductToFiken, bulkSyncServices, bulkSyncProducts } from "./products";

/**
 * Scheduled sync intervals in milliseconds
 */
const SYNC_INTERVALS: Record<string, number> = {
  hourly: 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
  manual: 0, // No automatic sync
};

/**
 * Active scheduler intervals per tenant
 */
const activeSchedulers = new Map<string, NodeJS.Timeout>();

/**
 * Start Fiken scheduler for a tenant
 */
export async function startFikenScheduler(tenantId: string): Promise<void> {
  // Stop existing scheduler if running
  stopFikenScheduler(tenantId);

  const db = await getDb();
  if (!db) {
    console.error("[FikenScheduler] Database not available");
    return;
  }

  // Get Fiken settings
  const [settings] = await db
    .select()
    .from(fikenSettings)
    .where(eq(fikenSettings.tenantId, tenantId))
    .limit(1);

  if (!settings || !settings.enabled) {
    console.log(`[FikenScheduler] Fiken integration not enabled for tenant ${tenantId}`);
    return;
  }

  if (!settings.syncFrequency || settings.syncFrequency === "manual") {
    console.log(`[FikenScheduler] Manual sync mode for tenant ${tenantId}`);
    return;
  }

  const interval = SYNC_INTERVALS[settings.syncFrequency];
  if (!interval) {
    console.error(`[FikenScheduler] Invalid sync frequency: ${settings.syncFrequency}`);
    return;
  }

  console.log(
    `[FikenScheduler] Starting scheduler for tenant ${tenantId} with ${settings.syncFrequency} frequency`
  );

  // Schedule periodic sync
  const schedulerId = setInterval(async () => {
    await runScheduledSync(tenantId);
  }, interval);

  activeSchedulers.set(tenantId, schedulerId);

  // Run initial sync
  await runScheduledSync(tenantId);
}

/**
 * Stop Fiken scheduler for a tenant
 */
export function stopFikenScheduler(tenantId: string): void {
  const scheduler = activeSchedulers.get(tenantId);
  if (scheduler) {
    clearInterval(scheduler);
    activeSchedulers.delete(tenantId);
    console.log(`[FikenScheduler] Stopped scheduler for tenant ${tenantId}`);
  }
}

/**
 * Run scheduled sync for a tenant
 */
async function runScheduledSync(tenantId: string): Promise<void> {
  console.log(`[FikenScheduler] Running scheduled sync for tenant ${tenantId}`);

  try {
    const client = new FikenClient(tenantId);
    await client.initialize();

    // Sync customers
    console.log(`[FikenScheduler] Syncing customers for tenant ${tenantId}`);
    const customerResult = await bulkSyncCustomers(tenantId);
    console.log(
      `[FikenScheduler] Customer sync: ${customerResult.totalProcessed} processed, ${customerResult.totalFailed} failed`
    );

    // Sync services
    console.log(`[FikenScheduler] Syncing services for tenant ${tenantId}`);
    const serviceResult = await bulkSyncServices(client, tenantId);
    console.log(
      `[FikenScheduler] Service sync: ${serviceResult.synced} synced, ${serviceResult.failed} failed`
    );

    // Sync products
    console.log(`[FikenScheduler] Syncing products for tenant ${tenantId}`);
    const productResult = await bulkSyncProducts(client, tenantId);
    console.log(
      `[FikenScheduler] Product sync: ${productResult.synced} synced, ${productResult.failed} failed`
    );

    // Sync orders/invoices
    console.log(`[FikenScheduler] Syncing orders for tenant ${tenantId}`);
    const orderResult = await bulkSyncOrders(tenantId);
    console.log(
      `[FikenScheduler] Order sync: ${orderResult.totalProcessed} processed, ${orderResult.totalFailed} failed`
    );

    // Update last sync timestamp
    const db = await getDb();
    if (db) {
      await db
        .update(fikenSettings)
        .set({ lastSyncAt: new Date() })
        .where(eq(fikenSettings.tenantId, tenantId));
    }

    console.log(`[FikenScheduler] Completed scheduled sync for tenant ${tenantId}`);
  } catch (error) {
    console.error(`[FikenScheduler] Error during scheduled sync for tenant ${tenantId}:`, error);
  }
}

/**
 * Initialize schedulers for all enabled tenants
 */
export async function initializeFikenSchedulers(): Promise<void> {
  console.log("[FikenScheduler] Initializing schedulers for all enabled tenants");

  const db = await getDb();
  if (!db) {
    console.error("[FikenScheduler] Database not available");
    return;
  }

  const allSettings = await db
    .select()
    .from(fikenSettings)
    .where(eq(fikenSettings.enabled, true));

  for (const settings of allSettings) {
    if (settings.syncFrequency && settings.syncFrequency !== "manual") {
      await startFikenScheduler(settings.tenantId);
    }
  }

  console.log(`[FikenScheduler] Initialized ${allSettings.length} schedulers`);
}

/**
 * Shutdown all schedulers
 */
export function shutdownFikenSchedulers(): void {
  console.log("[FikenScheduler] Shutting down all schedulers");
  const tenantIds = Array.from(activeSchedulers.keys());
  for (const tenantId of tenantIds) {
    stopFikenScheduler(tenantId);
  }
}
