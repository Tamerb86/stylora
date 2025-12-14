import { describe, it, expect, beforeEach } from "vitest";
import * as db from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("Analytics API", () => {
  const mockContext: TrpcContext = {
    user: {
      id: 1,
      openId: "test-open-id",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "admin",
      tenantId: "test-tenant-id",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    tenantId: "test-tenant-id",
    req: {} as any,
    res: {} as any,
  };

  const caller = appRouter.createCaller(mockContext);

  beforeEach(async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) {
      throw new Error("Database not available");
    }

    // Clean up test data
    const { customers, appointments, users, services, appointmentServices } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    // appointmentServices doesn't have tenantId, delete via appointments join
    const appointmentIds = await dbInstance.select({ id: appointments.id }).from(appointments).where(eq(appointments.tenantId, mockContext.tenantId));
    if (appointmentIds.length > 0) {
      const { inArray } = await import("drizzle-orm");
      await dbInstance.delete(appointmentServices).where(inArray(appointmentServices.appointmentId, appointmentIds.map(a => a.id)));
    }
    await dbInstance.delete(appointments).where(eq(appointments.tenantId, mockContext.tenantId));
    await dbInstance.delete(customers).where(eq(customers.tenantId, mockContext.tenantId));
    await dbInstance.delete(services).where(eq(services.tenantId, mockContext.tenantId));
    await dbInstance.delete(users).where(eq(users.tenantId, mockContext.tenantId));
  });

  describe("customerGrowth", () => {
    it("should return customer growth data for date range", async () => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database not available");

      const { customers } = await import("../drizzle/schema");

      // Create test customers
      await dbInstance.insert(customers).values([
        {
          tenantId: mockContext.tenantId,
          firstName: "Test",
          lastName: "Customer 1",
          phone: "12345678",
          email: "customer1@test.com",
          createdAt: new Date("2024-01-15"),
        },
        {
          tenantId: mockContext.tenantId,
          firstName: "Test",
          lastName: "Customer 2",
          phone: "87654321",
          email: "customer2@test.com",
          createdAt: new Date("2024-01-15"),
        },
        {
          tenantId: mockContext.tenantId,
          firstName: "Test",
          lastName: "Customer 3",
          phone: "11223344",
          email: "customer3@test.com",
          createdAt: new Date("2024-01-20"),
        },
      ]);

      const result = await caller.analytics.customerGrowth({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("date");
      expect(result[0]).toHaveProperty("count");
    });

    it("should return empty array when no customers in date range", async () => {
      const result = await caller.analytics.customerGrowth({
        startDate: "2025-01-01",
        endDate: "2025-01-31",
      });

      expect(result).toBeDefined();
      expect(result.length).toBe(0);
    });
  });

  describe("employeePerformance", () => {
    it("should return employee performance metrics", async () => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database not available");

      const { appointments, users, services, appointmentServices, customers } = await import("../drizzle/schema");

      // Create test employee
      await dbInstance.insert(users).values({
        tenantId: mockContext.tenantId,
        name: "Test Employee",
        email: `employee-${Date.now()}@test.com`,
        role: "employee",
        openId: `employee-open-id-${Date.now()}-${Math.random()}`,
      });

      // Create test customer
      await dbInstance.insert(customers).values({
        tenantId: mockContext.tenantId,
        firstName: "Test",
        lastName: "Customer",
        phone: "12345678",
        email: "customer@test.com",
      });

      // Create test service
      await dbInstance.insert(services).values({
        tenantId: mockContext.tenantId,
        name: "Haircut",
        durationMinutes: 30,
        price: "300",
      });

      // Create completed appointment
      const [custResult] = await dbInstance.select({ id: customers.id }).from(customers).where(eq(customers.tenantId, mockContext.tenantId));
      const [empResult] = await dbInstance.select({ id: users.id }).from(users).where(eq(users.tenantId, mockContext.tenantId));
      
      await dbInstance.insert(appointments).values({
        tenantId: mockContext.tenantId,
        customerId: custResult.id,
        employeeId: empResult.id,
        appointmentDate: new Date("2024-01-15"),
        startTime: "10:00:00",
        endTime: "10:30:00",
        status: "completed",
      });

      const [appResult] = await dbInstance.select({ id: appointments.id }).from(appointments).where(eq(appointments.tenantId, mockContext.tenantId));
      const [svcResult] = await dbInstance.select({ id: services.id }).from(services).where(eq(services.tenantId, mockContext.tenantId));
      
      await dbInstance.insert(appointmentServices).values({
        appointmentId: appResult.id,
        serviceId: svcResult.id,
        price: "300",
      });

      const result = await caller.analytics.employeePerformance({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("employeeId");
      expect(result[0]).toHaveProperty("employeeName");
      expect(result[0]).toHaveProperty("appointmentCount");
      expect(result[0]).toHaveProperty("totalRevenue");
    });
  });

  describe("topServices", () => {
    it("should return most booked services", async () => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database not available");

      const { appointments, services, appointmentServices, customers, users } = await import("../drizzle/schema");

      // Create test data
      await dbInstance.insert(customers).values({
        tenantId: mockContext.tenantId,
        firstName: "Test",
        lastName: "Customer",
        phone: "12345678",
        email: "customer@test.com",
      });

      await dbInstance.insert(users).values({
        tenantId: mockContext.tenantId,
        name: "Test Employee",
        email: `employee-${Date.now()}@test.com`,
        role: "employee",
        openId: `employee-open-id-${Date.now()}-${Math.random()}`,
      });

      await dbInstance.insert(services).values([
        {
          tenantId: mockContext.tenantId,
          name: "Haircut",
          durationMinutes: 30,
          price: "300",
        },
        {
          tenantId: mockContext.tenantId,
          name: "Beard Trim",
          durationMinutes: 15,
          price: "150",
        },
      ]);

      // Create appointments
      const [custResult] = await dbInstance.select({ id: customers.id }).from(customers).where(eq(customers.tenantId, mockContext.tenantId));
      const [empResult] = await dbInstance.select({ id: users.id }).from(users).where(eq(users.tenantId, mockContext.tenantId));
      
      await dbInstance.insert(appointments).values([
        {
          tenantId: mockContext.tenantId,
          customerId: custResult.id,
          employeeId: empResult.id,
          appointmentDate: new Date("2024-01-15"),
          startTime: "10:00:00",
          endTime: "10:30:00",
          status: "completed",
        },
        {
          tenantId: mockContext.tenantId,
          customerId: custResult.id,
          employeeId: empResult.id,
          appointmentDate: new Date("2024-01-16"),
          startTime: "11:00:00",
          endTime: "11:30:00",
          status: "completed",
        },
      ]);

      const appResults = await dbInstance.select({ id: appointments.id }).from(appointments).where(eq(appointments.tenantId, mockContext.tenantId));
      const [svcResult] = await dbInstance.select({ id: services.id }).from(services).where(eq(services.tenantId, mockContext.tenantId));
      
      await dbInstance.insert(appointmentServices).values([
        {
          appointmentId: appResults[0].id,
          serviceId: svcResult.id,
          price: "300",
        },
        {
          appointmentId: appResults[1].id,
          serviceId: svcResult.id,
          price: "300",
        },
      ]);

      const result = await caller.analytics.topServices({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("serviceId");
      expect(result[0]).toHaveProperty("serviceName");
      expect(result[0]).toHaveProperty("bookingCount");
      expect(result[0]).toHaveProperty("totalRevenue");
    });
  });

  describe("revenueTrends", () => {
    it("should return daily revenue trends", async () => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database not available");

      const { appointments, services, appointmentServices, customers, users } = await import("../drizzle/schema");

      // Create test data
      await dbInstance.insert(customers).values({
        tenantId: mockContext.tenantId,
        firstName: "Test",
        lastName: "Customer",
        phone: "12345678",
        email: "customer@test.com",
      });

      await dbInstance.insert(users).values({
        tenantId: mockContext.tenantId,
        name: "Test Employee",
        email: `employee-${Date.now()}@test.com`,
        role: "employee",
        openId: `employee-open-id-${Date.now()}-${Math.random()}`,
      });

      await dbInstance.insert(services).values({
        tenantId: mockContext.tenantId,
        name: "Haircut",
        durationMinutes: 30,
        price: "300",
      });

      const [custResult] = await dbInstance.select({ id: customers.id }).from(customers).where(eq(customers.tenantId, mockContext.tenantId));
      const [empResult] = await dbInstance.select({ id: users.id }).from(users).where(eq(users.tenantId, mockContext.tenantId));
      
      await dbInstance.insert(appointments).values({
        tenantId: mockContext.tenantId,
        customerId: custResult.id,
        employeeId: empResult.id,
        appointmentDate: new Date("2024-01-15"),
        startTime: "10:00:00",
        endTime: "10:30:00",
        status: "completed",
      });

      const [appResult] = await dbInstance.select({ id: appointments.id }).from(appointments).where(eq(appointments.tenantId, mockContext.tenantId));
      const [svcResult] = await dbInstance.select({ id: services.id }).from(services).where(eq(services.tenantId, mockContext.tenantId));
      
      await dbInstance.insert(appointmentServices).values({
        appointmentId: appResult.id,
        serviceId: svcResult.id,
        price: "300",
      });

      const result = await caller.analytics.revenueTrends({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("date");
      expect(result[0]).toHaveProperty("revenue");
    });
  });

  describe("appointmentStatusDistribution", () => {
    it("should return appointment status distribution", async () => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database not available");

      const { appointments, customers, users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      // Create test data
      await dbInstance.insert(customers).values({
        tenantId: mockContext.tenantId,
        firstName: "Test",
        lastName: "Customer",
        phone: "12345678",
        email: "customer@test.com",
      });

      await dbInstance.insert(users).values({
        tenantId: mockContext.tenantId,
        name: "Test Employee",
        email: `employee-${Date.now()}@test.com`,
        role: "employee",
        openId: `employee-open-id-${Date.now()}-${Math.random()}`,
      });

      const [custResult] = await dbInstance.select({ id: customers.id }).from(customers).where(eq(customers.tenantId, mockContext.tenantId));
      const [empResult] = await dbInstance.select({ id: users.id }).from(users).where(eq(users.tenantId, mockContext.tenantId));
      
      await dbInstance.insert(appointments).values([
        {
          tenantId: mockContext.tenantId,
          customerId: custResult.id,
          employeeId: empResult.id,
          appointmentDate: new Date("2024-01-15"),
          startTime: "10:00:00",
          endTime: "10:30:00",
          status: "completed",
        },
        {
          tenantId: mockContext.tenantId,
          customerId: custResult.id,
          employeeId: empResult.id,
          appointmentDate: new Date("2024-01-16"),
          startTime: "11:00:00",
          endTime: "11:30:00",
          status: "pending",
        },
        {
          tenantId: mockContext.tenantId,
          customerId: custResult.id,
          employeeId: empResult.id,
          appointmentDate: new Date("2024-01-17"),
          startTime: "12:00:00",
          endTime: "12:30:00",
          status: "confirmed",
        },
      ]);

      const result = await caller.analytics.appointmentStatusDistribution({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("status");
      expect(result[0]).toHaveProperty("count");
    });
  });
});
