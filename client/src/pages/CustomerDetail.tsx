import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Phone, Mail, Calendar, MapPin, Gift, Pencil, Trash2, CalendarPlus, Receipt, FileText } from "lucide-react";
import { toast } from "sonner";

export default function CustomerDetail() {
  const [, params] = useRoute("/customers/:id");
  const [, setLocation] = useLocation();
  const customerId = parseInt(params?.id || "0");

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    address: "",
    notes: "",
    marketingSmsConsent: false,
    marketingEmailConsent: false,
  });

  const { data: customer, isLoading, refetch } = trpc.customers.getById.useQuery({ id: customerId });
  const { data: loyaltyPoints } = trpc.loyalty.getPoints.useQuery({ customerId });
  const { data: loyaltyHistory } = trpc.loyalty.getHistory.useQuery({ customerId, limit: 50 });
  const { data: gdprData } = trpc.customers.gdprExport.useQuery({ customerId });

  const updateCustomer = trpc.customers.update.useMutation({
    onSuccess: () => {
      toast.success("Kunde oppdatert!");
      setIsEditDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Feil: ${error.message}`);
    },
  });

  const deleteCustomer = trpc.customers.delete.useMutation({
    onSuccess: () => {
      toast.success("Kunde slettet!");
      setLocation("/customers");
    },
    onError: (error) => {
      toast.error(`Feil: ${error.message}`);
    },
  });

  const handleEdit = () => {
    if (!customer) return;
    setFormData({
      firstName: customer.firstName,
      lastName: customer.lastName || "",
      phone: customer.phone,
      email: customer.email || "",
      dateOfBirth: customer.dateOfBirth ? new Date(customer.dateOfBirth).toISOString().split('T')[0] : "",
      address: customer.address || "",
      notes: customer.notes || "",
      marketingSmsConsent: customer.marketingSmsConsent || false,
      marketingEmailConsent: customer.marketingEmailConsent || false,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateCustomer.mutate({
      id: customerId,
      ...formData,
    });
  };

  const handleDelete = () => {
    if (!customer) return;
    if (confirm(`Er du sikker på at du vil slette ${customer.firstName} ${customer.lastName}?`)) {
      deleteCustomer.mutate({ id: customerId });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-lg font-medium mb-4">Kunde ikke funnet</p>
              <Button onClick={() => setLocation("/customers")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
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
        <div className="flex justify-between items-start">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/customers")}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbake
            </Button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              {customer.firstName} {customer.lastName}
            </h1>
            <p className="text-muted-foreground mt-1">Kundedetaljer og historikk</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleEdit} variant="outline">
              <Pencil className="h-4 w-4 mr-2" />
              Rediger
            </Button>
            <Button onClick={handleDelete} variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Slett
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Customer Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Kontaktinformasjon</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.dateOfBirth && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(customer.dateOfBirth).toLocaleDateString('no-NO')}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.address}</span>
                </div>
              )}
              {loyaltyPoints && loyaltyPoints.currentPoints > 0 && (
                <div className="flex items-center gap-3 text-primary font-medium">
                  <Gift className="h-4 w-4" />
                  <span>{loyaltyPoints.currentPoints} lojalitetspoeng</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Notater
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customer.notes ? (
                <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Ingen notater lagt til</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Appointments History */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <CalendarPlus className="h-5 w-5" />
                Avtalehistorikk
              </CardTitle>
              <Button size="sm" onClick={() => setLocation("/appointments")}>
                Book ny avtale
              </Button>
            </div>
            <CardDescription>Tidligere avtaler og behandlinger</CardDescription>
          </CardHeader>
          <CardContent>
            {gdprData && gdprData.appointments && gdprData.appointments.length > 0 ? (
              <div className="space-y-3">
                {gdprData.appointments.map((appointment, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {new Date(appointment.date).toLocaleDateString('no-NO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {appointment.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{appointment.notes}</p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      appointment.status === 'completed' ? 'bg-green-100 text-green-700' :
                      appointment.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      appointment.status === 'no_show' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {appointment.status === 'completed' ? 'Fullført' :
                       appointment.status === 'cancelled' ? 'Avbrutt' :
                       appointment.status === 'no_show' ? 'Møtte ikke' :
                       'Planlagt'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Ingen avtaler registrert ennå
              </p>
            )}
          </CardContent>
        </Card>

        {/* Loyalty History */}
        {loyaltyHistory && loyaltyHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Lojalitetshistorikk
              </CardTitle>
              <CardDescription>Opptjente og brukte poeng</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {loyaltyHistory.map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{transaction.reason}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString('no-NO')}
                      </p>
                    </div>
                    <span className={`font-bold ${transaction.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.points > 0 ? '+' : ''}{transaction.points}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Hurtighandlinger</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button onClick={() => setLocation("/appointments")} className="flex-1">
              <CalendarPlus className="h-4 w-4 mr-2" />
              Book avtale
            </Button>
            <Button onClick={() => setLocation("/pos")} variant="outline" className="flex-1">
              <Receipt className="h-4 w-4 mr-2" />
              Gå til kasse
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rediger kunde</DialogTitle>
            <DialogDescription>
              Oppdater kundeinformasjon
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">Fornavn *</Label>
                <Input
                  id="edit-firstName"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Etternavn</Label>
                <Input
                  id="edit-lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefon *</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">E-post</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-dateOfBirth">Fødselsdato</Label>
                <Input
                  id="edit-dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Adresse</Label>
                <Input
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notater</Label>
              <Textarea
                id="edit-notes"
                placeholder="Interne notater om kunden (preferanser, allergier, etc.)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
              />
            </div>

            <div className="space-y-3">
              <Label>Markedsføringssamtykke</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-sms"
                  checked={formData.marketingSmsConsent}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, marketingSmsConsent: checked as boolean })
                  }
                />
                <label htmlFor="edit-sms" className="text-sm">SMS-markedsføring</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-email-consent"
                  checked={formData.marketingEmailConsent}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, marketingEmailConsent: checked as boolean })
                  }
                />
                <label htmlFor="edit-email-consent" className="text-sm">E-postmarkedsføring</label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Avbryt
              </Button>
              <Button type="submit" disabled={updateCustomer.isPending}>
                {updateCustomer.isPending ? "Oppdaterer..." : "Oppdater kunde"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
