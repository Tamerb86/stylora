import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { eq, and } from "drizzle-orm";
import Stripe from "stripe";
import { ENV } from "./_core/env";

/**
 * Cancellation & Refund System
 * Handles appointment cancellations with automatic refund calculations
 */

interface CancellationPolicy {
  freeCancellationHours: number; // Hours before appointment for free cancellation
  lateCancellationFeePercent: number; // Fee % for late cancellations (0-100)
  noShowFeePercent: number; // Fee % for no-shows (0-100)
}

const DEFAULT_POLICY: CancellationPolicy = {
  freeCancellationHours: 24,
  lateCancellationFeePercent: 50,
  noShowFeePercent: 100,
};

/**
 * Get cancellation policy for a tenant
 */
export async function getCancellationPolicy(tenantId: string): Promise<CancellationPolicy> {
  const dbInstance = await getDb();
  if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

  const { tenants } = await import("../drizzle/schema");
  const [tenant] = await dbInstance
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) return DEFAULT_POLICY;

  // Return policy from tenant settings or defaults
  return {
    freeCancellationHours: tenant.cancellationWindowHours || DEFAULT_POLICY.freeCancellationHours,
    lateCancellationFeePercent: DEFAULT_POLICY.lateCancellationFeePercent,
    noShowFeePercent: DEFAULT_POLICY.noShowFeePercent,
  };
}

/**
 * Calculate refund amount based on cancellation policy and timing
 */
export async function calculateRefundAmount(
  appointmentId: number,
  tenantId: string,
  cancellationType: "customer" | "staff" | "no_show"
): Promise<{
  originalAmount: number;
  refundAmount: number;
  feePercent: number;
  feeAmount: number;
  isLateCancellation: boolean;
}> {
  const dbInstance = await getDb();
  if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

  const { appointments, payments } = await import("../drizzle/schema");

  // Get appointment details
  const [appointment] = await dbInstance
    .select()
    .from(appointments)
    .where(eq(appointments.id, appointmentId))
    .limit(1);

  if (!appointment) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Appointment not found" });
  }

  // Get payment for this appointment
  const [payment] = await dbInstance
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.appointmentId, appointmentId),
        eq(payments.status, "completed")
      )
    )
    .limit(1);

  if (!payment) {
    // No payment found, nothing to refund
    return {
      originalAmount: 0,
      refundAmount: 0,
      feePercent: 0,
      feeAmount: 0,
      isLateCancellation: false,
    };
  }

  const originalAmount = parseFloat(payment.amount);
  const policy = await getCancellationPolicy(tenantId);

  // Calculate appointment start time
  const appointmentDate = new Date(appointment.appointmentDate);
  const [hours, minutes] = String(appointment.startTime).split(":").map(Number);
  appointmentDate.setHours(hours, minutes, 0, 0);

  // Calculate cancellation deadline
  const cancellationDeadline = new Date(appointmentDate);
  cancellationDeadline.setHours(
    cancellationDeadline.getHours() - policy.freeCancellationHours
  );

  const now = new Date();
  const isLateCancellation = now > cancellationDeadline;

  let feePercent = 0;

  if (cancellationType === "no_show") {
    feePercent = policy.noShowFeePercent;
  } else if (isLateCancellation) {
    feePercent = policy.lateCancellationFeePercent;
  } else {
    feePercent = 0; // Free cancellation
  }

  const feeAmount = (originalAmount * feePercent) / 100;
  const refundAmount = originalAmount - feeAmount;

  return {
    originalAmount,
    refundAmount,
    feePercent,
    feeAmount,
    isLateCancellation,
  };
}

/**
 * Process Stripe refund
 */
export async function processStripeRefund(
  paymentIntentId: string,
  refundAmount: number,
  reason: string
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  try {
    if (!ENV.stripeSecretKey) {
      throw new Error("Stripe secret key not configured");
    }

    const stripe = new Stripe(ENV.stripeSecretKey, {
      apiVersion: "2025-11-17.clover",
    });

    // Convert amount to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(refundAmount * 100);

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amountInCents,
      reason: "requested_by_customer",
      metadata: {
        reason: reason,
      },
    });

    return {
      success: true,
      refundId: refund.id,
    };
  } catch (error: any) {
    console.error("[Stripe Refund Error]", error);
    return {
      success: false,
      error: error.message || "Failed to process Stripe refund",
    };
  }
}

/**
 * Process Vipps refund (placeholder - requires Vipps API setup)
 */
export async function processVippsRefund(
  orderId: string,
  refundAmount: number,
  reason: string
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  // TODO: Implement Vipps refund API integration
  // This requires Vipps merchant account and API credentials
  console.log("[Vipps Refund] Not implemented yet", { orderId, refundAmount, reason });
  
  return {
    success: false,
    error: "Vipps refunds not yet implemented. Please process manually.",
  };
}

