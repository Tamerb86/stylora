import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Banknote, CreditCard, Smartphone, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PaymentSplit {
  method: "cash" | "card" | "vipps" | "stripe";
  amount: number;
  cardLast4?: string;
  cardBrand?: string;
  transactionId?: string;
  providerId?: number;
}

interface SplitPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  providers?: Array<{ id: number; name: string; type: string }>;
  onConfirm: (splits: PaymentSplit[]) => Promise<void>;
}

export function SplitPaymentDialog({
  open,
  onOpenChange,
  totalAmount,
  providers = [],
  onConfirm,
}: SplitPaymentDialogProps) {
  const [splits, setSplits] = useState<PaymentSplit[]>([]);
  const [cashAmount, setCashAmount] = useState("");
  const [cardAmount, setCardAmount] = useState("");
  const [cardLast4, setCardLast4] = useState("");
  const [cardBrand, setCardBrand] = useState("");
  const [cardTransactionId, setCardTransactionId] = useState("");
  const [selectedProviderId, setSelectedProviderId] = useState<number | undefined>();
  const [vippsAmount, setVippsAmount] = useState("");
  const [vippsTransactionId, setVippsTransactionId] = useState("");
  const [stripeAmount, setStripeAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const cashAmt = parseFloat(cashAmount) || 0;
  const cardAmt = parseFloat(cardAmount) || 0;
  const vippsAmt = parseFloat(vippsAmount) || 0;
  const stripeAmt = parseFloat(stripeAmount) || 0;
  const currentTotal = cashAmt + cardAmt + vippsAmt + stripeAmt;
  const remaining = totalAmount - currentTotal;
  const isValid = Math.abs(remaining) < 0.01;

  useEffect(() => {
    if (!open) {
      // Reset all fields when dialog closes
      setCashAmount("");
      setCardAmount("");
      setCardLast4("");
      setCardBrand("");
      setCardTransactionId("");
      setSelectedProviderId(undefined);
      setVippsAmount("");
      setVippsTransactionId("");
      setStripeAmount("");
      setSplits([]);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!isValid) return;

    const newSplits: PaymentSplit[] = [];
    
    if (cashAmt > 0) {
      newSplits.push({
        method: "cash",
        amount: cashAmt,
      });
    }
    
    if (cardAmt > 0) {
      newSplits.push({
        method: "card",
        amount: cardAmt,
        cardLast4: cardLast4 || undefined,
        cardBrand: cardBrand || undefined,
        transactionId: cardTransactionId || undefined,
        providerId: selectedProviderId,
      });
    }
    
    if (vippsAmt > 0) {
      newSplits.push({
        method: "vipps",
        amount: vippsAmt,
        transactionId: vippsTransactionId || undefined,
      });
    }
    
    if (stripeAmt > 0) {
      newSplits.push({
        method: "stripe",
        amount: stripeAmt,
      });
    }

    setIsProcessing(true);
    try {
      await onConfirm(newSplits);
      onOpenChange(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Delt betaling</DialogTitle>
          <DialogDescription>
            Del betalingen på flere betalingsmetoder. Totalt: {totalAmount.toFixed(2)} NOK
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Card */}
          <Card className={remaining === 0 ? "border-green-500" : remaining < 0 ? "border-red-500" : "border-yellow-500"}>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-muted-foreground">Totalt</div>
                  <div className="text-2xl font-bold">{totalAmount.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Betalt</div>
                  <div className="text-2xl font-bold">{currentTotal.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Gjenstår</div>
                  <div className={`text-2xl font-bold ${remaining === 0 ? "text-green-600" : remaining < 0 ? "text-red-600" : "text-yellow-600"}`}>
                    {remaining.toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Tabs defaultValue="cash" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="cash">
                <Banknote className="h-4 w-4 mr-2" />
                Kontant
              </TabsTrigger>
              <TabsTrigger value="card">
                <CreditCard className="h-4 w-4 mr-2" />
                Kort
              </TabsTrigger>
              <TabsTrigger value="vipps">
                <Smartphone className="h-4 w-4 mr-2" />
                Vipps
              </TabsTrigger>
              <TabsTrigger value="stripe">
                <CreditCard className="h-4 w-4 mr-2" />
                Stripe
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cash" className="space-y-4">
              <div>
                <Label htmlFor="cashAmount">Kontantbeløp (NOK)</Label>
                <Input
                  id="cashAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="card" className="space-y-4">
              <div>
                <Label htmlFor="cardAmount">Kortbeløp (NOK)</Label>
                <Input
                  id="cardAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={cardAmount}
                  onChange={(e) => setCardAmount(e.target.value)}
                />
              </div>
              
              {providers.length > 0 && (
                <div>
                  <Label htmlFor="provider">Kortterminal</Label>
                  <Select value={selectedProviderId?.toString()} onValueChange={(v) => setSelectedProviderId(parseInt(v))}>
                    <SelectTrigger id="provider">
                      <SelectValue placeholder="Velg terminal" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.name} ({p.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cardLast4">Siste 4 siffer (valgfritt)</Label>
                  <Input
                    id="cardLast4"
                    maxLength={4}
                    placeholder="1234"
                    value={cardLast4}
                    onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                <div>
                  <Label htmlFor="cardBrand">Korttype (valgfritt)</Label>
                  <Input
                    id="cardBrand"
                    placeholder="Visa, Mastercard..."
                    value={cardBrand}
                    onChange={(e) => setCardBrand(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cardTransactionId">Transaksjons-ID (valgfritt)</Label>
                <Input
                  id="cardTransactionId"
                  placeholder="TXN-12345"
                  value={cardTransactionId}
                  onChange={(e) => setCardTransactionId(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="vipps" className="space-y-4">
              <div>
                <Label htmlFor="vippsAmount">Vipps-beløp (NOK)</Label>
                <Input
                  id="vippsAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={vippsAmount}
                  onChange={(e) => setVippsAmount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="vippsTransactionId">Transaksjons-ID (valgfritt)</Label>
                <Input
                  id="vippsTransactionId"
                  placeholder="VPS-12345"
                  value={vippsTransactionId}
                  onChange={(e) => setVippsTransactionId(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="stripe" className="space-y-4">
              <div>
                <Label htmlFor="stripeAmount">Stripe-beløp (NOK)</Label>
                <Input
                  id="stripeAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={stripeAmount}
                  onChange={(e) => setStripeAmount(e.target.value)}
                />
              </div>
              <Alert>
                <AlertDescription>
                  Stripe-betaling vil bli behandlet automatisk via tilkoblet kortleser.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>

          {/* Validation Alert */}
          {!isValid && currentTotal > 0 && (
            <Alert variant={remaining < 0 ? "destructive" : "default"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {remaining < 0 
                  ? `Beløpet overstiger totalen med ${Math.abs(remaining).toFixed(2)} NOK`
                  : `Det gjenstår ${remaining.toFixed(2)} NOK å fordele`
                }
              </AlertDescription>
            </Alert>
          )}

          {isValid && currentTotal > 0 && (
            <Alert className="border-green-500">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Beløpet er korrekt fordelt!
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Avbryt
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid || isProcessing}>
            {isProcessing ? "Behandler..." : "Bekreft betaling"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
