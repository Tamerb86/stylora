import { describe, it, expect, beforeAll } from "vitest";
import { stripe } from "./stripe";
import * as db from "./db";

/**
 * Test suite for Stripe webhook handler
 * 
 * Tests the webhook endpoint that processes checkout.session.completed events
 * and updates payment/appointment status.
 */

describe("Stripe Webhook Handler", () => {
  let testTenantId: string;
  let testAppointmentId: number;
  let testCustomerId: number;
  let testEmployeeId: number;
  let testServiceId: number;
  let testPaymentId: number;
  let testSessionId: string;

  beforeAll(async () => {
    const dbInstance = await db.getDb();
    if (!dbInstance) {
      throw new Error("Database not available for testing");
    }

    // Create test tenant
    const { tenants, users, customers, services, appointments, appointmentServices } = await import("../drizzle/schema");
    
    testTenantId = `test-tenant-${Date.now()}`;
    
    await dbInstance.insert(tenants).values({
      id: testTenantId,
      name: "Test Salon",
      subdomain: `test-${Date.now()}`,
      status: "active",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });

    // Create test employee
    const [employee] = await dbInstance.insert(users).values({
      tenantId: testTenantId,
      openId: `test-employee-${Date.now()}`,
      name: "Test Employee",
      role: "employee",
      isActive: true,
    });
    testEmployeeId = employee.insertId;

    // Create test customer
    const [customer] = await dbInstance.insert(customers).values({
      tenantId: testTenantId,
      firstName: "Test",
      lastName: "Customer",
      phone: "+4712345678",
    });
    testCustomerId = customer.insertId;

    // Create test service
    const [service] = await dbInstance.insert(services).values({
      tenantId: testTenantId,
      name: "Test Haircut",
      durationMinutes: 30,
      price: "500.00",
      isActive: true,
    });
    testServiceId = service.insertId;

    // Create test appointment
    const [appointment] = await dbInstance.insert(appointments).values({
      tenantId: testTenantId,
      customerId: testCustomerId,
      employeeId: testEmployeeId,
      appointmentDate: new Date("2025-12-01"),
      startTime: "10:00:00",
      endTime: "10:30:00",
      status: "pending",
    });
    testAppointmentId = appointment.insertId;

    // Link service to appointment
    await dbInstance.insert(appointmentServices).values({
      appointmentId: testAppointmentId,
      serviceId: testServiceId,
      price: "500.00",
    });

    // Create a test Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: "nok",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "nok",
            unit_amount: 50000, // 500 NOK in øre
            product_data: {
              name: `Test Appointment #${testAppointmentId}`,
            },
          },
        },
      ],
      success_url: "https://example.com/success",
      cancel_url: "https://example.com/cancel",
      metadata: {
        tenantId: testTenantId,
        appointmentId: String(testAppointmentId),
        type: "appointment_payment",
      },
    });

    testSessionId = session.id;

    // Create payment record with status "pending"
    const payment = await db.createPayment({
      tenantId: testTenantId,
      appointmentId: testAppointmentId,
      orderId: null,
      paymentMethod: "stripe",
      paymentGateway: "stripe",
      amount: "500.00",
      currency: "NOK",
      status: "pending",
      gatewaySessionId: testSessionId,
      gatewayPaymentId: null,
      gatewayMetadata: {
        checkoutMode: "payment",
      },
      processedBy: null,
      processedAt: null,
      lastFour: null,
      cardBrand: null,
      errorMessage: null,
    });

    testPaymentId = payment.id;
  });

  it("should verify webhook signature and process checkout.session.completed", async () => {
    // Simulate a checkout.session.completed event
    const event = {
      id: `evt_test_${Date.now()}`,
      type: "checkout.session.completed",
      data: {
        object: {
          id: testSessionId,
          payment_intent: "pi_test_123456",
          metadata: {
            tenantId: testTenantId,
            appointmentId: String(testAppointmentId),
            type: "appointment_payment",
          },
        },
      },
    };

    // Create a webhook signature
    const payload = JSON.stringify(event);
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: process.env.STRIPE_WEBHOOK_SECRET || "",
    });

    // Simulate webhook request
    const mockReq = {
      headers: {
        "stripe-signature": signature,
      },
      body: Buffer.from(payload),
      rawBody: Buffer.from(payload),
    } as any;

    const mockRes = {
      status: (code: number) => ({
        send: (message: string) => {
          expect(code).toBe(200);
          return message;
        },
      }),
    } as any;

    // Import and call the webhook handler
    const { handleStripeWebhook } = await import("./stripe-webhook");
    await handleStripeWebhook(mockReq, mockRes);

    // Verify payment was updated to "completed"
    const payment = await db.getPaymentById(testPaymentId);
    expect(payment).toBeDefined();
    expect(payment?.status).toBe("completed");
    expect(payment?.gatewayPaymentId).toBe("pi_test_123456");
    expect(payment?.processedAt).toBeDefined();

    // Verify appointment was updated to "confirmed"
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("DB not available");

    const { appointments } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const [appointment] = await dbInstance
      .select()
      .from(appointments)
      .where(eq(appointments.id, testAppointmentId));

    expect(appointment).toBeDefined();
    expect(appointment.status).toBe("confirmed");
  });

  it("should reject webhook with invalid signature", async () => {
    const event = {
      id: `evt_test_${Date.now()}`,
      type: "checkout.session.completed",
      data: {
        object: {
          id: testSessionId,
          metadata: {
            tenantId: testTenantId,
            appointmentId: String(testAppointmentId),
          },
        },
      },
    };

    const payload = JSON.stringify(event);

    // Use an invalid signature
    const mockReq = {
      headers: {
        "stripe-signature": "invalid_signature",
      },
      body: Buffer.from(payload),
      rawBody: Buffer.from(payload),
    } as any;

    let statusCode = 0;
    const mockRes = {
      status: (code: number) => {
        statusCode = code;
        return {
          send: (message: string) => message,
        };
      },
    } as any;

    const { handleStripeWebhook } = await import("./stripe-webhook");
    await handleStripeWebhook(mockReq, mockRes);

    // Verify webhook was rejected
    expect(statusCode).toBe(400);
  });

  it("should not update canceled appointments", async () => {
    // Create a canceled appointment
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("DB not available");

    const { appointments, appointmentServices } = await import("../drizzle/schema");

    const [canceledAppointment] = await dbInstance.insert(appointments).values({
      tenantId: testTenantId,
      customerId: testCustomerId,
      employeeId: testEmployeeId,
      appointmentDate: new Date("2025-12-02"),
      startTime: "11:00:00",
      endTime: "11:30:00",
      status: "canceled",
    });

    const canceledAppointmentId = canceledAppointment.insertId;

    await dbInstance.insert(appointmentServices).values({
      appointmentId: canceledAppointmentId,
      serviceId: testServiceId,
      price: "500.00",
    });

    // Create session for canceled appointment
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: "nok",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "nok",
            unit_amount: 50000,
            product_data: {
              name: `Test Appointment #${canceledAppointmentId}`,
            },
          },
        },
      ],
      success_url: "https://example.com/success",
      cancel_url: "https://example.com/cancel",
      metadata: {
        tenantId: testTenantId,
        appointmentId: String(canceledAppointmentId),
        type: "appointment_payment",
      },
    });

    // Create payment record
    await db.createPayment({
      tenantId: testTenantId,
      appointmentId: canceledAppointmentId,
      orderId: null,
      paymentMethod: "stripe",
      paymentGateway: "stripe",
      amount: "500.00",
      currency: "NOK",
      status: "pending",
      gatewaySessionId: session.id,
      gatewayPaymentId: null,
      gatewayMetadata: null,
      processedBy: null,
      processedAt: null,
      lastFour: null,
      cardBrand: null,
      errorMessage: null,
    });

    // Simulate webhook
    const event = {
      id: `evt_test_${Date.now()}`,
      type: "checkout.session.completed",
      data: {
        object: {
          id: session.id,
          payment_intent: "pi_test_canceled",
          metadata: {
            tenantId: testTenantId,
            appointmentId: String(canceledAppointmentId),
          },
        },
      },
    };

    const payload = JSON.stringify(event);
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: process.env.STRIPE_WEBHOOK_SECRET || "",
    });

    const mockReq = {
      headers: { "stripe-signature": signature },
      body: Buffer.from(payload),
      rawBody: Buffer.from(payload),
    } as any;

    const mockRes = {
      status: (code: number) => ({
        send: (message: string) => message,
      }),
    } as any;

    const { handleStripeWebhook } = await import("./stripe-webhook");
    await handleStripeWebhook(mockReq, mockRes);

    // Verify appointment status remains "canceled"
    const { eq } = await import("drizzle-orm");
    const [appointment] = await dbInstance
      .select()
      .from(appointments)
      .where(eq(appointments.id, canceledAppointmentId));

    expect(appointment.status).toBe("canceled");
  });
});
