/**
 * iZettle Payment Integration Service
 * 
 * This service handles OAuth authentication and payment processing with iZettle.
 * Documentation: https://developer.zettle.com/docs/
 */

import crypto from "crypto";

const IZETTLE_CLIENT_ID = process.env.IZETTLE_CLIENT_ID || "";
const IZETTLE_CLIENT_SECRET = process.env.IZETTLE_CLIENT_SECRET || "";
const IZETTLE_REDIRECT_URI = process.env.IZETTLE_REDIRECT_URI || "";
const ENCRYPTION_KEY = process.env.JWT_SECRET || "default-encryption-key-change-me";

/**
 * Generate iZettle OAuth authorization URL
 */
export function getAuthorizationUrl(tenantId: string): string {
  const state = Buffer.from(JSON.stringify({ tenantId, timestamp: Date.now() })).toString("base64");
  
  const params = new URLSearchParams({
    response_type: "code",
    client_id: IZETTLE_CLIENT_ID,
    redirect_uri: IZETTLE_REDIRECT_URI,
    scope: "READ:PURCHASE READ:FINANCE READ:USERINFO",
    state,
  });

  return `https://oauth.zettle.com/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const response = await fetch("https://oauth.zettle.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: IZETTLE_CLIENT_ID,
      client_secret: IZETTLE_CLIENT_SECRET,
      code,
      redirect_uri: IZETTLE_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`iZettle token exchange failed: ${error}`);
  }

  return response.json();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const response = await fetch("https://oauth.zettle.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: IZETTLE_CLIENT_ID,
      client_secret: IZETTLE_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`iZettle token refresh failed: ${error}`);
  }

  return response.json();
}

/**
 * Create a payment in iZettle
 */
export async function createPayment(
  accessToken: string,
  amount: number,
  currency: string = "SEK",
  reference?: string
): Promise<{
  purchaseUUID: string;
  amount: number;
  currency: string;
  status: string;
}> {
  const response = await fetch("https://purchase.izettle.com/purchases/v2", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      reference,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`iZettle payment creation failed: ${error}`);
  }

  return response.json();
}

/**
 * Get payment status from iZettle
 */
export async function getPaymentStatus(
  accessToken: string,
  purchaseUUID: string
): Promise<{
  purchaseUUID: string;
  amount: number;
  currency: string;
  status: string;
  timestamp: string;
}> {
  const response = await fetch(`https://purchase.izettle.com/purchases/v2/${purchaseUUID}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`iZettle payment status check failed: ${error}`);
  }

  return response.json();
}

/**
 * Encrypt sensitive token data
 */
export function encryptToken(token: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  
  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  return `${iv.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt sensitive token data
 */
export function decryptToken(encryptedToken: string): string {
  const [ivHex, encrypted] = encryptedToken.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}
