import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, Phone, Mail, Calendar, MapPin, Gift, Receipt, 
  Clock, User, Scissors, CreditCard, FileText 
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export default function CustomerDetails() {
  const [, params] = useRoute("/customers/:id");
  const [, setLocation] = useLocation();
  const customerId = parseInt(params?.id || "0");

  const { data: customer, isLoading: customerLoading } = trpc.customers.getById.useQuery({ id: customerId });
  const { data: appointments, isLoading: appointmentsLoading } = trpc.appointments.list.useQuery();
  const { data: loyaltyPoints } = trpc.loyalty.getPoints.useQuery({ customerId });

  // Filter appointments for this customer
  const customerAppointments = appointments?.filter(apt => apt.customerId === customerId)
    .sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()) || [];

  const completedAppointments = customerAppointments.filter(apt => apt.status === "completed");
  const upcomingAppointments = customerAppointments.filter(apt => 
    apt.status === "confirmed" || apt.status === "pending"
  );

  if (customerLoading) {
    return (
      <DashboardLayout breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Kunder", href: "/customers" },
        { label: "Laster..." },
      ]}>
        <div className="p-8">
          <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Kunder", href: "/customers" },
        { label: "Ikke funnet" },
      ]}>
        <div className="p-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Kunde ikke funnet</h3>
              <Button onClick={() => setLocation("/customers")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Tilbake til kunder
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Kunder", href: "/customers" },
        { label: `${customer.firstName} ${customer.lastName}` },
      ]}
    >
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setLocation("/customers")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tilbake
          </Button>
          <Button onClick={() => setLocation("/appointments")}>
            <Calendar className="mr-2 h-4 w-4" />
            Book ny avtale
          </Button>
        </div>

        {/* Customer Info Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl">
                  {customer.firstName} {customer.lastName}
                </CardTitle>
                <CardDescription className="space-y-2 mt-3">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${customer.phone}`} className="hover:underline">
                      {customer.phone}
                    </a>
                  </div>
                  {customer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${customer.email}`} className="hover:underline">
                        {customer.email}
                      </a>
                    </div>
                  )}
                  {customer.dateOfBirth && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Født: {format(new Date(customer.dateOfBirth), "d. MMMM yyyy", { locale: nb })}
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {customer.address}
                    </div>
                  )}
                </CardDescription>
              </div>
              <div className="text-right space-y-2">
                <div className="text-sm text-muted-foreground">Totalt besøk</div>
                <div className="text-3xl font-bold">{customer.totalVisits}</div>
                <div className="text-sm text-muted-foreground">Total omsetning</div>
                <div className="text-2xl font-bold text-green-600">{customer.totalRevenue} NOK</div>
                {loyaltyPoints && loyaltyPoints.currentPoints > 0 && (
                  <>
                    <div className="text-sm text-muted-foreground mt-4">Lojalitetspoeng</div>
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <Gift className="h-5 w-5" />
                      {loyaltyPoints.currentPoints}
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          {customer.notes && (
            <CardContent>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-sm mb-1">Notater</div>
                    <p className="text-sm text-muted-foreground">{customer.notes}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Kommende avtaler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <div className="font-medium">
                      {format(new Date(apt.appointmentDate), "EEEE d. MMMM yyyy", { locale: nb })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Kl. {apt.startTime} - {apt.endTime}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {/* Service name from join */}
                    </div>
                  </div>
                  <Badge variant={apt.status === "confirmed" ? "default" : "secondary"}>
                    {apt.status === "confirmed" ? "Bekreftet" : "Venter"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Visit History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Besøkshistorikk
            </CardTitle>
            <CardDescription>
              {completedAppointments.length} fullførte besøk
            </CardDescription>
          </CardHeader>
          <CardContent>
            {appointmentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : completedAppointments.length > 0 ? (
              <div className="space-y-4">
                {completedAppointments.map((apt, index) => (
                  <div key={apt.id}>
                    {index > 0 && <Separator className="my-4" />}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {format(new Date(apt.appointmentDate), "EEEE d. MMMM yyyy", { locale: nb })}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Kl. {apt.startTime} - {apt.endTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Scissors className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{/* Service name from join */}</span>
                          </div>
                          {/* Employee name from join */ false && (
                            <div className="flex items-center gap-3">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                Med {apt.employeeName}
                              </span>
                            </div>
                          )}
                          {apt.notes && (
                            <div className="flex items-start gap-3 mt-2">
                              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <span className="text-sm text-muted-foreground">
                                {apt.notes}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-green-600 font-semibold">
                            <CreditCard className="h-4 w-4" />
                            {/* Price from join */} NOK
                          </div>
                          {/* Payment method from join */ false && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {apt.paymentMethod === "card" && "Kort"}
                              {apt.paymentMethod === "cash" && "Kontant"}
                              {apt.paymentMethod === "vipps" && "Vipps"}
                              {apt.paymentMethod === "invoice" && "Faktura"}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ingen besøk ennå</h3>
                <p className="text-muted-foreground mb-4">
                  Dette er en ny kunde uten besøkshistorikk
                </p>
                <Button onClick={() => setLocation("/appointments")}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Book første avtale
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
