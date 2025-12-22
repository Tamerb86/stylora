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
    scope: "READ:PURCHASE WRITE:PURCHASE READ:FINANCE READ:USERINFO",
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
    const errorText = await response.text();
    let errorMessage = "Token exchange failed";
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.error_description || errorData.error || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    
    // Provide user-friendly error messages
    if (response.status === 400) {
      throw new Error(`Ugyldig autorisasjonskode. Vennligst prøv å koble til på nytt.`);
    } else if (response.status === 401) {
      throw new Error(`Autentisering mislyktes. Sjekk dine iZettle-legitimasjoner.`);
    } else if (response.status === 403) {
      throw new Error(`Ingen tilgang. Kontroller at du har riktige tillatelser i iZettle.`);
    } else {
      throw new Error(`iZettle-tilkobling mislyktes: ${errorMessage}`);
    }
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
    const errorText = await response.text();
    let errorMessage = "Token refresh failed";
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.error_description || errorData.error || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    
    // Provide user-friendly error messages
    if (response.status === 400 || response.status === 401) {
      throw new Error(`Din iZettle-økt har utløpt. Vennligst koble til på nytt.`);
    } else {
      throw new Error(`Kunne ikke fornye iZettle-tilkobling: ${errorMessage}`);
    }
  }

  return response.json();
}

/**
 * Retry helper with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      // Check if it's a rate limit error (429)
      const isRateLimitError = error.message?.includes('429') || error.message?.toLowerCase().includes('too many requests');
      
      if (attempt === maxRetries || !isRateLimitError) {
        throw error;
      }
      
      // Exponential backoff: 2s, 4s, 8s
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

/**
 * Create a Reader Link (for PayPal Reader)
 * This creates a connection between Stylora and the PayPal Reader
 */
export async function createReaderLink(
  accessToken: string,
  linkName: string = "Stylora POS"
): Promise<{
  linkId: string;
  linkName: string;
  websocketUrl: string;
}> {
  return retryWithBackoff(async () => {
    const response = await fetch("https://reader-connect.zettle.com/v1/links", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        linkName,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      
      // Provide user-friendly error messages
      if (response.status === 429) {
        throw new Error(`For mange forespørsler (429). Vennligst vent litt før du prøver igjen.`);
      } else if (response.status === 401) {
        throw new Error(`Autentisering mislyktes. Vennligst koble til iZettle på nytt.`);
      } else {
        throw new Error(`Reader Link creation failed: ${error}`);
      }
    }

    return response.json();
  }, 3, 2000); // 3 retries, starting with 2 second delay
}

/**
 * Get existing Reader Links
 */
export async function getReaderLinks(
  accessToken: string
): Promise<Array<{
  linkId: string;
  linkName: string;
  status: string;
}>> {
  const response = await fetch("https://reader-connect.zettle.com/v1/links", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch Reader Links: ${error}`);
  }

  return response.json();
}

/**
 * Delete a Reader Link
 */
export async function deleteReaderLink(
  accessToken: string,
  linkId: string
): Promise<void> {
  const response = await fetch(`https://reader-connect.zettle.com/v1/links/${linkId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete Reader Link: ${error}`);
  }
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
  if (!encryptedToken || typeof encryptedToken !== 'string') {
    throw new Error('Invalid encrypted token: must be a non-empty string');
  }
  
  const parts = encryptedToken.split(":");
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted token format: expected "iv:encrypted"');
  }
  
  const [ivHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  // Trim whitespace and validate
  decrypted = decrypted.trim();
  
  if (!decrypted) {
    throw new Error('Decryption resulted in empty token');
  }
  
  return decrypted;
}
