import { eq, and, isNull, like, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  InsertUser,
  users,
  tenants,
  customers,
  services,
  appointments,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let _connection: mysql.Connection | null = null;

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      console.log(
        "[Database] Connecting to:",
        process.env.DATABASE_URL.replace(/:\/\/.*@/, "://***@")
      );

      _connection = await mysql.createConnection(process.env.DATABASE_URL);
      await _connection.ping();

      console.log("[Database] Connection successful");
      _db = drizzle(_connection);
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      _db = null;
      _connection = null;
    }
  }
  return _db;
}

// Graceful shutdown
export async function closeDb() {
  if (_connection) {
    await _connection.end();
    _connection = null;
    _db = null;
    console.log("[Database] Connection closed");
  }
}

// ============================================================================
// USER HELPERS
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  if (!user.tenantId) throw new Error("User tenantId is required");

  const db = await getDb();
  if (!db) return;

  const values: InsertUser = {
    openId: user.openId,
    tenantId: user.tenantId,
    role:
      user.role || (user.openId === ENV.ownerOpenId ? "owner" : "employee"),
  };

  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod", "phone"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }

  if (user.lastSignedIn) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }

  if (!values.lastSignedIn) {
    values.lastSignedIn = new Date();
    updateSet.lastSignedIn = new Date();
  }

  await db.insert(users).values(values).onDuplicateKeyUpdate({
    set: updateSet,
  });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result[0];
}

// ============================================================================
// TENANT HELPERS
// ============================================================================

export async function getTenantBySubdomain(subdomain: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(tenants)
    .where(eq(tenants.subdomain, subdomain))
    .limit(1);

  return result[0];
}

export async function getTenantById(tenantId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  return result[0];
}

// ============================================================================
// CUSTOMER HELPERS
// ============================================================================

export async function getCustomersByTenant(tenantId: string) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(customers)
    .where(and(eq(customers.tenantId, tenantId), isNull(customers.deletedAt)));
}

export async function getCustomerById(customerId: number, tenantId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)))
    .limit(1);

  return result[0];
}

// ============================================================================
// SERVICE HELPERS
// ============================================================================

export async function getServicesByTenant(tenantId: string) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(services)
    .where(and(eq(services.tenantId, tenantId), eq(services.isActive, true)));
}

export async function getServiceById(serviceId: number, tenantId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(services)
    .where(and(eq(services.id, serviceId), eq(services.tenantId, tenantId)))
    .limit(1);

  return result[0];
}

// ============================================================================
// APPOINTMENT HELPERS
// ============================================================================

export async function getAppointmentsByTenant(
  tenantId: string,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) return [];

  const start = startDate.toISOString().slice(0, 10);
  const end = endDate.toISOString().slice(0, 10);

  return db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.tenantId, tenantId),
        sql`${appointments.appointmentDate} >= ${start}`,
        sql`${appointments.appointmentDate} <= ${end}`
      )
    );
}

export async function getAppointmentById(
  appointmentId: number,
  tenantId: string
) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.id, appointmentId),
        eq(appointments.tenantId, tenantId)
      )
    )
    .limit(1);

  return result[0];
}

// ============================================================================
// GLOBAL SEARCH (SAFE / SIMPLE)
// ============================================================================

export async function globalSearch(tenantId: string, query: string) {
  const db = await getDb();
  if (!db) return { customers: [], appointments: [], services: [] };

  const term = `%${query}%`;

  const customerResults = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.tenantId, tenantId),
        like(customers.firstName, term)
      )
    )
    .limit(5);

  const appointmentResults = await db
    .select()
    .from(appointments)
    .where(eq(appointments.tenantId, tenantId))
    .limit(5);

  const serviceResults = await db
    .select()
    .from(services)
    .where(and(eq(services.tenantId, tenantId), like(services.name, term)))
    .limit(5);

  return {
    customers: customerResults,
    appointments: appointmentResults,
    services: serviceResults,
  };
}
