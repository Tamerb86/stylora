import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

describe("POS Cash Payment", () => {
  it("should create an order and process cash payment", async () => {
    // Use known test data from the UI
    const testTenantId = "easy-charge";
    const testEmployeeId = 2; // Tamer baghdadi from the UI
    const testServiceId = 1; // Herreklipp (350 kr)

    // Create a test caller with tenant context
    const caller = appRouter.createCaller({
      user: {
        id: testEmployeeId,
        name: "Test User",
        email: "test@test.com",
        role: "admin",
        openId: "test-open-id",
        tenantId: testTenantId, // IMPORTANT: tenantProcedure requires this!
      },
      tenantId: testTenantId,
    });

    console.log("🧪 Creating order with:", {
      tenantId: testTenantId,
      employeeId: testEmployeeId,
      serviceId: testServiceId,
    });

    // Step 1: Create an order
    const orderResult = await caller.pos.createOrder({
      employeeId: testEmployeeId,
      items: [
        {
          itemType: "service",
          itemId: testServiceId,
          quantity: 1,
          unitPrice: 350,
          vatRate: 25,
        },
      ],
      orderDate: new Date().toISOString().split("T")[0],
      orderTime: "10:00",
    });

    expect(orderResult.order).toBeDefined();
    expect(orderResult.order.id).toBeTypeOf("number");
    expect(orderResult.order.status).toBe("pending");
    
    const testOrderId = orderResult.order.id;
    const orderTotal = Number(orderResult.order.total);

    console.log("✅ Order created:", {
      orderId: testOrderId,
      total: orderTotal,
      status: orderResult.order.status,
    });

    // Step 2: Process cash payment
    console.log("💵 Processing cash payment for order:", testOrderId, "amount:", orderTotal);
    
    const paymentResult = await caller.pos.recordCashPayment({
      orderId: testOrderId,
      amount: orderTotal,
    });

    expect(paymentResult.payment).toBeDefined();
    expect(paymentResult.payment.status).toBe("completed");
    expect(paymentResult.payment.paymentMethod).toBe("cash");
    expect(paymentResult.order.status).toBe("completed");

    console.log("✅ Cash payment processed:", {
      paymentId: paymentResult.payment.id,
      amount: paymentResult.payment.amount,
      status: paymentResult.payment.status,
      orderStatus: paymentResult.order.status,
    });
  });
});
