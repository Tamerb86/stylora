import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CreditCard, Banknote, Smartphone, Receipt, Split, Loader2, Settings } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStripeTerminal } from "@/hooks/useStripeTerminal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";
import { SplitPaymentDialog } from "@/components/SplitPaymentDialog";

export default function POSPayment() {
  const [amount, setAmount] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>();
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | undefined>();
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "vipps" | "stripe">("cash");
  const [selectedProviderId, setSelectedProviderId] = useState<number | undefined>();
  
  // Split payment state
  const [showSplitDialog, setShowSplitDialog] = useState(false);
  const [splitCashAmount, setSplitCashAmount] = useState("");
  const [splitCardAmount, setSplitCardAmount] = useState("");

  const { data: providers } = trpc.paymentTerminal.listProviders.useQuery();
  const processPayment = trpc.paymentTerminal.processPayment.useMutation();
  const processSplitPayment = trpc.paymentTerminal.processSplitPayment.useMutation();

  // Stripe Terminal hook
  const {
    connectedReader,
    isProcessing: isStripeProcessing,
    isInitialized,
    processPayment: processStripePayment,
  } = useStripeTerminal();

  const handleSimplePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Vennligst oppgi et gyldig beløp");
      return;
    }

    // Use Stripe Terminal for "stripe" payment method
    if (paymentMethod === "stripe") {
      if (!connectedReader) {
        toast.error("Ingen kortleser tilkoblet", {
          description: "Vennligst koble til en kortleser fra innstillinger",
          action: {
            label: "Gå til innstillinger",
            onClick: () => window.location.href = "/reader-management",
          },
        });
        return;
      }

      toast.info("Venter på kort...", {
        description: "Vennligst sett inn eller tap kortet",
      });

      const result = await processStripePayment(
        Math.round(parseFloat(amount) * 100), // Convert to øre
        "nok",
        {
          customerId: selectedCustomerId?.toString() || "",
          appointmentId: selectedAppointmentId?.toString() || "",
        }
      );

      if (result.success) {
        toast.success("Betaling fullført!", {
          description: `Beløp: ${amount} NOK`,
        });
        setAmount("");
        setSelectedCustomerId(undefined);
        setSelectedAppointmentId(undefined);
      } else {
        toast.error("Betaling feilet", {
          description: result.error || "Ukjent feil",
        });
      }
      return;
    }

    // Use existing payment terminal for other methods
    try {
      const result = await processPayment.mutateAsync({
        amount: parseFloat(amount),
        paymentMethod,
        paymentProviderId: selectedProviderId,
        customerId: selectedCustomerId,
        appointmentId: selectedAppointmentId,
      });

      toast.success(`Betaling fullført! Kvittering: ${result.receiptNumber}`);
      setAmount("");
      setSelectedCustomerId(undefined);
      setSelectedAppointmentId(undefined);
    } catch (error: any) {
      toast.error(`Betaling feilet: ${error.message}`);
    }
  };

  const handleSplitPayment = async (splits: Array<{
    method: "cash" | "card" | "vipps" | "stripe";
    amount: number;
    cardLast4?: string;
    cardBrand?: string;
    transactionId?: string;
    providerId?: number;
  }>) => {
    const totalAmount = splits.reduce((sum, s) => sum + s.amount, 0);

    try {
      const formattedSplits = splits.map(s => ({
        amount: s.amount,
        paymentMethod: s.method,
        paymentProviderId: s.providerId,
        transactionId: s.transactionId,
        cardLast4: s.cardLast4,
        cardBrand: s.cardBrand,
      }));

      const result = await processSplitPayment.mutateAsync({
        totalAmount,
        splits: formattedSplits,
        customerId: selectedCustomerId,
        appointmentId: selectedAppointmentId,
      });

      toast.success(`Delt betaling fullført! Kvittering: ${result.receiptNumber}`);
      setAmount("");
      setSelectedCustomerId(undefined);
      setSelectedAppointmentId(undefined);
    } catch (error: any) {
      toast.error(`Betaling feilet: ${error.message}`);
      throw error;
    }
  };

  return (
    <DashboardLayout>
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Kasse (POS)
        </h1>
        <p className="text-muted-foreground mt-2">
          Behandle betalinger raskt og enkelt
        </p>
      </div>

      {/* Stripe Terminal Status */}
      {paymentMethod === "stripe" && (
        <Alert className="mb-6">
          <AlertDescription className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {connectedReader ? (
                <>
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span>Kortleser tilkoblet: {connectedReader.label}</span>
                </>
              ) : (
                <>
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span>Ingen kortleser tilkoblet</span>
                </>
              )}
            </div>
            <Link href="/reader-management">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Innstillinger
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="simple" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="simple">Enkel betaling</TabsTrigger>
        </TabsList>

        <TabsContent value="simple">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Enkel betaling
              </CardTitle>
              <CardDescription>
                Velg betalingsmetode og oppgi beløp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount">Beløp (NOK) *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-2xl font-bold"
                />
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-2">
                <Label>Betalingsmetode *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button
                    variant={paymentMethod === "cash" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("cash")}
                    className="h-20 flex-col gap-2"
                  >
                    <Banknote className="h-6 w-6" />
                    <span>Kontant</span>
                  </Button>
                  <Button
                    variant={paymentMethod === "card" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("card")}
                    className="h-20 flex-col gap-2"
                  >
                    <CreditCard className="h-6 w-6" />
                    <span>Kort</span>
                  </Button>
                  <Button
                    variant={paymentMethod === "vipps" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("vipps")}
                    className="h-20 flex-col gap-2"
                  >
                    <Smartphone className="h-6 w-6" />
                    <span>Vipps</span>
                  </Button>
                  <Button
                    variant={paymentMethod === "stripe" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("stripe")}
                    className="h-20 flex-col gap-2"
                  >
                    <CreditCard className="h-6 w-6" />
                    <span>Stripe</span>
                  </Button>
                </div>
              </div>

              {/* Provider Selection (for card/vipps) */}
              {(paymentMethod === "card" || paymentMethod === "vipps") && providers && providers.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="provider">Terminal</Label>
                  <Select
                    value={selectedProviderId?.toString()}
                    onValueChange={(value) => setSelectedProviderId(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Velg terminal" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers
                        .filter(p => p.providerType === paymentMethod || p.providerType === "generic")
                        .map(provider => (
                          <SelectItem key={provider.id} value={provider.id.toString()}>
                            {provider.providerName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Process Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={handleSimplePayment}
                  disabled={processPayment.isPending || isStripeProcessing}
                  className="h-14 text-lg"
                >
                  {(processPayment.isPending || isStripeProcessing) ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Behandler...
                    </>
                  ) : (
                    `Betal ${amount ? `${amount} NOK` : ""}`
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowSplitDialog(true)}
                  disabled={!amount || parseFloat(amount) <= 0}
                  className="h-14 text-lg"
                >
                  <Split className="mr-2 h-5 w-5" />
                  Del betaling
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>

      {/* Payment History Link */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <Button variant="outline" className="w-full" asChild>
            <a href="/payment-history">
              <Receipt className="h-4 w-4 mr-2" />
              Se betalingshistorikk
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Split Payment Dialog */}
      <SplitPaymentDialog
        open={showSplitDialog}
        onOpenChange={setShowSplitDialog}
        totalAmount={parseFloat(amount) || 0}
        providers={providers?.map(p => ({ id: p.id, name: p.providerName, type: p.providerType }))}
        onConfirm={handleSplitPayment}
      />
    </div>
    </DashboardLayout>
  );
}
