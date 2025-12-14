import { describe, it, expect, beforeAll } from "vitest";

describe("POS Frontend Simulation", () => {
  let testTenantId: string;
  let testEmployeeId: number;
  let testServiceId: number;

  beforeAll(async () => {
    const dbInstance = await (await import("./db")).getDb();
    if (!dbInstance) {
      throw new Error("Database not initialized");
    }

    // Create test tenant
    const { tenants, users, services } = await import("../drizzle/schema");
    
    const [tenant] = await dbInstance.insert(tenants).values({
      id: `test-frontend-${Date.now()}`,
      name: "Test Salon Frontend",
      subdomain: `test-frontend-${Date.now()}`,
      ownerOpenId: "test-owner",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });
    testTenantId = tenant.insertId as any;

    // Create test employee
    const [employee] = await dbInstance.insert(users).values({
      tenantId: testTenantId,
      openId: `test-employee-${Date.now()}`,
      name: "Test Employee",
      email: "test@example.com",
      role: "employee",
    });
    testEmployeeId = employee.insertId;

    // Create test service
    const [service] = await dbInstance.insert(services).values({
      tenantId: testTenantId,
      name: "Herreklipp",
      description: "Men's haircut",
      durationMinutes: 30,
      price: "350.00",
      vatRate: "25.00",
    });
    testServiceId = service.insertId;
  });

  it("should create order exactly like frontend does", async () => {
    const { appRouter } = await import("./routers");
    const { createContext } = await import("./_core/context");

    // Create mock authenticated context
    const ctx = await createContext({
      req: {
        headers: {},
        cookies: {},
      } as any,
      res: {} as any,
    });

    // Mock user with tenant (exactly like frontend)
    ctx.user = {
      id: testEmployeeId,
      tenantId: testTenantId,
      role: "employee",
    } as any;

    const caller = appRouter.createCaller(ctx);

    // Simulate exact frontend request
    const now = new Date();
    const orderDate = now.toISOString().slice(0, 10);
    const orderTime = now.toTimeString().slice(0, 5);

    console.log("Creating order with:", {
      employeeId: testEmployeeId,
      orderDate,
      orderTime,
      items: [
        {
          itemType: "service",
          itemId: testServiceId,
          quantity: 1,
          unitPrice: 350,
          vatRate: 25,
        },
      ],
    });

    const result = await caller.pos.createOrder({
      employeeId: testEmployeeId,
      orderDate,
      orderTime,
      items: [
        {
          itemType: "service",
          itemId: testServiceId,
          quantity: 1,
          unitPrice: 350,
          vatRate: 25,
        },
      ],
    });

    // Verify response structure
    expect(result.order).toBeDefined();
    expect(result.items).toBeDefined();
    expect(result.items.length).toBe(1);

    console.log("✅ Order created successfully:", result.order.id);
  });
});
