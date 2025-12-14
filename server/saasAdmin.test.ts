import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";
import { ENV } from "./_core/env";

// Mock request and response objects
const createMockContext = (user: TrpcContext["user"]): TrpcContext => ({
  req: {} as any,
  res: {
    cookie: () => {},
    clearCookie: () => {},
  } as any,
  user,
});

describe("SaaS Admin - Platform Admin Procedures", () => {
  const platformOwnerOpenId = ENV.ownerOpenId;
  const regularUserOpenId = "regular-user-123";

  describe("Authorization - platformAdminProcedure", () => {
    it("should allow platform owner to access saasAdmin.getOverview", async () => {
      const caller = appRouter.createCaller(
        createMockContext({
          id: 1,
          tenantId: "test-tenant",
          openId: platformOwnerOpenId,
          email: "owner@example.com",
          name: "Platform Owner",
          phone: null,
          loginMethod: "email",
          role: "owner",
          pin: null,
          profilePicture: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        })
      );

      const result = await caller.saasAdmin.getOverview();
      expect(result).toBeDefined();
      expect(result).toHaveProperty("totalTenants");
      expect(result).toHaveProperty("activeTenants");
      expect(result).toHaveProperty("trialTenants");
    });

    it("should block non-owner from accessing saasAdmin.getOverview", async () => {
      const caller = appRouter.createCaller(
        createMockContext({
          id: 2,
          tenantId: "test-tenant",
          openId: regularUserOpenId,
          email: "user@example.com",
          name: "Regular User",
          phone: null,
          loginMethod: "email",
          role: "admin",
          pin: null,
          profilePicture: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        })
      );

      await expect(caller.saasAdmin.getOverview()).rejects.toThrow("Platform admin access required");
    });
  });

  describe("saasAdmin.getOverview", () => {
    it("should return platform-wide statistics", async () => {
      const caller = appRouter.createCaller(
        createMockContext({
          id: 1,
          tenantId: "test-tenant",
          openId: platformOwnerOpenId,
          email: "owner@example.com",
          name: "Platform Owner",
          phone: null,
          loginMethod: "email",
          role: "owner",
          pin: null,
          profilePicture: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        })
      );

      const result = await caller.saasAdmin.getOverview();

      expect(result).toHaveProperty("totalTenants");
      expect(result).toHaveProperty("activeTenants");
      expect(result).toHaveProperty("trialTenants");
      expect(result).toHaveProperty("suspendedTenants");
      expect(result).toHaveProperty("canceledTenants");
      expect(result).toHaveProperty("totalAppointmentsLast30Days");
      expect(result).toHaveProperty("totalOrdersLast30Days");
      expect(result).toHaveProperty("totalRevenueFromOrdersLast30Days");

      expect(typeof result.totalTenants).toBe("number");
      expect(typeof result.activeTenants).toBe("number");
      expect(typeof result.totalRevenueFromOrdersLast30Days).toBe("number");
    });
  });

  describe("saasAdmin.listTenants", () => {
    it("should list all tenants with default parameters", async () => {
      const caller = appRouter.createCaller(
        createMockContext({
          id: 1,
          tenantId: "test-tenant",
          openId: platformOwnerOpenId,
          email: "owner@example.com",
          name: "Platform Owner",
          phone: null,
          loginMethod: "email",
          role: "owner",
          pin: null,
          profilePicture: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        })
      );

      const result = await caller.saasAdmin.listTenants({});

      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("page");
      expect(result).toHaveProperty("pageSize");
      expect(result).toHaveProperty("totalItems");
      expect(result).toHaveProperty("totalPages");
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it("should filter tenants by status", async () => {
      const caller = appRouter.createCaller(
        createMockContext({
          id: 1,
          tenantId: "test-tenant",
          openId: platformOwnerOpenId,
          email: "owner@example.com",
          name: "Platform Owner",
          phone: null,
          loginMethod: "email",
          role: "owner",
          pin: null,
          profilePicture: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        })
      );

      const result = await caller.saasAdmin.listTenants({ status: "active" });

      expect(result.items.every((t) => t.status === "active")).toBe(true);
    });

    it("should support pagination", async () => {
      const caller = appRouter.createCaller(
        createMockContext({
          id: 1,
          tenantId: "test-tenant",
          openId: platformOwnerOpenId,
          email: "owner@example.com",
          name: "Platform Owner",
          phone: null,
          loginMethod: "email",
          role: "owner",
          pin: null,
          profilePicture: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        })
      );

      const page1 = await caller.saasAdmin.listTenants({ page: 1, pageSize: 5 });
      expect(page1.page).toBe(1);
      expect(page1.pageSize).toBe(5);
      expect(page1.items.length).toBeLessThanOrEqual(5);
    });

    it("should search tenants by name, subdomain, or orgNumber", async () => {
      const caller = appRouter.createCaller(
        createMockContext({
          id: 1,
          tenantId: "test-tenant",
          openId: platformOwnerOpenId,
          email: "owner@example.com",
          name: "Platform Owner",
          phone: null,
          loginMethod: "email",
          role: "owner",
          pin: null,
          profilePicture: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        })
      );

      // This test assumes there's at least one tenant in the database
      const allTenants = await caller.saasAdmin.listTenants({});
      if (allTenants.items.length > 0) {
        const firstTenant = allTenants.items[0];
        const searchResult = await caller.saasAdmin.listTenants({
          search: firstTenant.name.substring(0, 3),
        });
        expect(searchResult.items.length).toBeGreaterThan(0);
      }
    });
  });

  describe("saasAdmin.getTenantDetails", () => {
    it("should return detailed tenant information", async () => {
      const caller = appRouter.createCaller(
        createMockContext({
          id: 1,
          tenantId: "test-tenant",
          openId: platformOwnerOpenId,
          email: "owner@example.com",
          name: "Platform Owner",
          phone: null,
          loginMethod: "email",
          role: "owner",
          pin: null,
          profilePicture: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        })
      );

      // Get a tenant ID from the list
      const tenants = await caller.saasAdmin.listTenants({ pageSize: 1 });
      if (tenants.items.length > 0) {
        const tenantId = tenants.items[0].id;
        const details = await caller.saasAdmin.getTenantDetails({ tenantId });

        expect(details).toHaveProperty("tenant");
        expect(details).toHaveProperty("subscription");
        expect(details).toHaveProperty("usage");

        expect(details.tenant).toHaveProperty("id");
        expect(details.tenant).toHaveProperty("name");
        expect(details.tenant).toHaveProperty("status");

        expect(details.usage).toHaveProperty("totalCustomers");
        expect(details.usage).toHaveProperty("totalEmployees");
        expect(details.usage).toHaveProperty("totalAppointments");
        expect(details.usage).toHaveProperty("totalOrders");
        expect(details.usage).toHaveProperty("last30DaysAppointments");
        expect(details.usage).toHaveProperty("last30DaysOrders");
      }
    });

    it("should throw error for non-existent tenant", async () => {
      const caller = appRouter.createCaller(
        createMockContext({
          id: 1,
          tenantId: "test-tenant",
          openId: platformOwnerOpenId,
          email: "owner@example.com",
          name: "Platform Owner",
          phone: null,
          loginMethod: "email",
          role: "owner",
          pin: null,
          profilePicture: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        })
      );

      await expect(
        caller.saasAdmin.getTenantDetails({ tenantId: "non-existent-tenant-id" })
      ).rejects.toThrow("Tenant not found");
    });
  });

  describe("saasAdmin.updateTenantPlanAndStatus", () => {
    it("should update tenant status", async () => {
      const caller = appRouter.createCaller(
        createMockContext({
          id: 1,
          tenantId: "test-tenant",
          openId: platformOwnerOpenId,
          email: "owner@example.com",
          name: "Platform Owner",
          phone: null,
          loginMethod: "email",
          role: "owner",
          pin: null,
          profilePicture: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        })
      );

      // Get a tenant ID
      const tenants = await caller.saasAdmin.listTenants({ pageSize: 1 });
      if (tenants.items.length > 0) {
        const tenantId = tenants.items[0].id;
        const originalStatus = tenants.items[0].status;
        const newStatus = originalStatus === "active" ? "trial" : "active";

        const result = await caller.saasAdmin.updateTenantPlanAndStatus({
          tenantId,
          status: newStatus,
        });

        expect(result.success).toBe(true);
        expect(result.tenant?.status).toBe(newStatus);

        // Restore original status
        await caller.saasAdmin.updateTenantPlanAndStatus({
          tenantId,
          status: originalStatus,
        });
      }
    });
  });

  describe("saasAdmin.getSubscriptionPlans", () => {
    it("should return list of active subscription plans", async () => {
      const caller = appRouter.createCaller(
        createMockContext({
          id: 1,
          tenantId: "test-tenant",
          openId: platformOwnerOpenId,
          email: "owner@example.com",
          name: "Platform Owner",
          phone: null,
          loginMethod: "email",
          role: "owner",
          pin: null,
          profilePicture: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        })
      );

      const plans = await caller.saasAdmin.getSubscriptionPlans();

      expect(Array.isArray(plans)).toBe(true);
      if (plans.length > 0) {
        expect(plans[0]).toHaveProperty("id");
        expect(plans[0]).toHaveProperty("name");
        expect(plans[0]).toHaveProperty("displayNameNo");
        expect(plans[0]).toHaveProperty("priceMonthly");
        expect(plans[0].isActive).toBe(true);
      }
    });
  });

  describe("saasAdmin.impersonateTenant", () => {
    it("should allow platform owner to impersonate a tenant", async () => {
      const mockRes = {
        cookie: () => {},
        clearCookie: () => {},
      };

      const caller = appRouter.createCaller({
        req: { headers: {} } as any,
        res: mockRes as any,
        user: {
          id: 1,
          tenantId: "test-tenant",
          openId: platformOwnerOpenId,
          email: "owner@example.com",
          name: "Platform Owner",
          phone: null,
          loginMethod: "email",
          role: "owner",
          pin: null,
          profilePicture: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        },
      });

      // Get a tenant ID
      const tenants = await caller.saasAdmin.listTenants({ pageSize: 1 });
      if (tenants.items.length > 0) {
        const tenantId = tenants.items[0].id;
        const result = await caller.saasAdmin.impersonateTenant({ tenantId });

        expect(result.success).toBe(true);
        expect(result.redirectUrl).toBe("/dashboard");
        expect(result.tenantId).toBe(tenantId);
      }
    });

    it("should fail for non-existent tenant", async () => {
      const caller = appRouter.createCaller(
        createMockContext({
          id: 1,
          tenantId: "test-tenant",
          openId: platformOwnerOpenId,
          email: "owner@example.com",
          name: "Platform Owner",
          phone: null,
          loginMethod: "email",
          role: "owner",
          pin: null,
          profilePicture: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        })
      );

      await expect(
        caller.saasAdmin.impersonateTenant({ tenantId: "non-existent-tenant" })
      ).rejects.toThrow("Tenant not found");
    });
  });

  describe("saasAdmin.clearImpersonation", () => {
    it("should clear impersonation and redirect to saas-admin", async () => {
      const mockRes = {
        cookie: () => {},
        clearCookie: () => {},
      };

      const caller = appRouter.createCaller({
        req: { headers: {} } as any,
        res: mockRes as any,
        user: {
          id: 1,
          tenantId: "test-tenant",
          openId: platformOwnerOpenId,
          email: "owner@example.com",
          name: "Platform Owner",
          phone: null,
          loginMethod: "email",
          role: "owner",
          pin: null,
          profilePicture: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        },
      });

      const result = await caller.saasAdmin.clearImpersonation();

      expect(result.success).toBe(true);
      expect(result.redirectUrl).toBe("/saas-admin");
    });
  });
});
