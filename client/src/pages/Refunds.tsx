import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Refunds() {
  const [, setLocation] = useLocation();
  const { data: refunds = [], isLoading } = trpc.refunds.list.useQuery({});

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Fullført
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Venter
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Feilet
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRefundMethodText = (method: string) => {
    switch (method) {
      case "stripe":
        return "Stripe (Automatisk)";
      case "vipps":
        return "Vipps (Automatisk)";
      case "manual":
        return "Manuell";
      default:
        return method;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Refusjoner" },
        ]}
      >
        <div className="p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-muted rounded w-1/3"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Refusjoner" },
      ]}
    >
      <div className="p-6 max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              Refusjoner
            </h1>
            <p className="text-muted-foreground mt-1">
              Oversikt over alle refusjoner og avbestillinger
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbake
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Totalt refundert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {refunds
                  .filter((r) => r.status === "completed")
                  .reduce((sum, r) => sum + parseFloat(r.amount), 0)
                  .toFixed(2)}{" "}
                NOK
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Fullførte refusjoner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {refunds.filter((r) => r.status === "completed").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ventende refusjoner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {refunds.filter((r) => r.status === "pending").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Refunds List */}
        <Card>
          <CardHeader>
            <CardTitle>Refusjonshistorikk</CardTitle>
            <CardDescription>
              Alle refusjoner sortert etter dato
            </CardDescription>
          </CardHeader>
          <CardContent>
            {refunds.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Ingen refusjoner registrert ennå.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {refunds.map((refund: any) => (
                  <div
                    key={refund.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">
                            {refund.customerName} {refund.customerLastName}
                          </h3>
                          {getStatusBadge(refund.status)}
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Beløp:</span>
                            <span className="text-lg font-bold text-green-600">
                              {parseFloat(refund.amount).toFixed(2)} NOK
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Metode:</span>
                            <span>{getRefundMethodText(refund.refundMethod)}</span>
                          </div>

                          {refund.paymentMethod && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Opprinnelig betaling:</span>
                              <span className="capitalize">{refund.paymentMethod}</span>
                            </div>
                          )}

                          {refund.appointmentId && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Avtale ID:</span>
                              <span>#{refund.appointmentId}</span>
                            </div>
                          )}

                          {refund.gatewayRefundId && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Gateway Refund ID:</span>
                              <span className="font-mono text-xs">{refund.gatewayRefundId}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <span className="font-medium">Grunn:</span>
                            <span className="italic">{refund.reason}</span>
                          </div>

                          {refund.errorMessage && (
                            <div className="flex items-center gap-2 text-red-600">
                              <span className="font-medium">Feilmelding:</span>
                              <span>{refund.errorMessage}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-medium">Dato:</span>
                            <span>
                              {new Date(refund.createdAt).toLocaleDateString("no-NO", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
