/**
 * iZettle OAuth and Payment API Service
 * 
 * Handles OAuth flow, token management, and payment processing for iZettle integration.
 * Multi-tenant support - each tenant has their own iZettle account and tokens.
 */

import crypto from 'crypto';

// iZettle OAuth Configuration
const IZETTLE_CLIENT_ID = process.env.IZETTLE_CLIENT_ID || '';
const IZETTLE_CLIENT_SECRET = process.env.IZETTLE_CLIENT_SECRET || '';
const IZETTLE_REDIRECT_URI = process.env.IZETTLE_REDIRECT_URI || '';

if (!IZETTLE_CLIENT_ID || !IZETTLE_CLIENT_SECRET || !IZETTLE_REDIRECT_URI) {
  console.warn('[iZettle] Missing environment variables. iZettle integration will not work.');
}

// iZettle API Endpoints
const IZETTLE_AUTH_URL = 'https://oauth.zettle.com/authorize';
const IZETTLE_TOKEN_URL = 'https://oauth.zettle.com/token';
const IZETTLE_API_BASE = 'https://purchase.izettle.com';

/**
 * Generate authorization URL for OAuth flow
 */
export function getAuthorizationUrl(tenantId: string): string {
  // Generate random state for CSRF protection
  const state = crypto.randomBytes(32).toString('hex');
  
  // Store state in session/cache (simplified - in production use Redis or session store)
  // For now, we'll encode tenantId in state
  const stateWithTenant = Buffer.from(JSON.stringify({ state, tenantId })).toString('base64');
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: IZETTLE_CLIENT_ID,
    redirect_uri: IZETTLE_REDIRECT_URI,
    scope: 'READ:PURCHASE WRITE:PURCHASE READ:FINANCE',
    state: stateWithTenant,
  });
  
  return `${IZETTLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}> {
  const response = await fetch(IZETTLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: IZETTLE_CLIENT_ID,
      client_secret: IZETTLE_CLIENT_SECRET,
      redirect_uri: IZETTLE_REDIRECT_URI,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
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
  token_type: string;
}> {
  const response = await fetch(IZETTLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: IZETTLE_CLIENT_ID,
      client_secret: IZETTLE_CLIENT_SECRET,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }
  
  return response.json();
}

/**
 * Get user information from iZettle
 */
export async function getUserInfo(accessToken: string): Promise<{
  uuid: string;
  organizationUuid: string;
  email: string;
}> {
  const response = await fetch('https://oauth.zettle.com/users/self', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get user info: ${error}`);
  }
  
  return response.json();
}

/**
 * Create a payment in iZettle
 */
export async function createPayment(
  accessToken: string,
  amount: number,
  currency: string = 'NOK',
  reference?: string
): Promise<{
  purchaseUUID: string;
  amount: number;
  currency: string;
  status: string;
}> {
  const response = await fetch(`${IZETTLE_API_BASE}/purchases`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      reference,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create payment: ${error}`);
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
  const response = await fetch(`${IZETTLE_API_BASE}/purchases/${purchaseUUID}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get payment status: ${error}`);
  }
  
  return response.json();
}

/**
 * Simple encryption for storing tokens (in production, use proper encryption library)
 */
export function encryptToken(token: string): string {
  // In production, use a proper encryption library like crypto-js or node's crypto with AES
  // For now, simple base64 encoding (NOT SECURE - just for demo)
  return Buffer.from(token).toString('base64');
}

/**
 * Simple decryption for retrieving tokens
 */
export function decryptToken(encryptedToken: string): string {
  // In production, use proper decryption
  return Buffer.from(encryptedToken, 'base64').toString('utf-8');
}

/**
 * Parse state parameter from OAuth callback
 */
export function parseState(state: string): { state: string; tenantId: string } {
  try {
    const decoded = Buffer.from(state, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    throw new Error('Invalid state parameter');
  }
}
