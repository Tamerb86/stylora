import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export interface StripeTerminalReader {
  id: string;
  label: string;
  status: string;
  device_type: string;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
}

export function useStripeTerminal() {
  const [terminal, setTerminal] = useState<any>(null);
  const [connectedReader, setConnectedReader] = useState<StripeTerminalReader | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const connectionTokenMutation = trpc.stripeTerminal.createConnectionToken.useMutation();
  const createPaymentIntentMutation = trpc.stripeTerminal.createPaymentIntent.useMutation();

  // Initialize Stripe Terminal SDK
  useEffect(() => {
    const initializeTerminal = async () => {
      try {
        // @ts-ignore - Stripe Terminal SDK loaded via script tag
        if (typeof StripeTerminal === "undefined") {
          console.error("Stripe Terminal SDK not loaded");
          return;
        }

        // @ts-ignore
        const terminalInstance = StripeTerminal.create({
          onFetchConnectionToken: async () => {
            try {
              const result = await connectionTokenMutation.mutateAsync({});
              return result.secret;
            } catch (error) {
              console.error("Error fetching connection token:", error);
              throw error;
            }
          },
          onUnexpectedReaderDisconnect: () => {
            toast.error("قارئ البطاقات انقطع بشكل غير متوقع", {
              description: "يرجى إعادة الاتصال من صفحة إدارة القارئ",
            });
            setConnectedReader(null);
          },
        });

        setTerminal(terminalInstance);
        setIsInitialized(true);
        console.log("Stripe Terminal initialized successfully");
      } catch (error) {
        console.error("Error initializing Stripe Terminal:", error);
        setIsInitialized(false);
      }
    };

    initializeTerminal();
  }, []);

  // Check if reader is already connected on mount
  useEffect(() => {
    if (terminal && isInitialized) {
      const checkConnection = async () => {
        try {
          const status = await terminal.getConnectionStatus();
          if (status === "connected") {
            const reader = await terminal.getConnectedReader();
            if (reader) {
              setConnectedReader(reader);
              console.log("Already connected to reader:", reader.label);
            }
          }
        } catch (error) {
          console.error("Error checking connection status:", error);
        }
      };

      checkConnection();
    }
  }, [terminal, isInitialized]);

  // Discover readers
  const discoverReaders = useCallback(async (): Promise<StripeTerminalReader[]> => {
    if (!terminal) {
      throw new Error("Terminal not initialized");
    }

    const config = {
      simulated: true, // Set to false for real readers
      location: undefined,
    };

    const discoverResult = await terminal.discoverReaders(config);

    if (discoverResult.error) {
      throw new Error(discoverResult.error.message);
    }

    return discoverResult.discoveredReaders;
  }, [terminal]);

  // Connect to a reader
  const connectReader = useCallback(async (reader: StripeTerminalReader): Promise<void> => {
    if (!terminal) {
      throw new Error("Terminal not initialized");
    }

    const connectResult = await terminal.connectReader(reader);

    if (connectResult.error) {
      throw new Error(connectResult.error.message);
    }

    setConnectedReader(connectResult.reader);
  }, [terminal]);

  // Disconnect from reader
  const disconnectReader = useCallback(async (): Promise<void> => {
    if (!terminal) {
      throw new Error("Terminal not initialized");
    }

    await terminal.disconnectReader();
    setConnectedReader(null);
  }, [terminal]);

  // Process payment
  const processPayment = useCallback(async (
    amount: number,
    currency: string = "nok",
    metadata: Record<string, string> = {}
  ): Promise<PaymentResult> => {
    if (!terminal) {
      return {
        success: false,
        error: "Terminal not initialized",
      };
    }

    if (!connectedReader) {
      return {
        success: false,
        error: "No reader connected. Please connect a reader first.",
      };
    }

    setIsProcessing(true);

    try {
      // Create payment intent on backend
      const paymentIntentResult = await createPaymentIntentMutation.mutateAsync({
        amount,
        currency,
        metadata,
      });

      if (!paymentIntentResult.clientSecret) {
        throw new Error("Failed to create payment intent");
      }

      // Collect payment method using the reader
      const collectResult = await terminal.collectPaymentMethod(paymentIntentResult.clientSecret);

      if (collectResult.error) {
        throw new Error(collectResult.error.message);
      }

      // Process the payment
      const processResult = await terminal.processPayment(collectResult.paymentIntent);

      if (processResult.error) {
        throw new Error(processResult.error.message);
      }

      // Payment successful
      return {
        success: true,
        paymentIntentId: processResult.paymentIntent.id,
      };
    } catch (error: any) {
      console.error("Payment processing error:", error);
      return {
        success: false,
        error: error.message || "Payment failed",
      };
    } finally {
      setIsProcessing(false);
    }
  }, [terminal, connectedReader, createPaymentIntentMutation]);

  // Cancel payment
  const cancelPayment = useCallback(async (): Promise<void> => {
    if (!terminal) {
      throw new Error("Terminal not initialized");
    }

    await terminal.cancelCollectPaymentMethod();
  }, [terminal]);

  return {
    terminal,
    connectedReader,
    isProcessing,
    isInitialized,
    discoverReaders,
    connectReader,
    disconnectReader,
    processPayment,
    cancelPayment,
  };
}
