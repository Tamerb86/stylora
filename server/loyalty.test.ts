import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
  const tenantId = "test-tenant-" + Date.now();
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    tenantId: tenantId,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    tenantId: tenantId,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Loyalty System", () => {
  it("should create and retrieve loyalty settings", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Update settings
    await caller.loyalty.updateSettings({
      enabled: true,
      pointsPerVisit: 10,
      pointsPerNOK: 0.1,
    });

    // Get settings
    const settings = await caller.loyalty.getSettings();
    expect(settings.enabled).toBe(true);
    expect(settings.pointsPerVisit).toBe(10);
    expect(settings.pointsPerNOK).toBe(0.1);
  });

  it("should create a loyalty reward", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.loyalty.createReward({
      name: "10% rabatt",
      description: "Få 10% rabatt på neste besøk",
      pointsCost: 100,
      discountType: "percentage",
      discountValue: "10",
      validityDays: 30,
    });

    expect(result.success).toBe(true);

    // Verify reward was created by listing rewards
    const rewards = await caller.loyalty.listRewards();
    expect(rewards.length).toBeGreaterThan(0);
  });

  it("should award and retrieve loyalty points", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create a customer first
    await caller.customers.create({
      firstName: "Loyalty",
      lastName: "Test",
      phone: "+4798765432",
      email: "loyalty@test.com",
    });

    // Get customer to get ID
    const customers = await caller.customers.list();
    const customer = customers.find(c => c.phone === "+4798765432");
    if (!customer) throw new Error("Customer not found");

    // Award points
    await caller.loyalty.awardPoints({
      customerId: customer.id,
      points: 50,
      reason: "Test points award",
    });

    // Get points
    const loyaltyPoints = await caller.loyalty.getPoints({
      customerId: customer.id,
    });

    expect(loyaltyPoints.currentPoints).toBe(50);
    expect(loyaltyPoints.lifetimePoints).toBe(50);
  });

  it("should redeem loyalty points for reward", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create customer
    await caller.customers.create({
      firstName: "Redeem",
      lastName: "Test",
      phone: "+4798765433",
      email: "redeem@test.com",
    });

    const customers = await caller.customers.list();
    const customer = customers.find(c => c.phone === "+4798765433");
    if (!customer) throw new Error("Customer not found");

    // Award points
    await caller.loyalty.awardPoints({
      customerId: customer.id,
      points: 200,
      reason: "Initial points",
    });

    // Create reward
    await caller.loyalty.createReward({
      name: "Free haircut",
      description: "Get a free haircut",
      pointsCost: 150,
      discountType: "fixed_amount",
      discountValue: "500",
      validityDays: 30,
    });

    // Get the reward ID from list
    const rewards = await caller.loyalty.listRewards();
    const reward = rewards.find(r => r.name === "Free haircut");
    if (!reward) throw new Error("Reward not found");

    // Redeem reward
    await caller.loyalty.redeemReward({
      customerId: customer.id,
      rewardId: reward.id,
    });

    // Check remaining points
    const loyaltyPoints = await caller.loyalty.getPoints({
      customerId: customer.id,
    });

    expect(loyaltyPoints.currentPoints).toBe(50); // 200 - 150
    expect(loyaltyPoints.lifetimePoints).toBe(200); // Lifetime doesn't decrease
  });

  it("should auto-award points when appointment is completed", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Enable loyalty
    await caller.loyalty.updateSettings({
      enabled: true,
      pointsPerVisit: 10,
      pointsPerNOK: 0.1,
    });

    // Create customer
    await caller.customers.create({
      firstName: "Auto",
      lastName: "Points",
      phone: "+4798765434",
      email: "auto@test.com",
    });

    const customers = await caller.customers.list();
    const customer = customers.find(c => c.phone === "+4798765434");
    if (!customer) throw new Error("Customer not found");

    // Create employee
    await caller.employees.create({
      name: "Stylist One",
      phone: "+4798765435",
      email: "stylist@test.com",
      role: "employee",
      commissionRate: "15",
    });

    const employees = await caller.employees.list();
    const employee = employees.find(e => e.phone === "+4798765435");
    if (!employee) throw new Error("Employee not found");

    // Create service
    await caller.services.create({
      name: "Haircut",
      description: "Standard haircut",
      price: "500",
      durationMinutes: 60,
    });

    const services = await caller.services.list();
    const service = services.find(s => s.name === "Haircut");
    if (!service) throw new Error("Service not found");

    // Create appointment
    await caller.appointments.create({
      customerId: customer.id,
      employeeId: employee.id,
      serviceIds: [service.id],
      appointmentDate: new Date().toISOString().split("T")[0],
      startTime: "10:00:00",
      endTime: "11:00:00",
    });

    const appointments = await caller.appointments.list({
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
    });
    const appointment = appointments.find(a => a.customerId === customer.id);
    if (!appointment) throw new Error("Appointment not found");

    // Complete appointment
    await caller.appointments.updateStatus({
      id: appointment.id,
      status: "completed",
    });

    // Check points were awarded
    const loyaltyPoints = await caller.loyalty.getPoints({
      customerId: customer.id,
    });

    // Should have 10 points for visit + 50 points for 500 NOK (500 * 0.1)
    expect(loyaltyPoints.currentPoints).toBe(60);
  });
});
