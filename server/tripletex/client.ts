/**
 * Tripletex API Client
 * Documentation: https://developer.tripletex.no/
 */

import { getDb } from "../db";
import { tenants } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export interface TripletexConfig {
  consumerToken: string;
  employeeToken: string;
  sessionToken?: string;
  companyId?: number;
}

export interface TripletexCustomer {
  id?: number;
  name: string;
  email?: string;
  phoneNumber?: string;
  organizationNumber?: string;
  invoiceEmail?: string;
  postalAddress?: {
    addressLine1?: string;
    addressLine2?: string;
    postalCode?: string;
    city?: string;
    country?: { id: number };
  };
}

export interface TripletexInvoice {
  id?: number;
  invoiceNumber?: number;
  customer: { id: number };
  invoiceDate: string;
  invoiceDueDate: string;
  orders?: { id: number }[];
  comment?: string;
}

export interface TripletexOrder {
  id?: number;
  customer: { id: number };
  orderDate: string;
  deliveryDate?: string;
  orderLines: TripletexOrderLine[];
}

export interface TripletexOrderLine {
  description: string;
  count: number;
  unitPriceExcludingVatCurrency: number;
  vatType?: { id: number };
  product?: { id: number };
}

const TRIPLETEX_API_BASE = "https://tripletex.no/v2";

export class TripletexClient {
  private config: TripletexConfig;
  private tenantId: string;

  constructor(tenantId: string, config: TripletexConfig) {
    this.tenantId = tenantId;
    this.config = config;
  }

  private getAuthHeader(): string {
    if (this.config.sessionToken) {
      return `Basic ${Buffer.from(`0:${this.config.sessionToken}`).toString("base64")}`;
    }
    throw new Error("Tripletex session token not configured");
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const url = `${TRIPLETEX_API_BASE}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        "Authorization": this.getAuthHeader(),
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Tripletex API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.value || data;
  }

  // Session Management
  async createSession(expirationDate: string): Promise<{
    token: string;
    encryptionKey: string;
  }> {
    const url = `${TRIPLETEX_API_BASE}/token/session/:create`;
    const params = new URLSearchParams({
      consumerToken: this.config.consumerToken,
      employeeToken: this.config.employeeToken,
      expirationDate,
    });

    const response = await fetch(`${url}?${params}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to create Tripletex session");
    }

    const data = await response.json();
    return {
      token: data.value.token,
      encryptionKey: data.value.encryptionKey,
    };
  }

  // Customer Operations
  async getCustomers(params?: {
    id?: string;
    email?: string;
    organizationNumber?: string;
    from?: number;
    count?: number;
  }): Promise<TripletexCustomer[]> {
    const queryParams = new URLSearchParams();
    if (params?.id) queryParams.set("id", params.id);
    if (params?.email) queryParams.set("email", params.email);
    if (params?.organizationNumber) queryParams.set("organizationNumber", params.organizationNumber);
    if (params?.from !== undefined) queryParams.set("from", params.from.toString());
    if (params?.count !== undefined) queryParams.set("count", params.count.toString());

    const endpoint = `/customer?${queryParams}`;
    return this.request<TripletexCustomer[]>("GET", endpoint);
  }

  async getCustomer(id: number): Promise<TripletexCustomer> {
    return this.request<TripletexCustomer>("GET", `/customer/${id}`);
  }

  async createCustomer(customer: TripletexCustomer): Promise<TripletexCustomer> {
    return this.request<TripletexCustomer>("POST", "/customer", customer);
  }

  async updateCustomer(id: number, customer: Partial<TripletexCustomer>): Promise<TripletexCustomer> {
    return this.request<TripletexCustomer>("PUT", `/customer/${id}`, customer);
  }

  // Order Operations
  async getOrders(params?: {
    customerId?: string;
    from?: number;
    count?: number;
  }): Promise<TripletexOrder[]> {
    const queryParams = new URLSearchParams();
    if (params?.customerId) queryParams.set("customerId", params.customerId);
    if (params?.from !== undefined) queryParams.set("from", params.from.toString());
    if (params?.count !== undefined) queryParams.set("count", params.count.toString());

    const endpoint = `/order?${queryParams}`;
    return this.request<TripletexOrder[]>("GET", endpoint);
  }

  async createOrder(order: TripletexOrder): Promise<TripletexOrder> {
    return this.request<TripletexOrder>("POST", "/order", order);
  }

  // Invoice Operations
  async getInvoices(params?: {
    invoiceDateFrom?: string;
    invoiceDateTo?: string;
    customerId?: string;
    from?: number;
    count?: number;
  }): Promise<TripletexInvoice[]> {
    const queryParams = new URLSearchParams();
    if (params?.invoiceDateFrom) queryParams.set("invoiceDateFrom", params.invoiceDateFrom);
    if (params?.invoiceDateTo) queryParams.set("invoiceDateTo", params.invoiceDateTo);
    if (params?.customerId) queryParams.set("customerId", params.customerId);
    if (params?.from !== undefined) queryParams.set("from", params.from.toString());
    if (params?.count !== undefined) queryParams.set("count", params.count.toString());

    const endpoint = `/invoice?${queryParams}`;
    return this.request<TripletexInvoice[]>("GET", endpoint);
  }

  async createInvoice(orderId: number, invoiceDate: string, sendToCustomer: boolean = false): Promise<TripletexInvoice> {
    const params = new URLSearchParams({
      invoiceDate,
      sendToCustomer: sendToCustomer.toString(),
    });
    return this.request<TripletexInvoice>("PUT", `/order/${orderId}/:invoice?${params}`, {});
  }

  // Company Info
  async getCompanyInfo(): Promise<{
    id: number;
    name: string;
    organizationNumber: string;
  }> {
    return this.request("GET", "/company/1");
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

// Helper to get Tripletex client for a tenant
export async function getTripletexClient(tenantId: string): Promise<TripletexClient | null> {
  const dbInstance = await getDb();
  if (!dbInstance) return null;

  const [tenant] = await dbInstance
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) return null;

  // Get Tripletex config from tenant settings
  // In production, you would store these in a secure settings table
  
  return null;
}
