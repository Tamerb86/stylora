import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function BookingSettingsSection() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.salonSettings.getBookingSettings.useQuery();
  const updateMutation = trpc.salonSettings.updateBookingSettings.useMutation({
    onSuccess: () => {
      utils.salonSettings.getBookingSettings.invalidate();
      toast.success("Bookinginnstillinger lagret!");
    },
    onError: (error) => {
      toast.error(`Feil ved lagring: ${error.message}`);
    },
  });

  const [localState, setLocalState] = useState<{
    requirePrepayment: boolean;
    cancellationWindowHours: number;
  } | null>(null);

  useEffect(() => {
    if (data && !localState) {
      setLocalState({
        requirePrepayment: data.requirePrepayment ?? false,
        cancellationWindowHours: data.cancellationWindowHours ?? 24,
      });
    }
  }, [data, localState]);

  if (isLoading || !localState) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Laster bookinginnstillinger...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSave = () => {
    updateMutation.mutate({
      requirePrepayment: localState.requirePrepayment,
      cancellationWindowHours: localState.cancellationWindowHours,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking & Avbestilling</CardTitle>
        <CardDescription>
          Konfigurer forhåndsbetaling og avbestillingsvindu for online bookinger
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Require Prepayment Toggle */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-lg border">
          <div className="flex-1">
            <div className="font-medium">Krev forhåndsbetaling</div>
            <div className="text-sm text-muted-foreground mt-1">
              Når aktivert, må kunder betale på forhånd for nye online bookinger
            </div>
          </div>
          <Switch
            checked={localState.requirePrepayment}
            onCheckedChange={(checked) =>
              setLocalState((prev) =>
                prev ? { ...prev, requirePrepayment: checked } : prev
              )
            }
          />
        </div>

        {/* Cancellation Window Hours */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-lg border">
          <div className="flex-1">
            <Label htmlFor="cancellationWindow" className="font-medium">
              Avbestillingsvindu (timer)
            </Label>
            <div className="text-sm text-muted-foreground mt-1">
              Avbestillinger innenfor dette vinduet vil bli merket som sen avbestilling
            </div>
          </div>
          <Input
            id="cancellationWindow"
            type="number"
            min={1}
            max={168}
            className="w-24 text-right"
            value={localState.cancellationWindowHours}
            onChange={(e) =>
              setLocalState((prev) =>
                prev
                  ? {
                      ...prev,
                      cancellationWindowHours: Number(e.target.value || 1),
                    }
                  : prev
              )
            }
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Lagrer...
              </>
            ) : (
              "Lagre endringer"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
