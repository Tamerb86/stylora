/**
 * Unimicro API Client
 * Handles OAuth 2.0 authentication and API requests to Unimicro accounting system
 */

import axios, { type AxiosInstance } from "axios";
import { getDb } from "../db";
import { unimicroSettings, unimicroSyncLog } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const UNIMICRO_API_BASE_URL = "https://api.unimicro.no";
const UNIMICRO_AUTH_URL = "https://identity.unimicro.no";

export interface UnimicroConfig {
  clientId: string;
  clientSecret: string;
  companyId: number;
}

export class UnimicroClient {
  private axiosInstance: AxiosInstance;
  private tenantId: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor(tenantId: string, accessToken?: string, refreshToken?: string, tokenExpiresAt?: Date) {
    this.tenantId = tenantId;
    this.accessToken = accessToken || null;
    this.refreshToken = refreshToken || null;
    this.tokenExpiresAt = tokenExpiresAt || null;

    this.axiosInstance = axios.create({
      baseURL: UNIMICRO_API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000, // 30 seconds
    });

    // Add request interceptor to inject access token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Refresh token if expired
        if (this.isTokenExpired()) {
          await this.refreshAccessToken();
        }

        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        // If 401 Unauthorized, try to refresh token once
        if (error.response?.status === 401 && !error.config._retry) {
          error.config._retry = true;
          await this.refreshAccessToken();
          error.config.headers.Authorization = `Bearer ${this.accessToken}`;
          return this.axiosInstance.request(error.config);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check if access token is expired or about to expire (within 5 minutes)
   */
  private isTokenExpired(): boolean {
    if (!this.tokenExpiresAt) return true;
    const now = new Date();
    const expiresAt = new Date(this.tokenExpiresAt);
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    return expiresAt <= fiveMinutesFromNow;
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [settings] = await db
        .select()
        .from(unimicroSettings)
        .where(eq(unimicroSettings.tenantId, this.tenantId))
        .limit(1);

      if (!settings?.clientId || !settings?.clientSecret) {
        throw new Error("Unimicro credentials not configured");
      }

      const response = await axios.post(
        `${UNIMICRO_AUTH_URL}/connect/token`,
        new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: this.refreshToken,
          client_id: settings.clientId,
          client_secret: settings.clientSecret,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token || this.refreshToken;
      this.tokenExpiresAt = new Date(Date.now() + response.data.expires_in * 1000);

      // Update tokens in database
      await db
        .update(unimicroSettings)
        .set({
          accessToken: this.accessToken,
          refreshToken: this.refreshToken,
          tokenExpiresAt: this.tokenExpiresAt,
        })
        .where(eq(unimicroSettings.tenantId, this.tenantId));
    } catch (error: any) {
      console.error("[Unimicro] Token refresh failed:", error.message);
      throw new Error(`Failed to refresh Unimicro access token: ${error.message}`);
    }
  }

  /**
   * Authenticate with Unimicro using client credentials
   * This is for server-to-server authentication (certificate-based flow)
   */
  static async authenticate(tenantId: string, config: UnimicroConfig): Promise<UnimicroClient> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    try {
      const response = await axios.post(
        `${UNIMICRO_AUTH_URL}/connect/token`,
        new URLSearchParams({
          grant_type: "client_credentials",
          client_id: config.clientId,
          client_secret: config.clientSecret,
          scope: "unimicro_api", // Adjust scope as needed
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const accessToken = response.data.access_token;
      const refreshToken = response.data.refresh_token;
      const expiresIn = response.data.expires_in;
      const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

      // Save tokens to database
      await db
        .update(unimicroSettings)
        .set({
          accessToken,
          refreshToken,
          tokenExpiresAt,
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          companyId: config.companyId,
        })
        .where(eq(unimicroSettings.tenantId, tenantId));

      return new UnimicroClient(tenantId, accessToken, refreshToken, tokenExpiresAt);
    } catch (error: any) {
      console.error("[Unimicro] Authentication failed:", error.response?.data || error.message);
      throw new Error(`Unimicro authentication failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Test connection to Unimicro API
   */
  async testConnection(): Promise<boolean> {
    const startTime = Date.now();
    try {
      // Try to fetch company info as a connection test
      const response = await this.axiosInstance.get("/api/companies");
      const duration = Date.now() - startTime;

      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Log successful test
      await db.insert(unimicroSyncLog).values({
        tenantId: this.tenantId,
        operation: "test_connection",
        status: "success",
        itemsProcessed: 1,
        itemsFailed: 0,
        duration,
        triggeredBy: "manual",
      });

      return response.status === 200;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Log failed test
      await db.insert(unimicroSyncLog).values({
        tenantId: this.tenantId,
        operation: "test_connection",
        status: "failed",
        itemsProcessed: 0,
        itemsFailed: 1,
        errorMessage: error.message,
        duration,
        triggeredBy: "manual",
      });

      console.error("[Unimicro] Connection test failed:", error.message);
      return false;
    }
  }

  /**
   * Generic GET request
   */
  async get<T = any>(endpoint: string, params?: any): Promise<T> {
    const response = await this.axiosInstance.get(endpoint, { params });
    return response.data;
  }

  /**
   * Generic POST request
   */
  async post<T = any>(endpoint: string, data: any): Promise<T> {
    const response = await this.axiosInstance.post(endpoint, data);
    return response.data;
  }

  /**
   * Generic PUT request
   */
  async put<T = any>(endpoint: string, data: any): Promise<T> {
    const response = await this.axiosInstance.put(endpoint, data);
    return response.data;
  }

  /**
   * Generic DELETE request
   */
  async delete<T = any>(endpoint: string): Promise<T> {
    const response = await this.axiosInstance.delete(endpoint);
    return response.data;
  }
}

/**
 * Get or create Unimicro client for a tenant
 */
export async function getUnimicroClient(tenantId: string): Promise<UnimicroClient> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [settings] = await db
    .select()
    .from(unimicroSettings)
    .where(eq(unimicroSettings.tenantId, tenantId))
    .limit(1);

  if (!settings || !settings.enabled) {
    throw new Error("Unimicro integration is not enabled for this tenant");
  }

  if (!settings.accessToken || !settings.refreshToken) {
    throw new Error("Unimicro authentication tokens not found. Please authenticate first.");
  }

  return new UnimicroClient(
    tenantId,
    settings.accessToken,
    settings.refreshToken,
    settings.tokenExpiresAt || undefined
  );
}
