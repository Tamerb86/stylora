import { useState, useMemo, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useStripeTerminal } from "@/contexts/StripeTerminalContext";
import { useThermalPrinter } from "@/contexts/ThermalPrinterContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  User,
  Calendar,
  CreditCard,
  Banknote,
  CheckCircle2,
  Download,
  Mail,
  Receipt,
  ArrowLeft,
  Printer,
  Loader2,
  Wifi,
  WifiOff,
  AlertCircle,
} from "lucide-react";

// Cart item type
type CartItem = {
  id: number;
  itemType: "service" | "product";
  name: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
};

// Cart state type
type CartState = {
  customerId?: number;
  customerName?: string;
  appointmentId?: number;
  employeeId?: number;
  employeeName?: string;
  items: CartItem[];
};

export default function POS() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const stripeTerminal = useStripeTerminal();
  const thermalPrinter = useThermalPrinter();
  const [cart, setCart] = useState<CartState>({ items: [] });
  const [searchQuery, setSearchQuery] = useState("");
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<number | null>(null);
  const [lastTotal, setLastTotal] = useState<number>(0);
  const [lastPaymentMethod, setLastPaymentMethod] = useState<string>("");
  const [lastCustomerEmail, setLastCustomerEmail] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentInstructions, setPaymentInstructions] = useState<string>("");
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load services and products
  const { data: services = [] } = trpc.services.list.useQuery();
  const { data: products = [] } = trpc.products.list.useQuery();
  const { data: customers = [] } = trpc.customers.list.useQuery();
  const { data: employees = [] } = trpc.employees.list.useQuery();
  const { data: printSettings } = trpc.salonSettings.getPrintSettings.useQuery();

  // Auto-focus search field on page load
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Mutations
  const createOrder = trpc.pos.createOrder.useMutation();
  const recordCashPayment = trpc.pos.recordCashPayment.useMutation();
  const recordCardPayment = trpc.pos.recordCardPayment.useMutation();
  const generateReceipt = trpc.pos.generateReceipt.useMutation();
  const sendReceiptEmail = trpc.pos.sendReceiptEmail.useMutation();

  // Filter services and products by search query
  const filteredServices = useMemo(() => {
    if (!searchQuery) return services;
    return services.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [services, searchQuery]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const query = searchQuery.toLowerCase().trim();
    return products.filter((p) =>
      p.name.toLowerCase().includes(query) ||
      (p.barcode && p.barcode.toLowerCase().includes(query))
    );
  }, [products, searchQuery]);

  // Filter customers by search query
  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery) return customers;
    return customers.filter(
      (c) =>
        c.firstName.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
        (c.lastName && c.lastName.toLowerCase().includes(customerSearchQuery.toLowerCase())) ||
        c.phone?.includes(customerSearchQuery)
    );
  }, [customers, customerSearchQuery]);

  // Filter employees by search query (only active employees)
  const filteredEmployees = useMemo(() => {
    const activeEmployees = employees.filter(e => e.isActive);
    if (!employeeSearchQuery) return activeEmployees;
    return activeEmployees.filter(
      (e) =>
        e.name?.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
        e.email?.toLowerCase().includes(employeeSearchQuery.toLowerCase())
    );
  }, [employees, employeeSearchQuery]);

  // Cart functions
  const addItemToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.items.find(
        (i) => i.id === item.id && i.itemType === item.itemType
      );
      if (existing) {
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.id === item.id && i.itemType === item.itemType
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { ...prev, items: [...prev.items, item] };
    });
    toast.success(`${item.name} lagt til i handlekurv`);
  };

  const updateItemQuantity = (
    id: number,
    itemType: "service" | "product",
    quantity: number
  ) => {
    if (quantity <= 0) {
      removeItemFromCart(id, itemType);
      return;
    }
    setCart((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.id === id && i.itemType === itemType ? { ...i, quantity } : i
      ),
    }));
  };

  const removeItemFromCart = (id: number, itemType: "service" | "product") => {
    setCart((prev) => ({
      ...prev,
      items: prev.items.filter((i) => !(i.id === id && i.itemType === itemType)),
    }));
  };

  const clearCart = () => {
    setCart({ items: [] });
  };

  const selectCustomer = (customerId: number, customerName: string) => {
    setCart((prev) => ({ ...prev, customerId, customerName }));
    setShowCustomerDialog(false);
    toast.success(`Kunde valgt: ${customerName}`);
  };

  // Calculate totals
  const subtotal = cart.items.reduce(
    (acc, i) => acc + i.unitPrice * i.quantity,
    0
  );
  const vatAmount = cart.items.reduce(
    (acc, i) => acc + (i.unitPrice * i.quantity * i.vatRate) / 100,
    0
  );
  const total = subtotal + vatAmount;

  // Checkout handler
  const handleCheckout = async (paymentMethod: "cash" | "card") => {
    // Validation
    if (cart.items.length === 0) {
      toast.error("Handlekurven er tom");
      return;
    }

    if (!user) {
      toast.error("Ingen bruker logget inn");
      return;
    }

    if (!cart.employeeId) {
      toast.error("Vennligst velg en ansatt før du fullfører betalingen");
      return;
    }

    try {
      // Create order
      const now = new Date();
      const orderDate = now.toISOString().slice(0, 10);
      const orderTime = now.toTimeString().slice(0, 5);

      const orderRes = await createOrder.mutateAsync({
        appointmentId: cart.appointmentId,
        customerId: cart.customerId,
        employeeId: cart.employeeId,
        orderDate,
        orderTime,
        items: cart.items.map((i) => ({
          itemType: i.itemType,
          itemId: i.id,
          itemName: i.name, // Send name from cart
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          vatRate: i.vatRate,
        })),
      });

      // Record payment
      if (paymentMethod === "cash") {
        await recordCashPayment.mutateAsync({
          orderId: orderRes.order.id,
          amount: total,
        });

        // Auto-open cash drawer if enabled and thermal printer connected
        if (printSettings?.autoOpenCashDrawer && thermalPrinter.connectedPrinter) {
          try {
            await thermalPrinter.openCashDrawer();
          } catch (error: any) {
            console.error("Failed to open cash drawer:", error);
            // Don't fail the transaction if drawer fails to open
          }
        }
      } else {
        // Card payment with Stripe Terminal
        if (!stripeTerminal.connectedReader) {
          toast.error("Ingen kortleser tilkoblet. Vennligst koble til en kortleser først.");
          return;
        }

        setIsProcessingPayment(true);
        setPaymentInstructions("Venter på kort...");

        try {
          // Process payment with Stripe Terminal
          const paymentResult = await stripeTerminal.processPayment(total);

          if (!paymentResult.success) {
            throw new Error(paymentResult.error || "Betalingen mislyktes");
          }

          // Record successful card payment
          await recordCardPayment.mutateAsync({
            orderId: orderRes.order.id,
            amount: total,
            cardBrand: paymentResult.cardBrand,
            lastFour: paymentResult.lastFour,
          });

          setPaymentInstructions("");
        } catch (error: any) {
          setIsProcessingPayment(false);
          setPaymentInstructions("");
          toast.error(error.message || "Kortbetaling mislyktes");
          return;
        } finally {
          setIsProcessingPayment(false);
        }
      }

      // Show success
      setLastOrderId(orderRes.order.id);
      setLastTotal(total);
      setLastPaymentMethod(paymentMethod === "cash" ? "Kontant" : "Kort");
      
      // Get customer email if available
      if (cart.customerId) {
        const customer = customers.find(c => c.id === cart.customerId);
        setLastCustomerEmail(customer?.email || null);
      } else {
        setLastCustomerEmail(null);
      }
      
      setShowSuccessDialog(true);

      // Auto-print receipt if enabled
      if (printSettings?.autoPrintReceipt) {
        setTimeout(async () => {
          // Use thermal printer if connected, otherwise fallback to browser print
          if (thermalPrinter.connectedPrinter && !thermalPrinter.isPrinting) {
            // Prepare receipt data for thermal printer
            const receiptData = {
              orderId: orderRes.order.id,
              date: new Date().toLocaleDateString('no-NO'),
              time: new Date().toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' }),
              items: cart.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.quantity * item.unitPrice,
              })),
              subtotal: subtotal,
              vat: vatAmount,
              total: total,
              paymentMethod: paymentMethod === 'cash' ? 'Kontant' : 'Kort',
              footerText: printSettings.customFooterText,
            };
            
            // Print directly to thermal printer
            await thermalPrinter.printReceipt(receiptData);
          } else {
            // Fallback to browser print
            window.open(`/print-receipt/${orderRes.order.id}`, '_blank');
          }
        }, 500); // Small delay to ensure success dialog is shown first
      }

      // Clear cart
      clearCart();
      toast.success("Salg fullført!");
    } catch (error: any) {
      toast.error(error.message || "Feil ved registrering av salg");
    }
  };

  // Keyboard shortcuts (must be after handleCheckout definition)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Allow some shortcuts even in inputs
        if (e.key === 'Escape') {
          (target as HTMLInputElement).blur();
          return;
        }
        return;
      }

      // F1: Focus search field
      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
        toast.info("Søk aktivert", { description: "Du kan nå søke etter produkter og tjenester" });
      }

      // F2: Quick cash payment
      if (e.key === 'F2') {
        e.preventDefault();
        if (cart.items.length > 0 && cart.employeeId) {
          handleCheckout('cash');
        } else {
          toast.error("Kan ikke betale", { description: cart.items.length === 0 ? "Handlekurven er tom" : "Vennligst velg en ansatt" });
        }
      }

      // F3: Quick card payment
      if (e.key === 'F3') {
        e.preventDefault();
        if (cart.items.length > 0 && cart.employeeId) {
          handleCheckout('card');
        } else {
          toast.error("Kan ikke betale", { description: cart.items.length === 0 ? "Handlekurven er tom" : "Vennligst velg en ansatt" });
        }
      }

      // ESC: Clear cart
      if (e.key === 'Escape') {
        e.preventDefault();
        if (cart.items.length > 0) {
          clearCart();
          toast.info("Handlekurv tømt");
        }
      }

      // ?: Toggle shortcuts help
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowShortcutsHelp(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, handleCheckout]);

  return (
    <DashboardLayout>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
              Salgssted (POS)
            </h1>
            <p className="text-gray-600 mt-1">
              Registrer salg av tjenester og produkter
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowShortcutsHelp(true)}
              className="gap-2 border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-700"
              title="Vis tastatursnarveier (trykk ?)"
            >
              <span className="text-lg">⌨️</span>
              Snarveier
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/orders")}
              className="gap-2"
            >
              <Receipt className="h-4 w-4" />
              Ordrehistorikk
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left side: Item selection */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="mb-4">
                <Input
                  ref={searchInputRef}
                  placeholder="Søk etter tjenester eller produkter (eller skann strekkode)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      // Check for exact barcode match first
                      const exactBarcodeMatch = products.find(
                        (p) => p.barcode && p.barcode.toLowerCase() === searchQuery.toLowerCase().trim()
                      );
                      
                      if (exactBarcodeMatch) {
                        // Add product to cart automatically
                        addItemToCart({
                          id: exactBarcodeMatch.id,
                          itemType: 'product',
                          name: exactBarcodeMatch.name,
                          quantity: 1,
                          unitPrice: parseFloat(exactBarcodeMatch.retailPrice),
                          vatRate: 25,
                        });
                        // Clear search
                        setSearchQuery('');
                      } else if (filteredProducts.length === 1) {
                        // If only one product matches, add it
                        const product = filteredProducts[0];
                        addItemToCart({
                          id: product.id,
                          itemType: 'product',
                          name: product.name,
                          quantity: 1,
                          unitPrice: parseFloat(product.retailPrice),
                          vatRate: 25,
                        });
                        setSearchQuery('');
                      } else if (filteredServices.length === 1 && filteredProducts.length === 0) {
                        // If only one service matches, add it
                        const service = filteredServices[0];
                        addItemToCart({
                          id: service.id,
                          itemType: 'service',
                          name: service.name,
                          quantity: 1,
                          unitPrice: parseFloat(service.price),
                          vatRate: 25,
                        });
                        setSearchQuery('');
                      }
                    }
                  }}
                  className="w-full"
                  autoFocus
                />
              </div>

              <Tabs defaultValue="services" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="services">
                    Tjenester ({services.length})
                  </TabsTrigger>
                  <TabsTrigger value="products">
                    Produkter ({products.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="services" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
                    {filteredServices.map((service) => (
                      <Card
                        key={service.id}
                        className="p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              {service.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {service.durationMinutes} min
                            </p>
                          </div>
                          <p className="font-bold text-blue-600">
                            {service.price} kr
                          </p>
                        </div>
                        <Button
                          size="lg"
                          onClick={() =>
                            addItemToCart({
                              id: service.id,
                              itemType: "service",
                              name: service.name,
                              quantity: 1,
                              unitPrice: parseFloat(service.price),
                              vatRate: 25,
                            })
                          }
                          className="w-full h-14 text-base bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                        >
                          <Plus className="w-5 h-5 mr-2" />
                          Legg til
                        </Button>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="products" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
                    {filteredProducts.map((product) => (
                      <Card
                        key={product.id}
                        className="p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              {product.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Lager: {product.stockQuantity || 0}
                            </p>
                          </div>
                          <p className="font-bold text-orange-600">
                            {parseFloat(product.retailPrice).toFixed(0)} kr
                          </p>
                        </div>
                        <Button
                          size="lg"
                          onClick={() =>
                            addItemToCart({
                              id: product.id,
                              itemType: "product",
                              name: product.name,
                              quantity: 1,
                              unitPrice: parseFloat(product.retailPrice),
                              vatRate: 25,
                            })
                          }
                          className="w-full h-14 text-base bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
                          disabled={
                            product.stockQuantity !== null &&
                            product.stockQuantity <= 0
                          }
                        >
                          <Plus className="w-5 h-5 mr-2" />
                          Legg til
                        </Button>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Right side: Cart & payment */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold">Handlekurv</h2>
              </div>

              {/* Customer selection */}
              <div className="mb-4">
                <Label className="text-sm font-medium mb-2 block">Kunde</Label>
                <Dialog
                  open={showCustomerDialog}
                  onOpenChange={setShowCustomerDialog}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <User className="w-4 h-4 mr-2" />
                      {cart.customerName || "Velg kunde (valgfritt)"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Velg kunde</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Søk etter navn eller telefon..."
                        value={customerSearchQuery}
                        onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      />
                      <div className="max-h-[400px] overflow-y-auto space-y-2">
                        {filteredCustomers.map((customer) => (
                          <Button
                            key={customer.id}
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() =>
                              selectCustomer(customer.id, `${customer.firstName} ${customer.lastName || ''}`)
                            }
                          >
                            <div className="text-left">
                              <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                              <div className="text-sm text-gray-600">
                                {customer.phone}
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Employee selection */}
              <div className="mb-4">
                <Label className="text-sm font-medium mb-2 block">Ansatt *</Label>
                <Dialog
                  open={showEmployeeDialog}
                  onOpenChange={setShowEmployeeDialog}
                >
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={`w-full justify-start ${
                        !cart.employeeId ? "border-red-300 bg-red-50" : ""
                      }`}
                    >
                      <User className="w-4 h-4 mr-2" />
                      {cart.employeeName || "Velg ansatt (påkrevd)"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Velg ansatt</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Søk etter navn..."
                        value={employeeSearchQuery}
                        onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                      />
                      <div className="max-h-[400px] overflow-y-auto space-y-2">
                        {filteredEmployees.map((employee) => (
                          <Button
                            key={employee.id}
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => {
                              setCart((prev) => ({
                                ...prev,
                                employeeId: employee.id,
                                employeeName: employee.name || "Ukjent",
                              }));
                              setShowEmployeeDialog(false);
                              setEmployeeSearchQuery("");
                            }}
                          >
                            <div className="text-left">
                              <div className="font-medium">{employee.name}</div>
                              {employee.email && (
                                <div className="text-sm text-gray-600">
                                  {employee.email}
                                </div>
                              )}
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Cart items */}
              <div className="border-t border-b py-4 mb-4 max-h-[300px] overflow-y-auto">
                {cart.items.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Handlekurven er tom
                  </p>
                ) : (
                  <div className="space-y-3">
                    {cart.items.map((item, index) => (
                      <div
                        key={`${item.itemType}-${item.id}-${index}`}
                        className="flex items-center gap-2"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-gray-600">
                            {item.unitPrice} kr
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-10 w-10 p-0"
                            onClick={() =>
                              updateItemQuantity(
                                item.id,
                                item.itemType,
                                item.quantity - 1
                              )
                            }
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-12 text-center text-base font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-10 w-10 p-0"
                            onClick={() =>
                              updateItemQuantity(
                                item.id,
                                item.itemType,
                                item.quantity + 1
                              )
                            }
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-10 w-10 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() =>
                            removeItemFromCart(item.id, item.itemType)
                          }
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reader Status */}
              {stripeTerminal.connectedReader ? (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <Wifi className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Kortleser tilkoblet: {stripeTerminal.connectedReader.label || "Unknown"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-700 mb-2">
                    <WifiOff className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Ingen kortleser tilkoblet
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => setLocation("/reader-management")}
                  >
                    Koble til kortleser
                  </Button>
                </div>
              )}

              {/* Totals */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{subtotal.toFixed(2)} kr</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">MVA (25%):</span>
                  <span className="font-medium">{vatAmount.toFixed(2)} kr</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-blue-600">{total.toFixed(2)} kr</span>
                </div>
              </div>

              {/* Payment Instructions */}
              {isProcessingPayment && paymentInstructions && (
                <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg animate-pulse">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                    <div>
                      <p className="text-lg font-semibold text-blue-900">
                        {paymentInstructions}
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        Sett inn, tapp eller sveip kortet
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment buttons */}
              <div className="space-y-2">
                <Button
                  size="lg"
                  className="w-full h-16 text-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 relative"
                  onClick={() => handleCheckout("cash")}
                  disabled={
                    cart.items.length === 0 ||
                    createOrder.isPending ||
                    recordCashPayment.isPending
                  }
                >
                  <Banknote className="w-6 h-6 mr-3" />
                  Registrer kontantbetaling
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-white/20 rounded text-xs font-mono">
                    F2
                  </span>
                </Button>
                <Button
                  size="lg"
                  className="w-full h-16 text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 relative"
                  onClick={() => handleCheckout("card")}
                  disabled={
                    cart.items.length === 0 ||
                    createOrder.isPending ||
                    recordCardPayment.isPending ||
                    isProcessingPayment ||
                    !stripeTerminal.connectedReader
                  }
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                      Behandler betaling...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-6 h-6 mr-3" />
                      Registrer kortbetaling
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-white/20 rounded text-xs font-mono">
                        F3
                      </span>
                    </>
                  )}
                </Button>

                {/* Manual Open Cash Drawer Button (only show if thermal printer connected) */}
                {thermalPrinter.connectedPrinter && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 border-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-700"
                    onClick={() => thermalPrinter.openCashDrawer()}
                    disabled={thermalPrinter.isOpeningDrawer || thermalPrinter.isPrinting}
                  >
                    {thermalPrinter.isOpeningDrawer ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Åpner kassaskuff...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Åpne kassaskuff
                      </>
                    )}
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Success dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-6 h-6" />
              <DialogTitle>Salg fullført!</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ordre-ID:</span>
                  <span className="font-bold">#{lastOrderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Betalingsmetode:</span>
                  <span className="font-medium">{lastPaymentMethod}</span>
                </div>
                <div className="flex justify-between text-lg border-t pt-2">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold text-green-600">
                    {lastTotal.toFixed(2)} kr
                  </span>
                </div>
              </div>
            </div>
            {lastCustomerEmail && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Mail className="w-4 h-4" />
                  <span>Kunde e-post: {lastCustomerEmail}</span>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="bg-blue-50 hover:bg-blue-100 border-blue-300"
                  onClick={() => {
                    if (!lastOrderId) return;
                    window.open(`/print-receipt/${lastOrderId}`, '_blank');
                    toast.success('Kvittering åpnet for utskrift!');
                  }}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  {printSettings?.autoPrintReceipt ? 'Skriv ut på nytt' : 'Skriv ut'}
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!lastOrderId) return;
                    try {
                      const result = await generateReceipt.mutateAsync({ orderId: lastOrderId });
                      // Convert base64 to blob and download
                      const byteCharacters = atob(result.pdf);
                      const byteNumbers = new Array(byteCharacters.length);
                      for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                      }
                      const byteArray = new Uint8Array(byteNumbers);
                      const blob = new Blob([byteArray], { type: 'application/pdf' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = result.filename;
                      a.click();
                      window.URL.revokeObjectURL(url);
                      toast.success('Kvittering lastet ned!');
                    } catch (error) {
                      toast.error('Kunne ikke generere kvittering');
                    }
                  }}
                  disabled={generateReceipt.isPending}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {generateReceipt.isPending ? 'Genererer...' : 'Last ned'}
                </Button>
              </div>
              {lastCustomerEmail && (
                <Button
                  variant="outline"
                  className="w-full bg-green-50 hover:bg-green-100 border-green-300"
                  onClick={async () => {
                    if (!lastOrderId || !lastCustomerEmail) return;
                    try {
                      await sendReceiptEmail.mutateAsync({
                        orderId: lastOrderId,
                        customerEmail: lastCustomerEmail,
                      });
                      toast.success('Kvittering sendt på e-post!');
                    } catch (error) {
                      toast.error('Kunne ikke sende kvittering');
                    }
                  }}
                  disabled={sendReceiptEmail.isPending}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {sendReceiptEmail.isPending ? 'Sender...' : 'Send på e-post'}
                </Button>
              )}
              <div className="border-t pt-2">
              </div>
              <Button
                className="w-full"
                onClick={() => setShowSuccessDialog(false)}
              >
                Lukk
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Help Dialog */}
      <Dialog open={showShortcutsHelp} onOpenChange={setShowShortcutsHelp}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">⌨️</span>
              Tastatursnarveier
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-orange-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                Bruk disse snarveiene for raskere betjening av kassasystemet.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <kbd className="px-3 py-1.5 bg-white border border-gray-300 rounded shadow-sm font-mono text-sm font-semibold">
                    F1
                  </kbd>
                  <span className="text-gray-700">Fokuser søkefeltet</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <div className="flex items-center gap-3">
                  <kbd className="px-3 py-1.5 bg-white border border-gray-300 rounded shadow-sm font-mono text-sm font-semibold">
                    F2
                  </kbd>
                  <span className="text-gray-700">Kontantbetaling</span>
                </div>
                <Banknote className="w-5 h-5 text-green-600" />
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <div className="flex items-center gap-3">
                  <kbd className="px-3 py-1.5 bg-white border border-gray-300 rounded shadow-sm font-mono text-sm font-semibold">
                    F3
                  </kbd>
                  <span className="text-gray-700">Kortbetaling</span>
                </div>
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                <div className="flex items-center gap-3">
                  <kbd className="px-3 py-1.5 bg-white border border-gray-300 rounded shadow-sm font-mono text-sm font-semibold">
                    ESC
                  </kbd>
                  <span className="text-gray-700">Tøm handlekurv</span>
                </div>
                <X className="w-5 h-5 text-red-600" />
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <div className="flex items-center gap-3">
                  <kbd className="px-3 py-1.5 bg-white border border-gray-300 rounded shadow-sm font-mono text-sm font-semibold">
                    Enter
                  </kbd>
                  <span className="text-gray-700">Legg til valgt vare (ved søk)</span>
                </div>
                <Plus className="w-5 h-5 text-purple-600" />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <kbd className="px-3 py-1.5 bg-white border border-gray-300 rounded shadow-sm font-mono text-sm font-semibold">
                    ?
                  </kbd>
                  <span className="text-gray-700">Vis/skjul denne hjelpen</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700"
                onClick={() => setShowShortcutsHelp(false)}
              >
                Lukk
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
}

/**
 * POS (Point of Sale) Page
 *
 * This page is for in-salon use only, accessible to employees and admins.
 *
 * tRPC procedures used:
 * - services.list: Load active services
 * - products.list: Load products
 * - customers.list: Search/select customers
 * - pos.createOrder: Create order with items
 * - pos.recordCashPayment: Record cash payment
 * - pos.recordCardPayment: Record card payment (external terminal)
 *
 * Workflow:
 * 1. (Optional) Select customer
 * 2. Add services/products to cart
 * 3. Review cart with subtotal, VAT, and total
 * 4. Choose payment method (cash or card)
 * 5. Order and payment are created
 * 6. Show success summary
 */