/**
 * Cancel appointment with automatic refund
 */
export async function cancelAppointmentWithRefund(
  appointmentId: number,
  tenantId: string,
  userId: number,
  reason: string,
  cancellationType: "customer" | "staff" | "no_show"
): Promise<{
  success: boolean;
  refundProcessed: boolean;
  refundAmount: number;
  error?: string;
}> {
  const dbInstance = await getDb();
  if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

  const { appointments, payments, refunds } = await import("../drizzle/schema");

  try {
    // Calculate refund amount
    const refundCalc = await calculateRefundAmount(appointmentId, tenantId, cancellationType);

    // Update appointment status
    const status = cancellationType === "no_show" ? "no_show" : "canceled";
    await dbInstance
      .update(appointments)
      .set({
        status,
        canceledAt: new Date(),
        canceledBy: cancellationType === "customer" ? "customer" : "staff",
        cancellationReason: reason,
        isLateCancellation: refundCalc.isLateCancellation,
      })
      .where(eq(appointments.id, appointmentId));

    // If no payment or no refund needed, return early
    if (refundCalc.refundAmount <= 0) {
      return {
        success: true,
        refundProcessed: false,
        refundAmount: 0,
      };
    }

    // Get payment details
    const [payment] = await dbInstance
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.appointmentId, appointmentId),
          eq(payments.status, "completed")
        )
      )
      .limit(1);

    if (!payment) {
      return {
        success: true,
        refundProcessed: false,
        refundAmount: 0,
      };
    }

    // Process refund based on payment method
    let refundResult: { success: boolean; refundId?: string; error?: string };
    let refundMethod: "stripe" | "vipps" | "manual";

    if (payment.paymentGateway === "stripe" && payment.gatewayPaymentId) {
      refundMethod = "stripe";
      refundResult = await processStripeRefund(
        payment.gatewayPaymentId,
        refundCalc.refundAmount,
        reason
      );
    } else if (payment.paymentGateway === "vipps" && payment.gatewayPaymentId) {
      refundMethod = "vipps";
      refundResult = await processVippsRefund(
        payment.gatewayPaymentId,
        refundCalc.refundAmount,
        reason
      );
    } else {
      // Manual refund for cash/card terminal payments
      refundMethod = "manual";
      refundResult = { success: true, refundId: undefined };
    }

    // Record refund in database
    await dbInstance.insert(refunds).values({
      tenantId,
      paymentId: payment.id,
      appointmentId,
      amount: String(refundCalc.refundAmount),
      reason,
      refundMethod,
      status: refundResult.success ? "completed" : "failed",
      gatewayRefundId: refundResult.refundId || null,
      errorMessage: refundResult.error || null,
      processedBy: userId,
      processedAt: new Date(),
    });

    // Update payment status if fully refunded
    if (refundCalc.refundAmount >= refundCalc.originalAmount) {
      await dbInstance
        .update(payments)
        .set({ status: "refunded" })
        .where(eq(payments.id, payment.id));
    }

    return {
      success: true,
      refundProcessed: refundResult.success,
      refundAmount: refundCalc.refundAmount,
      error: refundResult.error,
    };
  } catch (error: any) {
    console.error("[Cancel Appointment Error]", error);
    return {
      success: false,
      refundProcessed: false,
      refundAmount: 0,
      error: error.message || "Failed to cancel appointment",
    };
  }
}

/**
 * Get refund history for a tenant
 */
export async function getRefundHistory(
  tenantId: string,
  appointmentId?: number
): Promise<any[]> {
  const dbInstance = await getDb();
  if (!dbInstance) return [];

  const { refunds, payments, appointments, customers } = await import("../drizzle/schema");

  const baseQuery = dbInstance
    .select({
      id: refunds.id,
      amount: refunds.amount,
      reason: refunds.reason,
      refundMethod: refunds.refundMethod,
      status: refunds.status,
      gatewayRefundId: refunds.gatewayRefundId,
      errorMessage: refunds.errorMessage,
      processedAt: refunds.processedAt,
      createdAt: refunds.createdAt,
      appointmentId: refunds.appointmentId,
      paymentMethod: payments.paymentMethod,
      customerName: customers.firstName,
      customerLastName: customers.lastName,
    })
    .from(refunds)
    .leftJoin(payments, eq(refunds.paymentId, payments.id))
    .leftJoin(appointments, eq(refunds.appointmentId, appointments.id))
    .leftJoin(customers, eq(appointments.customerId, customers.id));

  if (appointmentId) {
    return baseQuery.where(
      and(
        eq(refunds.tenantId, tenantId),
        eq(refunds.appointmentId, appointmentId)
      )
    );
  }

  return baseQuery.where(eq(refunds.tenantId, tenantId));
}
