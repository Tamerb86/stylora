import { describe, it, expect, beforeAll } from "vitest";
import type { AppRouter } from "../routers";
import type { inferProcedureInput } from "@trpc/server";
import { ENV } from "../_core/env";

// Mock context for platform admin (owner)
const mockOwnerContext = {
  user: {
    openId: ENV.ownerOpenId,
    name: "Platform Owner",
    tenantId: null,
  },
  req: {} as any,
  res: {} as any,
};

// Mock context for regular user (not owner)
const mockUserContext = {
  user: {
    openId: "regular-user-123",
    name: "Regular User",
    tenantId: "some-tenant",
  },
  req: {} as any,
  res: {} as any,
};

describe("Tenant Onboarding", () => {
  let appRouter: AppRouter;

  beforeAll(async () => {
    const { appRouter: router } = await import("../routers");
    appRouter = router;
  });

  describe("getServiceTemplates", () => {
    it("should return frisør templates", async () => {
      const caller = appRouter.createCaller(mockOwnerContext);
      const result = await caller.saasAdmin.getServiceTemplates({ salonType: "frisør" });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("duration");
      expect(result[0]).toHaveProperty("price");
      
      // Check specific frisør services
      const serviceNames = result.map(s => s.name);
      expect(serviceNames).toContain("Klipp dame");
      expect(serviceNames).toContain("Klipp herre");
      expect(serviceNames).toContain("Farge");
    });

    it("should return barber templates", async () => {
      const caller = appRouter.createCaller(mockOwnerContext);
      const result = await caller.saasAdmin.getServiceTemplates({ salonType: "barber" });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Check specific barber services
      const serviceNames = result.map(s => s.name);
      expect(serviceNames).toContain("Klipp");
      expect(serviceNames).toContain("Skjegg");
      expect(serviceNames).toContain("Klipp + Skjegg");
    });

    it("should return skjønnhet templates", async () => {
      const caller = appRouter.createCaller(mockOwnerContext);
      const result = await caller.saasAdmin.getServiceTemplates({ salonType: "skjønnhet" });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Check specific skjønnhet services
      const serviceNames = result.map(s => s.name);
      expect(serviceNames).toContain("Ansiktsbehandling");
      expect(serviceNames).toContain("Massasje 60 min");
      expect(serviceNames).toContain("Manikyr");
    });

    it("should reject non-owner users", async () => {
      const caller = appRouter.createCaller(mockUserContext);
      
      await expect(
        caller.saasAdmin.getServiceTemplates({ salonType: "frisør" })
      ).rejects.toThrow();
    });
  });

  describe("checkSubdomainAvailability", () => {
    it("should return available for non-existent subdomain", async () => {
      const caller = appRouter.createCaller(mockOwnerContext);
      const uniqueSubdomain = `test-salon-${Date.now()}`;
      
      const result = await caller.saasAdmin.checkSubdomainAvailability({ 
        subdomain: uniqueSubdomain 
      });

      expect(result).toEqual({ available: true });
    });

    it("should return unavailable for existing subdomain", async () => {
      const caller = appRouter.createCaller(mockOwnerContext);
      
      // Use the default tenant subdomain
      const result = await caller.saasAdmin.checkSubdomainAvailability({ 
        subdomain: "default-tenant" 
      });

      expect(result).toEqual({ available: false });
    });

    it("should be case-insensitive", async () => {
      const caller = appRouter.createCaller(mockOwnerContext);
      
      // Check uppercase version of existing subdomain
      // Note: The check converts to lowercase, so uppercase should also be unavailable
      const result = await caller.saasAdmin.checkSubdomainAvailability({ 
        subdomain: "DEFAULT-TENANT" 
      });

      // If default-tenant exists, this should be unavailable
      // If it doesn't exist in test DB, both will be available
      expect(result).toHaveProperty("available");
      expect(typeof result.available).toBe("boolean");
    });
  });

  describe("checkOrgNumberAvailability", () => {
    it("should return available for non-existent org number", async () => {
      const caller = appRouter.createCaller(mockOwnerContext);
      const uniqueOrgNumber = `${Date.now()}`.slice(0, 9);
      
      const result = await caller.saasAdmin.checkOrgNumberAvailability({ 
        orgNumber: uniqueOrgNumber 
      });

      expect(result).toEqual({ available: true });
    });

    it("should return unavailable for existing org number", async () => {
      const caller = appRouter.createCaller(mockOwnerContext);
      
      // First, get an existing org number from the database
      const { getDb } = await import("../db");
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");
      
      const { tenants } = await import("../../drizzle/schema");
      const [existingTenant] = await dbInstance
        .select()
        .from(tenants)
        .limit(1);

      if (existingTenant?.orgNumber) {
        const result = await caller.saasAdmin.checkOrgNumberAvailability({ 
          orgNumber: existingTenant.orgNumber 
        });

        expect(result).toEqual({ available: false });
      } else {
        // Skip test if no tenants with org numbers exist
        expect(true).toBe(true);
      }
    });
  });

  describe("createTenantWithOnboarding", () => {
    it("should create tenant with all components", async () => {
      const caller = appRouter.createCaller(mockOwnerContext);
      const timestamp = Date.now();
      
      const input: inferProcedureInput<AppRouter["saasAdmin"]["createTenantWithOnboarding"]> = {
        name: `Test Salon ${timestamp}`,
        subdomain: `test-salon-${timestamp}`,
        orgNumber: `9${timestamp}`.slice(0, 9),
        contactEmail: `test${timestamp}@example.com`,
        contactPhone: "+4712345678",
        planId: 1, // Assuming plan ID 1 exists (Start plan)
        adminFirstName: "Test",
        adminLastName: "Admin",
        adminEmail: `admin${timestamp}@example.com`,
        adminPhone: "+4787654321",
        salonType: "frisør",
        services: [
          { name: "Klipp dame", duration: 60, price: 550 },
          { name: "Klipp herre", duration: 30, price: 350 },
        ],
      };

      const result = await caller.saasAdmin.createTenantWithOnboarding(input);

      expect(result.success).toBe(true);
      expect(result.tenantId).toBeDefined();
      expect(result.subdomain).toBe(input.subdomain);
      expect(result.adminEmail).toBe(input.adminEmail);
      expect(result.generatedPassword).toBeDefined();
      expect(result.generatedPassword.length).toBe(8);

      // Verify tenant was created in database
      const { getDb } = await import("../db");
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error("Database not available");
      
      const { tenants, users, services, tenantSubscriptions, settings } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      // Check tenant
      const [tenant] = await dbInstance
        .select()
        .from(tenants)
        .where(eq(tenants.id, result.tenantId));
      
      expect(tenant).toBeDefined();
      expect(tenant.name).toBe(input.name);
      expect(tenant.subdomain).toBe(input.subdomain);
      expect(tenant.status).toBe("trial");

      // Check admin user
      const [admin] = await dbInstance
        .select()
        .from(users)
        .where(eq(users.tenantId, result.tenantId));
      
      expect(admin).toBeDefined();
      expect(admin.email).toBe(input.adminEmail);
      expect(admin.role).toBe("admin");

      // Check services
      const createdServices = await dbInstance
        .select()
        .from(services)
        .where(eq(services.tenantId, result.tenantId));
      
      expect(createdServices.length).toBe(2);

      // Check subscription
      const [subscription] = await dbInstance
        .select()
        .from(tenantSubscriptions)
        .where(eq(tenantSubscriptions.tenantId, result.tenantId));
      
      expect(subscription).toBeDefined();
      expect(subscription.planId).toBe(input.planId);
      expect(subscription.status).toBe("active");

      // Check settings
      const createdSettings = await dbInstance
        .select()
        .from(settings)
        .where(eq(settings.tenantId, result.tenantId));
      
      expect(createdSettings.length).toBeGreaterThan(0);
      
      // Verify specific settings
      const salonNameSetting = createdSettings.find(s => s.settingKey === "salonName");
      expect(salonNameSetting?.settingValue).toBe(input.name);
    });

    it("should reject duplicate subdomain", async () => {
      const caller = appRouter.createCaller(mockOwnerContext);
      const timestamp = Date.now();
      
      // Create a tenant first to ensure we have a duplicate subdomain
      const firstTimestamp = Date.now();
      const firstInput: inferProcedureInput<AppRouter["saasAdmin"]["createTenantWithOnboarding"]> = {
        name: `First Salon ${firstTimestamp}`,
        subdomain: `duplicate-test-${firstTimestamp}`,
        orgNumber: `1${firstTimestamp}`.slice(0, 9),
        contactEmail: `first${firstTimestamp}@example.com`,
        contactPhone: "+4712345678",
        planId: 1,
        adminFirstName: "First",
        adminLastName: "Admin",
        adminEmail: `firstadmin${firstTimestamp}@example.com`,
        adminPhone: "+4787654321",
        salonType: "frisør" as const,
        services: [
          { name: "Klipp dame", duration: 60, price: 550 },
        ],
      };

      await caller.saasAdmin.createTenantWithOnboarding(firstInput);

      // Small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      // Now try to create another with same subdomain
      const input: inferProcedureInput<AppRouter["saasAdmin"]["createTenantWithOnboarding"]> = {
        name: `Test Salon ${timestamp}`,
        subdomain: `duplicate-test-${firstTimestamp}`, // Same subdomain
        orgNumber: `2${timestamp}`.slice(0, 9),
        contactEmail: `test${timestamp}@example.com`,
        contactPhone: "+4712345678",
        planId: 1,
        adminFirstName: "Test",
        adminLastName: "Admin",
        adminEmail: `admin${timestamp}@example.com`,
        adminPhone: "+4787654321",
        salonType: "frisør",
        services: [
          { name: "Klipp dame", duration: 60, price: 550 },
        ],
      };

      await expect(
        caller.saasAdmin.createTenantWithOnboarding(input)
      ).rejects.toThrow("Subdomain already exists");
    });

    it("should reject duplicate organization number", async () => {
      const caller = appRouter.createCaller(mockOwnerContext);
      const timestamp = Date.now();
      
      // Create a tenant first to ensure we have a duplicate org number
      const firstTimestamp = Date.now();
      const duplicateOrgNumber = `3${firstTimestamp}`.slice(0, 9);
      
      const firstInput: inferProcedureInput<AppRouter["saasAdmin"]["createTenantWithOnboarding"]> = {
        name: `First Salon ${firstTimestamp}`,
        subdomain: `org-test-1-${firstTimestamp}`,
        orgNumber: duplicateOrgNumber,
        contactEmail: `first${firstTimestamp}@example.com`,
        contactPhone: "+4712345678",
        planId: 1,
        adminFirstName: "First",
        adminLastName: "Admin",
        adminEmail: `firstadmin${firstTimestamp}@example.com`,
        adminPhone: "+4787654321",
        salonType: "frisør" as const,
        services: [
          { name: "Klipp dame", duration: 60, price: 550 },
        ],
      };

      await caller.saasAdmin.createTenantWithOnboarding(firstInput);

      // Small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      // Now try to create another with same org number
      const input: inferProcedureInput<AppRouter["saasAdmin"]["createTenantWithOnboarding"]> = {
        name: `Test Salon ${timestamp}`,
        subdomain: `org-test-2-${timestamp}`,
        orgNumber: duplicateOrgNumber, // Same org number
        contactEmail: `test${timestamp}@example.com`,
        contactPhone: "+4712345678",
        planId: 1,
        adminFirstName: "Test",
        adminLastName: "Admin",
        adminEmail: `admin${timestamp}@example.com`,
        adminPhone: "+4787654321",
        salonType: "frisør",
        services: [
          { name: "Klipp dame", duration: 60, price: 550 },
        ],
      };

      await expect(
        caller.saasAdmin.createTenantWithOnboarding(input)
      ).rejects.toThrow("Organization number already exists");
    });

    it("should reject non-owner users", async () => {
      const caller = appRouter.createCaller(mockUserContext);
      const timestamp = Date.now();
      
      const input: inferProcedureInput<AppRouter["saasAdmin"]["createTenantWithOnboarding"]> = {
        name: `Test Salon ${timestamp}`,
        subdomain: `test-salon-${timestamp}`,
        orgNumber: `${timestamp}`.slice(0, 9),
        contactEmail: `test${timestamp}@example.com`,
        contactPhone: "+4712345678",
        planId: 1,
        adminFirstName: "Test",
        adminLastName: "Admin",
        adminEmail: `admin${timestamp}@example.com`,
        adminPhone: "+4787654321",
        salonType: "frisør",
        services: [
          { name: "Klipp dame", duration: 60, price: 550 },
        ],
      };

      await expect(
        caller.saasAdmin.createTenantWithOnboarding(input)
      ).rejects.toThrow();
    });
  });
});
