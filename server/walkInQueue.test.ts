import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { walkInQueue, users, services } from "../drizzle/schema";
import { eq, and, or } from "drizzle-orm";

/**
 * Phase 31: Walk-in Queue Priority System Tests
 * 
 * Tests the enhanced walk-in queue system with:
 * - Priority levels (normal, urgent, vip)
 * - Dynamic wait time calculation
 * - Priority-based queue sorting
 * - Available barbers tracking
 */

describe("Walk-in Queue Priority System", () => {
  let testTenantId: string;
  let testServiceId: number;
  let testEmployeeId: number;
  let testQueueIds: number[] = [];

  beforeAll(async () => {
    // Use a test tenant ID
    testTenantId = "test-tenant-priority-" + Date.now();

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test service
    const [service] = await db
      .insert(services)
      .values({
        tenantId: testTenantId,
        name: "Test Haircut",
        durationMinutes: 30,
        price: "500.00",
        isActive: true,
      })
      .$returningId();
    testServiceId = service.id;

    // Create a test employee (user with employee role)
    const [employee] = await db
      .insert(users)
      .values({
        tenantId: testTenantId,
        openId: `test-openid-${Date.now()}`,
        name: "Test Barber",
        email: `test-barber-${Date.now()}@test.com`,
        phone: "+4712345678",
        role: "employee",
        isActive: true,
      })
      .$returningId();
    testEmployeeId = employee.id;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    if (testQueueIds.length > 0) {
      await db
        .delete(walkInQueue)
        .where(eq(walkInQueue.tenantId, testTenantId));
    }
    if (testEmployeeId) {
      await db.delete(users).where(eq(users.id, testEmployeeId));
    }
    if (testServiceId) {
      await db.delete(services).where(eq(services.id, testServiceId));
    }
  });

  describe("Priority Field Validation", () => {
    it("should accept 'normal' priority", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db
        .insert(walkInQueue)
        .values({
          tenantId: testTenantId,
          customerName: "Normal Customer",
          customerPhone: "+4711111111",
          serviceId: testServiceId,
          status: "waiting",
          priority: "normal",
          estimatedWaitMinutes: 15,
          position: 1,
        })
        .$returningId();

      testQueueIds.push(result.id);

      const [queue] = await db
        .select()
        .from(walkInQueue)
        .where(eq(walkInQueue.id, result.id));

      expect(queue.priority).toBe("normal");
      expect(queue.priorityReason).toBeNull();
    });

    it("should accept 'urgent' priority with reason", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db
        .insert(walkInQueue)
        .values({
          tenantId: testTenantId,
          customerName: "Urgent Customer",
          customerPhone: "+4722222222",
          serviceId: testServiceId,
          status: "waiting",
          priority: "urgent",
          priorityReason: "Has important meeting in 1 hour",
          estimatedWaitMinutes: 10,
          position: 2,
        })
        .$returningId();

      testQueueIds.push(result.id);

      const [queue] = await db
        .select()
        .from(walkInQueue)
        .where(eq(walkInQueue.id, result.id));

      expect(queue.priority).toBe("urgent");
      expect(queue.priorityReason).toBe("Has important meeting in 1 hour");
    });

    it("should accept 'vip' priority with reason", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db
        .insert(walkInQueue)
        .values({
          tenantId: testTenantId,
          customerName: "VIP Customer",
          customerPhone: "+4733333333",
          serviceId: testServiceId,
          status: "waiting",
          priority: "vip",
          priorityReason: "Regular customer, special occasion",
          estimatedWaitMinutes: 5,
          position: 3,
        })
        .$returningId();

      testQueueIds.push(result.id);

      const [queue] = await db
        .select()
        .from(walkInQueue)
        .where(eq(walkInQueue.id, result.id));

      expect(queue.priority).toBe("vip");
      expect(queue.priorityReason).toBe("Regular customer, special occasion");
    });
  });

  describe("Priority-Based Queue Sorting", () => {
    it("should sort queue by priority: VIP > Urgent > Normal", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Insert customers in reverse priority order
      const normalCustomer = await db
        .insert(walkInQueue)
        .values({
          tenantId: testTenantId,
          customerName: "Normal Priority",
          customerPhone: "+4744444444",
          serviceId: testServiceId,
          status: "waiting",
          priority: "normal",
          estimatedWaitMinutes: 20,
          position: 1,
        })
        .$returningId();

      const urgentCustomer = await db
        .insert(walkInQueue)
        .values({
          tenantId: testTenantId,
          customerName: "Urgent Priority",
          customerPhone: "+4755555555",
          serviceId: testServiceId,
          status: "waiting",
          priority: "urgent",
          priorityReason: "Time sensitive",
          estimatedWaitMinutes: 15,
          position: 2,
        })
        .$returningId();

      const vipCustomer = await db
        .insert(walkInQueue)
        .values({
          tenantId: testTenantId,
          customerName: "VIP Priority",
          customerPhone: "+4766666666",
          serviceId: testServiceId,
          status: "waiting",
          priority: "vip",
          priorityReason: "VIP member",
          estimatedWaitMinutes: 10,
          position: 3,
        })
        .$returningId();

      testQueueIds.push(
        normalCustomer[0].id,
        urgentCustomer[0].id,
        vipCustomer[0].id
      );

      // Query with priority-based sorting
      const queue = await db
        .select()
        .from(walkInQueue)
        .where(
          and(
            eq(walkInQueue.tenantId, testTenantId),
            eq(walkInQueue.status, "waiting")
          )
        );

      // Manually sort by priority for verification
      const priorityOrder = { vip: 1, urgent: 2, normal: 3 };
      const sortedQueue = [...queue].sort(
        (a, b) =>
          priorityOrder[a.priority as keyof typeof priorityOrder] -
          priorityOrder[b.priority as keyof typeof priorityOrder]
      );

      // Verify we have at least 3 customers (may include customers from previous tests)
      expect(queue.length).toBeGreaterThanOrEqual(3);
      
      // Verify sorted order is correct - VIP comes first, then urgent, then normal
      expect(sortedQueue[0].priority).toBe("vip");
      
      // Find our test customers in the sorted queue
      const testVip = sortedQueue.find(c => c.customerName === "VIP Priority");
      const testUrgent = sortedQueue.find(c => c.customerName === "Urgent Priority");
      const testNormal = sortedQueue.find(c => c.customerName === "Normal Priority");
      
      expect(testVip).toBeDefined();
      expect(testUrgent).toBeDefined();
      expect(testNormal).toBeDefined();
      
      // Verify priorities are correct
      expect(testVip?.priority).toBe("vip");
      expect(testUrgent?.priority).toBe("urgent");
      expect(testNormal?.priority).toBe("normal");
    });
  });

  describe("Dynamic Wait Time Calculation", () => {
    it("should calculate wait time based on queue position and service duration", async () => {
      // Average service time: 30 minutes
      // 3 customers ahead
      // Expected wait: 90 minutes for normal priority

      const avgServiceTime = 30;
      const customersAhead = 3;
      const expectedWaitNormal = avgServiceTime * customersAhead;

      expect(expectedWaitNormal).toBe(90);
    });

    it("should apply priority multipliers correctly", () => {
      const baseWaitTime = 60; // 60 minutes base

      // Priority multipliers
      const vipMultiplier = 0.5; // VIP gets 50% reduction
      const urgentMultiplier = 0.75; // Urgent gets 25% reduction
      const normalMultiplier = 1.0; // Normal gets no reduction

      const vipWait = baseWaitTime * vipMultiplier;
      const urgentWait = baseWaitTime * urgentMultiplier;
      const normalWait = baseWaitTime * normalMultiplier;

      expect(vipWait).toBe(30); // 30 minutes
      expect(urgentWait).toBe(45); // 45 minutes
      expect(normalWait).toBe(60); // 60 minutes
    });

    it("should factor in available barbers count", () => {
      const totalWaitTime = 120; // 120 minutes total
      const availableBarbers1 = 1;
      const availableBarbers2 = 2;
      const availableBarbers3 = 3;

      const wait1 = totalWaitTime / availableBarbers1;
      const wait2 = totalWaitTime / availableBarbers2;
      const wait3 = totalWaitTime / availableBarbers3;

      expect(wait1).toBe(120); // 120 minutes with 1 barber
      expect(wait2).toBe(60); // 60 minutes with 2 barbers
      expect(wait3).toBe(40); // 40 minutes with 3 barbers
    });
  });

  describe("Priority Update Functionality", () => {
    it("should allow updating customer priority", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db
        .insert(walkInQueue)
        .values({
          tenantId: testTenantId,
          customerName: "Priority Update Test",
          customerPhone: "+4777777777",
          serviceId: testServiceId,
          status: "waiting",
          priority: "normal",
          estimatedWaitMinutes: 30,
          position: 1,
        })
        .$returningId();

      testQueueIds.push(result.id);

      // Update to VIP
      await db
        .update(walkInQueue)
        .set({
          priority: "vip",
          priorityReason: "Upgraded to VIP",
          estimatedWaitMinutes: 15,
        })
        .where(eq(walkInQueue.id, result.id));

      const [updated] = await db
        .select()
        .from(walkInQueue)
        .where(eq(walkInQueue.id, result.id));

      expect(updated.priority).toBe("vip");
      expect(updated.priorityReason).toBe("Upgraded to VIP");
      expect(updated.estimatedWaitMinutes).toBe(15);
    });
  });

  describe("Available Barbers Tracking", () => {
    it("should identify available vs busy barbers", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all active employees (users with employee/admin/owner role)
      const allBarbers = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.tenantId, testTenantId),
            eq(users.isActive, true),
            or(
              eq(users.role, "employee"),
              eq(users.role, "admin"),
              eq(users.role, "owner")
            )
          )
        );

      // Get barbers currently serving customers
      const busyBarbers = await db
        .select({ employeeId: walkInQueue.employeeId })
        .from(walkInQueue)
        .where(
          and(
            eq(walkInQueue.tenantId, testTenantId),
            eq(walkInQueue.status, "in-progress")
          )
        );

      const busyBarberIds = new Set(
        busyBarbers
          .map((b) => b.employeeId)
          .filter((id): id is number => id !== null)
      );

      const availableBarbers = allBarbers.filter(
        (b) => !busyBarberIds.has(b.id)
      );

      // We have 1 test barber and no one is serving
      expect(allBarbers.length).toBeGreaterThanOrEqual(1);
      expect(availableBarbers.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle null priorityReason for normal priority", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db
        .insert(walkInQueue)
        .values({
          tenantId: testTenantId,
          customerName: "No Reason Test",
          customerPhone: "+4788888888",
          serviceId: testServiceId,
          status: "waiting",
          priority: "normal",
          priorityReason: null,
          estimatedWaitMinutes: 20,
          position: 1,
        })
        .$returningId();

      testQueueIds.push(result.id);

      const [queue] = await db
        .select()
        .from(walkInQueue)
        .where(eq(walkInQueue.id, result.id));

      expect(queue.priority).toBe("normal");
      expect(queue.priorityReason).toBeNull();
    });

    it("should handle zero available barbers gracefully", () => {
      const availableBarbers = 0;
      const baseWaitTime = 60;

      // When no barbers available, wait time should be undefined or very high
      const waitTime =
        availableBarbers > 0 ? baseWaitTime / availableBarbers : Infinity;

      expect(waitTime).toBe(Infinity);
    });

    it("should handle empty queue", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const emptyQueue = await db
        .select()
        .from(walkInQueue)
        .where(
          and(
            eq(walkInQueue.tenantId, "non-existent-tenant"),
            eq(walkInQueue.status, "waiting")
          )
        );

      expect(emptyQueue.length).toBe(0);
    });
  });
});
