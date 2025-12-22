import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Loader2, Smartphone, CheckCircle2, AlertCircle, Info } from "lucide-react";

export function PayPalReaderPairing() {
  const [code, setCode] = useState("");
  const [deviceName, setDeviceName] = useState("Stylora POS");

  const pairMutation = trpc.izettle.pairReader.useMutation({
    onSuccess: (data) => {
      toast.success(`PayPal Reader koblet til! Serienummer: ${data.serialNumber}`);
      setCode("");
      // Refresh the page to show the newly paired reader
      setTimeout(() => window.location.reload(), 1500);
    },
    onError: (error) => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Koble til PayPal Reader
        </CardTitle>
        <CardDescription>
          Koble din fysiske PayPal Reader til Stylora for å ta imot betalinger
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Instructions */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2 text-sm">
              <p className="font-medium">Slik kobler du til PayPal Reader:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Slå på PayPal Reader og skriv inn <strong>4578</strong></li>
                <li>Readeren vil vise en 8-sifret kode på skjermen</li>
                <li>Skriv inn koden nedenfor og klikk "Koble til"</li>
                <li>Readeren vil vise en bekreftelsesmelding når koblingen er vellykket</li>
              </ol>
            </div>
          </AlertDescription>
        </Alert>

        {/* Pairing Form */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="readerCode">8-sifret kode fra PayPal Reader</Label>
            <Input
              id="readerCode"
              placeholder="ABCD1234"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 8))}
              maxLength={8}
              className="font-mono text-lg tracking-wider"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Koden vises på skjermen til PayPal Reader
            </p>
          </div>

          <div>
            <Label htmlFor="deviceName">Enhetsnavn (valgfritt)</Label>
            <Input
              id="deviceName"
              placeholder="Stylora POS"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
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

        {/* Help Text */}
        <Alert variant="default" className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-900">
            <strong>Trenger du hjelp?</strong> Kontakt PayPal support hvis readeren ikke viser koden eller hvis du får feilmelding.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
