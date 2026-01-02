import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import {
  Loader2,
  Link2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export function IZettleOAuthConnection() {
  const {
    data: status,
    isLoading,
    refetch,
  } = trpc.izettle.getConnectionStatus.useQuery();

  const handleConnect = () => {
    // Redirect to iZettle OAuth
    window.location.href = "/api/izettle/auth";
  };

  const disconnectMutation = trpc.izettle.disconnect.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const isConnected = status?.isConnected;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          iZettle / PayPal Zettle Tilkobling
        </CardTitle>
        <CardDescription>
          Koble til din iZettle-konto for å bruke PayPal Reader og ta imot
          betalinger
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <>
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <strong>Tilkoblet!</strong> Din iZettle-konto er koblet til
                Stylora.
                {status.accountEmail && (
                  <div className="mt-1 text-sm">
                    Konto: <strong>{status.accountEmail}</strong>
                  </div>
                )}
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
              >
                {disconnectMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Du må koble til din iZettle-konto før du kan pare PayPal Reader.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Når du klikker "Koble til iZettle", vil du bli omdirigert til
                iZettle sin påloggingsside. Logg inn med din iZettle-konto og
                godta tilgangene som Stylora ber om.
              </p>

              <Button onClick={handleConnect} className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                Koble til iZettle
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
