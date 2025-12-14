import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, User, Calendar, Receipt, Scissors, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();
  
  const { data, isLoading } = trpc.search.global.useQuery(
    { query },
    { enabled: query.length >= 2 }
  );

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  const handleNavigate = (path: string) => {
    setLocation(path);
    onOpenChange(false);
    toast.success("Navigert til resultat");
  };

  const hasResults = data && (
    data.customers.length > 0 ||
    data.appointments.length > 0 ||
    data.orders.length > 0 ||
    data.services.length > 0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[600px] p-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Søk i systemet
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-2">
          <Input
            placeholder="Søk etter kunder, avtaler, ordre eller tjenester..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full"
            autoFocus
          />
        </div>

        <div className="overflow-y-auto max-h-[400px] px-4 pb-4">
          {query.length < 2 && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Skriv minst 2 tegn for å søke</p>
            </div>
          )}

          {query.length >= 2 && isLoading && (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            </div>
          )}

          {query.length >= 2 && !isLoading && !hasResults && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Ingen resultater funnet</p>
            </div>
          )}

          {data && hasResults && (
            <div className="space-y-4">
              {/* Customers */}
              {data.customers.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Kunder ({data.customers.length})
                  </h3>
                  <div className="space-y-1">
                    {data.customers.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => handleNavigate("/customers")}
                        className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="font-medium">
                          {customer.firstName} {customer.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {customer.phone} {customer.email && `• ${customer.email}`}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Appointments */}
              {data.appointments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Avtaler ({data.appointments.length})
                  </h3>
                  <div className="space-y-1">
                    {data.appointments.map((item) => (
                      <button
                        key={item.appointment.id}
                        onClick={() => handleNavigate("/appointments")}
                        className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="font-medium">
                          {item.customer?.firstName} {item.customer?.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(item.appointment.startTime).toLocaleDateString("nb-NO")} kl.{" "}
                          {new Date(item.appointment.startTime).toLocaleTimeString("nb-NO", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {item.employee && ` • ${item.employee.name}`}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Orders */}
              {data.orders.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Ordre ({data.orders.length})
                  </h3>
                  <div className="space-y-1">
                    {data.orders.map((item) => (
                      <button
                        key={item.order.id}
                        onClick={() => handleNavigate("/orders")}
                        className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="font-medium">
                          Ordre #{item.order.id}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.customer
                            ? `${item.customer.firstName} ${item.customer.lastName}`
                            : "Walk-in"}{" "}
                          • {item.order.total} kr
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Services */}
              {data.services.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <Scissors className="h-4 w-4" />
                    Tjenester ({data.services.length})
                  </h3>
                  <div className="space-y-1">
                    {data.services.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => handleNavigate("/services")}
                        className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="font-medium">{service.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {service.price} kr • {service.durationMinutes} min
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground">
            Tips: Bruk <kbd className="px-2 py-1 bg-background border rounded">Ctrl</kbd> +{" "}
            <kbd className="px-2 py-1 bg-background border rounded">K</kbd> for å åpne søk
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
