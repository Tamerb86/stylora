import Stripe from "stripe";
import { ENV } from "./_core/env";

if (!ENV.stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY in environment");
}

export const stripe = new Stripe(ENV.stripeSecretKey, {
  apiVersion: "2025-11-17.clover",
});
