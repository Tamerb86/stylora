import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

/**
 * Test impersonation banner detection logic
 * 
 * The banner should ONLY show when:
 * 1. Platform owner (OWNER_OPEN_ID) is logged in
 * 2. impersonatedTenantId is set in the session
 * 
 * The banner should NOT show when:
 * 1. Regular users are logged in (even if tenantId is not "default-tenant")
 * 2. Platform owner is logged in without impersonation
 */
describe("Impersonation Banner Logic", () => {
  const mockReq = {} as any;
  const mockRes = {} as any;

  it("should NOT show banner for regular user with custom tenantId", async () => {
    // Simulate a regular user with their own tenantId (not "default-tenant")
    const regularUser: User & { impersonatedTenantId?: string | null } = {
      id: 1,
      tenantId: "user-tenant-123", // Custom tenant ID
      openId: "regular-user-openid",
      email: "user@example.com",
      name: "Regular User",
      phone: null,
      loginMethod: "email",
      role: "owner",
      pin: null,
      isActive: true,
      deactivatedAt: null,
      commissionType: "percentage",
      commissionRate: null,
      annualLeaveTotal: 25,
      annualLeaveUsed: 0,
      sickLeaveUsed: 0,
      uiMode: "simple",
      onboardingCompleted: false,
      onboardingStep: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      impersonatedTenantId: null, // No impersonation
    };

    const ctx: TrpcContext = {
      req: mockReq,
      res: mockRes,
      user: regularUser,
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();

    // Regular user should NOT have impersonatedTenantId set
    expect(result?.impersonatedTenantId).toBeNull();
    
    // This means banner will NOT show (isImpersonating = false)
    const isImpersonating = result && result.impersonatedTenantId;
    expect(isImpersonating).toBeFalsy();
  });

  it("should show banner when platform owner is impersonating", async () => {
    // Simulate platform owner impersonating another tenant
    const platformOwner: User & { impersonatedTenantId?: string | null } = {
      id: 2,
      tenantId: "impersonated-tenant-456", // Tenant being impersonated
      openId: process.env.OWNER_OPEN_ID || "platform-owner-openid",
      email: "owner@platform.com",
      name: "Platform Owner",
      phone: null,
      loginMethod: "email",
      role: "owner",
      pin: null,
      isActive: true,
      deactivatedAt: null,
      commissionType: "percentage",
      commissionRate: null,
      annualLeaveTotal: 25,
      annualLeaveUsed: 0,
      sickLeaveUsed: 0,
      uiMode: "advanced",
      onboardingCompleted: true,
      onboardingStep: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      impersonatedTenantId: "impersonated-tenant-456", // Impersonation active
    };

    const ctx: TrpcContext = {
      req: mockReq,
      res: mockRes,
      user: platformOwner,
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();

    // Platform owner impersonating should have impersonatedTenantId set
    expect(result?.impersonatedTenantId).toBe("impersonated-tenant-456");
    
    // This means banner WILL show (isImpersonating = true)
    const isImpersonating = result && result.impersonatedTenantId;
    expect(isImpersonating).toBeTruthy();
  });

  it("should NOT show banner when platform owner is not impersonating", async () => {
    // Simulate platform owner logged in normally (no impersonation)
    const platformOwner: User & { impersonatedTenantId?: string | null } = {
      id: 3,
      tenantId: "platform-owner-tenant",
      openId: process.env.OWNER_OPEN_ID || "platform-owner-openid",
      email: "owner@platform.com",
      name: "Platform Owner",
      phone: null,
      loginMethod: "email",
      role: "owner",
      pin: null,
      isActive: true,
      deactivatedAt: null,
      commissionType: "percentage",
      commissionRate: null,
      annualLeaveTotal: 25,
      annualLeaveUsed: 0,
      sickLeaveUsed: 0,
      uiMode: "advanced",
      onboardingCompleted: true,
      onboardingStep: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      impersonatedTenantId: null, // No impersonation
    };

    const ctx: TrpcContext = {
      req: mockReq,
      res: mockRes,
      user: platformOwner,
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();

    // Platform owner without impersonation should NOT have impersonatedTenantId set
    expect(result?.impersonatedTenantId).toBeNull();
    
    // This means banner will NOT show (isImpersonating = false)
    const isImpersonating = result && result.impersonatedTenantId;
    expect(isImpersonating).toBeFalsy();
  });
});
