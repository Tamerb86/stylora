import { eq, and, isNull, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  tenants, 
  customers, 
  services, 
  appointments 
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  if (!user.tenantId) {
    throw new Error("User tenantId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
      tenantId: user.tenantId,
      role: user.role || (user.openId === ENV.ownerOpenId ? 'owner' : 'employee'),
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "phone"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// TENANT HELPERS
// ============================================================================

export async function getTenantBySubdomain(subdomain: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tenants).where(eq(tenants.subdomain, subdomain)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getTenantById(tenantId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// CUSTOMER HELPERS
// ============================================================================

export async function getCustomersByTenant(tenantId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(customers).where(
    and(eq(customers.tenantId, tenantId), isNull(customers.deletedAt))
  );
}

export async function getCustomerById(customerId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// SERVICE HELPERS
// ============================================================================

export async function getServicesByTenant(tenantId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(services).where(
    and(eq(services.tenantId, tenantId), eq(services.isActive, true))
  );
}

export async function getServiceById(serviceId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// APPOINTMENT HELPERS
// ============================================================================

export async function getAppointmentsByTenant(tenantId: string, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  const { and, sql } = await import("drizzle-orm");
  
  // Format dates as YYYY-MM-DD using local date components to avoid timezone issues
  const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
  const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
  
  return db.select().from(appointments).where(
    and(
      eq(appointments.tenantId, tenantId),
      sql`${appointments.appointmentDate} >= ${startDateStr}`,
      sql`${appointments.appointmentDate} <= ${endDateStr}`
    )
  );
}

export async function getAppointmentById(appointmentId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(appointments).where(eq(appointments.id, appointmentId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}


// ============================================================================
// PAYMENTS
// ============================================================================

export async function createPayment(data: {
  tenantId: string;
  appointmentId?: number | null;
  orderId?: number | null;
  paymentMethod: "cash" | "card" | "vipps" | "stripe";
  paymentGateway?: "stripe" | "vipps" | null;
  amount: string;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  gatewaySessionId?: string | null;
  gatewayPaymentId?: string | null;
  gatewayMetadata?: any;
  lastFour?: string | null;
  cardBrand?: string | null;
  errorMessage?: string | null;
  processedBy?: number | null;
  processedAt?: Date | null;
}) {
  console.log("[createPayment] data:", JSON.stringify(data, null, 2));
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const { payments } = await import("../drizzle/schema");
  
  const [result] = await db.insert(payments).values({
    tenantId: data.tenantId,
    appointmentId: data.appointmentId ?? null,
    orderId: data.orderId ?? null,
    paymentMethod: data.paymentMethod,
    paymentGateway: data.paymentGateway ?? null,
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    gatewaySessionId: data.gatewaySessionId ?? null,
    gatewayPaymentId: data.gatewayPaymentId ?? null,
    gatewayMetadata: data.gatewayMetadata ?? null,
    cardLast4: data.lastFour ?? null,
    cardBrand: data.cardBrand ?? null,
    paidAt: data.processedAt ?? null,
    processedBy: data.processedBy ?? null,
    processedAt: data.processedAt ?? null,
    errorMessage: data.errorMessage ?? null,
  });

  // Fetch the created payment
  const paymentId = result.insertId;
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1);

  return payment;
}

export async function getPaymentById(paymentId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const { payments } = await import("../drizzle/schema");
  const result = await db
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function getPaymentsByAppointment(appointmentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { payments } = await import("../drizzle/schema");
  return db
    .select()
    .from(payments)
    .where(eq(payments.appointmentId, appointmentId));
}

export async function getPaymentsByTenant(tenantId: string) {
  const db = await getDb();
  if (!db) return [];
  
  const { payments } = await import("../drizzle/schema");
  return db
    .select()
    .from(payments)
    .where(eq(payments.tenantId, tenantId));
}

// ============================================================================
// ORDER HELPERS (for POS)
// ============================================================================

export async function createOrderWithItems(
  orderData: {
    tenantId: string;
    appointmentId: number | null;
    customerId: number | null;
    employeeId: number;
    orderDate: string; // YYYY-MM-DD format for MySQL DATE column
    orderTime: string;
    subtotal: string;
    vatAmount: string;
    total: string; // Match DB column name
    status: "pending" | "completed" | "refunded";
  },
  items: Array<{
    itemType: "service" | "product";
    itemId: number;
    itemName: string; // Required by DB
    quantity: number;
    unitPrice: string;
    vatRate: string;
    total: string; // Match DB column name
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not initialized");

  const { orders, orderItems } = await import("../drizzle/schema");

  // Use transaction to ensure atomicity
  return await db.transaction(async (tx) => {
    // Insert order
    const [orderResult] = await tx.insert(orders).values({
      tenantId: orderData.tenantId,
      appointmentId: orderData.appointmentId,
      customerId: orderData.customerId,
      employeeId: orderData.employeeId,
      orderDate: orderData.orderDate,
      orderTime: orderData.orderTime,
      subtotal: orderData.subtotal,
      vatAmount: orderData.vatAmount,
      total: orderData.total,
      status: orderData.status,
      notes: null,
    });

    const orderId = orderResult.insertId;

    // Insert order items
    const itemsToInsert = items.map((item) => ({
      orderId,
      itemType: item.itemType,
      itemId: item.itemId,
      itemName: item.itemName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      vatRate: item.vatRate,
      total: item.total,
    }));

    await tx.insert(orderItems).values(itemsToInsert);

    // Fetch created order
    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    // Fetch created items
    const createdItems = await tx
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    return { order, items: createdItems };
  });
}

export async function updateOrderStatus(
  orderId: number,
  status: "pending" | "completed" | "refunded" | "partially_refunded"
) {
  const db = await getDb();
  if (!db) throw new Error("DB not initialized");

  const { orders } = await import("../drizzle/schema");

  await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  // Fetch updated order
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  return order;
}

export async function getOrderById(orderId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const { orders } = await import("../drizzle/schema");
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  return order;
}

export async function getOrdersByTenant(tenantId: string) {
  const db = await getDb();
  if (!db) return [];

  const { orders } = await import("../drizzle/schema");
  return db
    .select()
    .from(orders)
    .where(eq(orders.tenantId, tenantId))
    .orderBy(orders.createdAt);
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];

  const { orderItems } = await import("../drizzle/schema");
  return db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));
}

export async function getOrdersWithDetails(
  tenantId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    paymentMethod?: "cash" | "card";
    customerId?: number;
    status?: "pending" | "completed" | "refunded" | "partially_refunded";
  }
) {
  const db = await getDb();
  if (!db) return [];

  const { orders, customers, payments } = await import("../drizzle/schema");
  const { eq, and, sql, desc } = await import("drizzle-orm");

  const conditions = [eq(orders.tenantId, tenantId)];

  if (filters?.startDate) {
    conditions.push(sql`${orders.orderDate} >= ${filters.startDate}`);
  }
  if (filters?.endDate) {
    conditions.push(sql`${orders.orderDate} <= ${filters.endDate}`);
  }
  if (filters?.customerId) {
    conditions.push(eq(orders.customerId, filters.customerId));
  }
  if (filters?.status) {
    conditions.push(eq(orders.status, filters.status));
  }

  const result = await db
    .select({
      order: orders,
      customer: customers,
      payment: payments,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(payments, eq(payments.orderId, orders.id))
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt));

  // Filter by payment method if specified
  if (filters?.paymentMethod) {
    return result.filter(r => r.payment?.paymentMethod === filters.paymentMethod);
  }

  return result;
}

// ============================================================================
// NO-SHOW TRACKING
// ============================================================================

export async function getNoShowCountForCustomer(tenantId: string, customerId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const { appointments } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");

  const rows = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        eq(appointments.tenantId, tenantId),
        eq(appointments.customerId, customerId),
        eq(appointments.status, "no_show")
      )
    );

  return rows.length;
}

// ============================================================================
// GLOBAL SEARCH
// ============================================================================

export async function globalSearch(tenantId: string, query: string) {
  const db = await getDb();
  if (!db) return { customers: [], appointments: [], orders: [], services: [] };

  const { customers, appointments, services, orders, users } = await import("../drizzle/schema");
  const { eq, and, or, like, desc } = await import("drizzle-orm");

  const searchTerm = `%${query}%`;

  // Search customers
  const customerResults = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.tenantId, tenantId),
        or(
          like(customers.firstName, searchTerm),
          like(customers.lastName, searchTerm),
          like(customers.phone, searchTerm),
          like(customers.email, searchTerm)
        )
      )
    )
    .limit(5);

  // Search appointments with customer and employee info
  const appointmentResults = await db
    .select({
      appointment: appointments,
      customer: customers,
      employee: users,
    })
    .from(appointments)
    .leftJoin(customers, eq(appointments.customerId, customers.id))
    .leftJoin(users, eq(appointments.employeeId, users.id))
    .where(
      and(
        eq(appointments.tenantId, tenantId),
        or(
          like(customers.firstName, searchTerm),
          like(customers.lastName, searchTerm),
          like(appointments.id, searchTerm)
        )
      )
    )
    .orderBy(desc(appointments.startTime))
    .limit(5);

  // Search orders
  const orderResults = await db
    .select({
      order: orders,
      customer: customers,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .where(
      and(
        eq(orders.tenantId, tenantId),
        or(
          like(orders.id, searchTerm),
          like(customers.firstName, searchTerm),
          like(customers.lastName, searchTerm)
        )
      )
    )
    .orderBy(desc(orders.createdAt))
    .limit(5);

  // Search services
  const serviceResults = await db
    .select()
    .from(services)
    .where(
      and(
        eq(services.tenantId, tenantId),
        like(services.name, searchTerm)
      )
    )
    .limit(5);

  return {
    customers: customerResults,
    appointments: appointmentResults,
    orders: orderResults,
    services: serviceResults,
  };
}

// ============================================================================
// SPLIT PAYMENTS
// ============================================================================

export async function createSplitPayment(data: {
  tenantId: string;
  orderId: number;
  paymentId?: number | null;
  amount: number;
  paymentMethod: "card" | "cash" | "vipps" | "stripe";
  paymentProviderId?: number | null;
  cardLast4?: string | null;
  cardBrand?: string | null;
  transactionId?: string | null;
  processedBy: number;
  notes?: string | null;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const { paymentSplits } = await import("../drizzle/schema");

  const [result] = await db.insert(paymentSplits).values({
    tenantId: data.tenantId,
    orderId: data.orderId,
    paymentId: data.paymentId || null,
    amount: data.amount.toString(),
    paymentMethod: data.paymentMethod,
    paymentProviderId: data.paymentProviderId || null,
    cardLast4: data.cardLast4 || null,
    cardBrand: data.cardBrand || null,
    transactionId: data.transactionId || null,
    status: "completed",
    processedBy: data.processedBy,
    notes: data.notes || null,
  });

  return result;
}

export async function getSplitsByOrder(orderId: number) {
  const db = await getDb();
  if (!db) return [];

  const { paymentSplits } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  return db.select().from(paymentSplits).where(eq(paymentSplits.orderId, orderId));
}

export async function getSplitsByPayment(paymentId: number) {
  const db = await getDb();
  if (!db) return [];

  const { paymentSplits } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  return db.select().from(paymentSplits).where(eq(paymentSplits.paymentId, paymentId));
}

// ============================================================================
// REFUNDS
// ============================================================================

export async function createRefund(data: {
  tenantId: string;
  paymentId: number;
  orderId?: number | null;
  appointmentId?: number | null;
  amount: number;
  reason: string;
  refundMethod: "stripe" | "vipps" | "manual";
  processedBy: number;
  gatewayRefundId?: string | null;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const { refunds } = await import("../drizzle/schema");

  const [result] = await db.insert(refunds).values({
    tenantId: data.tenantId,
    paymentId: data.paymentId,
    orderId: data.orderId || null,
    appointmentId: data.appointmentId || null,
    amount: data.amount.toString(),
    reason: data.reason,
    refundMethod: data.refundMethod,
    status: "pending",
    processedBy: data.processedBy,
    gatewayRefundId: data.gatewayRefundId || null,
  });

  return result;
}

export async function updateRefundStatus(
  refundId: number,
  status: "pending" | "completed" | "failed",
  errorMessage?: string | null
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const { refunds } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  await db
    .update(refunds)
    .set({
      status,
      processedAt: status === "completed" ? new Date() : null,
      errorMessage: errorMessage || null,
    })
    .where(eq(refunds.id, refundId));
}

export async function getRefundsByOrder(orderId: number) {
  const db = await getDb();
  if (!db) return [];

  const { refunds } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  return db.select().from(refunds).where(eq(refunds.orderId, orderId));
}

export async function getRefundsByPayment(paymentId: number) {
  const db = await getDb();
  if (!db) return [];

  const { refunds } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  return db.select().from(refunds).where(eq(refunds.paymentId, paymentId));
}

export async function getRefundsByTenant(tenantId: string) {
  const db = await getDb();
  if (!db) return [];

  const { refunds } = await import("../drizzle/schema");
  const { eq, desc } = await import("drizzle-orm");

  return db
    .select()
    .from(refunds)
    .where(eq(refunds.tenantId, tenantId))
    .orderBy(desc(refunds.createdAt));
}
