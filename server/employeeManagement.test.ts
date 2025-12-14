import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { Context } from "./_core/context";

describe("Employee Management", () => {
  const testTenantId = "test-tenant-employee-mgmt";
  const testContext: Context = {
    tenantId: testTenantId,
    user: {
      id: 1,
      openId: "test-owner-emp-mgmt",
      name: "Test Owner",
      role: "admin",
      tenantId: testTenantId,
    },
  };

  beforeEach(async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    const { users, timesheets } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    // Clean up test data
    await dbInstance.delete(timesheets).where(eq(timesheets.tenantId, testTenantId));
    await dbInstance.delete(users).where(eq(users.tenantId, testTenantId));

    // Create test owner
    await dbInstance.insert(users).values({
      tenantId: testTenantId,
      openId: "test-owner-emp-mgmt",
      name: "Test Owner",
      role: "admin",
      email: "owner@test.com",
    });
  });

  it("should update employee data", async () => {
    const caller = appRouter.createCaller(testContext);
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    const { users } = await import("../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");

    // Create test employee
    await dbInstance.insert(users).values({
      tenantId: testTenantId,
      openId: "test-emp-update",
      name: "Original Name",
      role: "employee",
      email: "original@test.com",
      phone: "11111111",
    });

    const [employee] = await dbInstance
      .select()
      .from(users)
      .where(
        and(
          eq(users.tenantId, testTenantId),
          eq(users.openId, "test-emp-update")
        )
      )
      .limit(1);

    // Update employee
    await caller.employees.update({
      id: employee.id,
      name: "Updated Name",
      email: "updated@test.com",
      phone: "22222222",
    });

    // Verify update
    const updated = await dbInstance
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, employee.id),
          eq(users.tenantId, testTenantId)
        )
      )
      .limit(1);

    expect(updated[0].name).toBe("Updated Name");
    expect(updated[0].email).toBe("updated@test.com");
    expect(updated[0].phone).toBe("22222222");
  });

  it("should add PIN code to employee", async () => {
    const caller = appRouter.createCaller(testContext);
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    const { users } = await import("../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");

    // Create test employee
    await dbInstance.insert(users).values({
      tenantId: testTenantId,
      openId: "test-emp-pin",
      name: "Employee With PIN",
      role: "employee",
    });

    const [employee] = await dbInstance
      .select()
      .from(users)
      .where(
        and(
          eq(users.tenantId, testTenantId),
          eq(users.openId, "test-emp-pin")
        )
      )
      .limit(1);

    // Add PIN
    await caller.employees.update({
      id: employee.id,
      pin: "1234",
    });

    // Verify PIN added
    const updated = await dbInstance
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, employee.id),
          eq(users.tenantId, testTenantId)
        )
      )
      .limit(1);

    expect(updated[0].pin).toBe("1234");
  });

  it("should reject duplicate PIN within same tenant", async () => {
    const caller = appRouter.createCaller(testContext);
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    const { users } = await import("../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");

    // Create two employees
    await dbInstance.insert(users).values({
      tenantId: testTenantId,
      openId: "test-emp-pin-1",
      name: "Employee 1",
      role: "employee",
      pin: "1234",
    });

    await dbInstance.insert(users).values({
      tenantId: testTenantId,
      openId: "test-emp-pin-2",
      name: "Employee 2",
      role: "employee",
    });

    const [emp2] = await dbInstance
      .select()
      .from(users)
      .where(
        and(
          eq(users.tenantId, testTenantId),
          eq(users.openId, "test-emp-pin-2")
        )
      )
      .limit(1);

    // Try to assign same PIN to second employee
    await expect(
      caller.employees.update({
        id: emp2.id,
        pin: "1234",
      })
    ).rejects.toThrow("PIN-koden er allerede i bruk av en annen ansatt");
  });

  it("should deactivate employee", async () => {
    const caller = appRouter.createCaller(testContext);
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    const { users } = await import("../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");

    // Create test employee
    await dbInstance.insert(users).values({
      tenantId: testTenantId,
      openId: "test-emp-deactivate",
      name: "Employee To Deactivate",
      role: "employee",
      isActive: true,
    });

    const [employee] = await dbInstance
      .select()
      .from(users)
      .where(
        and(
          eq(users.tenantId, testTenantId),
          eq(users.openId, "test-emp-deactivate")
        )
      )
      .limit(1);

    // Deactivate
    await caller.employees.deactivate({ id: employee.id });

    // Verify deactivation
    const updated = await dbInstance
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, employee.id),
          eq(users.tenantId, testTenantId)
        )
      )
      .limit(1);

    expect(updated[0].isActive).toBe(false);
    expect(updated[0].deactivatedAt).not.toBeNull();
  });

  it("should activate employee", async () => {
    const caller = appRouter.createCaller(testContext);
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    const { users } = await import("../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");

    // Create deactivated employee
    await dbInstance.insert(users).values({
      tenantId: testTenantId,
      openId: "test-emp-activate",
      name: "Employee To Activate",
      role: "employee",
      isActive: false,
      deactivatedAt: new Date(),
    });

    const [employee] = await dbInstance
      .select()
      .from(users)
      .where(
        and(
          eq(users.tenantId, testTenantId),
          eq(users.openId, "test-emp-activate")
        )
      )
      .limit(1);

    // Activate
    await caller.employees.activate({ id: employee.id });

    // Verify activation
    const updated = await dbInstance
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, employee.id),
          eq(users.tenantId, testTenantId)
        )
      )
      .limit(1);

    expect(updated[0].isActive).toBe(true);
    expect(updated[0].deactivatedAt).toBeNull();
  });

  it("should update commission settings", async () => {
    const caller = appRouter.createCaller(testContext);
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("Database not available");

    const { users } = await import("../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");

    // Create test employee
    await dbInstance.insert(users).values({
      tenantId: testTenantId,
      openId: "test-emp-commission",
      name: "Employee Commission",
      role: "employee",
      commissionType: "percentage",
      commissionRate: "40",
    });

    const [employee] = await dbInstance
      .select()
      .from(users)
      .where(
        and(
          eq(users.tenantId, testTenantId),
          eq(users.openId, "test-emp-commission")
        )
      )
      .limit(1);

    // Update commission
    await caller.employees.update({
      id: employee.id,
      commissionType: "fixed",
      commissionRate: "500",
    });

    // Verify update
    const updated = await dbInstance
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, employee.id),
          eq(users.tenantId, testTenantId)
        )
      )
      .limit(1);

    expect(updated[0].commissionType).toBe("fixed");
    expect(updated[0].commissionRate).toBe("500.00");
  });
});
