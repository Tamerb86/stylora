import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(tenantId: string = "test-tenant"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    tenantId,
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    phone: null,
    commissionType: "percentage",
    commissionRate: null,
    isActive: true,
    deactivatedAt: null,
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
      ip: "127.0.0.1",
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("customers router", () => {
  it("should list customers for tenant", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const customers = await caller.customers.list();
    
    expect(Array.isArray(customers)).toBe(true);
  });

  it("should create a new customer", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.customers.create({
      firstName: "John",
      lastName: "Doe",
      phone: "+4712345678",
      email: "john@example.com",
      marketingSmsConsent: true,
      marketingEmailConsent: false,
    });

    expect(result.success).toBe(true);
  });
});

describe("services router", () => {
  it("should list services for tenant", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const services = await caller.services.list();
    
    expect(Array.isArray(services)).toBe(true);
  });

  it("should create a new service", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.services.create({
      name: "Herreklipp",
      description: "Standard herreklipp",
      durationMinutes: 30,
      price: "299.00",
    });

    expect(result.success).toBe(true);
  });
});

describe("dashboard router", () => {
  it("should return today's stats", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.dashboard.todayStats();
    
    expect(stats).toHaveProperty("todayAppointments");
    expect(stats).toHaveProperty("todayRevenue");
    expect(stats).toHaveProperty("pendingAppointments");
    expect(stats).toHaveProperty("totalCustomers");
    expect(typeof stats.todayAppointments).toBe("number");
    expect(typeof stats.totalCustomers).toBe("number");
  });
});
