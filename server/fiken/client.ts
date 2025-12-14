/**
 * Fiken API Client
 * 
 * Handles OAuth2 authentication and API requests to Fiken accounting system
 * Documentation: https://api.fiken.no/api/v2/docs/
 */

import { getDb } from "../db";
import { fikenSettings, fikenSyncLog } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const FIKEN_BASE_URL = "https://api.fiken.no/api/v2";
const FIKEN_OAUTH_BASE = "https://fiken.no/oauth";

export interface FikenOAuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface FikenCompany {
  name: string;
  slug: string;
  organizationNumber: string;
  address?: {
    streetAddress?: string;
    city?: string;
    postCode?: string;
    country?: string;
  };
}

export interface FikenContact {
  contactId: number;
  name: string;
  email?: string;
  phoneNumber?: string;
  organizationNumber?: string;
  customerNumber?: number;
  contactPerson?: Array<{
    contactPersonId: number;
    name: string;
    email?: string;
    phoneNumber?: string;
  }>;
}

export interface FikenInvoice {
  invoiceId: number;
  invoiceNumber?: string;
  kid?: string;
  issueDate: string;
  dueDate: string;
  customerId: number;
  lines: Array<{
    description: string;
    netAmount: number;
    vatAmount: number;
    grossAmount: number;
    vatType?: string;
    productId?: number;
  }>;
  totalPaid: number;
  totalPaidInCurrency: number;
  outstandingBalance: number;
  currency: string;
}

export interface FikenProduct {
  productId: number;
  name: string;
  unitPrice: number;
  incomeAccount: string;
  vatType: string;
  active: boolean;
}

/**
 * Fiken API Client
 * Manages OAuth2 authentication and API requests
 */
export class FikenClient {
  private tenantId: string;
  private accessToken?: string;
  private refreshToken?: string;
  private tokenExpiresAt?: Date;
  private clientId?: string;
  private clientSecret?: string;
  private companySlug?: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Initialize client with settings from database
   */
  async initialize(): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [settings] = await db
      .select()
      .from(fikenSettings)
      .where(eq(fikenSettings.tenantId, this.tenantId))
      .limit(1);

    if (!settings || !settings.enabled) {
      throw new Error("Fiken integration is not enabled for this tenant");
    }

    if (!settings.clientId || !settings.clientSecret) {
      throw new Error("Fiken OAuth credentials not configured");
    }

    this.clientId = settings.clientId;
    this.clientSecret = settings.clientSecret;
    this.accessToken = settings.accessToken || undefined;
    this.refreshToken = settings.refreshToken || undefined;
    this.tokenExpiresAt = settings.tokenExpiresAt || undefined;
    this.companySlug = settings.companySlug || undefined;

