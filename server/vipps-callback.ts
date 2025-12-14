/**
 * Vipps Callback Handler
 * 
 * This module handles callbacks from Vipps when payment status changes.
 * Vipps sends POST requests to the callback URL with payment status updates.
 * 
 * Documentation: https://developer.vippsmobilepay.com/docs/APIs/ecom-api/vipps-ecom-api/#callbacks
 * 
 * Callback payload example:
 * {
 *   "merchantSerialNumber": "123456",
 *   "orderId": "apt-123-abc123",
 *   "transactionInfo": {
 *     "amount": 49900,
 *     "status": "RESERVE",
 *     "timeStamp": "2023-01-01T12:00:00Z",
 *     "transactionId": "5001420062"
 *   }
 * }
 * 
 * Status values:
 * - INITIATE: Payment initiated
 * - REGISTER: User opened payment in Vipps app
 * - RESERVE: Payment reserved (user approved)
 * - SALE: Payment captured (auto-capture enabled)
 * - CANCEL: Payment cancelled
 * - VOID: Reserved payment voided
 * - REFUND: Payment refunded
 */

import type { Request, Response } from "express";
import * as db from "./db";
import { getVippsPaymentDetails } from "./vipps";
import { sendAppointmentConfirmationIfPossible } from "./notifications-appointments";

interface VippsCallbackPayload {
  merchantSerialNumber: string;
  orderId: string;
  transactionInfo: {
    amount: number; // Amount in øre
    status: "INITIATE" | "REGISTER" | "RESERVE" | "SALE" | "CANCEL" | "VOID" | "REFUND";
    timeStamp: string;
    transactionId: string;
  };
}

/**
 * Handle Vipps callback
 * 
 * This function is called by Express when Vipps sends a callback.
 * It updates the payment status in the database and triggers confirmation emails.
 * 
 * @param req - Express request object
 * @param res - Express response object
 */
export async function handleVippsCallback(req: Request, res: Response): Promise<void> {
  try {
    const payload: VippsCallbackPayload = req.body;

    console.log("[Vipps Callback] Received callback:", JSON.stringify(payload, null, 2));

    // Validate payload
    if (!payload.orderId || !payload.transactionInfo) {
      console.error("[Vipps Callback] Invalid payload: missing orderId or transactionInfo");
      res.status(400).json({ error: "Invalid callback payload" });
      return;
    }

    const { orderId, transactionInfo } = payload;
    const { status, transactionId, amount } = transactionInfo;

    // Get full payment details from Vipps to verify
    let paymentDetails;
    try {
      paymentDetails = await getVippsPaymentDetails(orderId);
      console.log("[Vipps Callback] Payment details:", JSON.stringify(paymentDetails, null, 2));
    } catch (error) {
      console.error("[Vipps Callback] Failed to get payment details:", error);
      // Continue anyway, use callback data
    }

    // Find payment record in database by gatewaySessionId (vippsOrderId)
    const dbInstance = await db.getDb();
    if (!dbInstance) {
      console.error("[Vipps Callback] Database not available");
      res.status(500).json({ error: "Database not available" });
      return;
    }

    const { payments, appointments } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const [payment] = await dbInstance
      .select()
      .from(payments)
      .where(eq(payments.gatewaySessionId, orderId));

    if (!payment) {
      console.error(`[Vipps Callback] Payment not found for orderId: ${orderId}`);
      res.status(404).json({ error: "Payment not found" });
      return;
    }

    console.log(`[Vipps Callback] Found payment ID: ${payment.id}, current status: ${payment.status}`);

    // Determine new payment status based on Vipps status
    let newPaymentStatus: "pending" | "completed" | "failed" | "refunded" = payment.status as any;
    let shouldConfirmAppointment = false;

    switch (status) {
      case "RESERVE":
      case "SALE":
        // Payment successful (reserved or captured)
        newPaymentStatus = "completed";
        shouldConfirmAppointment = true;
        console.log(`[Vipps Callback] Payment ${status}: marking as completed`);
        break;

      case "CANCEL":
      case "VOID":
        // Payment cancelled or voided
        newPaymentStatus = "failed";
        console.log(`[Vipps Callback] Payment ${status}: marking as failed`);
        break;

      case "REFUND":
        // Payment refunded
        newPaymentStatus = "refunded";
        console.log(`[Vipps Callback] Payment ${status}: marking as refunded`);
        break;

      case "INITIATE":
      case "REGISTER":
        // Payment in progress, keep as pending
        console.log(`[Vipps Callback] Payment ${status}: keeping as pending`);
        break;

      default:
        console.log(`[Vipps Callback] Unknown status: ${status}`);
    }

    // Update payment record
    if (newPaymentStatus !== payment.status) {
      await dbInstance
        .update(payments)
        .set({
          status: newPaymentStatus,
          gatewayPaymentId: transactionId,
          gatewayMetadata: {
            ...(payment.gatewayMetadata as any),
            vippsStatus: status,
            vippsTransactionId: transactionId,
            vippsAmount: amount,
            vippsTimestamp: transactionInfo.timeStamp,
            callbackReceived: new Date().toISOString(),
          },
          processedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));

      console.log(`[Vipps Callback] Updated payment ${payment.id} status to: ${newPaymentStatus}`);
    }

    // Update appointment status if payment successful
    if (shouldConfirmAppointment && payment.appointmentId) {
      const [appointment] = await dbInstance
        .select()
        .from(appointments)
        .where(eq(appointments.id, payment.appointmentId));

      if (appointment && appointment.status !== "canceled") {
        // Update appointment to confirmed
        await dbInstance
          .update(appointments)
          .set({ status: "confirmed" })
          .where(eq(appointments.id, appointment.id));

        console.log(`[Vipps Callback] Updated appointment ${appointment.id} status to: confirmed`);

        // Send confirmation email
        try {
          await sendAppointmentConfirmationIfPossible(appointment.id, payment.tenantId);
          console.log(`[Vipps Callback] Sent confirmation email for appointment ${appointment.id}`);
        } catch (emailError) {
          console.error(`[Vipps Callback] Failed to send confirmation email:`, emailError);
          // Don't fail the callback if email fails
        }
      }
    }

    // Respond to Vipps with 200 OK
    res.status(200).json({ success: true });
    console.log(`[Vipps Callback] Callback processed successfully for orderId: ${orderId}`);
  } catch (error) {
    console.error("[Vipps Callback] Error processing callback:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Verify Vipps callback authenticity (optional but recommended)
 * 
 * Vipps includes an Authorization header with the callback request.
 * You can verify this matches your access token to ensure the callback is genuine.
 * 
 * Note: This is optional as Vipps callbacks come from known IP ranges.
 * For production, consider implementing IP whitelisting or token verification.
 */
export function verifyVippsCallback(req: Request): boolean {
  // TODO: Implement callback verification if needed
  // For now, we trust callbacks from Vipps
  // In production, you may want to:
  // 1. Check the Authorization header matches your access token
  // 2. Whitelist Vipps IP addresses
  // 3. Use HTTPS only
  return true;
}
