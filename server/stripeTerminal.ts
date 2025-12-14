import Stripe from "stripe";

// Initialize Stripe with secret key from environment
const getStripeClient = (apiKey?: string): Stripe => {
  const key = apiKey || process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Stripe API key not configured");
  }
  return new Stripe(key, {
    apiVersion: "2025-11-17.clover",
  });
};

/**
 * Create a connection token for Stripe Terminal SDK
 * Required by the frontend SDK to discover and connect to readers
 */
export async function createConnectionToken(apiKey?: string): Promise<string> {
  const stripe = getStripeClient(apiKey);
  const connectionToken = await stripe.terminal.connectionTokens.create();
  return connectionToken.secret;
}

/**
 * List all registered readers for this Stripe account
 */
export async function listReaders(apiKey?: string) {
  const stripe = getStripeClient(apiKey);
  const readers = await stripe.terminal.readers.list({ limit: 100 });
  return readers.data;
}

/**
 * Get a specific reader by ID
 */
export async function getReader(readerId: string, apiKey?: string) {
  const stripe = getStripeClient(apiKey);
  return await stripe.terminal.readers.retrieve(readerId);
}

/**
 * Create a payment intent for terminal payment
 */
export async function createTerminalPaymentIntent(
  amount: number,
  currency: string = "nok",
  metadata?: Record<string, string>,
  apiKey?: string
) {
  const stripe = getStripeClient(apiKey);
  
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: currency.toLowerCase(),
    payment_method_types: ["card_present"],
    capture_method: "automatic",
    metadata: metadata || {},
  });
}

/**
 * Capture a payment intent (if using manual capture)
 */
export async function capturePaymentIntent(
  paymentIntentId: string,
  apiKey?: string
) {
  const stripe = getStripeClient(apiKey);
  return await stripe.paymentIntents.capture(paymentIntentId);
}

/**
 * Cancel a payment intent
 */
export async function cancelPaymentIntent(
  paymentIntentId: string,
  apiKey?: string
) {
  const stripe = getStripeClient(apiKey);
  return await stripe.paymentIntents.cancel(paymentIntentId);
}

/**
 * Process a refund for a terminal payment
 */
export async function refundTerminalPayment(
  paymentIntentId: string,
  amount?: number,
  apiKey?: string
) {
  const stripe = getStripeClient(apiKey);
  
  const refundData: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
  };
  
  if (amount) {
    refundData.amount = Math.round(amount * 100);
  }
  
  return await stripe.refunds.create(refundData);
}

/**
 * Simulate a test payment (for development)
 */
export async function simulateTestPayment(readerId: string, apiKey?: string) {
  const stripe = getStripeClient(apiKey);
  return await stripe.testHelpers.terminal.readers.presentPaymentMethod(readerId);
}