    // Refresh token if expired or about to expire (within 5 minutes)
    if (this.refreshToken && this.tokenExpiresAt) {
      const expiresIn = this.tokenExpiresAt.getTime() - Date.now();
      if (expiresIn < 5 * 60 * 1000) {
        await this.refreshAccessToken();
      }
    }
  }

  /**
   * Generate OAuth2 authorization URL
   */
  static getAuthorizationUrl(clientId: string, redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      state: state,
    });

    return `${FIKEN_OAUTH_BASE}/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ): Promise<FikenOAuthTokens> {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await fetch(`${FIKEN_OAUTH_BASE}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to exchange code for token: ${error.error_description || error.error}`);
    }

    return await response.json();
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken || !this.clientId || !this.clientSecret) {
      throw new Error("Cannot refresh token: missing credentials");
    }

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");

    const response = await fetch(`${FIKEN_OAUTH_BASE}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: this.refreshToken,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      
      // Log failed refresh attempt
      const db = await getDb();
      if (db) {
        await db.insert(fikenSyncLog).values({
        tenantId: this.tenantId,
        operation: "oauth_refresh",
        status: "failed",
          errorMessage: error.error_description || error.error,
          triggeredBy: "auto",
        });
      }

      throw new Error(`Failed to refresh token: ${error.error_description || error.error}`);
    }

    const tokens: FikenOAuthTokens = await response.json();

    // Update tokens in database
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(fikenSettings)
      .set({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(fikenSettings.tenantId, this.tenantId));

    // Update instance variables
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token;
    this.tokenExpiresAt = expiresAt;

    // Log successful refresh
    const dbForLog = await getDb();
    if (dbForLog) {
      await dbForLog.insert(fikenSyncLog).values({
      tenantId: this.tenantId,
        operation: "oauth_refresh",
        status: "success",
        triggeredBy: "auto",
      });
    }
  }

  /**
   * Make authenticated API request to Fiken
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.accessToken) {
      throw new Error("No access token available. Please authenticate first.");
    }

    const url = `${FIKEN_BASE_URL}${endpoint}`;
    const headers = {
      "Authorization": `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
      "X-Request-ID": crypto.randomUUID(),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - try to refresh token once
    if (response.status === 401 && this.refreshToken) {
      await this.refreshAccessToken();
      
      // Retry request with new token
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          "Authorization": `Bearer ${this.accessToken}`,
        },
      });

      if (!retryResponse.ok) {
        const error = await retryResponse.text();
        throw new Error(`Fiken API error (${retryResponse.status}): ${error}`);
      }

      return await retryResponse.json();
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Fiken API error (${response.status}): ${error}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  }

  /**
   * Get list of companies the user has access to
   */
  async getCompanies(): Promise<FikenCompany[]> {
    return await this.request<FikenCompany[]>("/companies");
  }

  /**
   * Get company details
   */
  async getCompany(companySlug?: string): Promise<FikenCompany> {
    const slug = companySlug || this.companySlug;
    if (!slug) {
      throw new Error("Company slug not provided");
    }

    return await this.request<FikenCompany>(`/companies/${slug}`);
  }

  /**
   * Get contacts (customers) for a company
   */
  async getContacts(companySlug?: string): Promise<FikenContact[]> {
    const slug = companySlug || this.companySlug;
    if (!slug) {
      throw new Error("Company slug not provided");
    }

    return await this.request<FikenContact[]>(`/companies/${slug}/contacts`);
  }

  /**
   * Create a new contact (customer)
   */
  async createContact(
    contact: Partial<FikenContact>,
    companySlug?: string
  ): Promise<FikenContact> {
    const slug = companySlug || this.companySlug;
    if (!slug) {
      throw new Error("Company slug not provided");
    }

    return await this.request<FikenContact>(`/companies/${slug}/contacts`, {
      method: "POST",
      body: JSON.stringify(contact),
    });
  }

  /**
   * Update an existing contact
   */
  async updateContact(
    contactId: number,
    contact: Partial<FikenContact>,
    companySlug?: string
  ): Promise<FikenContact> {
    const slug = companySlug || this.companySlug;
    if (!slug) {
      throw new Error("Company slug not provided");
    }

    return await this.request<FikenContact>(`/companies/${slug}/contacts/${contactId}`, {
      method: "PUT",
      body: JSON.stringify(contact),
    });
  }

  /**
   * Get invoices for a company
   */
  async getInvoices(companySlug?: string): Promise<FikenInvoice[]> {
    const slug = companySlug || this.companySlug;
    if (!slug) {
      throw new Error("Company slug not provided");
    }

    return await this.request<FikenInvoice[]>(`/companies/${slug}/invoices`);
  }

  /**
   * Create a new invoice
   */
  async createInvoice(
    invoice: Partial<FikenInvoice>,
    companySlug?: string
  ): Promise<FikenInvoice> {
    const slug = companySlug || this.companySlug;
    if (!slug) {
      throw new Error("Company slug not provided");
    }

    return await this.request<FikenInvoice>(`/companies/${slug}/invoices`, {
      method: "POST",
      body: JSON.stringify(invoice),
    });
  }

  /**
   * Get products for a company
   */
  async getProducts(companySlug?: string): Promise<FikenProduct[]> {
    const slug = companySlug || this.companySlug;
    if (!slug) {
      throw new Error("Company slug not provided");
    }

    return await this.request<FikenProduct[]>(`/companies/${slug}/products`);
  }

  /**
   * Create a new product
   */
  async createProduct(
    product: Partial<FikenProduct>,
    companySlug?: string
  ): Promise<FikenProduct> {
    const slug = companySlug || this.companySlug;
    if (!slug) {
      throw new Error("Company slug not provided");
    }

    return await this.request<FikenProduct>(`/companies/${slug}/products`, {
      method: "POST",
      body: JSON.stringify(product),
    });
  }

  /**
   * Test connection to Fiken API
   */
  async testConnection(): Promise<{ success: boolean; companyName?: string; error?: string }> {
    try {
      const companies = await this.getCompanies();
      
      if (companies.length === 0) {
        return {
          success: false,
          error: "No companies found. Please ensure you have access to at least one company in Fiken.",
        };
      }

      return {
        success: true,
        companyName: companies[0].name,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
