import { getDb } from "./db";
import { dataImports, customers, services, products, serviceCategories, productCategories } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import * as XLSX from "xlsx";

/**
 * Import customers from CSV/Excel file
 */
export async function importCustomersFromFile(
  tenantId: string,
  fileBuffer: Buffer,
  fileName: string,
  userId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Create import record
  const importResult = await db.insert(dataImports).values({
    tenantId,
    importType: "customers",
    fileName,
    fileSize: fileBuffer.length,
    status: "in_progress",
    importedBy: userId,
  });

  const importId = Array.isArray(importResult) ? importResult[0]?.insertId : (importResult as any).insertId;

  try {
    // Parse Excel/CSV file
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);

    const errors: any[] = [];
    let imported = 0;
    let failed = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Validate required fields
        if (!row.firstName || !row.phone) {
          throw new Error("Missing required fields: firstName or phone");
        }

        // Check if customer already exists (by phone)
        const existing = await db
          .select()
          .from(customers)
          .where(eq(customers.phone, row.phone))
          .limit(1);

        if (existing.length > 0) {
          throw new Error(`Customer with phone ${row.phone} already exists`);
        }

        // Insert customer
        await db.insert(customers).values({
          tenantId,
          firstName: row.firstName,
          lastName: row.lastName || null,
          phone: row.phone,
          email: row.email || null,
          notes: row.notes || null,
          source: "import",
        });

        imported++;
      } catch (error: any) {
        failed++;
        errors.push({
          row: i + 2, // Excel row number (1-indexed + header)
          data: row,
          error: error.message,
        });
      }
    }

    // Update import record
    await db.update(dataImports)
      .set({
        status: failed === 0 ? "completed" : "completed",
        recordsTotal: data.length,
        recordsImported: imported,
        recordsFailed: failed,
        errorDetails: errors.length > 0 ? errors : null,
        completedAt: new Date(),
      })
      .where(eq(dataImports.id, Number(importId)));

    return {
      success: true,
      importId: Number(importId),
      total: data.length,
      imported,
      failed,
      errors,
    };
  } catch (error: any) {
    // Mark import as failed
    await db.update(dataImports)
      .set({
        status: "failed",
        errorMessage: error.message || "Unknown error",
        completedAt: new Date(),
      })
      .where(eq(dataImports.id, Number(importId)));

    throw error;
  }
}

/**
 * Import services from CSV/Excel file
 */
export async function importServicesFromFile(
  tenantId: string,
  fileBuffer: Buffer,
  fileName: string,
  userId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Create import record
  const importResult = await db.insert(dataImports).values({
    tenantId,
    importType: "services",
    fileName,
    fileSize: fileBuffer.length,
    status: "in_progress",
    importedBy: userId,
  });

  const importId = Array.isArray(importResult) ? importResult[0]?.insertId : (importResult as any).insertId;

  try {
    // Parse Excel/CSV file
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);

    const errors: any[] = [];
    let imported = 0;
    let failed = 0;

    // Get or create default category
    let categoryId: number | null = null;
    const defaultCategory = await db
      .select()
      .from(serviceCategories)
      .where(eq(serviceCategories.tenantId, tenantId))
      .limit(1);

    if (defaultCategory.length === 0) {
      const catResult = await db.insert(serviceCategories).values({
        tenantId,
        name: "Imported Services",
      });
      categoryId = Array.isArray(catResult) ? catResult[0]?.insertId : (catResult as any).insertId;
    } else {
      categoryId = defaultCategory[0].id;
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Validate required fields
        if (!row.name || !row.price || !row.duration) {
          throw new Error("Missing required fields: name, price, or duration");
        }

        // Insert service (skip duplicate check for imports)
        await db.insert(services).values({
          tenantId,
          categoryId: categoryId!,
          name: row.name,
          description: row.description || null,
          price: String(row.price),
          durationMinutes: Number(row.duration),
          isActive: true,
        });

        imported++;
      } catch (error: any) {
        failed++;
        errors.push({
          row: i + 2,
          data: row,
          error: error.message,
        });
      }
    }

    // Update import record
    await db.update(dataImports)
      .set({
        status: failed === 0 ? "completed" : "completed",
        recordsTotal: data.length,
        recordsImported: imported,
        recordsFailed: failed,
        errorDetails: errors.length > 0 ? errors : null,
        completedAt: new Date(),
      })
      .where(eq(dataImports.id, Number(importId)));

    return {
      success: true,
      importId: Number(importId),
      total: data.length,
      imported,
      failed,
      errors,
    };
  } catch (error: any) {
    // Mark import as failed
    await db.update(dataImports)
      .set({
        status: "failed",
        errorMessage: error.message || "Unknown error",
        completedAt: new Date(),
      })
      .where(eq(dataImports.id, Number(importId)));

    throw error;
  }
}

/**
 * Import products from CSV/Excel file
 */
