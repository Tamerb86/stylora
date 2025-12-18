import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export default function IZettleSettings() {
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: status, isLoading, refetch } = (trpc as any).izettle.getStatus.useQuery();
  const disconnectMutation = (trpc as any).izettle.disconnect.useMutation({
    onSuccess: () => {
      toast.success("iZettle frakoblet", {
        description: "Din iZettle-konto er nå frakoblet.",
      });
      refetch();
    },
    onError: (error: any) => {
      toast.error("Feil ved frakobling", {
        description: error.message,
      });
    },
  });

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const result = await (trpc as any).izettle.getAuthUrl.query();
      if (result.url) {
        // Open OAuth URL in new window
        window.location.href = result.url;
      }
    } catch (error: any) {
      toast.error("Feil ved tilkobling", {
        description: error.message,
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    if (confirm("Er du sikker på at du vil koble fra iZettle?")) {
      disconnectMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isConnected = status?.connected;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">iZettle-integrasjon</h1>
        <p className="text-gray-600 mt-2">
          Koble til din iZettle-konto for å akseptere betalinger via iZettle-terminaler
        </p>
      </div>

      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tilkoblingsstatus</CardTitle>
              <CardDescription>Status for din iZettle-integrasjon</CardDescription>
            </div>
            {isConnected ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Tilkoblet
              </Badge>
            ) : (
              <Badge variant="secondary">
                <XCircle className="h-4 w-4 mr-1" />
                Ikke tilkoblet
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900">iZettle er tilkoblet</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Din iZettle-konto er koblet til og klar til å akseptere betalinger.
                    </p>
                  </div>
                </div>
              </div>

              {status.lastSync && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Sist synkronisert:</span>{" "}
                  {format(new Date(status.lastSync), "PPP 'kl.' HH:mm", { locale: nb })}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  onClick={handleDisconnect}
                  disabled={disconnectMutation.isPending}
                >
                  {disconnectMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Kobler fra...
                    </>
                  ) : (
                    "Koble fra iZettle"
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900">Koble til iZettle</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      For å akseptere betalinger via iZettle, må du først koble til din iZettle-konto.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Kobler til...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Koble til iZettle
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Om iZettle-integrasjon</CardTitle>
          <CardDescription>Hvordan fungerer iZettle med BarberTime?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none">
            <p>
              iZettle-integrasjonen lar deg akseptere betalinger direkte fra BarberTime ved hjelp av
              iZettle-terminaler. Dette gir deg:
            </p>
            <ul>
              <li>Sømløs betalingsprosessering i salongen</li>
              <li>Automatisk synkronisering av transaksjoner</li>
              <li>Enkel refundering og annullering</li>
              <li>Detaljert betalingshistorikk</li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-amber-900">Viktig informasjon</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Du må ha en aktiv iZettle-konto for å bruke denne integrasjonen. Hvis du ikke har
                  en konto, kan du registrere deg på{" "}
                  <a
                    href="https://www.izettle.com/no"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-amber-900"
                  >
                    izettle.com
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Card */}
      <Card>
        <CardHeader>
          <CardTitle>Funksjoner</CardTitle>
          <CardDescription>Hva kan du gjøre med iZettle-integrasjonen?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Aksepter betalinger</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Ta imot kort- og mobilbetalinger via iZettle-terminaler
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Automatisk synkronisering</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Transaksjoner synkroniseres automatisk med BarberTime
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Refundering</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Refunder betalinger enkelt direkte fra BarberTime
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Betalingshistorikk</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Se detaljert historikk over alle transaksjoner
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
