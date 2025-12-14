/**
 * Vipps Payment Gateway Integration
 * 
 * This module provides integration with Vipps eCom API for Norwegian payment processing.
 * 
 * Documentation: https://developer.vippsmobilepay.com/docs/APIs/ecom-api/
 * 
 * Required environment variables:
 * - VIPPS_CLIENT_ID: Your Vipps client ID
 * - VIPPS_CLIENT_SECRET: Your Vipps client secret
 * - VIPPS_SUBSCRIPTION_KEY: Your Vipps subscription key (Ocp-Apim-Subscription-Key)
 * - VIPPS_MERCHANT_SERIAL_NUMBER: Your merchant serial number (MSN)
 * - VIPPS_API_URL: API base URL (https://apitest.vipps.no for test, https://api.vipps.no for production)
 * 
 * Setup instructions:
 * 1. Register for a Vipps merchant account at https://vipps.no/
 * 2. Get your test credentials from the Vipps portal
 * 3. Add the credentials to your environment variables
 * 4. Test with the test environment first
 * 5. Switch to production when ready
 */

import { ENV } from "./_core/env";

// Vipps API response types
interface VippsAccessTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface VippsInitiatePaymentRequest {
  merchantInfo: {
    merchantSerialNumber: string;
    callbackPrefix: string;
    fallBack: string;
  };
  customerInfo?: {
    mobileNumber?: string;
  };
  transaction: {
    orderId: string;
    amount: number; // Amount in øre (1 NOK = 100 øre)
    transactionText: string;
  };
}

interface VippsInitiatePaymentResponse {
  orderId: string;
  url: string; // URL to redirect customer to for payment
}

interface VippsPaymentDetails {
  orderId: string;
  transactionInfo: {
    amount: number;
    status: "INITIATE" | "REGISTER" | "RESERVE" | "SALE" | "CANCEL" | "VOID" | "REFUND";
    timeStamp: string;
    transactionId: string;
  };
  transactionLogHistory: Array<{
    amount: number;
    operation: string;
    operationSuccess: boolean;
    requestId: string;
    timeStamp: string;
    transactionId: string;
    transactionText: string;
  }>;
}

// Cache for access token
let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Get Vipps access token (cached)
 * Tokens are valid for 1 hour, so we cache them to avoid unnecessary API calls
 */
export async function getVippsAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5 minute buffer)
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedAccessToken;
  }

  // Validate required credentials
  if (!ENV.vippsClientId || !ENV.vippsClientSecret || !ENV.vippsSubscriptionKey) {
    throw new Error(
      "Vipps credentials not configured. Please set VIPPS_CLIENT_ID, VIPPS_CLIENT_SECRET, and VIPPS_SUBSCRIPTION_KEY environment variables."
    );
  }

  // Request new access token
  const response = await fetch(`${ENV.vippsApiUrl}/accesstoken/get`, {
    method: "POST",
    headers: {
      "client_id": ENV.vippsClientId,
      "client_secret": ENV.vippsClientSecret,
      "Ocp-Apim-Subscription-Key": ENV.vippsSubscriptionKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get Vipps access token: ${response.status} ${errorText}`);
  }

  const data: VippsAccessTokenResponse = await response.json();
  
  // Cache the token
  cachedAccessToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;

  return cachedAccessToken;
}

/**
 * Initiate a Vipps payment
 * 
 * @param orderId - Unique order ID (must be unique per merchant)
 * @param amountNOK - Amount in Norwegian Kroner (will be converted to øre)
 * @param transactionText - Description shown to customer (max 100 chars, avoid sensitive info)
 * @param callbackUrl - URL where Vipps will send payment status updates
 * @param fallbackUrl - URL where customer is redirected after payment
 * @param mobileNumber - Optional customer mobile number (8 digits, no country code)
 * @returns Payment initiation response with redirect URL
 */
export async function initiateVippsPayment(params: {
  orderId: string;
  amountNOK: number;
  transactionText: string;
  callbackUrl: string;
  fallbackUrl: string;
  mobileNumber?: string;
}): Promise<VippsInitiatePaymentResponse> {
  const accessToken = await getVippsAccessToken();

  if (!ENV.vippsMerchantSerialNumber) {
    throw new Error("VIPPS_MERCHANT_SERIAL_NUMBER not configured");
  }

  // Convert NOK to øre (1 NOK = 100 øre)
  const amountInOre = Math.round(params.amountNOK * 100);

  // Validate amount (must be at least 1 NOK = 100 øre)
  if (amountInOre < 100) {
    throw new Error("Amount must be at least 1 NOK");
  }

  const requestBody: VippsInitiatePaymentRequest = {
    merchantInfo: {
      merchantSerialNumber: ENV.vippsMerchantSerialNumber,
      callbackPrefix: params.callbackUrl,
      fallBack: params.fallbackUrl,
    },
    transaction: {
      orderId: params.orderId,
      amount: amountInOre,
      transactionText: params.transactionText.substring(0, 100), // Max 100 chars
    },
  };

  // Add mobile number if provided (optional)
  if (params.mobileNumber) {
    requestBody.customerInfo = {
      mobileNumber: params.mobileNumber.replace(/\D/g, ""), // Remove non-digits
    };
  }

  const response = await fetch(`${ENV.vippsApiUrl}/ecomm/v2/payments`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Ocp-Apim-Subscription-Key": ENV.vippsSubscriptionKey,
      "Content-Type": "application/json",
      "Merchant-Serial-Number": ENV.vippsMerchantSerialNumber,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to initiate Vipps payment: ${response.status} ${errorText}`);
  }

  const data: VippsInitiatePaymentResponse = await response.json();
  return data;
}

