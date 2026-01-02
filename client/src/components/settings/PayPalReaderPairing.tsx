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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Loader2,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Info,
  Wifi,
  WifiOff,
  Trash2,
  RefreshCw,
} from "lucide-react";

export function PayPalReaderPairing() {
  const [code, setCode] = useState("");
  const [deviceName, setDeviceName] = useState("Stylora POS");
  const [showPairingForm, setShowPairingForm] = useState(false);

  // Fetch linked readers
  const {
    data: linkedReadersData,
    isLoading: loadingReaders,
    refetch: refetchReaders,
  } = trpc.izettle.getLinkedReaders.useQuery();

  const pairMutation = trpc.izettle.pairReader.useMutation({
    onSuccess: data => {
      toast.success(
        `PayPal Reader koblet til! Serienummer: ${data.serialNumber}`
      );
      setCode("");
      setShowPairingForm(false);
      refetchReaders();
    },
    onError: error => {
      toast.error(error.message || "Kunne ikke koble til PayPal Reader");
    },
  });

  const handlePair = () => {
    if (code.length !== 8) {
      toast.error("Koden må være 8 tegn");
      return;
    }
    pairMutation.mutate({ code, deviceName });
  };

  const linkedReaders = linkedReadersData?.readers || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          PayPal Reader
        </CardTitle>
        <CardDescription>
          Administrer dine PayPal Readers for å ta imot kortbetalinger
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Linked Readers List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Tilkoblede Readers</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchReaders()}
              disabled={loadingReaders}
            >
              <RefreshCw
                className={`h-4 w-4 ${loadingReaders ? "animate-spin" : ""}`}
              />
            </Button>
          </div>

          {loadingReaders ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : linkedReaders.length > 0 ? (
            <div className="space-y-2">
              {linkedReaders.map((reader: any) => (
                <div
                  key={reader.linkId}
                  className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Wifi className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {reader.deviceName || "PayPal Reader"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {reader.model} • S/N: {reader.serialNumber}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      Tilkoblet
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <WifiOff className="h-4 w-4" />
              <AlertDescription>
                Ingen PayPal Readers er koblet til ennå. Koble til en reader
                nedenfor.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Toggle Pairing Form */}
        {!showPairingForm && (
          <Button
            variant="outline"
            onClick={() => setShowPairingForm(true)}
            className="w-full"
          >
            <Smartphone className="mr-2 h-4 w-4" />
            Koble til ny PayPal Reader
          </Button>
        )}

        {/* Pairing Form */}
        {showPairingForm && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Koble til ny Reader</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPairingForm(false)}
              >
                Avbryt
              </Button>
            </div>

            {/* Instructions */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">
                    Slik kobler du til PayPal Reader:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>
                      Slå på PayPal Reader og skriv inn <strong>4578</strong>
                    </li>
                    <li>
                      Koble Reader til WiFi via{" "}
                      <strong>http://192.168.4.1/</strong>
                    </li>
                    <li>Readeren vil vise en 8-sifret kode på skjermen</li>
                    <li>Skriv inn koden nedenfor og klikk "Koble til"</li>
                  </ol>
                </div>
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="readerCode">
                8-sifret kode fra PayPal Reader
              </Label>
              <Input
                id="readerCode"
                placeholder="ABCD1234"
                value={code}
                onChange={e =>
                  setCode(e.target.value.toUpperCase().slice(0, 8))
                }
                maxLength={8}
                className="font-mono text-lg tracking-wider"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Koden vises på skjermen til PayPal Reader etter WiFi-tilkobling
              </p>
            </div>

            <div>
              <Label htmlFor="deviceName">Enhetsnavn (valgfritt)</Label>
              <Input
                id="deviceName"
                placeholder="Stylora POS"
                value={deviceName}
                onChange={e => setDeviceName(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Gi readeren et navn for å gjenkjenne den
              </p>
            </div>

            <Button
              onClick={handlePair}
              disabled={pairMutation.isPending || code.length !== 8}
              className="w-full"
            >
              {pairMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kobler til...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Koble til PayPal Reader
                </>
              )}
            </Button>
          </div>
        )}

        {/* Help Text */}
        <Alert variant="default" className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-900">
            <strong>Trenger du hjelp?</strong> Hvis readeren viser QR-kode i
            stedet for 8-sifret kode, skann QR-koden med telefonen din for å
            koble til via PayPal-appen, deretter vil readeren automatisk vises
            her.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
