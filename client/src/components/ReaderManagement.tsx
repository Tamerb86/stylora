import { useState } from "react";
import { Reader } from "@stripe/terminal-js";
import { useStripeTerminal } from "@/contexts/StripeTerminalContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wifi, WifiOff, Search, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function ReaderManagement() {
  const {
    connectedReader,
    isInitialized,
    isConnecting,
    discoverReaders,
    connectReader,
    disconnectReader,
  } = useStripeTerminal();

  const [discoveredReaders, setDiscoveredReaders] = useState<Reader[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);

  const handleDiscover = async () => {
    setIsDiscovering(true);
    try {
      const readers = await discoverReaders();
      setDiscoveredReaders(readers);
      
      if (readers.length === 0) {
        toast.info("Ingen lesere funnet. Sjekk at leseren er påslått og i nærheten.");
      } else {
        toast.success(`Fant ${readers.length} leser${readers.length > 1 ? 'e' : ''}`);
      }
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleConnect = async (reader: Reader) => {
    await connectReader(reader);
    // Clear discovered readers after connection
    setDiscoveredReaders([]);
  };

  if (!isInitialized) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Initialiserer Stripe Terminal...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connected Reader Status */}
      {connectedReader && (
        <Card className="p-4 border-green-200 bg-green-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-900">
                  {connectedReader.label || "Kortleser"}
                </p>
                <p className="text-sm text-green-700">
                  {connectedReader.serial_number}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={disconnectReader}
              className="border-green-300 hover:bg-green-100"
            >
              Koble fra
            </Button>
          </div>
        </Card>
      )}

      {/* Discovery Section */}
      {!connectedReader && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Finn kortlesere</h3>
                <p className="text-sm text-muted-foreground">
                  Søk etter tilgjengelige Stripe Terminal-lesere
                </p>
              </div>
              <Button
                onClick={handleDiscover}
                disabled={isDiscovering}
                className="gap-2"
              >
                {isDiscovering ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Søker...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Søk etter lesere
                  </>
                )}
              </Button>
            </div>

            {/* Discovered Readers List */}
            {discoveredReaders.length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                <p className="text-sm font-medium">
                  Funnet {discoveredReaders.length} leser{discoveredReaders.length > 1 ? 'e' : ''}:
                </p>
                <div className="space-y-2">
                  {discoveredReaders.map((reader) => (
                    <div
                      key={reader.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <Wifi className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{reader.label || "Kortleser"}</p>
                          <p className="text-sm text-muted-foreground">
                            {reader.serial_number}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {reader.device_type}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleConnect(reader)}
                        disabled={isConnecting}
                      >
                        {isConnecting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Kobler til...
                          </>
                        ) : (
                          "Koble til"
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Help Text */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                <strong>Tips:</strong> Sørg for at kortleseren er påslått og i nærheten. 
                I testmodus vil du se simulerte lesere.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
