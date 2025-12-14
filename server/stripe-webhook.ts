import type { Request, Response } from "express";
import { stripe } from "./stripe";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { payments, appointments } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { sendAppointmentConfirmationIfPossible } from "./notifications-appointments";

/**
 * Stripe Webhook Handler
 * 
 * Handles incoming webhook events from Stripe to update payment and appointment status.
 * 
 * Supported events:
 * - checkout.session.completed: When customer completes payment
 * 
 * Security:
 * - Verifies webhook signature using STRIPE_WEBHOOK_SECRET
 * - Enforces multi-tenant isolation using metadata.tenantId
 * 
 * @param req Express request (must have raw body for signature verification)
 * @param res Express response
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];

  if (!sig || Array.isArray(sig)) {
    console.error("[Stripe Webhook] Missing stripe-signature header");
    return res.status(400).send("Missing stripe-signature header");
  }

  let event;

  try {
    // Verify webhook signature
    // rawBody is attached by the route handler before JSON parsing
    const rawBody = (req as any).rawBody ?? req.body;
    
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      ENV.stripeWebhookSecret
    );
    
    console.log(`[Stripe Webhook] Verified event: ${event.type} (${event.id})`);
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const db = await getDb();
  if (!db) {
    console.error("[Stripe Webhook] Database not available");
    return res.status(500).send("Database not available");
  }

  try {
    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;

      console.log(`[Stripe Webhook] Processing checkout.session.completed: ${session.id}`);

      // Extract metadata set during createCheckoutSession
      const metadata = session.metadata || {};
      const tenantId = metadata.tenantId as string | undefined;
      const appointmentIdStr = metadata.appointmentId as string | undefined;

      if (!tenantId || !appointmentIdStr) {
        console.warn("[Stripe Webhook] Missing tenantId or appointmentId in session.metadata");
        return res.status(200).send("OK - No metadata");
      }

      const appointmentId = Number(appointmentIdStr);

      // 1) Find payment row by gatewaySessionId + tenantId (multi-tenant isolation)
      const [paymentRow] = await db
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.gatewaySessionId, session.id),
            eq(payments.tenantId, tenantId)
          )
        );

      if (!paymentRow) {
        console.warn(`[Stripe Webhook] Payment not found for session ${session.id} and tenant ${tenantId}`);
      } else {
        // Extract Payment Intent ID from session
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;

        // Update payment status to "completed"
        await db
          .update(payments)
          .set({
            status: "completed",
            gatewayPaymentId: paymentIntentId ?? paymentRow.gatewayPaymentId,
            errorMessage: null,
            processedAt: new Date(),
          })
          .where(eq(payments.id, paymentRow.id));

        console.log(`[Stripe Webhook] Updated payment ${paymentRow.id} to completed`);
      }

      // 2) Update the appointment status to "confirmed" (if not canceled)
      const [appointment] = await db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.id, appointmentId),
            eq(appointments.tenantId, tenantId)
          )
        );

      if (!appointment) {
        console.warn(`[Stripe Webhook] Appointment ${appointmentId} not found for tenant ${tenantId}`);
      } else if (appointment.status === "canceled") {
        console.log(`[Stripe Webhook] Appointment ${appointmentId} is canceled, not updating status`);
      } else {
        // Update appointment status to "confirmed"
        await db
          .update(appointments)
          .set({
            status: "confirmed",
          })
          .where(eq(appointments.id, appointment.id));

        console.log(`[Stripe Webhook] Updated appointment ${appointmentId} to confirmed`);

        // Send confirmation email (non-blocking)
        sendAppointmentConfirmationIfPossible(appointmentId, tenantId).catch((err) => {
          console.error("[Stripe Webhook] Failed to send confirmation email:", err);
        });
      }

      return res.status(200).send("OK - Processed");
    }

    // Log other event types for future implementation
    console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    return res.status(200).send("OK - Unhandled event");

  } catch (err) {
    console.error("[Stripe Webhook] Error processing webhook:", err);
    return res.status(500).send("Webhook handler error");
  }
}
