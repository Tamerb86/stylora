import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Mail, Eye, Search, Filter, ShoppingCart, ArrowLeft, Printer, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function Orders() {
  const [, setLocation] = useLocation();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("customer_request");
  const [refundMethod, setRefundMethod] = useState<"stripe" | "vipps" | "manual">("manual");

  // Fetch orders with filters
  const { data: orders = [], isLoading } = trpc.pos.getOrders.useQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    paymentMethod: paymentMethod === "all" ? undefined : paymentMethod,
  });

  // Fetch order details when selected
  const { data: orderDetails } = trpc.pos.getOrderDetails.useQuery(
    { orderId: selectedOrderId! },
    { enabled: !!selectedOrderId }
  );

  // Fetch existing refunds for selected order
  const { data: existingRefunds = [] } = trpc.refunds.getByOrder.useQuery(
    { orderId: selectedOrderId! },
    { enabled: !!selectedOrderId && showRefundDialog }
  );

  const generateReceipt = trpc.pos.generateReceipt.useMutation();
  const sendReceiptEmail = trpc.pos.sendReceiptEmail.useMutation();
  const createRefund = trpc.refunds.createPOSRefund.useMutation();
  const utils = trpc.useUtils();

  // Filter orders by search query (customer name or order ID)
  const filteredOrders = useMemo(() => {
    if (!searchQuery) return orders;
    const query = searchQuery.toLowerCase();
    return orders.filter(
      (o) =>
        o.order.id.toString().includes(query) ||
        o.customer?.firstName?.toLowerCase().includes(query) ||
        o.customer?.lastName?.toLowerCase().includes(query) ||
        o.customer?.phone?.includes(query)
    );
  }, [orders, searchQuery]);

  const handleDownloadReceipt = async (orderId: number) => {
    try {
      const result = await generateReceipt.mutateAsync({ orderId });
      const blob = new Blob([Uint8Array.from(atob(result.pdf), (c) => c.charCodeAt(0))], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Kvittering lastet ned!");
    } catch (error) {
      toast.error("Kunne ikke laste ned kvittering");
    }
  };

  const handlePrintReceipt = (orderId: number) => {
    // Open print-optimized page in new window
    window.open(`/print-receipt/${orderId}`, "_blank");
    toast.success("Kvittering åpnet for utskrift!");
  };

  const handleSendEmail = async (orderId: number, customerEmail: string) => {
    if (!customerEmail) {
      toast.error("Kunden har ingen e-postadresse");
      return;
    }
    try {
      await sendReceiptEmail.mutateAsync({ orderId, customerEmail });
      toast.success("Kvittering sendt på e-post!");
    } catch (error) {
      toast.error("Kunne ikke sende kvittering");
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("nb-NO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // HH:MM
  };

  const handleRefundClick = (orderId: number) => {
    setSelectedOrderId(orderId);
    setRefundAmount("");
    setRefundReason("customer_request");
    setRefundMethod("manual");
    setShowRefundDialog(true);
  };

  const handleRefundSubmit = async () => {
    if (!selectedOrderId) return;
    
    const order = filteredOrders.find(o => o.order.id === selectedOrderId);
    if (!order || !order.payment) {
      toast.error("Kunne ikke finne betalingsinformasjon");
      return;
    }

    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Vennligst oppgi et gyldig beløp");
      return;
    }

    // Calculate available refund amount
    const originalAmount = parseFloat(order.order.total);
    const totalRefunded = existingRefunds
      .filter((r) => r.status === "completed")
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const availableAmount = originalAmount - totalRefunded;

    if (amount > availableAmount) {
      toast.error(`Beløpet overstiger tilgjengelig beløp (${availableAmount.toFixed(2)} kr)`);
      return;
    }

    try {
      await createRefund.mutateAsync({
        paymentId: order.payment.id,
        orderId: selectedOrderId,
        amount,
        reason: refundReason,
        refundMethod,
      });
      
      toast.success("Refusjon opprettet!");
      setShowRefundDialog(false);
      utils.pos.getOrders.invalidate();
      utils.refunds.getByOrder.invalidate();
    } catch (error: any) {
      toast.error(error.message || "Kunne ikke opprette refusjon");
    }
  };

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Ordrehistorikk" },
      ]}
    >
      <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ordrehistorikk</h1>
          <p className="text-muted-foreground">Se alle salg og administrer kvitteringer</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setLocation("/pos")}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Nytt salg
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocation("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Tilbake
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Filtrer ordrer</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Fra dato</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Til dato</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Betalingsmetode</label>
              <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="cash">Kontant</SelectItem>
                  <SelectItem value="card">Kort</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Søk</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Ordre-ID, kunde..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {(startDate || endDate || paymentMethod !== "all" || searchQuery) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setPaymentMethod("all");
                setSearchQuery("");
              }}
            >
              Nullstill filtre
            </Button>
          )}
        </div>
      </Card>

      {/* Orders Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ordre-ID</TableHead>
              <TableHead>Dato</TableHead>
              <TableHead>Tid</TableHead>
              <TableHead>Kunde</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Betaling</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Handlinger</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Laster ordrer...
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Ingen ordrer funnet
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((item) => (
                <TableRow key={item.order.id}>
                  <TableCell className="font-medium">#{item.order.id}</TableCell>
                  <TableCell>{formatDate(item.order.orderDate)}</TableCell>
                  <TableCell>{formatTime(item.order.orderTime)}</TableCell>
                  <TableCell>
                    {item.customer ? (
                      <button
                        onClick={() => setLocation(`/customers`)}
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {`${item.customer.firstName} ${item.customer.lastName || ''}`.trim()}
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    ) : (
                      <span className="text-muted-foreground italic">Walk-in</span>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold">{item.order.total} kr</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      item.payment?.paymentMethod === "cash"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {item.payment?.paymentMethod === "cash" ? "Kontant" : "Kort"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      item.order.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : item.order.status === "refunded"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {item.order.status === "completed" ? "Fullført" : 
                       item.order.status === "refunded" ? "Refundert" :
                       item.order.status === "partially_refunded" ? "Delvis refundert" : "Venter"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedOrderId(item.order.id);
                          setShowDetailDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadReceipt(item.order.id)}
                        disabled={generateReceipt.isPending}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {item.customer?.email && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendEmail(item.order.id, item.customer!.email!)}
                          disabled={sendReceiptEmail.isPending}
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                      )}
                      {(item.order.status === "completed" || item.order.status === "partially_refunded") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRefundClick(item.order.id)}
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Opprett refusjon</DialogTitle>
          </DialogHeader>
          {selectedOrderId && (() => {
            const order = filteredOrders.find(o => o.order.id === selectedOrderId);
            if (!order) return null;
            
            const originalAmount = parseFloat(order.order.total);
            const totalRefunded = existingRefunds
              .filter((r) => r.status === "completed")
              .reduce((sum, r) => sum + parseFloat(r.amount), 0);
            const availableAmount = originalAmount - totalRefunded;
            
            return (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Ordre-ID</p>
                    <p className="font-semibold">#{order.order.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Opprinnelig beløp</p>
                    <p className="font-semibold">{originalAmount.toFixed(2)} kr</p>
                  </div>
                  {totalRefunded > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Allerede refundert</p>
                      <p className="font-semibold text-orange-600">-{totalRefunded.toFixed(2)} kr</p>
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">Tilgjengelig for refusjon</p>
                    <p className="text-lg font-bold text-green-600">{availableAmount.toFixed(2)} kr</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Refusjonsbeløp (kr)</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      min="0"
                      max={availableAmount}
                      step="0.01"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setRefundAmount(availableAmount.toFixed(2))}
                      disabled={availableAmount <= 0}
                    >
                      Full
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Maks: {availableAmount.toFixed(2)} kr
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Årsak</label>
                  <Select value={refundReason} onValueChange={setRefundReason}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer_request">Kundeforespørsel</SelectItem>
                      <SelectItem value="damaged_product">Skadet produkt</SelectItem>
                      <SelectItem value="wrong_item">Feil vare</SelectItem>
                      <SelectItem value="service_issue">Tjenesteproblemer</SelectItem>
                      <SelectItem value="other">Annet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Refusjonsmetode</label>
                  <Select value={refundMethod} onValueChange={(v: any) => setRefundMethod(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manuell (Kontant/Terminal)</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="vipps">Vipps</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowRefundDialog(false)}
                    className="flex-1"
                  >
                    Avbryt
                  </Button>
                  <Button
                    onClick={handleRefundSubmit}
                    disabled={createRefund.isPending || !refundAmount}
                    className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                  >
                    {createRefund.isPending ? "Behandler..." : "Opprett refusjon"}
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ordredetaljer #{selectedOrderId}</DialogTitle>
          </DialogHeader>
          {orderDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Dato</p>
                  <p className="font-medium">{formatDate(orderDetails.order.orderDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tid</p>
                  <p className="font-medium">{formatTime(orderDetails.order.orderTime)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Subtotal</p>
                  <p className="font-medium">{orderDetails.order.subtotal} kr</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">MVA (25%)</p>
                  <p className="font-medium">{orderDetails.order.vatAmount} kr</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-lg font-bold">{orderDetails.order.total} kr</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{orderDetails.order.status}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Varer</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Antall</TableHead>
                      <TableHead>Enhetspris</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderDetails.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.itemType === "service" ? "Tjeneste" : "Produkt"}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.unitPrice} kr</TableCell>
                        <TableCell>{item.total} kr</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Print Button */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  onClick={() => selectedOrderId && handlePrintReceipt(selectedOrderId)}
                  disabled={generateReceipt.isPending}
                  className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  {generateReceipt.isPending ? "Skriver ut..." : "Skriv ut kvittering"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
}
