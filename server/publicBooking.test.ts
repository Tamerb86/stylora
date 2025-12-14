import { describe, it, expect, beforeEach } from "vitest";
import { 
  createTestTenant, 
  createTestService, 
  createTestEmployee,
  createTestCustomer,
  cleanupTestTenant 
} from "./test-helpers";
import { appRouter } from "./routers";
import * as db from "./db";
import { eq } from "drizzle-orm";
import { services, users } from "../drizzle/schema";

describe("Public Booking API", () => {
  let testTenantId: string;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(async () => {
    // Create test tenant
    const { tenantId } = await createTestTenant();
    testTenantId = tenantId;

    // Create public context (no authenticated user)
    caller = appRouter.createCaller({ user: null, req: {} as any, res: {} as any });
  });

  describe("getSalonInfo", () => {
    it("should return salon information", async () => {
      const result = await caller.publicBooking.getSalonInfo({
        tenantId: testTenantId,
      });

      expect(result).toBeDefined();
      expect(result?.name).toContain("Test Salon");
    });

    it("should return null for non-existent salon", async () => {
      const result = await caller.publicBooking.getSalonInfo({
        tenantId: "non-existent-id",
      });

      expect(result).toBeNull();
    });
  });

  describe("getAvailableServices", () => {
    it("should return only active services", async () => {
      // Create active service
      await createTestService(testTenantId, {
        name: "Haircut",
        durationMinutes: 30,
        price: "300",
        isActive: true,
      });

      // Create inactive service
      await createTestService(testTenantId, {
        name: "Inactive Service",
        durationMinutes: 20,
        price: "200",
        isActive: false,
      });

      const result = await caller.publicBooking.getAvailableServices({
        tenantId: testTenantId,
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Haircut");
      expect(result[0].durationMinutes).toBe(30);
      expect(result[0].price).toBe("300.00");
    });
  });

  describe("getAvailableEmployees", () => {
    it("should return only active employees", async () => {
      // Create active employee
      await createTestEmployee(testTenantId);

      // Create inactive employee
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database not available");

      await dbInstance.insert(users).values({
        tenantId: testTenantId,
        name: "Inactive Employee",
        email: `inactive-${Date.now()}@test.com`,
        role: "employee",
        openId: `inactive-${Date.now()}-${Math.random()}`,
        isActive: false,
      });

      const result = await caller.publicBooking.getAvailableEmployees({
        tenantId: testTenantId,
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Test Employee");
    });
  });

  describe("getAvailableTimeSlots", () => {
    it("should return available time slots", async () => {
      // Create test service
      const { serviceId } = await createTestService(testTenantId, {
        name: "Haircut",
        durationMinutes: 30,
        price: "300",
        isActive: true,
      });

      // Create test employee
      await createTestEmployee(testTenantId);

      const result = await caller.publicBooking.getAvailableTimeSlots({
        tenantId: testTenantId,
        date: "2025-12-01",
        serviceId,
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("time");
      expect(result[0]).toHaveProperty("available");
      expect(result[0].available).toBe(true);
    });
  });

  describe("createBooking", () => {
    it("should create a new booking with customer", async () => {
      // Create test service
      const { serviceId } = await createTestService(testTenantId, {
        name: "Haircut",
        durationMinutes: 30,
        price: "300",
        isActive: true,
      });

      // Create test employee
      const { userId: employeeId } = await createTestEmployee(testTenantId);

      const result = await caller.publicBooking.createBooking({
        tenantId: testTenantId,
        serviceId,
        employeeId,
        date: "2025-12-01",
        time: "10:00:00",
        customerInfo: {
          firstName: "John",
          lastName: "Doe",
          phone: "12345678",
          email: "john@test.com",
        },
      });

      expect(result.success).toBe(true);
      expect(result.appointmentId).toBeDefined();
      expect(result.customerId).toBeDefined();
    });

    it("should reuse existing customer by phone", async () => {
      // Create test service
      const { serviceId } = await createTestService(testTenantId, {
        name: "Haircut",
        durationMinutes: 30,
        price: "300",
        isActive: true,
      });

      // Create test employee
      const { userId: employeeId } = await createTestEmployee(testTenantId);

      // Create existing customer
      const { customerId: existingCustomerId } = await createTestCustomer(testTenantId, {
        firstName: "Jane",
        lastName: "Doe",
        phone: "87654321",
        email: "jane@test.com",
      });

      const result = await caller.publicBooking.createBooking({
        tenantId: testTenantId,
        serviceId,
        employeeId,
        date: "2025-12-01",
        time: "11:00:00",
        customerInfo: {
          firstName: "Jane",
          lastName: "Smith",
          phone: "87654321",
          email: "jane.new@test.com",
        },
      });

      expect(result.success).toBe(true);
      expect(result.customerId).toBe(existingCustomerId);
    });
  });
});
