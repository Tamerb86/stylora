import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, CreditCard, Banknote, Smartphone, Settings, Trash2, Edit, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { IZettleSetupWizard } from "@/components/IZettleSetupWizard";

type ProviderType = "stripe_terminal" | "vipps" | "nets" | "manual_card" | "cash" | "generic";

interface ProviderConfig {
  // Stripe Terminal
  apiKey?: string;
  terminalId?: string;
  
  // Vipps
  merchantSerialNumber?: string;
  clientId?: string;
  clientSecret?: string;
  
  // Nets/BankAxept
  merchantId?: string;
  accountNumber?: string;
  
  // Generic
  [key: string]: any;
}

export default function PaymentProviders() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<any>(null);
  const [providerType, setProviderType] = useState<ProviderType>("cash");
  const [providerName, setProviderName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [config, setConfig] = useState<ProviderConfig>({});
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const { data: providers, refetch } = trpc.paymentTerminal.listProviders.useQuery();
  const addProvider = trpc.paymentTerminal.addProvider.useMutation();
  const updateProvider = trpc.paymentTerminal.updateProvider.useMutation();
  const deleteProvider = trpc.paymentTerminal.deleteProvider.useMutation();
  const testConnection = trpc.paymentTerminal.testConnection.useMutation();

  const handleAddProvider = async () => {
    if (!providerName.trim()) {
      toast.error("Vennligst oppgi et navn");
      return;
    }

    try {
      await addProvider.mutateAsync({
        providerType,
        providerName,
        config: Object.keys(config).length > 0 ? config : undefined,
        isDefault,
      });

      toast.success("Terminal lagt til!");
      resetForm();
      setIsAddDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(`Feil: ${error.message}`);
    }
  };

  const handleUpdateProvider = async () => {
    if (!editingProvider) return;

    try {
      await updateProvider.mutateAsync({
        providerId: editingProvider.id,
        providerName,
        config: Object.keys(config).length > 0 ? config : undefined,
        isDefault,
      });

      toast.success("Terminal oppdatert!");
      resetForm();
      setIsEditDialogOpen(false);
      setEditingProvider(null);
      refetch();
    } catch (error: any) {
      toast.error(`Feil: ${error.message}`);
    }
  };

  const handleDeleteProvider = async (providerId: number, providerName: string) => {
    if (!confirm(`Er du sikker på at du vil slette "${providerName}"?`)) {
      return;
    }

    try {
      await deleteProvider.mutateAsync({ providerId });
      toast.success("Terminal slettet!");
      refetch();
    } catch (error: any) {
      toast.error(`Feil: ${error.message}`);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      const result = await testConnection.mutateAsync({
        providerType,
        config,
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(`Feil: ${error.message}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const openEditDialog = (provider: any) => {
    setEditingProvider(provider);
    setProviderType(provider.providerType);
    setProviderName(provider.providerName);
    setIsDefault(provider.isDefault);
    setConfig(provider.config || {});
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setProviderName("");
    setProviderType("cash");
    setIsDefault(false);
    setConfig({});
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case "cash":
        return <Banknote className="h-5 w-5" />;
      case "stripe_terminal":
      case "manual_card":
        return <CreditCard className="h-5 w-5" />;
      case "vipps":
        return <Smartphone className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  const getProviderTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      stripe_terminal: "Stripe Terminal",
      vipps: "Vipps",
      nets: "Nets/BankAxept",
      manual_card: "Manuell kortinntasting",
      cash: "Kontant",
      generic: "Generisk terminal",
    };
    return labels[type] || type;
  };

  const renderConfigFields = () => {
    switch (providerType) {
      case "stripe_terminal":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key *</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk_test_..."
                value={config.apiKey || ""}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="terminalId">Terminal ID (valgfritt)</Label>
              <Input
                id="terminalId"
                placeholder="tmr_..."
                value={config.terminalId || ""}
                onChange={(e) => setConfig({ ...config, terminalId: e.target.value })}
              />
            </div>
          </>
        );

      case "vipps":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="merchantSerialNumber">Merchant Serial Number *</Label>
              <Input
                id="merchantSerialNumber"
                placeholder="123456"
                value={config.merchantSerialNumber || ""}
                onChange={(e) => setConfig({ ...config, merchantSerialNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID *</Label>
              <Input
                id="clientId"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={config.clientId || ""}
                onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret *</Label>
              <Input
                id="clientSecret"
                type="password"
                placeholder="••••••••"
                value={config.clientSecret || ""}
                onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
              />
            </div>
          </>
        );

      case "nets":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="terminalId">Terminal ID *</Label>
              <Input
                id="terminalId"
                placeholder="12345678"
                value={config.terminalId || ""}
                onChange={(e) => setConfig({ ...config, terminalId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="merchantId">Merchant ID *</Label>
              <Input
                id="merchantId"
                placeholder="987654321"
                value={config.merchantId || ""}
                onChange={(e) => setConfig({ ...config, merchantId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number (valgfritt)</Label>
              <Input
                id="accountNumber"
                placeholder="1234.56.78910"
                value={config.accountNumber || ""}
                onChange={(e) => setConfig({ ...config, accountNumber: e.target.value })}
              />
            </div>
          </>
        );

      case "cash":
      case "manual_card":
        return (
          <p className="text-sm text-muted-foreground">
            Ingen ekstra konfigurasjon nødvendig for denne typen.
          </p>
        );

      default:
        return null;
    }
  };

  const ConfigDialog = ({ isOpen, onClose, onSave, title }: any) => (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Konfigurer terminalen med nødvendige detaljer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="providerType">Type</Label>
            <Select
              value={providerType}
              onValueChange={(value: any) => {
                setProviderType(value);
                setConfig({}); // Reset config when type changes
              }}
              disabled={!!editingProvider}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Kontant</SelectItem>
                <SelectItem value="stripe_terminal">Stripe Terminal</SelectItem>
                <SelectItem value="vipps">Vipps</SelectItem>
                <SelectItem value="nets">Nets/BankAxept</SelectItem>
                <SelectItem value="manual_card">Manuell kortinntasting</SelectItem>
                <SelectItem value="generic">Generisk terminal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="providerName">Navn</Label>
            <Input
              id="providerName"
              placeholder="F.eks. Hovedkasse, Terminal 1"
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
            />
          </div>

          {renderConfigFields()}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="isDefault" className="cursor-pointer">
              Sett som standard for denne typen
            </Label>
          </div>

          {providerType !== "cash" && providerType !== "manual_card" && (
            <Button
              onClick={handleTestConnection}
              disabled={isTestingConnection}
              variant="outline"
              className="w-full"
            >
              {isTestingConnection ? "Tester tilkobling..." : "Test tilkobling"}
            </Button>
          )}

          <Button
            onClick={onSave}
            disabled={addProvider.isPending || updateProvider.isPending}
            className="w-full"
          >
            {addProvider.isPending || updateProvider.isPending ? "Lagrer..." : "Lagre"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // iZettle integration
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [showIZettleWizard, setShowIZettleWizard] = useState(false);
  const { data: iZettleStatus, refetch: refetchIZettle } = trpc.izettle.getStatus.useQuery();
  const { data: authUrlData } = trpc.izettle.getAuthUrl.useQuery();
  const disconnectIZettle = trpc.izettle.disconnect.useMutation({
    onSuccess: () => {
      toast.success("iZettle frakoblet");
      refetchIZettle();
      setDisconnectDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Feil ved frakobling: ${error.message}`);
    },
  });

  const handleConnectIZettle = () => {
    if (authUrlData?.url) {
      window.location.href = authUrlData.url;
    }
  };

  const handleDisconnectIZettle = () => {
    disconnectIZettle.mutate();
  };

  return (
    <DashboardLayout>
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Betalingsterminaler
          </h1>
          <p className="text-muted-foreground mt-2">
            Administrer terminaler og betalingsmetoder
          </p>
        </div>

        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Legg til terminal
        </Button>
      </div>

      {/* iZettle OAuth Integration */}
      <Card className="mb-6 border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                iZettle (Zettle by PayPal)
                {iZettleStatus?.connected && (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Tilkoblet
                  </Badge>
                )}
                {!iZettleStatus?.connected && (
                  <Badge variant="secondary">
                    <XCircle className="h-3 w-3 mr-1" />
                    Ikke tilkoblet
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-2">
                Aksepter kortbetalinger med iZettle kortleser. Pengene går direkte til din iZettle-konto.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {iZettleStatus?.connected ? (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">E-post:</span>
                  <span className="font-medium">{iZettleStatus.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Konto-ID:</span>
                  <span className="font-mono text-xs">{iZettleStatus.accountId}</span>
                </div>
                {iZettleStatus.lastSync && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sist synkronisert:</span>
                    <span>{new Date(iZettleStatus.lastSync).toLocaleString('no-NO')}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => window.open('https://my.izettle.com', '_blank')}
                  className="flex-1"
                >
                  Åpne iZettle Dashboard
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDisconnectDialogOpen(true)}
                  disabled={disconnectIZettle.isPending}
                >
                  {disconnectIZettle.isPending ? "Kobler fra..." : "Koble fra"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h4 className="font-medium">Fordeler med iZettle:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Aksepter alle kort: Visa, Mastercard, BankAxept</li>
                  <li>Kontaktløs betaling (NFC)</li>
                  <li>Avgift: 1.75% - 2.75% per transaksjon</li>
                  <li>Utbetaling til bankkonto: 1-2 virkedager</li>
                  <li>Ingen månedlig avgift</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleConnectIZettle}
                  className="flex-1"
                  size="lg"
                >
                  Koble til iZettle
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowIZettleWizard(true)}
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Hjelp
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Du vil bli sendt til iZettle for å autorisere tilkoblingen.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {!providers || providers.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Ingen terminaler konfigurert ennå. Legg til din første terminal!
            </CardContent>
          </Card>
        ) : (
          providers.map((provider) => (
            <Card key={provider.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getProviderIcon(provider.providerType)}
                    <div>
                      <CardTitle>{provider.providerName}</CardTitle>
                      <CardDescription>
                        {getProviderTypeLabel(provider.providerType)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    {provider.isDefault && (
                      <Badge variant="secondary">Standard</Badge>
                    )}
                    {provider.isActive ? (
                      <Badge variant="default">Aktiv</Badge>
                    ) : (
                      <Badge variant="outline">Inaktiv</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(provider)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteProvider(provider.id, provider.providerName)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {provider.config && typeof provider.config === 'object' && Object.keys(provider.config).length > 0 ? (
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    <strong>Konfigurert:</strong>{" "}
                    {Object.keys(provider.config as Record<string, any>).filter(k => (provider.config as Record<string, any>)[k]).length} felt(er)
                  </div>
                </CardContent>
              ) : null}
            </Card>
          ))
        )}
      </div>

      <ConfigDialog
        isOpen={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false);
          resetForm();
        }}
        onSave={handleAddProvider}
        title="Legg til ny terminal"
      />

      <ConfigDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingProvider(null);
          resetForm();
        }}
        onSave={handleUpdateProvider}
        title="Rediger terminal"
      />
    </div>

      {/* iZettle Setup Wizard */}
      <IZettleSetupWizard
        open={showIZettleWizard}
        onClose={() => setShowIZettleWizard(false)}
        onStartConnection={handleConnectIZettle}
      />

      {/* iZettle Disconnect Confirmation Dialog */}
      <AlertDialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Koble fra iZettle?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil koble fra iZettle? Du vil ikke lenger kunne ta imot kortbetalinger
              gjennom iZettle før du kobler til igjen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnectIZettle}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Koble fra
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
