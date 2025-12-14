import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

/**
 * Test suite for POS (Point of Sale) backend functionality
 * 
 * Tests order creation and payment recording for in-salon sales
 */

describe("POS Backend", () => {
  let testTenantId: string;
  let testEmployeeId: number;
  let testServiceId: number;
  let testProductId: number;
  let testCustomerId: number;

  beforeAll(async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) {
      throw new Error("Database not available for testing");
    }

    const { tenants, users, services, products, customers } = await import("../drizzle/schema");
    
    // Create test tenant
    testTenantId = `test-pos-tenant-${Date.now()}`;
    
    await dbInstance.insert(tenants).values({
      id: testTenantId,
      name: "Test POS Salon",
      subdomain: `test-pos-${Date.now()}`,
      status: "active",
      emailVerified: true, // Required for email features
    });

    // Create test employee
    const [employee] = await dbInstance.insert(users).values({
      tenantId: testTenantId,
      openId: `test-pos-employee-${Date.now()}`,
      name: "Test Cashier",
      role: "employee",
      isActive: true,
    });
    testEmployeeId = employee.insertId;

    // Create test service
    const [service] = await dbInstance.insert(services).values({
      tenantId: testTenantId,
      name: "Test Haircut",
      durationMinutes: 30,
      price: "400.00",
      isActive: true,
    });
    testServiceId = service.insertId;

    // Create test product
    const [product] = await dbInstance.insert(products).values({
      tenantId: testTenantId,
      sku: `TEST-GEL-${Date.now()}`,
      name: "Test Hair Gel",
      retailPrice: "150.00",
      costPrice: "100.00",
      vatRate: "25.00",
      stockQuantity: 100,
      isActive: true,
    });
    testProductId = product.insertId;

    // Create test customer
    const [customer] = await dbInstance.insert(customers).values({
      tenantId: testTenantId,
      firstName: "Test",
      lastName: "Customer",
      phone: "+4712345678",
    });
    testCustomerId = customer.insertId;
  });

  describe("pos.createOrder", () => {
    it("should create order with service items", async () => {
      const { appRouter } = await import("./routers");
      const { createContext } = await import("./_core/context");

      // Create mock authenticated context
      const ctx = await createContext({
        req: {
          headers: {},
          cookies: {},
        } as any,
        res: {} as any,
      });

      // Mock user with tenant
      ctx.user = {
        id: testEmployeeId,
        tenantId: testTenantId,
        role: "employee",
      } as any;

      const caller = appRouter.createCaller(ctx);

      const result = await caller.pos.createOrder({
        employeeId: testEmployeeId,
        customerId: testCustomerId,
        orderDate: "2025-12-01",
        orderTime: "10:30",
        items: [
          {
            itemType: "service",
            itemId: testServiceId,
            quantity: 1,
            unitPrice: 400,
            vatRate: 25,
          },
        ],
      });

      // Verify response structure
      expect(result.order).toBeDefined();
      expect(result.items).toBeDefined();
      expect(result.items.length).toBe(1);

      // Verify order details
      expect(result.order.tenantId).toBe(testTenantId);
      expect(result.order.employeeId).toBe(testEmployeeId);
      expect(result.order.customerId).toBe(testCustomerId);
      expect(result.order.status).toBe("pending");
      expect(result.order.subtotal).toBe("400.00");
      expect(result.order.vatAmount).toBe("100.00"); // 25% of 400
      expect(result.order.total).toBe("500.00"); // 400 + 100

      // Verify order item
      expect(result.items[0].itemType).toBe("service");
      expect(result.items[0].itemId).toBe(testServiceId);
      expect(result.items[0].quantity).toBe(1);
      expect(result.items[0].unitPrice).toBe("400.00");
      expect(result.items[0].total).toBe("400.00");
    });

    it("should create order with multiple items (service + product)", async () => {
      const { appRouter } = await import("./routers");
      const { createContext } = await import("./_core/context");

      const ctx = await createContext({
        req: { headers: {}, cookies: {} } as any,
        res: {} as any,
      });

      ctx.user = {
        id: testEmployeeId,
        tenantId: testTenantId,
        role: "employee",
      } as any;

      const caller = appRouter.createCaller(ctx);

      const result = await caller.pos.createOrder({
        employeeId: testEmployeeId,
        customerId: testCustomerId,
        orderDate: "2025-12-02",
        orderTime: "14:00",
        items: [
          {
            itemType: "service",
            itemId: testServiceId,
            quantity: 1,
            unitPrice: 400,
            vatRate: 25,
          },
          {
            itemType: "product",
            itemId: testProductId,
            quantity: 2,
            unitPrice: 150,
            vatRate: 25,
          },
        ],
      });

      expect(result.items.length).toBe(2);
      
      // Verify totals: (400 + 150*2) = 700, VAT = 175, Total = 875
      expect(result.order.subtotal).toBe("700.00");
      expect(result.order.vatAmount).toBe("175.00");
      expect(result.order.total).toBe("875.00");
    });

    it("should create walk-in order without customer or appointment", async () => {
      const { appRouter } = await import("./routers");
      const { createContext } = await import("./_core/context");

      const ctx = await createContext({
        req: { headers: {}, cookies: {} } as any,
        res: {} as any,
      });

      ctx.user = {
        id: testEmployeeId,
        tenantId: testTenantId,
        role: "employee",
      } as any;

      const caller = appRouter.createCaller(ctx);

      const result = await caller.pos.createOrder({
        employeeId: testEmployeeId,
        orderDate: "2025-12-03",
        orderTime: "16:00",
        items: [
          {
            itemType: "service",
            itemId: testServiceId,
            quantity: 1,
            unitPrice: 400,
            vatRate: 25,
          },
        ],
      });

      expect(result.order.customerId).toBeNull();
      expect(result.order.appointmentId).toBeNull();
      expect(result.order.status).toBe("pending");
    });

    it("should reject order with no items", async () => {
      const { appRouter } = await import("./routers");
      const { createContext } = await import("./_core/context");

      const ctx = await createContext({
        req: { headers: {}, cookies: {} } as any,
        res: {} as any,
      });

      ctx.user = {
        id: testEmployeeId,
        tenantId: testTenantId,
        role: "employee",
      } as any;

      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.pos.createOrder({
          employeeId: testEmployeeId,
          orderDate: "2025-12-04",
          orderTime: "10:00",
          items: [],
        })
      ).rejects.toThrow("At least one item is required");
    });
  });

  describe("pos.recordCashPayment", () => {
    it("should record cash payment and mark order as completed", async () => {
      const { appRouter } = await import("./routers");
      const { createContext } = await import("./_core/context");

      const ctx = await createContext({
        req: { headers: {}, cookies: {} } as any,
        res: {} as any,
      });

      ctx.user = {
        id: testEmployeeId,
        tenantId: testTenantId,
        role: "employee",
      } as any;

      const caller = appRouter.createCaller(ctx);

      // First create an order
      const orderResult = await caller.pos.createOrder({
        employeeId: testEmployeeId,
        orderDate: "2025-12-05",
        orderTime: "11:00",
        items: [
          {
            itemType: "service",
            itemId: testServiceId,
            quantity: 1,
            unitPrice: 400,
            vatRate: 25,
          },
        ],
      });

      const orderId = orderResult.order.id;
      const totalAmount = Number(orderResult.order.total);

      // Record cash payment
      const paymentResult = await caller.pos.recordCashPayment({
        orderId,
        amount: totalAmount,
      });

      // Verify payment
      expect(paymentResult.payment).toBeDefined();
      expect(paymentResult.payment.orderId).toBe(orderId);
      expect(paymentResult.payment.paymentMethod).toBe("cash");
      expect(paymentResult.payment.status).toBe("completed");
      expect(paymentResult.payment.amount).toBe("500.00");
      expect(paymentResult.payment.currency).toBe("NOK");
      expect(paymentResult.payment.processedBy).toBe(testEmployeeId);
      expect(paymentResult.payment.processedAt).toBeDefined();

      // Verify order status updated
      expect(paymentResult.order.status).toBe("completed");
    });

    it("should reject payment with incorrect amount", async () => {
      const { appRouter } = await import("./routers");
      const { createContext } = await import("./_core/context");

      const ctx = await createContext({
        req: { headers: {}, cookies: {} } as any,
        res: {} as any,
      });

      ctx.user = {
        id: testEmployeeId,
        tenantId: testTenantId,
        role: "employee",
      } as any;

      const caller = appRouter.createCaller(ctx);

      // Create order
      const orderResult = await caller.pos.createOrder({
        employeeId: testEmployeeId,
        orderDate: "2025-12-06",
        orderTime: "12:00",
        items: [
          {
            itemType: "service",
            itemId: testServiceId,
            quantity: 1,
            unitPrice: 400,
            vatRate: 25,
          },
        ],
      });

      // Try to pay wrong amount
      await expect(
        caller.pos.recordCashPayment({
          orderId: orderResult.order.id,
          amount: 300, // Wrong amount (should be 500)
        })
      ).rejects.toThrow("does not match order total");
    });

    it("should reject payment for non-existent order", async () => {
      const { appRouter } = await import("./routers");
      const { createContext } = await import("./_core/context");

      const ctx = await createContext({
        req: { headers: {}, cookies: {} } as any,
        res: {} as any,
      });

      ctx.user = {
        id: testEmployeeId,
        tenantId: testTenantId,
        role: "employee",
      } as any;

      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.pos.recordCashPayment({
          orderId: 999999,
          amount: 500,
        })
      ).rejects.toThrow("Order not found");
    });
  });

  describe("pos.recordCardPayment", () => {
    it("should record card payment with card details", async () => {
      const { appRouter } = await import("./routers");
      const { createContext } = await import("./_core/context");

      const ctx = await createContext({
        req: { headers: {}, cookies: {} } as any,
        res: {} as any,
      });

      ctx.user = {
        id: testEmployeeId,
        tenantId: testTenantId,
        role: "employee",
      } as any;

      const caller = appRouter.createCaller(ctx);

      // Create order
      const orderResult = await caller.pos.createOrder({
        employeeId: testEmployeeId,
        orderDate: "2025-12-07",
        orderTime: "13:00",
        items: [
          {
            itemType: "service",
            itemId: testServiceId,
            quantity: 1,
            unitPrice: 400,
            vatRate: 25,
          },
        ],
      });

      const orderId = orderResult.order.id;
      const totalAmount = Number(orderResult.order.total);

      // Record card payment
      const paymentResult = await caller.pos.recordCardPayment({
        orderId,
        amount: totalAmount,
        cardBrand: "Visa",
        lastFour: "4242",
      });

      // Verify payment
      expect(paymentResult.payment.paymentMethod).toBe("card");
      expect(paymentResult.payment.status).toBe("completed");
      expect(paymentResult.payment.cardBrand).toBe("Visa");
      expect(paymentResult.payment.cardLast4).toBe("4242");
      expect(paymentResult.payment.paymentGateway).toBeNull(); // POS terminal, not Stripe

      // Verify order completed
      expect(paymentResult.order.status).toBe("completed");
    });

    it("should record card payment without card details", async () => {
      const { appRouter } = await import("./routers");
      const { createContext } = await import("./_core/context");

      const ctx = await createContext({
        req: { headers: {}, cookies: {} } as any,
        res: {} as any,
      });

      ctx.user = {
        id: testEmployeeId,
        tenantId: testTenantId,
        role: "employee",
      } as any;

      const caller = appRouter.createCaller(ctx);

      // Create order
      const orderResult = await caller.pos.createOrder({
        employeeId: testEmployeeId,
        orderDate: "2025-12-08",
        orderTime: "14:00",
        items: [
          {
            itemType: "product",
            itemId: testProductId,
            quantity: 1,
            unitPrice: 150,
            vatRate: 25,
          },
        ],
      });

      // Record card payment without details
      const paymentResult = await caller.pos.recordCardPayment({
        orderId: orderResult.order.id,
        amount: Number(orderResult.order.total),
      });

      expect(paymentResult.payment.paymentMethod).toBe("card");
      expect(paymentResult.payment.cardBrand).toBeNull();
      expect(paymentResult.payment.cardLast4).toBeNull();
      expect(paymentResult.order.status).toBe("completed");
    });
  });

  describe("Multi-tenant isolation", () => {
    it("should prevent access to orders from different tenant", async () => {
      const { appRouter } = await import("./routers");
      const { createContext } = await import("./_core/context");

      // Create order in first tenant
      const ctx1 = await createContext({
        req: { headers: {}, cookies: {} } as any,
        res: {} as any,
      });

      ctx1.user = {
        id: testEmployeeId,
        tenantId: testTenantId,
        role: "employee",
      } as any;

      const caller1 = appRouter.createCaller(ctx1);

      const orderResult = await caller1.pos.createOrder({
        employeeId: testEmployeeId,
        orderDate: "2025-12-09",
        orderTime: "15:00",
        items: [
          {
            itemType: "service",
            itemId: testServiceId,
            quantity: 1,
            unitPrice: 400,
            vatRate: 25,
          },
        ],
      });

      // Try to pay from different tenant
      const ctx2 = await createContext({
        req: { headers: {}, cookies: {} } as any,
        res: {} as any,
      });

      ctx2.user = {
        id: 999,
        tenantId: "different-tenant",
        role: "employee",
      } as any;

      const caller2 = appRouter.createCaller(ctx2);

      await expect(
        caller2.pos.recordCashPayment({
          orderId: orderResult.order.id,
          amount: Number(orderResult.order.total),
        })
      ).rejects.toThrow("Tenant not found");
    });
  });
});
