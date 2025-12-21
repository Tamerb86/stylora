import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, CreditCard } from "lucide-react";

interface ZettlePaymentStatusProps {
  purchaseUUID: string | null;
  paymentId: number | null;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ZettlePaymentStatus({
  purchaseUUID,
  paymentId,
  amount,
  onSuccess,
  onCancel,
}: ZettlePaymentStatusProps) {
  const [status, setStatus] = useState<"pending" | "completed" | "failed">("pending");
  const [pollCount, setPollCount] = useState(0);
  const maxPolls = 60; // 60 seconds max (poll every second)

  // Poll payment status
  const { data: paymentStatus, refetch } = trpc.pos.checkZettlePaymentStatus.useQuery(
    {
      purchaseUUID: purchaseUUID || "",
      paymentId: paymentId || 0,
    },
    {
      enabled: !!purchaseUUID && !!paymentId && status === "pending",
      refetchInterval: status === "pending" ? 2000 : false, // Poll every 2 seconds
    }
  );

  // Check status updates
  useEffect(() => {
    if (!paymentStatus) return;

    if (paymentStatus.status === "PAID") {
      setStatus("completed");
      setTimeout(() => onSuccess(), 1000);
    } else if (paymentStatus.status === "FAILED") {
      setStatus("failed");
    }
  }, [paymentStatus, onSuccess]);

  // Timeout after max polls
  useEffect(() => {
    if (status !== "pending") return;

    const interval = setInterval(() => {
      setPollCount((prev) => {
        if (prev >= maxPolls) {
          setStatus("failed");
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  return (
    <div className="space-y-6">
      {/* Status Display */}
      <div className="flex flex-col items-center justify-center py-8">
        {status === "pending" && (
          <>
            <div className="relative">
              <Loader2 className="w-16 h-16 text-purple-600 animate-spin" />
              <CreditCard className="w-8 h-8 text-purple-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              Venter på betaling...
            </h3>
            <p className="mt-2 text-sm text-gray-600 text-center">
              Vennligst fullfør betalingen på iZettle-leseren
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Beløp: {amount.toFixed(2)} NOK
            </p>
            <div className="mt-4 w-full max-w-xs">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 transition-all duration-1000"
                  style={{ width: `${(pollCount / maxPolls) * 100}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-center text-gray-500">
                {maxPolls - pollCount} sekunder gjenstår
              </p>
            </div>
          </>
        )}

        {status === "completed" && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-green-900">
              Betaling fullført!
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {amount.toFixed(2)} NOK betalt med iZettle
            </p>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-red-900">
              Betaling mislyktes
            </h3>
            <p className="mt-2 text-sm text-gray-600 text-center">
              Betalingen ble ikke fullført. Vennligst prøv igjen.
            </p>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {status === "pending" && (
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
          >
            Avbryt
          </Button>
        )}
        {status === "failed" && (
          <>
            <Button
              variant="outline"
              className="flex-1"
              onClick={onCancel}
            >
              Lukk
            </Button>
            <Button
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              onClick={() => {
                setStatus("pending");
                setPollCount(0);
                refetch();
              }}
            >
              Prøv igjen
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
