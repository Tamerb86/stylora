import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Loader2, Save, CreditCard, Smartphone, Banknote, Store } from "lucide-react";
import { PayPalReaderPairing } from "./PayPalReaderPairing";

export function PaymentSettingsTab() {
  const [vippsEnabled, setVippsEnabled] = useState(false);
  const [cardEnabled, setCardEnabled] = useState(false);
  const [cashEnabled, setCashEnabled] = useState(true);
  const [payAtSalonEnabled, setPayAtSalonEnabled] = useState(true);
  
  // Vipps credentials
  const [vippsClientId, setVippsClientId] = useState("");
  const [vippsClientSecret, setVippsClientSecret] = useState("");
  const [vippsSubscriptionKey, setVippsSubscriptionKey] = useState("");
  const [vippsMerchantSerialNumber, setVippsMerchantSerialNumber] = useState("");
  
  // Stripe credentials
  const [stripePublishableKey, setStripePublishableKey] = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");

  // Load payment settings
  const { data: settings, isLoading } = (trpc as any).paymentSettings.get.useQuery();
  
  // Update mutation
  const updateMutation = (trpc as any).paymentSettings.update.useMutation({
    onSuccess: () => {
      toast.success("Betalingsinnstillinger lagret!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Kunne ikke lagre innstillinger");
    },
  });

  // Populate form when data loads
  useEffect(() => {
    if (settings) {
      setVippsEnabled(settings.vippsEnabled || false);
      setCardEnabled(settings.cardEnabled || false);
      setCashEnabled(settings.cashEnabled ?? true);
      setPayAtSalonEnabled(settings.payAtSalonEnabled ?? true);
      
      setVippsClientId(settings.vippsClientId || "");
      setVippsClientSecret(settings.vippsClientSecret || "");
      setVippsSubscriptionKey(settings.vippsSubscriptionKey || "");
      setVippsMerchantSerialNumber(settings.vippsMerchantSerialNumber || "");
      
      setStripePublishableKey(settings.stripePublishableKey || "");
      setStripeSecretKey(settings.stripeSecretKey || "");
    }
  }, [settings]);

  const handleSave = () => {
    updateMutation.mutate({
      vippsEnabled,
      cardEnabled,
      cashEnabled,
      payAtSalonEnabled,
      vippsClientId: vippsClientId || undefined,
      vippsClientSecret: vippsClientSecret || undefined,
      vippsSubscriptionKey: vippsSubscriptionKey || undefined,
      vippsMerchantSerialNumber: vippsMerchantSerialNumber || undefined,
      stripePublishableKey: stripePublishableKey || undefined,
      stripeSecretKey: stripeSecretKey || undefined,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* PayPal Reader Pairing */}
      <PayPalReaderPairing />
      
      {/* Payment Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Betalingsinnstillinger</CardTitle>
          <CardDescription>
            Konfigurer betalingsmetoder for online booking
          </CardDescription>
        </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Methods */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Betalingsmetoder</h3>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-purple-600" />
              <div className="space-y-0.5">
                <Label>Vipps-betaling</Label>
                <p className="text-sm text-muted-foreground">
                  Tillat betaling med Vipps ved online booking
                </p>
              </div>
            </div>
            <Switch 
              checked={vippsEnabled} 
              onCheckedChange={setVippsEnabled}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <div className="space-y-0.5">
                <Label>Kortbetaling</Label>
                <p className="text-sm text-muted-foreground">
                  Tillat betaling med kort (Stripe) ved online booking
                </p>
              </div>
            </div>
            <Switch 
              checked={cardEnabled} 
              onCheckedChange={setCardEnabled}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Banknote className="h-5 w-5 text-green-600" />
              <div className="space-y-0.5">
                <Label>Kontant</Label>
                <p className="text-sm text-muted-foreground">
                  Tillat kontantbetaling ved online booking
                </p>
              </div>
            </div>
            <Switch 
              checked={cashEnabled} 
              onCheckedChange={setCashEnabled}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Store className="h-5 w-5 text-orange-600" />
              <div className="space-y-0.5">
                <Label>Betal på salong</Label>
                <p className="text-sm text-muted-foreground">
                  Tillat betaling på salong etter behandling
                </p>
              </div>
            </div>
            <Switch 
              checked={payAtSalonEnabled} 
              onCheckedChange={setPayAtSalonEnabled}
            />
          </div>
        </div>

        {/* Vipps Configuration */}
        {vippsEnabled && (
          <div className="pt-4 border-t space-y-4">
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Vipps-konfigurasjon
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Få Vipps API-nøkler fra <a href="https://portal.vipps.no" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Vipps Portal</a>
              </p>
            </div>
            
            <div>
              <Label htmlFor="vippsClientId">Client ID</Label>
              <Input
                id="vippsClientId"
                placeholder="Din Vipps Client ID"
                value={vippsClientId}
                onChange={(e) => setVippsClientId(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="vippsClientSecret">Client Secret</Label>
              <Input
                id="vippsClientSecret"
                type="password"
                placeholder="Din Vipps Client Secret"
                value={vippsClientSecret}
                onChange={(e) => setVippsClientSecret(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="vippsSubscriptionKey">Subscription Key</Label>
              <Input
                id="vippsSubscriptionKey"
                type="password"
                placeholder="Din Vipps Subscription Key"
                value={vippsSubscriptionKey}
                onChange={(e) => setVippsSubscriptionKey(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="vippsMerchantSerialNumber">Merchant Serial Number</Label>
              <Input
                id="vippsMerchantSerialNumber"
                placeholder="123456"
                value={vippsMerchantSerialNumber}
                onChange={(e) => setVippsMerchantSerialNumber(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Stripe Configuration */}
        {cardEnabled && (
          <div className="pt-4 border-t space-y-4">
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Stripe-konfigurasjon
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Få Stripe API-nøkler fra <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Stripe Dashboard</a>
              </p>
            </div>
            
            <div>
              <Label htmlFor="stripePublishableKey">Publishable Key</Label>
              <Input
                id="stripePublishableKey"
                placeholder="pk_live_..."
                value={stripePublishableKey}
                onChange={(e) => setStripePublishableKey(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="stripeSecretKey">Secret Key</Label>
              <Input
                id="stripeSecretKey"
                type="password"
                placeholder="sk_live_..."
                value={stripeSecretKey}
                onChange={(e) => setStripeSecretKey(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Lagrer...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Lagre innstillinger
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
