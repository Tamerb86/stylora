import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export function StripeConnectButton() {
  const [isConnecting, setIsConnecting] = useState(false);
  
  const { data: status, refetch: refetchStatus } = trpc.stripeConnect.getStatus.useQuery();
  const { data: accountDetails } = trpc.stripeConnect.getAccountDetails.useQuery(
    undefined,
    { enabled: status?.connected }
  );
  
  const getAuthUrlMutation = trpc.stripeConnect.getAuthUrl.useQuery(
    undefined,
    { enabled: false }
  );
  
  const disconnectMutation = trpc.stripeConnect.disconnect.useMutation({
    onSuccess: () => {
      toast.success("Stripe-konto frakoblet");
      refetchStatus();
    },
    onError: (error) => {
      toast.error(error.message || "Kunne ikke koble fra Stripe");
    },
  });

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      
      // Get auth URL
      const result = await getAuthUrlMutation.refetch();
      
      if (result.data?.authUrl) {
        // Redirect to Stripe OAuth
        window.location.href = result.data.authUrl;
      } else {
        toast.error("Kunne ikke generere tilkoblingslenke");
      }
    } catch (error: any) {
      toast.error(error.message || "Kunne ikke koble til Stripe");
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Er du sikker på at du vil koble fra Stripe? Kortbetalinger vil bli deaktivert.")) {
      return;
    }
    
    disconnectMutation.mutate();
  };

  if (status?.connected) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Stripe Tilkoblet
              </CardTitle>
              <CardDescription>
                Din Stripe-konto er koblet til og klar til bruk
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {accountDetails && (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">E-post:</span>
                <span className="text-sm text-muted-foreground">{accountDetails.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Konto-ID:</span>
                <span className="text-sm text-muted-foreground font-mono">{accountDetails.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Land:</span>
                <span className="text-sm text-muted-foreground">{accountDetails.country?.toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Valuta:</span>
                <span className="text-sm text-muted-foreground">{accountDetails.currency?.toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <div className="flex gap-2">
                  {accountDetails.chargesEnabled ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Betalinger aktivert
                    </span>
                  ) : (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Betalinger deaktivert
                    </span>
                  )}
                  {accountDetails.payoutsEnabled ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Utbetalinger aktivert
                    </span>
                  ) : (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Utbetalinger deaktivert
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.open("https://dashboard.stripe.com", "_blank")}
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Åpne Stripe Dashboard
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={disconnectMutation.isPending}
            >
              {disconnectMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Koble fra
            </Button>
          </div>

          <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
            <strong>Tips:</strong> Du kan administrere kortlesere, se transaksjoner og endre innstillinger i Stripe Dashboard.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-muted-foreground" />
              Stripe Ikke Tilkoblet
            </CardTitle>
            <CardDescription>
              Koble til din Stripe-konto for å ta betaling med kortleser
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border p-4 space-y-3">
          <h4 className="font-medium text-sm">Hva er Stripe Connect?</h4>
          <p className="text-sm text-muted-foreground">
            Stripe Connect lar deg koble din Stripe-konto til Stylora med ett klikk. 
            Alle betalinger går direkte til din konto, og du beholder full kontroll.
          </p>
          
          <div className="space-y-2">
            <h5 className="font-medium text-sm">Fordeler:</h5>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Enkel oppsett - ingen API-nøkler å kopiere</li>
              <li>Sikker OAuth-autentisering</li>
              <li>Betalinger går direkte til din bankkonto</li>
              <li>Støtter alle betalingsmetoder (kort, Apple Pay, Google Pay)</li>
              <li>Administrer alt i Stripe Dashboard</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="font-medium text-sm">Hva trenger du?</h5>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>En Stripe-konto (gratis å opprette)</li>
              <li>Bedriftsinformasjon (org.nr, adresse)</li>
              <li>Bankkonto for utbetalinger</li>
            </ul>
          </div>
        </div>

        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full"
          size="lg"
        >
          {isConnecting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Kobler til Stripe...
            </>
          ) : (
            <>
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
              </svg>
              Koble til Stripe
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground text-center">
          Har du ikke Stripe-konto?{" "}
          <a
            href="https://stripe.com/no"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Opprett gratis konto
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
