import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, CreditCard, Banknote, Smartphone, ChevronLeft, ChevronRight } from "lucide-react";

export default function PaymentHistory() {
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data: payments, isLoading } = trpc.paymentTerminal.getPaymentHistory.useQuery({
    limit,
    offset: page * limit,
  });

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "cash":
        return <Banknote className="h-4 w-4" />;
      case "card":
        return <CreditCard className="h-4 w-4" />;
      case "vipps":
        return <Smartphone className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      refunded: "outline",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <DashboardLayout>
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Betalingshistorikk
        </h1>
        <p className="text-muted-foreground mt-2">
          Oversikt over alle betalinger
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Transaksjoner
          </CardTitle>
          <CardDescription>
            Alle betalinger registrert i systemet
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Laster betalinger...
            </div>
          ) : !payments || payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Ingen betalinger funnet
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kvittering</TableHead>
                      <TableHead>Dato</TableHead>
                      <TableHead>Kunde</TableHead>
                      <TableHead>Metode</TableHead>
                      <TableHead>Beløp</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((item) => (
                      <TableRow key={item.payment.id}>
                        <TableCell className="font-mono text-sm">
                          #{item.payment.id}
                        </TableCell>
                        <TableCell>
                          {item.payment.createdAt
                            ? new Date(item.payment.createdAt).toLocaleString("no-NO", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {item.payment.orderId ? `Order #${item.payment.orderId}` : item.payment.appointmentId ? `Appointment #${item.payment.appointmentId}` : "Walk-in"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPaymentMethodIcon(item.payment.paymentMethod)}
                            <span className="capitalize">{item.payment.paymentMethod}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {parseFloat(item.payment.amount).toFixed(2)} {item.payment.currency}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(item.payment.status || "pending")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Forrige
                </Button>
                <span className="text-sm text-muted-foreground">
                  Side {page + 1}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={!payments || payments.length < limit}
                >
                  Neste
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
    </DashboardLayout>
  );
}
