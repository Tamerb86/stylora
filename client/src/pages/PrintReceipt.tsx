import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import PrintableReceipt from "@/components/PrintableReceipt";
import { Loader2 } from "lucide-react";

export default function PrintReceipt() {
  const [, params] = useRoute("/print-receipt/:orderId");
  const orderId = params?.orderId ? parseInt(params.orderId) : null;

  const { data: orderDetails, isLoading } = trpc.pos.getOrderDetails.useQuery(
    { orderId: orderId! },
    { enabled: !!orderId }
  );

  const { data: salonInfo } = trpc.salonSettings.getSalonInfo.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Ordre ikke funnet</h1>
          <p className="text-muted-foreground">Kunne ikke finne ordre #{orderId}</p>
        </div>
      </div>
    );
  }

  const { order, items } = orderDetails;

  return (
    <PrintableReceipt
      order={{
        id: order.id,
        createdAt: order.createdAt || new Date(),
        subtotal: parseFloat(order.subtotal),
        tax: parseFloat(order.vatAmount),
        total: parseFloat(order.total),
        paymentMethod: order.status || "cash",
      }}
      items={items.map((item) => ({
        name: item.itemType === "product" ? "Produkt" : "Tjeneste",
        quantity: item.quantity || 1,
        price: parseFloat(item.unitPrice),
        total: parseFloat(item.total),
      }))}
      customer={undefined}
      salon={{
        name: salonInfo?.name || "Salon",
        address: salonInfo?.address,
        phone: salonInfo?.phone,
        email: salonInfo?.email,
        logo: undefined, // Logo URL if available
      }}
      autoPrint={true}
    />
  );
}
