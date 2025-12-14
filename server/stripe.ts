import Stripe from "stripe";
import { ENV } from "./_core/env";

// Stripe is optional - only initialize if key is provided
export const stripe = ENV.stripeSecretKey
  ? new Stripe(ENV.stripeSecretKey, {
      apiVersion: "2025-11-17.clover",
    })
  : null;

// Helper to check if Stripe is enabled
export const isStripeEnabled = () => stripe !== null;
