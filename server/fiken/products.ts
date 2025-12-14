import { FikenClient } from "./client";
import { getDb } from "../db";
import { services, products, fikenProductMapping, fikenSyncLog } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Sync service to Fiken as a product
 */
export async function syncServiceToFiken(
  client: FikenClient,
  tenantId: string,
  serviceId: number
): Promise<{ success: boolean; fikenProductId?: number; error?: string }> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get service details
    const [service] = await db
      .select()
      .from(services)
      .where(and(eq(services.id, serviceId), eq(services.tenantId, tenantId)))
      .limit(1);

    if (!service) {
      throw new Error(`Service ${serviceId} not found`);
    }

    // Check if already synced
    const [existingMapping] = await db
      .select()
      .from(fikenProductMapping)
      .where(
        and(
          eq(fikenProductMapping.serviceId, serviceId),
          eq(fikenProductMapping.tenantId, tenantId)
        )
      )
      .limit(1);

    if (existingMapping) {
      // Update existing product in Fiken
      const fikenProduct = await client.createProduct({
        name: service.name,
        unitPrice: Number(service.price),
        incomeAccount: "3000", // Norwegian standard for service income
        vatType: "HIGH", // 25% Norwegian VAT
        active: true,
      });

      return {
        success: true,
        fikenProductId: existingMapping.fikenProductId,
      };
    }

    // Create new product in Fiken
    const fikenProduct = await client.createProduct({
      name: service.name,
      unitPrice: Number(service.price),
      incomeAccount: "3000", // Norwegian standard for service income
      vatType: "HIGH", // 25% Norwegian VAT
      active: true,
    });

    // Store mapping
    await db.insert(fikenProductMapping).values({
      tenantId,
      serviceId,
      fikenProductId: fikenProduct.productId,
      syncedAt: new Date(),
    });

    // Log successful sync
    await db.insert(fikenSyncLog).values({
      tenantId,
      operation: "product_sync",
      status: "success",
      details: {
        serviceId,
        serviceName: service.name,
        fikenProductId: fikenProduct.productId,
      } as any,
    });

    return {
      success: true,
      fikenProductId: fikenProduct.productId,
    };
  } catch (error: any) {
    // Log failed sync
    const db = await getDb();
    if (db) {
      await db.insert(fikenSyncLog).values({
        tenantId,
        operation: "product_sync",
        status: "failed",
        errorMessage: error.message,
        details: {
          serviceId,
        } as any,
      });
    }

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Sync physical product to Fiken
 */
export async function syncProductToFiken(
  client: FikenClient,
  tenantId: string,
  productId: number
): Promise<{ success: boolean; fikenProductId?: number; error?: string }> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get product details
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)))
      .limit(1);

    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    // Check if already synced
    const [existingMapping] = await db
      .select()
      .from(fikenProductMapping)
      .where(
        and(
          eq(fikenProductMapping.productId, productId),
          eq(fikenProductMapping.tenantId, tenantId)
        )
      )
      .limit(1);

    if (existingMapping) {
      // Update existing product in Fiken
      const fikenProduct = await client.createProduct({
        name: product.name,
        unitPrice: Number(product.retailPrice),
        incomeAccount: "3400", // Norwegian standard for product sales
        vatType: "HIGH", // 25% Norwegian VAT
        active: true,
      });

      return {
        success: true,
        fikenProductId: existingMapping.fikenProductId,
      };
    }

    // Create new product in Fiken
    const fikenProduct = await client.createProduct({
      name: product.name,
      unitPrice: Number(product.retailPrice),
      incomeAccount: "3400", // Norwegian standard for product sales
      vatType: "HIGH", // 25% Norwegian VAT
      active: true,
    });

    // Store mapping
    await db.insert(fikenProductMapping).values({
      tenantId,
      productId,
      fikenProductId: fikenProduct.productId,
      syncedAt: new Date(),
    });

    // Log successful sync
    await db.insert(fikenSyncLog).values({
      tenantId,
      operation: "product_sync",
      status: "success",
      details: {
        productId,
        productName: product.name,
        fikenProductId: fikenProduct.productId,
      } as any,
    });

    return {
      success: true,
      fikenProductId: fikenProduct.productId,
    };
  } catch (error: any) {
    // Log failed sync
    const db = await getDb();
    if (db) {
      await db.insert(fikenSyncLog).values({
        tenantId,
        operation: "product_sync",
        status: "failed",
        errorMessage: error.message,
        details: {
          productId,
        } as any,
      });
    }

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Bulk sync all services for a tenant
 */
export async function bulkSyncServices(
  client: FikenClient,
  tenantId: string
): Promise<{ success: boolean; synced: number; failed: number; errors?: string[] }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const allServices = await db
    .select()
    .from(services)
    .where(eq(services.tenantId, tenantId));

  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const service of allServices) {
    const result = await syncServiceToFiken(client, tenantId, service.id);
    if (result.success) {
      synced++;
    } else {
      failed++;
      if (result.error) {
        errors.push(`Service ${service.name}: ${result.error}`);
      }
    }
  }

  return {
    success: failed === 0,
    synced,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Bulk sync all products for a tenant
 */
export async function bulkSyncProducts(
  client: FikenClient,
  tenantId: string
): Promise<{ success: boolean; synced: number; failed: number; errors?: string[] }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const allProducts = await db
    .select()
    .from(products)
    .where(eq(products.tenantId, tenantId));

  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const product of allProducts) {
    const result = await syncProductToFiken(client, tenantId, product.id);
    if (result.success) {
      synced++;
    } else {
      failed++;
      if (result.error) {
        errors.push(`Product ${product.name}: ${result.error}`);
      }
    }
  }

  return {
    success: failed === 0,
    synced,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  };
}
