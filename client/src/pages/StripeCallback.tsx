import { useEffect, useState } from "react";
import { useLocation, useRouter } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function StripeCallback() {
  const [, setLocation] = useLocation();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState("");

  const handleCallbackMutation =
    trpc.stripeConnect.handleCallback.useMutation();

  useEffect(() => {
    const handleCallback = async () => {
      // Get query parameters
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state"); // tenantId
      const error = params.get("error");
      const errorDescription = params.get("error_description");

      // Handle OAuth error
      if (error) {
        setStatus("error");
        setErrorMessage(errorDescription || error);
        return;
      }

      // Validate parameters
      if (!code || !state) {
        setStatus("error");
        setErrorMessage("Manglende parametere fra Stripe");
        return;
      }

      try {
        // Exchange code for access token
        await handleCallbackMutation.mutateAsync({
          code,
          state,
        });

        setStatus("success");

        // Redirect to settings after 2 seconds
        setTimeout(() => {
          setLocation("/settings?tab=payment");
        }, 2000);
      } catch (error: any) {
        setStatus("error");
        setErrorMessage(error.message || "Kunne ikke koble til Stripe");
      }
    };

    handleCallback();
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Kobler til Stripe...
            </CardTitle>
            <CardDescription>
              Vennligst vent mens vi kobler til din Stripe-konto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Autentiserer med Stripe</p>
              <p>• Henter tilgangstokens</p>
              <p>• Lagrer kontoinformasjon</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Tilkobling vellykket!
            </CardTitle>
            <CardDescription>
              Din Stripe-konto er nå koblet til Stylora
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 space-y-2">
              <p className="text-sm text-green-800">
                ✅ Stripe-konto koblet til
              </p>
              <p className="text-sm text-green-800">
                ✅ Kortbetalinger aktivert
              </p>
              <p className="text-sm text-green-800">
                ✅ Klar til å ta betaling
              </p>
            </div>

            <p className="text-sm text-muted-foreground">
              Du blir automatisk videresendt til innstillinger...
            </p>

            <Button
              onClick={() => setLocation("/settings?tab=payment")}
              className="w-full"
            >
              Gå til innstillinger
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Tilkobling feilet
          </CardTitle>
          <CardDescription>
            Kunne ikke koble til Stripe-kontoen din
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-800">
              {errorMessage || "En ukjent feil oppstod"}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Mulige årsaker:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Du avbrøt tilkoblingsprosessen</li>
              <li>Stripe-kontoen er ikke fullstendig konfigurert</li>
              <li>Nettverksfeil</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setLocation("/settings?tab=payment")}
              variant="outline"
              className="flex-1"
            >
              Tilbake til innstillinger
            </Button>
            <Button onClick={() => window.location.reload()} className="flex-1">
              Prøv igjen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
