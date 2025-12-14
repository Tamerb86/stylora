import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, CreditCard, Banknote, Smartphone, Settings, Trash2, Edit, CheckCircle2, XCircle } from "lucide-react";

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
    </DashboardLayout>
  );
}
