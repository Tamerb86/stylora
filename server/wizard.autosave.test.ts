import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("Wizard Auto-Save", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let tenantId: string;

  beforeAll(async () => {
    tenantId = "test-tenant-wizard-autosave";

    // Create a test context with tenant
    const mockContext: TrpcContext = {
      user: {
        id: 1,
        openId: "test-user",
        email: "test@example.com",
        name: "Test User",
        role: "owner",
        loginMethod: "manus",
        tenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      tenantId,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    caller = appRouter.createCaller(mockContext);

    // Clean up any existing test data
    const db = await import("./db");
    const dbInstance = await db.getDb();
    if (dbInstance) {
      const { tenants } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      // Delete existing test tenant if exists
      await dbInstance.delete(tenants).where(eq(tenants.id, tenantId));
      
      // Create fresh test tenant
      await dbInstance.insert(tenants).values({
        id: tenantId,
        name: "Test Salon AutoSave",
        subdomain: "test-autosave-wizard",
        onboardingCompleted: false,
        onboardingStep: "welcome",,

        emailVerified: true,

        emailVerifiedAt: new Date(),

      });
    }
  });

  it("should save draft data successfully", async () => {
    const draftData = {
      serviceName: "Herreklipp",
      serviceDuration: "30",
      servicePrice: "350",
      serviceDescription: "Standard herreklipp",
      employeeName: "John Doe",
      employeeEmail: "john@example.com",
      employeePhone: "+4712345678",
      employeeCommission: "40",
      skipEmployee: false,
      openTime: "09:00",
      closeTime: "17:00",
      workDays: [1, 2, 3, 4, 5],
    };

    const result = await caller.wizard.saveDraftData(draftData);
    expect(result.success).toBe(true);
  });

  it("should retrieve saved draft data", async () => {
    const draftData = {
      serviceName: "Dameklipp",
      serviceDuration: "45",
      servicePrice: "450",
      serviceDescription: "Dameklipp med styling",
      employeeName: "Jane Smith",
      employeeEmail: "jane@example.com",
      employeePhone: "+4787654321",
      employeeCommission: "50",
      skipEmployee: false,
      openTime: "10:00",
      closeTime: "18:00",
      workDays: [1, 2, 3, 4, 5, 6],
    };

    // Save draft
    await caller.wizard.saveDraftData(draftData);

    // Retrieve draft
    const retrieved = await caller.wizard.getDraftData();
    
    expect(retrieved).toBeDefined();
    expect(retrieved.serviceName).toBe("Dameklipp");
    expect(retrieved.serviceDuration).toBe("45");
    expect(retrieved.servicePrice).toBe("450");
    expect(retrieved.employeeName).toBe("Jane Smith");
    expect(retrieved.openTime).toBe("10:00");
    expect(retrieved.workDays).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("should handle partial draft data", async () => {
    const partialData = {
      serviceName: "Skjeggklipp",
      servicePrice: "200",
    };

    const result = await caller.wizard.saveDraftData(partialData);
    expect(result.success).toBe(true);

    const retrieved = await caller.wizard.getDraftData();
    expect(retrieved.serviceName).toBe("Skjeggklipp");
    expect(retrieved.servicePrice).toBe("200");
  });

  it("should clear draft data when empty object is passed", async () => {
    // First save some data
    await caller.wizard.saveDraftData({
      serviceName: "Test Service",
      servicePrice: "100",
    });

    // Then clear it
    await caller.wizard.saveDraftData({});

    const retrieved = await caller.wizard.getDraftData();
    // Should return empty object or null
    expect(retrieved === null || Object.keys(retrieved).length === 0).toBe(true);
  });

  it("should return null for tenant with no draft data", async () => {
    // Create a new tenant without draft data
    const db = await import("./db");
    const dbInstance = await db.getDb();
    if (dbInstance) {
      const { tenants } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const newTenantId = "test-tenant-no-draft";
      
      // Delete if exists
      await dbInstance.delete(tenants).where(eq(tenants.id, newTenantId));
      
      await dbInstance.insert(tenants).values({
        id: newTenantId,
        name: "Test Salon No Draft",
        subdomain: "test-no-draft",
        onboardingCompleted: false,
        onboardingStep: "welcome",,

        emailVerified: true,

        emailVerifiedAt: new Date(),

      });

      // Create caller for new tenant
      const newContext: TrpcContext = {
        user: {
          id: 2,
          openId: "test-user-2",
          email: "test2@example.com",
          name: "Test User 2",
          role: "owner",
          loginMethod: "manus",
          tenantId: newTenantId,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        },
        tenantId: newTenantId,
        req: {
          protocol: "https",
          headers: {},
        } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      };

      const newCaller = appRouter.createCaller(newContext);

      const retrieved = await newCaller.wizard.getDraftData();
      expect(retrieved).toBeNull();
    }
  });
});
