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
const ENCRYPTION_KEY =
  process.env.JWT_SECRET || "default-encryption-key-change-me";

/**
 * Generate HMAC signature for OAuth state parameter
 */
function generateStateSignature(payload: string): string {
  const hmac = crypto.createHmac("sha256", ENCRYPTION_KEY);
  hmac.update(payload);
  return hmac.digest("base64url");
}

/**
 * Verify HMAC signature for OAuth state parameter
 */
function verifyStateSignature(payload: string, signature: string): boolean {
  const expectedSignature = generateStateSignature(payload);

  // Check length before timing-safe comparison to prevent errors
  // Note: This length check is safe as signature length is deterministic
  // for a given HMAC algorithm (SHA-256 -> base64url -> 43 chars)
  if (signature.length !== expectedSignature.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Generate iZettle OAuth authorization URL with signed state
 */
export function getAuthorizationUrl(tenantId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ tenantId, timestamp: Date.now() })
  ).toString("base64url");
  const signature = generateStateSignature(payload);
  const state = `${payload}.${signature}`;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: IZETTLE_CLIENT_ID,
    redirect_uri: IZETTLE_REDIRECT_URI,
    scope:
      "READ:USERINFO WRITE:USERINFO READ:PAYMENT WRITE:PAYMENT READ:PURCHASE WRITE:PURCHASE READ:FINANCE",
    state,
  });

  return `https://oauth.zettle.com/authorize?${params.toString()}`;
}

/**
 * Verify and decode OAuth state parameter
 */
export function verifyAndDecodeState(
  state: string
): { tenantId: string; timestamp: number } | null {
  try {
    const [payload, signature] = state.split(".");
    if (!payload || !signature) {
      return null;
    }

    // Verify HMAC signature
    if (!verifyStateSignature(payload, signature)) {
      return null;
    }

    // Decode payload
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());

    // Check timestamp (reject if older than 10 minutes)
    const now = Date.now();
    if (now - decoded.timestamp > 10 * 60 * 1000) {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
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
      errorMessage =
        errorData.error_description || errorData.error || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }

    // Provide user-friendly error messages
    if (response.status === 400) {
      throw new Error(
        `Ugyldig autorisasjonskode. Vennligst prøv å koble til på nytt.`
      );
    } else if (response.status === 401) {
      throw new Error(
        `Autentisering mislyktes. Sjekk dine iZettle-legitimasjoner.`
      );
    } else if (response.status === 403) {
      throw new Error(
        `Ingen tilgang. Kontroller at du har riktige tillatelser i iZettle.`
      );
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
      errorMessage =
        errorData.error_description || errorData.error || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }

    // Provide user-friendly error messages
    if (response.status === 400 || response.status === 401) {
      throw new Error(
        `Din iZettle-økt har utløpt. Vennligst koble til på nytt.`
      );
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
      const isRateLimitError =
        error.message?.includes("429") ||
        error.message?.toLowerCase().includes("too many requests");

      if (attempt === maxRetries || !isRateLimitError) {
        throw error;
      }

      // Exponential backoff: 2s, 4s, 8s
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(
        `[Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries exceeded");
}

/**
 * Get existing Reader Links (for PayPal Reader)
 * Note: To create a new link, you need to pair the physical reader first using the 8-digit code
 * This function fetches existing links and returns the first one for WebSocket connection
 */
export async function createReaderLink(
  accessToken: string,
  linkName: string = "Stylora POS"
): Promise<{
  linkId: string;
  linkName: string;
  websocketUrl: string;
}> {
  return retryWithBackoff(
    async () => {
      // First, try to get existing links
      const response = await fetch(
        "https://reader-connect.zettle.com/v1/integrator/links",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();

        // Provide user-friendly error messages
        if (response.status === 429) {
          throw new Error(
            `For mange forespørsler (429). Vennligst vent litt før du prøver igjen.`
          );
        } else if (response.status === 401) {
          throw new Error(
            `Autentisering mislyktes. Vennligst koble til iZettle på nytt.`
          );
        } else {
          throw new Error(`Failed to fetch Reader Links: ${error}`);
        }
      }

      const links = await response.json();

      // If no links exist, throw error asking user to pair a reader first
      if (!links || links.length === 0) {
        throw new Error(
          `Ingen PayPal Reader funnet. Vennligst koble til en PayPal Reader først ved å følge instruksjonene i dokumentasjonen.`
        );
      }

      // Return the first link
      const link = links[0];
      return {
        linkId: link.id,
        linkName: link.integratorTags?.deviceName || "PayPal Reader",
        websocketUrl: `wss://reader-connect.zettle.com/v1/integrator/links/${link.id}/channel`,
      };
    },
    3,
    2000
  ); // 3 retries, starting with 2 second delay
}