export async function importProductsFromFile(
  tenantId: string,
  fileBuffer: Buffer,
  fileName: string,
  userId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Create import record
  const importResult = await db.insert(dataImports).values({
    tenantId,
    importType: "products",
    fileName,
    fileSize: fileBuffer.length,
    status: "in_progress",
    importedBy: userId,
  });

  const importId = Array.isArray(importResult) ? importResult[0]?.insertId : (importResult as any).insertId;

  try {
    // Parse Excel/CSV file
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);

    const errors: any[] = [];
    let imported = 0;
    let failed = 0;

    // Get or create default category
    let categoryId: number | null = null;
    const defaultCategory = await db
      .select()
      .from(productCategories)
      .where(eq(productCategories.tenantId, tenantId))
      .limit(1);

    if (defaultCategory.length === 0) {
      const catResult = await db.insert(productCategories).values({
        tenantId,
        name: "Imported Products",
      });
      categoryId = Array.isArray(catResult) ? catResult[0]?.insertId : (catResult as any).insertId;
    } else {
      categoryId = defaultCategory[0].id;
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Validate required fields
        if (!row.name || !row.price) {
          throw new Error("Missing required fields: name or price");
        }

        // Insert product (skip duplicate check for imports)
        await db.insert(products).values({
          tenantId,
          categoryId: categoryId!,
          name: row.name,
          description: row.description || "",
          retailPrice: String(row.price),
          costPrice: row.costPrice ? String(row.costPrice) : "0.00",
          stockQuantity: row.stock ? Number(row.stock) : 0,
          reorderPoint: row.lowStockThreshold ? Number(row.lowStockThreshold) : 5,
          sku: row.sku || `IMPORT-${Date.now()}-${i}`,
          barcode: row.barcode || "",
          isActive: true,
        });

        imported++;
      } catch (error: any) {
        failed++;
        errors.push({
          row: i + 2,
          data: row,
          error: error.message,
        });
      }
    }

    // Update import record
    await db.update(dataImports)
      .set({
        status: failed === 0 ? "completed" : "completed",
        recordsTotal: data.length,
        recordsImported: imported,
        recordsFailed: failed,
        errorDetails: errors.length > 0 ? errors : null,
        completedAt: new Date(),
      })
      .where(eq(dataImports.id, Number(importId)));

    return {
      success: true,
      importId: Number(importId),
      total: data.length,
      imported,
      failed,
      errors,
    };
  } catch (error: any) {
    // Mark import as failed
    await db.update(dataImports)
      .set({
        status: "failed",
        errorMessage: error.message || "Unknown error",
        completedAt: new Date(),
      })
      .where(eq(dataImports.id, Number(importId)));

    throw error;
  }
}

/**
 * List all imports for a tenant
 */
export async function listImports(tenantId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const imports = await db
    .select()
    .from(dataImports)
    .where(eq(dataImports.tenantId, tenantId))
    .orderBy(dataImports.createdAt)
    .limit(50);

  return imports;
}

/**
 * Get import details by ID
 */
export async function getImportById(importId: number, tenantId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const imports = await db
    .select()
    .from(dataImports)
    .where(eq(dataImports.id, importId))
    .limit(1);

  if (imports.length === 0 || imports[0].tenantId !== tenantId) {
    return null;
  }

  return imports[0];
}

/**
 * Restore database from SQL backup file
 * WARNING: This will DELETE existing data for the tenant!
 */
export async function restoreFromSQL(
  tenantId: string,
  fileBuffer: Buffer,
  fileName: string,
  userId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Create import record
  const importResult = await db.insert(dataImports).values({
    tenantId,
    importType: "sql_restore",
    fileName,
    fileSize: fileBuffer.length,
    status: "in_progress",
    importedBy: userId,
  });

  const importId = Array.isArray(importResult) ? importResult[0]?.insertId : (importResult as any).insertId;

  try {
    // Parse SQL file
    const sqlContent = fileBuffer.toString("utf-8");
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith("--"));

    let executed = 0;
    const errors: any[] = [];

    // Execute each SQL statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        // Skip comments and empty lines
        if (statement.startsWith("--") || statement.length === 0) {
          continue;
        }

        // Execute statement
        await db.execute(statement);
        executed++;
      } catch (error: any) {
        errors.push({
          statement: i + 1,
          sql: statement.substring(0, 100) + "...",
          error: error.message,
        });
      }
    }

    // Update import record
    await db.update(dataImports)
      .set({
        status: errors.length === 0 ? "completed" : "completed",
        recordsTotal: statements.length,
        recordsImported: executed,
        recordsFailed: errors.length,
        errorDetails: errors.length > 0 ? errors : null,
        completedAt: new Date(),
      })
      .where(eq(dataImports.id, Number(importId)));

    return {
      success: true,
      importId: Number(importId),
      total: statements.length,
      executed,
      failed: errors.length,
      errors,
    };
  } catch (error: any) {
    // Mark import as failed
    await db.update(dataImports)
      .set({
        status: "failed",
        errorMessage: error.message || "Unknown error",
        completedAt: new Date(),
      })
      .where(eq(dataImports.id, Number(importId)));

    throw error;
  }
}