/**
 * Get payment details from Vipps
 * 
 * @param orderId - The order ID used when initiating the payment
 * @returns Payment details including status and transaction history
 */
export async function getVippsPaymentDetails(orderId: string): Promise<VippsPaymentDetails> {
  const accessToken = await getVippsAccessToken();

  if (!ENV.vippsMerchantSerialNumber) {
    throw new Error("VIPPS_MERCHANT_SERIAL_NUMBER not configured");
  }

  const response = await fetch(`${ENV.vippsApiUrl}/ecomm/v2/payments/${orderId}/details`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Ocp-Apim-Subscription-Key": ENV.vippsSubscriptionKey,
      "Merchant-Serial-Number": ENV.vippsMerchantSerialNumber,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get Vipps payment details: ${response.status} ${errorText}`);
  }

  const data: VippsPaymentDetails = await response.json();
  return data;
}

/**
 * Capture a reserved Vipps payment
 * 
 * @param orderId - The order ID
 * @param amountNOK - Amount to capture in NOK (can be less than reserved amount)
 * @param transactionText - Description for the capture
 * @returns Capture response
 */
export async function captureVippsPayment(params: {
  orderId: string;
  amountNOK: number;
  transactionText: string;
}): Promise<{ orderId: string; transactionInfo: { status: string } }> {
  const accessToken = await getVippsAccessToken();

  if (!ENV.vippsMerchantSerialNumber) {
    throw new Error("VIPPS_MERCHANT_SERIAL_NUMBER not configured");
  }

  const amountInOre = Math.round(params.amountNOK * 100);

  const response = await fetch(`${ENV.vippsApiUrl}/ecomm/v2/payments/${params.orderId}/capture`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Ocp-Apim-Subscription-Key": ENV.vippsSubscriptionKey,
      "Content-Type": "application/json",
      "Merchant-Serial-Number": ENV.vippsMerchantSerialNumber,
    },
    body: JSON.stringify({
      merchantInfo: {
        merchantSerialNumber: ENV.vippsMerchantSerialNumber,
      },
      transaction: {
        amount: amountInOre,
        transactionText: params.transactionText,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to capture Vipps payment: ${response.status} ${errorText}`);
  }

  return await response.json();
}

/**
 * Cancel a reserved Vipps payment
 * 
 * @param orderId - The order ID
 * @param transactionText - Reason for cancellation
 * @returns Cancellation response
 */
export async function cancelVippsPayment(params: {
  orderId: string;
  transactionText: string;
}): Promise<{ orderId: string; transactionInfo: { status: string } }> {
  const accessToken = await getVippsAccessToken();

  if (!ENV.vippsMerchantSerialNumber) {
    throw new Error("VIPPS_MERCHANT_SERIAL_NUMBER not configured");
  }

  const response = await fetch(`${ENV.vippsApiUrl}/ecomm/v2/payments/${params.orderId}/cancel`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Ocp-Apim-Subscription-Key": ENV.vippsSubscriptionKey,
      "Content-Type": "application/json",
      "Merchant-Serial-Number": ENV.vippsMerchantSerialNumber,
    },
    body: JSON.stringify({
      merchantInfo: {
        merchantSerialNumber: ENV.vippsMerchantSerialNumber,
      },
      transaction: {
        transactionText: params.transactionText,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to cancel Vipps payment: ${response.status} ${errorText}`);
  }

  return await response.json();
}

/**
 * Refund a captured Vipps payment
 * 
 * @param orderId - The order ID
 * @param amountNOK - Amount to refund in NOK (can be partial)
 * @param transactionText - Reason for refund
 * @returns Refund response
 */
export async function refundVippsPayment(params: {
  orderId: string;
  amountNOK: number;
  transactionText: string;
}): Promise<{ orderId: string; transactionInfo: { status: string } }> {
  const accessToken = await getVippsAccessToken();

  if (!ENV.vippsMerchantSerialNumber) {
    throw new Error("VIPPS_MERCHANT_SERIAL_NUMBER not configured");
  }

  const amountInOre = Math.round(params.amountNOK * 100);

  const response = await fetch(`${ENV.vippsApiUrl}/ecomm/v2/payments/${params.orderId}/refund`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Ocp-Apim-Subscription-Key": ENV.vippsSubscriptionKey,
      "Content-Type": "application/json",
      "Merchant-Serial-Number": ENV.vippsMerchantSerialNumber,
    },
    body: JSON.stringify({
      merchantInfo: {
        merchantSerialNumber: ENV.vippsMerchantSerialNumber,
      },
      transaction: {
        amount: amountInOre,
        transactionText: params.transactionText,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refund Vipps payment: ${response.status} ${errorText}`);
  }

  return await response.json();
}

/**
 * Check if Vipps is configured and ready to use
 */
export function isVippsConfigured(): boolean {
  return !!(
    ENV.vippsClientId &&
    ENV.vippsClientSecret &&
    ENV.vippsSubscriptionKey &&
    ENV.vippsMerchantSerialNumber
  );
}
