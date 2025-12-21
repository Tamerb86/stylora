/**
 * Reader Connect WebSocket Manager
 * 
 * Manages WebSocket connections to PayPal Reader for payment processing
 * Documentation: https://developer.zettle.com/docs/payment-integrations/reader-connect/overview
 */

import { WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";

interface PaymentRequest {
  amount: number;
  currency: string;
  reference: string;
}

interface PaymentProgress {
  status: string;
  message?: string;
}

interface PaymentResult {
  resultStatus: "COMPLETED" | "FAILED" | "CANCELED";
  resultPayload?: any;
  resultErrorMessage?: string;
}

export class ReaderConnectManager {
  private ws: WebSocket | null = null;
  private linkId: string;
  private accessToken: string;
  private channelId: string = "1";
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;

  constructor(linkId: string, accessToken: string) {
    this.linkId = linkId;
    this.accessToken = accessToken;
  }

  /**
   * Connect to Reader via WebSocket
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // WebSocket URL format: wss://reader-connect.zettle.com/v1/links/{linkId}/ws
        const wsUrl = `wss://reader-connect.zettle.com/v1/links/${this.linkId}/ws`;
        
        this.ws = new WebSocket(wsUrl, {
          headers: {
            "Authorization": `Bearer ${this.accessToken}`,
          },
        });

        this.ws.on("open", () => {
          console.log(`[ReaderConnect] WebSocket connected to link ${this.linkId}`);
          this.reconnectAttempts = 0;
          resolve();
        });

        this.ws.on("message", (data: Buffer) => {
          try {
            const message = JSON.parse(data.toString());
            this.handleMessage(message);
          } catch (error) {
            console.error("[ReaderConnect] Failed to parse message:", error);
          }
        });

        this.ws.on("error", (error) => {
          console.error("[ReaderConnect] WebSocket error:", error);
          reject(error);
        });

        this.ws.on("close", () => {
          console.log("[ReaderConnect] WebSocket closed");
          this.attemptReconnect();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Attempt to reconnect to WebSocket
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[ReaderConnect] Max reconnect attempts reached");
      return;
    }

    this.reconnectAttempts++;
    console.log(`[ReaderConnect] Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error("[ReaderConnect] Reconnect failed:", error);
      });
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: any): void {
    const { type, messageId, payload } = message;

    if (type === "MESSAGE" && payload) {
      const { type: payloadType } = payload;

      // Handle different message types
      switch (payloadType) {
        case "PAYMENT_PROGRESS_RESPONSE":
          this.handlePaymentProgress(messageId, payload);
          break;
        case "PAYMENT_RESULT_RESPONSE":
          this.handlePaymentResult(messageId, payload);
          break;
        default:
          console.log("[ReaderConnect] Unknown message type:", payloadType);
      }
    }
  }

  /**
   * Handle payment progress updates
   */
  private handlePaymentProgress(messageId: string, payload: any): void {
    const handler = this.messageHandlers.get(messageId);
    if (handler) {
      handler({
        type: "progress",
        progress: payload.paymentProgress,
        message: payload.message,
      });
    }
  }

  /**
   * Handle payment result
   */
  private handlePaymentResult(messageId: string, payload: any): void {
    const handler = this.messageHandlers.get(messageId);
    if (handler) {
      handler({
        type: "result",
        status: payload.resultStatus,
        payload: payload.resultPayload,
        error: payload.resultErrorMessage,
      });
      // Clean up handler after result
      this.messageHandlers.delete(messageId);
    }
  }

  /**
   * Send payment request to Reader
   */
  async sendPaymentRequest(
    request: PaymentRequest,
    onProgress: (progress: PaymentProgress) => void,
    onResult: (result: PaymentResult) => void
  ): Promise<string> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not connected");
    }

    const messageId = uuidv4();
    const internalTraceId = uuidv4();

    // Register message handler
    this.messageHandlers.set(messageId, (data: any) => {
      if (data.type === "progress") {
        onProgress({
          status: data.progress,
          message: data.message,
        });
      } else if (data.type === "result") {
        onResult({
          resultStatus: data.status,
          resultPayload: data.payload,
          resultErrorMessage: data.error,
        });
      }
    });

    // Build payment request message
    const message = {
      type: "MESSAGE",
      linkId: this.linkId,
      channelId: this.channelId,
      messageId,
      payload: {
        type: "PAYMENT_REQUEST",
        accessToken: this.accessToken,
        expiresAt: Date.now() + 3600000, // 1 hour from now
        internalTraceId,
        amount: Math.round(request.amount * 100), // Convert to cents
        tippingType: "DEFAULT",
      },
    };

    // Send message
    this.ws.send(JSON.stringify(message));

    return internalTraceId;
  }

  /**
   * Cancel ongoing payment
   */
  async cancelPayment(internalTraceId: string): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not connected");
    }

    const messageId = uuidv4();

    const message = {
      type: "MESSAGE",
      linkId: this.linkId,
      channelId: this.channelId,
      messageId,
      payload: {
        type: "CANCEL_PAYMENT_REQUEST",
        internalTraceId,
      },
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Close WebSocket connection
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers.clear();
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Global manager instance (one per tenant)
const managerInstances = new Map<string, ReaderConnectManager>();

/**
 * Get or create Reader Connect manager for a tenant
 */
export function getReaderConnectManager(
  tenantId: string,
  linkId: string,
  accessToken: string
): ReaderConnectManager {
  const key = `${tenantId}:${linkId}`;
  
  if (!managerInstances.has(key)) {
    const manager = new ReaderConnectManager(linkId, accessToken);
    managerInstances.set(key, manager);
  }

  return managerInstances.get(key)!;
}

/**
 * Remove Reader Connect manager for a tenant
 */
export function removeReaderConnectManager(tenantId: string, linkId: string): void {
  const key = `${tenantId}:${linkId}`;
  const manager = managerInstances.get(key);
  
  if (manager) {
    manager.disconnect();
    managerInstances.delete(key);
  }
}
