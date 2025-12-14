import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    tenantId: "test-tenant-123",
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    phone: null,
    isActive: true,
    deactivatedAt: null,
    commissionType: null,
    commissionRate: null,
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Products API", () => {
  it("should list products for tenant", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const products = await caller.products.list();
    
    expect(Array.isArray(products)).toBe(true);
  });

  it("should create a product", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.products.create({
      name: "Test Shampoo",
      description: "Professional shampoo",
      price: "299.00",
      cost: "150.00",
      barcode: "1234567890",
      stockQuantity: 10,
      minStockLevel: 5,
    });

    expect(result).toEqual({ success: true });
  });
});

describe("Appointments API", () => {
  it("should list appointments for tenant", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const appointments = await caller.appointments.list({
      startDate,
      endDate,
    });

    expect(Array.isArray(appointments)).toBe(true);
  });
});

describe("Dashboard API", () => {
  it("should return today's stats", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.dashboard.todayStats();

    expect(stats).toHaveProperty("todayAppointments");
    expect(stats).toHaveProperty("todayRevenue");
    expect(stats).toHaveProperty("pendingAppointments");
    expect(stats).toHaveProperty("totalCustomers");
    expect(typeof stats.todayAppointments).toBe("number");
    expect(typeof stats.todayRevenue).toBe("string");
  });
});

describe("Services API", () => {
  it("should list services for tenant", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const services = await caller.services.list();

    expect(Array.isArray(services)).toBe(true);
  });

  it("should create a service", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.services.create({
      name: "Test Haircut",
      description: "Professional haircut",
      durationMinutes: 45,
      price: "500.00",
    });

    expect(result).toEqual({ success: true });
  });
});

describe("Employees API", () => {
  it("should list employees for tenant", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const employees = await caller.employees.list();

    expect(Array.isArray(employees)).toBe(true);
  });
});
