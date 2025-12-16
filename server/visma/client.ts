/**
 * Visma eAccounting API Client
 * Documentation: https://developer.visma.com/api/eaccounting/
 */

import { getDb } from "../db";
import { tenants } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export interface VismaConfig {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  companyId?: string;
}

export interface VismaCustomer {
  id?: string;
  customerNumber?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: {
    address1?: string;
    address2?: string;
    postalCode?: string;
    city?: string;
    country?: string;
  };
  organizationNumber?: string;
}

export interface VismaInvoice {
  id?: string;
  invoiceNumber?: string;
  customerId: string;
  invoiceDate: string;
  dueDate: string;
  rows: VismaInvoiceRow[];
  totalAmount?: number;
  totalVat?: number;
  currency?: string;
}

export interface VismaInvoiceRow {
  articleId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

const VISMA_API_BASE = "https://eaccountingapi.visma.net/v2";

export class VismaClient {
  private config: VismaConfig;
  private tenantId: string;

  constructor(tenantId: string, config: VismaConfig) {
    this.tenantId = tenantId;
    this.config = config;
  }

  private async getHeaders(): Promise<HeadersInit> {
    if (!this.config.accessToken) {
      throw new Error("Visma access token not configured");
    }
    return {
      "Authorization": `Bearer ${this.config.accessToken}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const headers = await this.getHeaders();
    const url = `${VISMA_API_BASE}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Visma API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // OAuth Flow
  static getAuthorizationUrl(clientId: string, redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "ea:api ea:sales ea:purchase offline_access",
      state,
    });
    return `https://identity.visma.com/connect/authorize?${params}`;
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    const response = await fetch("https://identity.visma.com/connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to exchange code for token");
    }

    return response.json();
  }

  async refreshAccessToken(): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    if (!this.config.refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await fetch("https://identity.visma.com/connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.config.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    return response.json();
  }

  // Customer Operations
  async getCustomers(): Promise<VismaCustomer[]> {
    return this.request<VismaCustomer[]>("GET", "/customers");
  }

  async getCustomer(id: string): Promise<VismaCustomer> {
    return this.request<VismaCustomer>("GET", `/customers/${id}`);
  }

  async createCustomer(customer: VismaCustomer): Promise<VismaCustomer> {
    return this.request<VismaCustomer>("POST", "/customers", customer);
  }

  async updateCustomer(id: string, customer: Partial<VismaCustomer>): Promise<VismaCustomer> {
    return this.request<VismaCustomer>("PUT", `/customers/${id}`, customer);
  }

  // Invoice Operations
  async getInvoices(): Promise<VismaInvoice[]> {
    return this.request<VismaInvoice[]>("GET", "/customerinvoices");
  }

  async getInvoice(id: string): Promise<VismaInvoice> {
    return this.request<VismaInvoice>("GET", `/customerinvoices/${id}`);
  }

  async createInvoice(invoice: VismaInvoice): Promise<VismaInvoice> {
    return this.request<VismaInvoice>("POST", "/customerinvoices", invoice);
  }

  // Company Info
  async getCompanyInfo(): Promise<{
    id: string;
    name: string;
    organizationNumber: string;
  }> {
    return this.request("GET", "/companyinfo");
  }

  // Test Connection
  async testConnection(): Promise<boolean> {
    try {
      await this.getCompanyInfo();
      return true;
    } catch {
      return false;
    }
  }
}

// Helper to get Visma client for a tenant
export async function getVismaClient(tenantId: string): Promise<VismaClient | null> {
  const dbInstance = await getDb();
  if (!dbInstance) return null;

  const [tenant] = await dbInstance
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) return null;

  // Get Visma config from tenant settings (stored in JSON field or separate table)
  // For now, return null if not configured
  // In production, you would store these in a secure settings table
  
  return null;
}
