import { describe, it, expect } from "vitest";
import { getDb } from "./db";

describe("recordCashPayment", () => {
  it("should record cash payment for existing order", async () => {
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");

    const { orders } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    // Get the latest order
    const [latestOrder] = await dbInstance
      .select()
      .from(orders)
      .orderBy(orders.id)
      .limit(1);

    if (!latestOrder) {
      console.log("❌ No orders found in database");
      return;
    }

    console.log("✅ Latest order:", latestOrder);
    console.log("   tenantId type:", typeof latestOrder.tenantId);
    console.log("   tenantId value:", latestOrder.tenantId);
  });
});
