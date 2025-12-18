import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DashboardLayout from "@/components/DashboardLayout";
import { Loader2, ExternalLink, CheckCircle2, XCircle, AlertCircle, Smartphone, CreditCard, BarChart3, RefreshCw, FileText, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export default function IZettleSettings() {
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: status, isLoading, refetch } = (trpc as any).izettle.getStatus.useQuery();
  
  const getAuthUrlQuery = (trpc as any).izettle.getAuthUrl.useQuery(undefined, {
    enabled: false,
  });

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
      const result = await getAuthUrlQuery.refetch();
      if (result.data?.url) {
        // Open OAuth URL in current window
        window.location.href = result.data.url;
      } else {
        toast.error("Kunne ikke hente autorisasjons-URL", {
          description: "Prøv igjen senere.",
        });
        setIsConnecting(false);
      }
    } catch (error: any) {
      toast.error("Feil ved tilkobling", {
        description: error.message,
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    if (confirm("Er du sikker på at du vil koble fra iZettle? Dette vil deaktivere alle iZettle-betalinger.")) {
      disconnectMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const isConnected = status?.connected;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              iZettle-integrasjon
            </h1>
            <p className="text-gray-600 mt-2 ml-15">
              Koble til din iZettle-konto for å akseptere betalinger via iZettle-terminaler
            </p>
          </div>
          {isConnected && (
            <Badge variant="default" className="bg-green-500 text-white px-4 py-2 text-sm">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Aktiv
            </Badge>
          )}
        </div>

        {/* Connection Status Card */}
        <Card className="border-2 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Tilkoblingsstatus</CardTitle>
                <CardDescription>Status for din iZettle-integrasjon</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {isConnected ? (
              <>
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <AlertDescription className="ml-2">
                    <span className="font-semibold text-green-900">iZettle er tilkoblet og klar til bruk</span>
                    <p className="text-sm text-green-700 mt-1">
                      Din iZettle-konto er koblet til og du kan nå akseptere betalinger via iZettle-terminaler.
                    </p>
                  </AlertDescription>
                </Alert>

                {status.lastSync && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <RefreshCw className="h-4 w-4" />
                    <span className="font-medium">Sist synkronisert:</span>
                    <span>{format(new Date(status.lastSync), "PPP 'kl.' HH:mm", { locale: nb })}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="destructive"
                    onClick={handleDisconnect}
                    disabled={disconnectMutation.isPending}
                    size="lg"
                  >
                    {disconnectMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Kobler fra...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Koble fra iZettle
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open('/payment-history', '_blank')}
                    size="lg"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Se betalingshistorikk
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <AlertDescription className="ml-2">
                    <span className="font-semibold text-blue-900">Koble til iZettle for å komme i gang</span>
                    <p className="text-sm text-blue-700 mt-1">
                      For å akseptere betalinger via iZettle, må du først koble til din iZettle-konto. 
                      Du vil bli omdirigert til iZettle for å autorisere tilkoblingen.
                    </p>
                  </AlertDescription>
                </Alert>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-100">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Før du kobler til
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Du må ha en aktiv iZettle-konto</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Sørg for at du er logget inn på iZettle i nettleseren</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Les <a href="/IZETTLE_SETUP_GUIDE.md" target="_blank" className="text-blue-600 underline hover:text-blue-800">konfigurasjonsguiden</a> for detaljerte instruksjoner</span>
                    </li>
                  </ul>
                </div>

                <Button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Kobler til iZettle...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-5 w-5 mr-2" />
                      Koble til iZettle
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Smartphone className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Aksepter betalinger</CardTitle>
                  <CardDescription className="text-xs">Kort og mobilbetalinger</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Ta imot kort- og mobilbetalinger via iZettle-terminaler direkte fra BarberTime-kassen.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Automatisk synkronisering</CardTitle>
                  <CardDescription className="text-xs">Sanntidsoppdateringer</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Transaksjoner synkroniseres automatisk med BarberTime for nøyaktig bokføring.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Enkel refundering</CardTitle>
                  <CardDescription className="text-xs">Håndter refusjoner</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Refunder betalinger enkelt direkte fra BarberTime uten å bruke iZettle-appen.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Detaljert historikk</CardTitle>
                  <CardDescription className="text-xs">Komplett oversikt</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Se detaljert historikk over alle iZettle-transaksjoner med fullstendig sporbarhet.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Help Card */}
        <Card className="border-2 border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="h-5 w-5" />
              Trenger du hjelp?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-amber-800">
              Hvis du ikke har en iZettle-konto, kan du registrere deg på{" "}
              <a
                href="https://www.izettle.com/no"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline hover:text-amber-900"
              >
                izettle.com
              </a>
              .
            </p>
            <p className="text-sm text-amber-800">
              Les vår{" "}
              <a
                href="/IZETTLE_SETUP_GUIDE.md"
                target="_blank"
                className="font-semibold underline hover:text-amber-900"
              >
                komplette konfigurasjonsguide
              </a>
              {" "}for steg-for-steg instruksjoner.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
