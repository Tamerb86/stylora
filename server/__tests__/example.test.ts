/**
 * Example Test File
 * 
 * This file demonstrates how to use the centralized test helpers
 * to create consistent, maintainable tests.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "../routers";
import {
  createTestEnvironment,
  createTestEmployee,
  cleanupTestTenant,
  TEST_TIMEOUTS,
} from "../test-helpers";

describe("Example Test Suite", () => {
  let tenantId: string;
  let userId: number;
  let mockContext: any;

  beforeAll(async () => {
    // Create a complete test environment with tenant and admin user
    // All required fields are automatically set, including:
    // - emailVerified: true
    // - emailVerifiedAt: current date
    // - onboardingCompleted: true
    // - subscriptionPlan: "pro"
    // - subscriptionStatus: "active"
    const env = await createTestEnvironment();
    
    tenantId = env.tenantId;
    userId = env.userId;
    mockContext = env.mockContext;
  }, TEST_TIMEOUTS.MEDIUM);

  afterAll(async () => {
    // Clean up all test data
    await cleanupTestTenant(tenantId);
  });

  it("should have a properly configured test environment", () => {
    expect(tenantId).toBeDefined();
    expect(userId).toBeDefined();
    expect(mockContext.user.tenantId).toBe(tenantId);
    expect(mockContext.user.role).toBe("admin");
  });

  it("should be able to call tRPC procedures with mock context", async () => {
    const caller = appRouter.createCaller(mockContext);
    
    // Example: Call a procedure that requires authentication
    // The mockContext provides all required user fields
    const result = await caller.auth.me();
    
    expect(result).toBeDefined();
    expect(result.id).toBe(userId);
    expect(result.tenantId).toBe(tenantId);
  });

  it("should be able to create test employees with PIN", async () => {
    // Create an employee with a PIN for time clock testing
    const { userId: employeeId, user: employee, pin } = await createTestEmployee(tenantId, "1234");
    
    expect(employee.role).toBe("employee");
    expect(employee.pin).toBeDefined();
    expect(pin).toBe("1234"); // Plain PIN is returned for testing
    
    // You can now test time clock procedures with this employee
    const employeeContext = {
      user: {
        id: employeeId,
        tenantId: employee.tenantId,
        openId: employee.openId,
        email: employee.email,
        name: employee.name,
        role: employee.role,
      },
      req: {} as any,
      res: {} as any,
    };
    
    const caller = appRouter.createCaller(employeeContext);
    // Test employee-specific procedures here
  });

  it("should be able to customize test tenant configuration", async () => {
    // You can override default values when creating test data
    const customEnv = await createTestEnvironment(
      {
        name: "Custom Salon Name",
        status: "trial",
        emailVerified: false, // Override default (normally true)
      },
      {
        firstName: "John",
        lastName: "Doe",
        role: "owner",
      }
    );
    
    expect(customEnv.tenant.name).toBe("Custom Salon Name");
    expect(customEnv.tenant.status).toBe("trial");
    expect(customEnv.tenant.emailVerified).toBe(false);
    expect(customEnv.user.name).toBe("John Doe");
    expect(customEnv.user.role).toBe("owner");
    
    // Clean up custom environment
    await cleanupTestTenant(customEnv.tenantId);
  });
});
