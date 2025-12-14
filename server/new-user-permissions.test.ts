import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { nanoid } from "nanoid";

describe("New User Permissions - Create Operations", () => {
  let testTenantId: string;
  let testUserId: number;
  let testUserOpenId: string;

  beforeAll(async () => {
    // Create a test tenant and user
    const { getDb } = await import("./db");
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");

    const { tenants, users } = await import("../drizzle/schema");
    const { randomUUID } = await import("crypto");
    
    // Create test tenant
    const tenantId = randomUUID();
    await dbInstance.insert(tenants).values({
      id: tenantId,
      name: "Test Salon",
      subdomain: `test-${nanoid(6)}`,
      emailVerified: true,
    });
    
    testTenantId = tenantId;

    // Create test user (regular employee, not admin)
    testUserOpenId = `test_user_${nanoid()}`;
    const [user] = await dbInstance.insert(users).values({
      tenantId: testTenantId,
      openId: testUserOpenId,
      name: "Test User",
      role: "employee",
    }).$returningId();
    
    testUserId = user.id;
  });

  it("should allow new user to create customers", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        openId: testUserOpenId,
        name: "Test User",
        role: "employee",
        tenantId: testTenantId as any,
      },
      tenantId: testTenantId,
      req: { ip: "127.0.0.1" } as any,
    });

    const result = await caller.customers.create({
      firstName: "Test",
      lastName: "Customer",
      phone: "12345678",
    });

    expect(result.success).toBe(true);
  });

  it("should allow new user to create services", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        openId: testUserOpenId,
        name: "Test User",
        role: "employee",
        tenantId: testTenantId as any,
      },
      tenantId: testTenantId,
      req: { ip: "127.0.0.1" } as any,
    });

    const result = await caller.services.create({
      name: "Test Service",
      durationMinutes: 30,
      price: "299.00",
    });

    expect(result.success).toBe(true);
  });

  it("should allow new user to create employees", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        openId: testUserOpenId,
        name: "Test User",
        role: "employee",
        tenantId: testTenantId as any,
      },
      tenantId: testTenantId,
      req: { ip: "127.0.0.1" } as any,
    });

    const result = await caller.employees.create({
      name: "Test Employee",
      role: "employee",
      phone: "87654321",
    });

    expect(result.success).toBe(true);
  });

  it("should allow new user to create products", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        openId: testUserOpenId,
        name: "Test User",
        role: "employee",
        tenantId: testTenantId as any,
      },
      tenantId: testTenantId,
      req: { ip: "127.0.0.1" } as any,
    });

    const result = await caller.products.create({
      name: "Test Product",
      price: "199.00",
      stockQuantity: 10,
    });

    expect(result.success).toBe(true);
  });

  it("should allow new user to create appointments", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        openId: testUserOpenId,
        name: "Test User",
        role: "employee",
        tenantId: testTenantId as any,
      },
      tenantId: testTenantId,
      req: { ip: "127.0.0.1" } as any,
    });

    // First create a customer and service
    const customer = await caller.customers.create({
      firstName: "Appointment",
      lastName: "Customer",
      phone: "11111111",
    });

    const service = await caller.services.create({
      name: "Appointment Service",
      durationMinutes: 60,
      price: "499.00",
    });

    // Get the created customer and service
    const customers = await caller.customers.list();
    const services = await caller.services.list();
    
    const customerId = customers.find(c => c.firstName === "Appointment")?.id;
    const serviceId = services.find(s => s.name === "Appointment Service")?.id;

    if (!customerId || !serviceId) {
      throw new Error("Failed to create customer or service");
    }

    // Create appointment
    const tomorrow = new Date(Date.now() + 86400000);
    const appointmentDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD
    const startTime = "10:00:00";
    const endTime = "11:00:00";
    
    const result = await caller.appointments.create({
      customerId,
      employeeId: testUserId,
      serviceIds: [serviceId],
      appointmentDate,
      startTime,
      endTime,
      notes: "Test appointment",
    });

    expect(result.success).toBe(true);
  });

  it("should allow employee to clock in (time registration)", async () => {
    const { getDb } = await import("./db");
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error("Database not available");

    const { users } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    // Set PIN for the test user
    const testPin = "1234";
    await dbInstance.update(users)
      .set({ pin: testPin })
      .where(eq(users.id, testUserId));

    // Create caller without authentication (public procedure)
    const caller = appRouter.createCaller({
      user: null,
      tenantId: null,
    });

    const result = await caller.employee.clockIn({
      tenantId: testTenantId,
      pin: testPin,
    });

    expect(result.success).toBe(true);
    expect(result.employeeName).toBeDefined();
    expect(result.employeeName).toBe("Test User");
  });
});
