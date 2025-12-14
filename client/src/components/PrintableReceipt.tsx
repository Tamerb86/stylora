import { useEffect } from "react";

interface PrintableReceiptProps {
  order: {
    id: number;
    createdAt: Date;
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  customer?: {
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
  };
  salon: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
  };
  autoPrint?: boolean;
}

export default function PrintableReceipt({
  order,
  items,
  customer,
  salon,
  autoPrint = false,
}: PrintableReceiptProps) {
  useEffect(() => {
    if (autoPrint) {
      // Auto-print after component mounts and renders
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("nb-NO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt,
          #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 0.5cm;
          }
        }
        
        @media screen {
          #printable-receipt {
            max-width: 80mm;
            margin: 2rem auto;
            padding: 1rem;
            border: 1px solid #e5e7eb;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          }
        }
      `}</style>

      <div id="printable-receipt" className="bg-white text-black">
        {/* Header */}
        <div className="text-center mb-4 pb-4 border-b-2 border-dashed border-gray-300">
          {salon.logo && (
            <img
              src={salon.logo}
              alt={salon.name}
              className="w-16 h-16 mx-auto mb-2 object-contain"
            />
          )}
          <h1 className="text-xl font-bold mb-1">{salon.name}</h1>
          {salon.address && (
            <p className="text-sm text-gray-600">{salon.address}</p>
          )}
          {salon.phone && (
            <p className="text-sm text-gray-600">Tlf: {salon.phone}</p>
          )}
          {salon.email && (
            <p className="text-sm text-gray-600">E-post: {salon.email}</p>
          )}
        </div>

        {/* Receipt Title */}
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold">KVITTERING</h2>
        </div>

        {/* Order Info */}
        <div className="mb-4 pb-4 border-b border-gray-300 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Ordre-ID:</span>
            <span className="font-medium">#{order.id.toString().padStart(6, "0")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Dato:</span>
            <span className="font-medium">{formatDate(order.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Betalingsmåte:</span>
            <span className="font-medium capitalize">{order.paymentMethod === "cash" ? "Kontant" : "Kort"}</span>
          </div>
          {customer && (
            <div className="flex justify-between">
              <span className="text-gray-600">Kunde:</span>
              <span className="font-medium">{customer.firstName} {customer.lastName}</span>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="mb-4 pb-4 border-b border-gray-300">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-1">Vare/Tjeneste</th>
                <th className="text-center py-1">Ant</th>
                <th className="text-right py-1">Pris</th>
                <th className="text-right py-1">Sum</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-2">{item.name}</td>
                  <td className="text-center py-2">{item.quantity}</td>
                  <td className="text-right py-2">{item.price.toFixed(2)} kr</td>
                  <td className="text-right py-2 font-medium">{item.total.toFixed(2)} kr</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mb-4 pb-4 border-b-2 border-dashed border-gray-300 text-sm">
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">{order.subtotal.toFixed(2)} kr</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">MVA (25%):</span>
            <span className="font-medium">{order.tax.toFixed(2)} kr</span>
          </div>
          <div className="flex justify-between text-lg font-bold mt-2">
            <span>TOTAL:</span>
            <span>{order.total.toFixed(2)} kr</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600">
          <p className="mb-2">Takk for besøket!</p>
          <p className="text-xs">Vi setter pris på ditt besøk! Ha en fin dag!</p>
        </div>
      </div>
    </>
  );
}