/**
 * Pair a PayPal Reader using the 8-digit code displayed on the device
 * This creates a link between the reader and your Zettle organization
 */
export async function pairReaderWithCode(
  accessToken: string,
  code: string,
  deviceName: string = "Stylora POS"
): Promise<{
  linkId: string;
  deviceName: string;
  serialNumber: string;
}> {
  // Use Zettle Reader Connect API v1 (correct endpoint for PayPal Reader)
  const requestBody = {
    code: code.toUpperCase().trim(),
    tags: {
      deviceName,
    },
  };

  // Decode access token to check organization (JWT format)
  try {
    const tokenParts = accessToken.split(".");
    if (tokenParts.length === 3) {
      const payload = JSON.parse(
        Buffer.from(tokenParts[1], "base64").toString()
      );
      console.log("[iZettle] Access token info:", {
        organizationUuid:
          payload.organizationUuid || payload.org_id || "NOT_FOUND",
        scopes: payload.scope || payload.scopes || "NOT_FOUND",
        expiresAt: payload.exp
          ? new Date(payload.exp * 1000).toISOString()
          : "NOT_FOUND",
        issuedAt: payload.iat
          ? new Date(payload.iat * 1000).toISOString()
          : "NOT_FOUND",
      });
    }
  } catch (e) {
    console.error("[iZettle] Failed to decode access token:", e);
  }

  // Log request details for debugging
  console.log("[iZettle] Pairing request:", {
    url: "https://reader-connect.zettle.com/v1/integrator/link-offers/claim",
    method: "POST",
    body: requestBody,
    codeLength: code.length,
    codeRaw: code,
    codeTrimmed: code.trim(),
    codeUpperCase: code.toUpperCase().trim(),
    accessTokenLength: accessToken.length,
    accessTokenPrefix: accessToken.substring(0, 20) + "...",
  });

  const response = await fetch(
    "https://reader-connect.zettle.com/v1/integrator/link-offers/claim",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    // Log detailed error for debugging
    console.error("[iZettle] Pairing failed:", {
      status: response.status,
      statusText: response.statusText,
      code: code,
      errorText: errorText,
      requestBody: requestBody,
    });

    // Try to parse error as JSON for more details
    try {
      const errorJson = JSON.parse(errorText);
      console.error("[iZettle] Parsed error:", errorJson);
    } catch (e) {
      console.error("[iZettle] Error is not JSON:", errorText);
    }

    // Provide user-friendly error messages
    if (response.status === 400) {
      throw new Error(
        `Ugyldig kode. Koden kan være utløpt eller allerede brukt. Prøv å generere en ny kode ved å slå av og på PayPal Reader.`
      );
    } else if (response.status === 404) {
      throw new Error(
        `Koden ble ikke funnet. Kontroller at PayPal Reader er påslått, koblet til WiFi, og viser koden.`
      );
    } else if (response.status === 401) {
      throw new Error(
        `Autentisering mislyktes. Vennligst koble til iZettle på nytt.`
      );
    } else if (response.status === 409) {
      throw new Error(
        `Denne PayPal Reader er allerede koblet til en annen konto.`
      );
    } else {
      throw new Error(
        `Kunne ikke koble til PayPal Reader (${response.status}): ${errorText}`
      );
    }
  }

  const link = await response.json();

  // Zettle Reader Connect API response format
  return {
    linkId: link.id,
    deviceName: link.integratorTags?.deviceName || deviceName,
    serialNumber: link.readerTags?.serialNumber || "Unknown",
  };
}

/**
 * Get existing Reader Links
 */
export async function getReaderLinks(accessToken: string): Promise<
  Array<{
    linkId: string;
    linkName: string;
    status: string;
  }>
> {
  // Use Zettle Reader Connect API v1
  const response = await fetch(
    "https://reader-connect.zettle.com/v1/integrator/links",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch Reader Links: ${error}`);
  }

  const links = await response.json();

  // Transform Zettle API response to match expected format
  return (links || []).map((link: any) => ({
    linkId: link.id,
    linkName:
      link.integratorTags?.deviceName ||
      link.readerTags?.serialNumber ||
      `Reader ${link.id.slice(0, 8)}`,
    status: "active",
  }));
}

/**
 * Delete a Reader Link
 */
export async function deleteReaderLink(
  accessToken: string,
  linkId: string
): Promise<void> {
  // Use Zettle Reader Connect API v1
  const response = await fetch(
    `https://reader-connect.zettle.com/v1/integrator/links/${linkId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

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
  const response = await fetch(
    `https://purchase.izettle.com/purchases/v2/${purchaseUUID}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

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
  if (!encryptedToken || typeof encryptedToken !== "string") {
    throw new Error("Invalid encrypted token: must be a non-empty string");
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
    throw new Error("Decryption resulted in empty token");
  }

  return decrypted;
}
