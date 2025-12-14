import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

describe("Cancellation & No-Show Policy", () => {
  let testTenantId: string;
  let testCustomerId: number;
  let testEmployeeId: number;
  let testServiceId: number;

  beforeAll(async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("DB not initialized");

    const { tenants, customers, users, services } = await import("../drizzle/schema");

    // Create test tenant with policy settings
    const tenantId = `test-tenant-${Date.now()}`;
    await dbInstance.insert(tenants).values({
      id: tenantId,
      name: "Test Salon",
      subdomain: `test-${Date.now()}`,
      cancellationWindowHours: 24, // 24-hour cancellation window
      noShowThresholdForPrepayment: 2, // 2 no-shows before prepayment required
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });
    testTenantId = tenantId;

    // Create test customer
    const [customer] = await dbInstance.insert(customers).values({
      tenantId: testTenantId,
      firstName: "John",
      lastName: "Doe",
      phone: "+4712345678",
      email: "john@example.com",
    });
    testCustomerId = customer.insertId;

    // Create test employee
    const [employee] = await dbInstance.insert(users).values({
      tenantId: testTenantId,
      openId: `test-employee-${Date.now()}`,
      name: "Test Employee",
      role: "employee",
      isActive: true,
    });
    testEmployeeId = employee.insertId;

    // Create test service
    const [service] = await dbInstance.insert(services).values({
      tenantId: testTenantId,
      name: "Test Service",
      durationMinutes: 30,
      price: "100.00",
      isActive: true,
    });
    testServiceId = service.insertId;
  });

  afterAll(async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) return;

    const { tenants, customers, users, services, appointments } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    // Clean up test data
    await dbInstance.delete(appointments).where(eq(appointments.tenantId, testTenantId));
    await dbInstance.delete(services).where(eq(services.tenantId, testTenantId));
    await dbInstance.delete(users).where(eq(users.tenantId, testTenantId));
    await dbInstance.delete(customers).where(eq(customers.tenantId, testTenantId));
    await dbInstance.delete(tenants).where(eq(tenants.id, testTenantId));
  });

  describe("Late Cancellation Detection", () => {
    it("should mark cancellation as late when inside cancellation window", async () => {
      const ctx = {
        user: { id: testEmployeeId, tenantId: testTenantId, role: "employee" as const },
        tenantId: testTenantId,
        req: {} as any,
      };

      const caller = appRouter.createCaller(ctx);

      // Create appointment for tomorrow at 14:00
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const appointmentDate = tomorrow.toISOString().split("T")[0];

      const appointmentResult = await caller.appointments.create({
        customerId: testCustomerId,
        employeeId: testEmployeeId,
        appointmentDate,
        startTime: "14:00",
        endTime: "14:30",
        serviceIds: [testServiceId],
      });

      // Cancel the appointment (should be late since it's within 24 hours)
      await caller.appointments.updateStatus({
        id: appointmentResult.appointmentId,
        status: "canceled",
        cancellationReason: "Customer request",
      });

      // Verify isLateCancellation is true
      const dbInstance = await db.getDb();
      const { appointments } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const [appointment] = await dbInstance!
        .select()
        .from(appointments)
        .where(eq(appointments.id, appointmentResult.appointmentId));

      expect(appointment.status).toBe("canceled");
      expect(appointment.isLateCancellation).toBe(true);
    });

    it("should NOT mark cancellation as late when outside cancellation window", async () => {
      const ctx = {
        user: { id: testEmployeeId, tenantId: testTenantId, role: "employee" as const },
        tenantId: testTenantId,
        req: {} as any,
      };

      const caller = appRouter.createCaller(ctx);

      // Create appointment for 3 days from now
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      const appointmentDate = futureDate.toISOString().split("T")[0];

      const appointmentResult = await caller.appointments.create({
        customerId: testCustomerId,
        employeeId: testEmployeeId,
        appointmentDate,
        startTime: "15:00",
        endTime: "15:30",
        serviceIds: [testServiceId],
      });

      // Cancel the appointment (should NOT be late since it's > 24 hours away)
      await caller.appointments.updateStatus({
        id: appointmentResult.appointmentId,
        status: "canceled",
        cancellationReason: "Customer request",
      });

      // Verify isLateCancellation is false
      const dbInstance = await db.getDb();
      const { appointments } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const [appointment] = await dbInstance!
        .select()
        .from(appointments)
        .where(eq(appointments.id, appointmentResult.appointmentId));

      expect(appointment.status).toBe("canceled");
      expect(appointment.isLateCancellation).toBe(false);
    });
  });

  describe("No-Show Tracking", () => {
    it("should count no-shows for a customer", async () => {
      const ctx = {
        user: { id: testEmployeeId, tenantId: testTenantId, role: "employee" as const },
        tenantId: testTenantId,
        req: {} as any,
      };

      const caller = appRouter.createCaller(ctx);

      // Create and mark 2 appointments as no-show
      for (let i = 0; i < 2; i++) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + i + 1);
        const appointmentDate = futureDate.toISOString().split("T")[0];

        const appointmentResult = await caller.appointments.create({
          customerId: testCustomerId,
          employeeId: testEmployeeId,
          appointmentDate,
          startTime: `${10 + i}:00`,
          endTime: `${10 + i}:30`,
          serviceIds: [testServiceId],
        });

        await caller.appointments.updateStatus({
          id: appointmentResult.appointmentId,
          status: "no_show",
        });
      }

      // Get no-show info
      const noShowInfo = await caller.customers.getNoShowInfo({
        customerId: testCustomerId,
      });

      expect(noShowInfo.customerId).toBe(testCustomerId);
      expect(noShowInfo.noShowCount).toBe(2);
      expect(noShowInfo.noShowThresholdForPrepayment).toBe(2);
      expect(noShowInfo.hasReachedThreshold).toBe(true);
    });

    it("should return hasReachedThreshold=false when below threshold", async () => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("DB not initialized");

      const { customers } = await import("../drizzle/schema");

      // Create new customer with no no-shows
      const [newCustomer] = await dbInstance.insert(customers).values({
        tenantId: testTenantId,
        firstName: "Jane",
        lastName: "Smith",
        phone: "+4787654321",
        email: "jane@example.com",
      });

      const ctx = {
        user: { id: testEmployeeId, tenantId: testTenantId, role: "employee" as const },
        tenantId: testTenantId,
        req: {} as any,
      };

      const caller = appRouter.createCaller(ctx);

      // Get no-show info
      const noShowInfo = await caller.customers.getNoShowInfo({
        customerId: newCustomer.insertId,
      });

      expect(noShowInfo.customerId).toBe(newCustomer.insertId);
      expect(noShowInfo.noShowCount).toBe(0);
      expect(noShowInfo.noShowThresholdForPrepayment).toBe(2);
      expect(noShowInfo.hasReachedThreshold).toBe(false);
    });
  });

  describe("Tenant Policy Configuration", () => {
    it("should respect custom cancellation window hours", async () => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("DB not initialized");

      const { tenants, customers, users, services, appointments } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      // Create tenant with 48-hour cancellation window
      const customTenantId = `test-tenant-custom-${Date.now()}`;
      await dbInstance.insert(tenants).values({
        id: customTenantId,
        name: "Custom Salon",
        subdomain: `custom-${Date.now()}`,
        cancellationWindowHours: 48, // 48-hour window
        noShowThresholdForPrepayment: 3,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });

      // Create customer, employee, service for this tenant
      const [customer] = await dbInstance.insert(customers).values({
        tenantId: customTenantId,
        firstName: "Test",
        lastName: "User",
        phone: "+4711111111",
        email: "test@example.com",
      });

      const [employee] = await dbInstance.insert(users).values({
        tenantId: customTenantId,
        openId: `test-employee-custom-${Date.now()}`,
        name: "Test Employee",
        role: "employee",
        isActive: true,
      });

      const [service] = await dbInstance.insert(services).values({
        tenantId: customTenantId,
        name: "Test Service",
        durationMinutes: 30,
        price: "100.00",
        isActive: true,
      });

      const ctx = {
        user: { id: employee.insertId, tenantId: customTenantId, role: "employee" as const },
        tenantId: customTenantId,
        req: {} as any,
      };

      const caller = appRouter.createCaller(ctx);

      // Create appointment for 2 days from now
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      const appointmentDate = futureDate.toISOString().split("T")[0];

      const appointmentResult = await caller.appointments.create({
        customerId: customer.insertId,
        employeeId: employee.insertId,
        appointmentDate,
        startTime: "16:00",
        endTime: "16:30",
        serviceIds: [service.insertId],
      });

      // Cancel the appointment (should be late since it's within 48 hours)
      await caller.appointments.updateStatus({
        id: appointmentResult.appointmentId,
        status: "canceled",
      });

      // Verify isLateCancellation is true
      const [appointment] = await dbInstance
        .select()
        .from(appointments)
        .where(eq(appointments.id, appointmentResult.appointmentId));

      expect(appointment.isLateCancellation).toBe(true);

      // Clean up
      await dbInstance.delete(appointments).where(eq(appointments.tenantId, customTenantId));
      await dbInstance.delete(services).where(eq(services.tenantId, customTenantId));
      await dbInstance.delete(users).where(eq(users.tenantId, customTenantId));
      await dbInstance.delete(customers).where(eq(customers.tenantId, customTenantId));
      await dbInstance.delete(tenants).where(eq(tenants.id, customTenantId));
    });
  });
});
