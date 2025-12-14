/**
 * Fiken Settings Page
 * 
 * Manage Fiken accounting integration
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  RefreshCw, 
  Settings, 
  Users, 
  FileText,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

export default function FikenSettings() {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  // Queries
  const { data: settings, refetch: refetchSettings } = trpc.fiken.getSettings.useQuery();
  const { data: syncStatus, refetch: refetchSyncStatus } = trpc.fiken.getSyncStatus.useQuery();
  const { data: syncLogs } = trpc.fiken.getSyncLogs.useQuery({ limit: 20 });

  // Mutations
  const saveCredentialsMutation = trpc.fiken.saveCredentials.useMutation();
  const handleCallbackMutation = trpc.fiken.handleCallback.useMutation();
  const testConnectionMutation = trpc.fiken.testConnection.useMutation();
  const disconnectMutation = trpc.fiken.disconnect.useMutation();
  const syncAllCustomersMutation = trpc.fiken.syncAllCustomers.useMutation();
  const syncAllOrdersMutation = trpc.fiken.syncAllOrders.useMutation();
  const syncAllServicesMutation = trpc.fiken.syncAllServices.useMutation();
  const syncAllProductsMutation = trpc.fiken.syncAllProducts.useMutation();
  const manualFullSyncMutation = trpc.fiken.manualFullSync.useMutation();

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error");

    if (error) {
      toast.error(`Fiken-tilkobling mislyktes: ${error}`);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code && state) {
      handleOAuthCallback(code, state);
    }
  }, []);

  const handleOAuthCallback = async (code: string, state: string) => {
    setIsConnecting(true);
    try {
      const redirectUri = `${window.location.origin}/fiken`;
      
      const result = await handleCallbackMutation.mutateAsync({
        code,
        state,
        redirectUri,
      });

      toast.success(`Tilkoblet til Fiken! Koblet til: ${result.companyName}`);

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Refresh settings
      refetchSettings();
      refetchSyncStatus();
    } catch (error) {
      toast.error(`Kunne ikke koble til Fiken: ${error instanceof Error ? error.message : "Ukjent feil"}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSaveCredentials = async () => {
    if (!clientId || !clientSecret) {
      toast.error("Vennligst fyll inn både Client ID og Client Secret");
      return;
    }

    try {
      await saveCredentialsMutation.mutateAsync({
        clientId,
        clientSecret,
      });

      toast.success("OAuth-legitimasjon er lagret. Du kan nå koble til Fiken.");

      refetchSettings();
      setClientId("");
      setClientSecret("");
    } catch (error) {
      toast.error(`Kunne ikke lagre: ${error instanceof Error ? error.message : "Ukjent feil"}`);
    }
  };

  const handleConnect = () => {
    const redirectUri = `${window.location.origin}/fiken`;
    // Build auth URL manually from settings
    if (!settings?.hasCredentials) {
      toast.error("Vennligst legg til OAuth-legitimasjon først");
      return;
    }
    
    // Redirect to backend endpoint that will generate auth URL
    window.location.href = `/api/fiken/auth?redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  const handleDisconnect = async () => {
    if (!confirm("Er du sikker på at du vil koble fra Fiken?")) {
      return;
    }

    try {
      await disconnectMutation.mutateAsync();
      toast.success("Fiken-integrasjonen er deaktivert");
      refetchSettings();
      refetchSyncStatus();
    } catch (error) {
      toast.error(`Kunne ikke koble fra: ${error instanceof Error ? error.message : "Ukjent feil"}`);
    }
  };

  const handleTestConnection = async () => {
    try {
      const result = await testConnectionMutation.mutateAsync();
      
      if (result.success) {
        toast.success(`Tilkobling OK! Koblet til: ${result.companyName}`);
      } else {
        toast.error(`Tilkobling mislyktes: ${result.error}`);
      }
    } catch (error) {
      toast.error(`Kunne ikke teste tilkobling: ${error instanceof Error ? error.message : "Ukjent feil"}`);
    }
  };

  const handleSyncCustomers = async () => {
    try {
      const result = await syncAllCustomersMutation.mutateAsync();
      
      if (result.success) {
        toast.success(`Synkronisering fullført! ${result.totalProcessed} kunder behandlet`);
      } else {
        toast.error(`Synkronisering delvis fullført: ${result.totalProcessed} behandlet, ${result.totalFailed} feilet`);
      }

      refetchSyncStatus();
    } catch (error) {
      toast.error(`Synkronisering mislyktes: ${error instanceof Error ? error.message : "Ukjent feil"}`);
    }
  };

  const handleSyncOrders = async () => {
    try {
      const result = await syncAllOrdersMutation.mutateAsync();
      
      if (result.success) {
        toast.success(`Synkronisering fullført! ${result.totalProcessed} ordrer behandlet`);
      } else {
        toast.error(`Synkronisering delvis fullført: ${result.totalProcessed} behandlet, ${result.totalFailed} feilet`);
      }

      refetchSyncStatus();
    } catch (error) {
      toast.error(`Synkronisering mislyktes: ${error instanceof Error ? error.message : "Ukjent feil"}`);
    }
  };

  const handleSyncServices = async () => {
    try {
      const result = await syncAllServicesMutation.mutateAsync();
      
      if (result.success) {
        toast.success(`Synkronisering fullført! ${result.synced} tjenester synkronisert`);
      } else {
        toast.error(`Synkronisering delvis fullført: ${result.synced} synkronisert, ${result.failed} feilet`);
      }

      refetchSyncStatus();
    } catch (error) {
      toast.error(`Synkronisering mislyktes: ${error instanceof Error ? error.message : "Ukjent feil"}`);
    }
  };

  const handleSyncProducts = async () => {
    try {
      const result = await syncAllProductsMutation.mutateAsync();
      
      if (result.success) {
        toast.success(`Synkronisering fullført! ${result.synced} produkter synkronisert`);
      } else {
        toast.error(`Synkronisering delvis fullført: ${result.synced} synkronisert, ${result.failed} feilet`);
      }

      refetchSyncStatus();
    } catch (error) {
      toast.error(`Synkronisering mislyktes: ${error instanceof Error ? error.message : "Ukjent feil"}`);
    }
  };

  const handleFullSync = async () => {
    try {
      const result = await manualFullSyncMutation.mutateAsync();
      
      const totalSynced = 
        (result.customers?.totalProcessed || 0) + 
        (result.services?.synced || 0) + 
        (result.products?.synced || 0) + 
        (result.orders?.totalProcessed || 0);
      
      const totalFailed = 
        (result.customers?.totalFailed || 0) + 
        (result.services?.failed || 0) + 
        (result.products?.failed || 0) + 
        (result.orders?.totalFailed || 0);

      if (totalFailed === 0) {
        toast.success(`Full synkronisering fullført! ${totalSynced} elementer synkronisert`);
      } else {
        toast.warning(`Synkronisering delvis fullført: ${totalSynced} synkronisert, ${totalFailed} feilet`);
      }

      refetchSyncStatus();
    } catch (error) {
      toast.error(`Synkronisering mislyktes: ${error instanceof Error ? error.message : "Ukjent feil"}`);
    }
  };

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Kobler til Fiken...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Fiken-integrasjon</h1>
        <p className="text-muted-foreground">
          Koble til Fiken for automatisk synkronisering av kunder og fakturaer
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Oversikt</TabsTrigger>
          <TabsTrigger value="sync">Synkronisering</TabsTrigger>
          <TabsTrigger value="logs">Logg</TabsTrigger>
          <TabsTrigger value="settings">Innstillinger</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tilkoblingsstatus</CardTitle>
              <CardDescription>
                Status for Fiken-integrasjonen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings?.isConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Tilkoblet til Fiken</span>
                  </div>
                  
                  {settings.companyName && (
                    <div>
                      <Label className="text-muted-foreground">Firma</Label>
                      <p className="font-medium">{settings.companyName}</p>
                    </div>
                  )}

                  {settings.organizationNumber && (
                    <div>
                      <Label className="text-muted-foreground">Org.nr</Label>
                      <p className="font-medium">{settings.organizationNumber}</p>
                    </div>
                  )}

                  {settings.lastSyncAt && (
                    <div>
                      <Label className="text-muted-foreground">Siste synkronisering</Label>
                      <p className="font-medium">
                        {new Date(settings.lastSyncAt).toLocaleString("no-NO")}
                      </p>
                      {settings.lastSyncStatus && (
                        <Badge 
                          variant={
                            settings.lastSyncStatus === "success" ? "default" : 
                            settings.lastSyncStatus === "failed" ? "destructive" : 
                            "secondary"
                          }
                          className="mt-1"
                        >
                          {settings.lastSyncStatus === "success" ? "Vellykket" :
                           settings.lastSyncStatus === "failed" ? "Feilet" :
                           "Delvis"}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleTestConnection} 
                      disabled={testConnectionMutation.isPending}
                      variant="outline"
                    >
                      {testConnectionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Test tilkobling
                    </Button>
                    <Button 
                      onClick={handleDisconnect} 
                      disabled={disconnectMutation.isPending}
                      variant="destructive"
                    >
                      Koble fra
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                    <span>Ikke tilkoblet</span>
                  </div>

                  {!settings?.hasCredentials ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Du må først legge til OAuth-legitimasjon i Innstillinger-fanen
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Button onClick={handleConnect}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Koble til Fiken
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {settings?.isConnected && syncStatus && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Usynkroniserte kunder
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{syncStatus.unsyncedCustomers}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Kunder som ikke er synkronisert til Fiken
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Usynkroniserte ordrer
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{syncStatus.unsyncedOrders}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ordrer som ikke er synkronisert til Fiken
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Sync Tab */}
        <TabsContent value="sync" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manuell synkronisering</CardTitle>
              <CardDescription>
                Synkroniser kunder og ordrer til Fiken
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!settings?.isConnected ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Du må koble til Fiken før du kan synkronisere
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Synkroniser kunder</h3>
                      <p className="text-sm text-muted-foreground">
                        {syncStatus?.unsyncedCustomers || 0} usynkroniserte kunder
                      </p>
                    </div>
                    <Button 
                      onClick={handleSyncCustomers}
                      disabled={syncAllCustomersMutation.isPending || (syncStatus?.unsyncedCustomers || 0) === 0}
                    >
                      {syncAllCustomersMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {syncAllCustomersMutation.isPending ? "Synkroniserer..." : "Synkroniser"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Synkroniser ordrer</h3>
                      <p className="text-sm text-muted-foreground">
                        {syncStatus?.unsyncedOrders || 0} usynkroniserte ordrer
                      </p>
                    </div>
                    <Button 
                      onClick={handleSyncOrders}
                      disabled={syncAllOrdersMutation.isPending || (syncStatus?.unsyncedOrders || 0) === 0}
                    >
                      {syncAllOrdersMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {syncAllOrdersMutation.isPending ? "Synkroniserer..." : "Synkroniser"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Synkroniser tjenester</h3>
                      <p className="text-sm text-muted-foreground">
                        Synkroniser alle tjenester som produkter i Fiken
                      </p>
                    </div>
                    <Button 
                      onClick={handleSyncServices}
                      disabled={syncAllServicesMutation.isPending}
                    >
                      {syncAllServicesMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {syncAllServicesMutation.isPending ? "Synkroniserer..." : "Synkroniser"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Synkroniser produkter</h3>
                      <p className="text-sm text-muted-foreground">
                        Synkroniser alle fysiske produkter til Fiken
                      </p>
                    </div>
                    <Button 
                      onClick={handleSyncProducts}
                      disabled={syncAllProductsMutation.isPending}
                    >
                      {syncAllProductsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {syncAllProductsMutation.isPending ? "Synkroniserer..." : "Synkroniser"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                    <div>
                      <h3 className="font-medium">Full synkronisering</h3>
                      <p className="text-sm text-muted-foreground">
                        Synkroniser alt: kunder, tjenester, produkter og ordrer
                      </p>
                    </div>
                    <Button 
                      onClick={handleFullSync}
                      disabled={manualFullSyncMutation.isPending}
                      variant="default"
                    >
                      {manualFullSyncMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {manualFullSyncMutation.isPending ? "Synkroniserer..." : "Synkroniser alt"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Synkroniseringslogg</CardTitle>
              <CardDescription>
                Historikk over synkroniseringer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!syncLogs || syncLogs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Ingen loggoppføringer ennå
                </p>
              ) : (
                <div className="space-y-2">
                  {syncLogs.map((log: any) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="mt-0.5">
                        {log.status === "success" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : log.status === "failed" ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">
                            {log.operation.replace("_", " ")}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString("no-NO")}
                          </span>
                        </div>
                        {log.itemsProcessed > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {log.itemsProcessed} behandlet, {log.itemsFailed} feilet
                          </p>
                        )}
                        {log.errorMessage && (
                          <p className="text-sm text-red-500">{log.errorMessage}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>OAuth-legitimasjon</CardTitle>
              <CardDescription>
                Konfigurer Fiken OAuth-tilgang. Du må opprette en OAuth-app i Fiken først.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Hvordan få OAuth-legitimasjon:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Logg inn på Fiken.no</li>
                    <li>Gå til Rediger konto → Profil → Andre innstillinger</li>
                    <li>Aktiver "Jeg er utvikler"</li>
                    <li>Gå til "API"-fanen og opprett en ny app</li>
                    <li>Kopier Client ID og Client Secret hit</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Din Fiken OAuth Client ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientSecret">Client Secret</Label>
                <Input
                  id="clientSecret"
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Din Fiken OAuth Client Secret"
                />
              </div>

              <Button 
                onClick={handleSaveCredentials}
                disabled={saveCredentialsMutation.isPending}
              >
                {saveCredentialsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lagre legitimasjon
              </Button>

              {settings?.hasCredentials && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    OAuth-legitimasjon er lagret. Du kan nå koble til Fiken fra Oversikt-fanen.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
