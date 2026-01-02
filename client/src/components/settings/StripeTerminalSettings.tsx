import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Loader2,
  CreditCard,
  Wifi,
  WifiOff,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";

export function StripeTerminalSettings() {
  const [stripeApiKey, setStripeApiKey] = useState("");
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [readers, setReaders] = useState<any[]>([]);
  const [connectedReader, setConnectedReader] = useState<any>(null);

  // Get Stripe API key from payment settings
  const { data: settings } = (trpc as any).paymentSettings.get.useQuery();

  // Stripe Terminal mutations
  const connectionTokenMutation =
    trpc.stripeTerminal.createConnectionToken.useMutation();
  const listReadersMutation = trpc.stripeTerminal.listReaders.useMutation();

  useEffect(() => {
    if (settings?.stripeSecretKey) {
      setStripeApiKey(settings.stripeSecretKey);
    }
  }, [settings]);

  const handleDiscoverReaders = async () => {
    if (!stripeApiKey) {
      toast.error("Vennligst legg til Stripe API-nøkkel først");
      return;
    }

    setIsDiscovering(true);
    try {
      const result = await listReadersMutation.mutateAsync({
        apiKey: stripeApiKey,
      });

      setReaders(result);

      if (result.length === 0) {
        toast.info(
          "Ingen lesere funnet. Sørg for at leseren er påslått og koblet til WiFi."
        );
      } else {
        toast.success(`Fant ${result.length} leser(e)`);
      }
    } catch (error: any) {
      toast.error(error.message || "Kunne ikke finne lesere");
    } finally {
      setIsDiscovering(false);
    }
  };

  const getReaderStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <Wifi className="h-4 w-4 text-green-600" />;
      case "offline":
        return <WifiOff className="h-4 w-4 text-gray-400" />;
      default:
        return <WifiOff className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getReaderStatusText = (status: string) => {
    switch (status) {
      case "online":
        return "Online";
      case "offline":
        return "Offline";
      default:
        return "Ukjent";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Stripe Terminal
        </CardTitle>
        <CardDescription>
          Koble til Stripe kortleser for å ta betaling i salongen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* API Key Status */}
        <div className="p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Stripe API-nøkkel</p>
              <p className="text-xs text-muted-foreground">
                {stripeApiKey ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    Konfigurert
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600">
                    <XCircle className="h-3 w-3" />
                    Ikke konfigurert
                  </span>
                )}
              </p>
            </div>
            {!stripeApiKey && (
              <Button variant="outline" size="sm" asChild>
                <a href="#payment-settings">Legg til API-nøkkel</a>
              </Button>
            )}
          </div>
        </div>

        {/* Discover Readers */}
        {stripeApiKey && (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Tilgjengelige lesere</h3>
                  <p className="text-xs text-muted-foreground">
                    Finn og koble til Stripe kortlesere på nettverket
                  </p>
                </div>
                <Button
                  onClick={handleDiscoverReaders}
                  disabled={isDiscovering}
                  variant="outline"
                  size="sm"
                >
                  {isDiscovering ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Søker...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-3 w-3" />
                      Søk etter lesere
                    </>
                  )}
                </Button>
              </div>

              {/* Readers List */}
              {readers.length > 0 && (
                <div className="space-y-2">
                  {readers.map(reader => (
                    <div
                      key={reader.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getReaderStatusIcon(reader.status)}
                        <div>
                          <p className="text-sm font-medium">
                            {reader.label || reader.id}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {reader.device_type} •{" "}
                            {getReaderStatusText(reader.status)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {reader.status === "online" && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                            Klar
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {readers.length === 0 && !isDiscovering && (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Ingen lesere funnet</p>
                  <p className="text-xs mt-1">
                    Klikk "Søk etter lesere" for å finne tilgjengelige
                    Stripe-lesere
                  </p>
                </div>
              )}
            </div>

            {/* Setup Instructions */}
            <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <h4 className="text-sm font-medium mb-2">
                Slik setter du opp Stripe Terminal:
              </h4>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>
                  Bestill en Stripe kortleser fra{" "}
                  <a
                    href="https://dashboard.stripe.com/terminal/shop"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Stripe Dashboard
                  </a>
                </li>
                <li>
                  Koble leseren til WiFi (følg instruksjonene som følger med
                  leseren)
                </li>
                <li>
                  Sørg for at leseren er på samme nettverk som denne enheten
                </li>
                <li>Klikk "Søk etter lesere" for å finne leseren</li>
                <li>
                  Når leseren vises som "Online", er den klar til bruk i
                  POS-systemet
                </li>
              </ol>
            </div>

            {/* Supported Readers */}
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium mb-2">Støttede lesere:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Stripe Reader S700 (~$299)</li>
                <li>• BBPOS WisePOS E (~$299)</li>
                <li>• Verifone P400 (~$299)</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                💡 <strong>Tips:</strong> Stripe Terminal støtter chip,
                contactless, Apple Pay og Google Pay
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
