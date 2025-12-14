import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Phone, Mail, Calendar, Users, Gift, CalendarPlus, Receipt } from "lucide-react";
import { toast } from "sonner";

function CustomerLoyaltyPoints({ customerId }: { customerId: number }) {
  const { data: loyaltyPoints } = trpc.loyalty.getPoints.useQuery({ customerId });

  if (!loyaltyPoints || loyaltyPoints.currentPoints === 0) return null;

  return (
    <div className="flex items-center gap-2 text-primary">
      <Gift className="h-3 w-3" />
      {loyaltyPoints.currentPoints} lojalitetspoeng
    </div>
  );
}

export default function Customers() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  const { data: customers, isLoading, refetch } = trpc.customers.list.useQuery();
  const createCustomer = trpc.customers.create.useMutation({
    onSuccess: () => {
      toast.success("Kunde opprettet!");
      setIsDialogOpen(false);
      refetch();
      setFormData({
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
    },
    onError: (error) => {
      toast.error(`Feil: ${error.message}`);
    },
  });

  const filteredCustomers = customers?.filter((customer) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.firstName.toLowerCase().includes(searchLower) ||
      (customer.lastName?.toLowerCase() || "").includes(searchLower) ||
      customer.phone.includes(searchTerm) ||
      (customer.email?.toLowerCase() || "").includes(searchLower)
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCustomer.mutate(formData);
  };

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Kunder" },
      ]}
    >
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Kunder</h1>
            <p className="text-muted-foreground mt-1">Administrer kunderegisteret</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white shadow-lg">
                <Plus className="mr-2 h-4 w-4" />
                Ny kunde
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Opprett ny kunde</DialogTitle>
                <DialogDescription>
                  Fyll inn kundeinformasjon. Felt merket med * er påkrevd.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Fornavn *</Label>
                    <Input
                      id="firstName"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Etternavn</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-post</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Fødselsdato</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notater (allergier, preferanser)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Markedsføringssamtykke</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="marketingSms"
                      checked={formData.marketingSmsConsent}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, marketingSmsConsent: checked as boolean })
                      }
                    />
                    <label htmlFor="marketingSms" className="text-sm">
                      Samtykke til markedsføring på SMS
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="marketingEmail"
                      checked={formData.marketingEmailConsent}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, marketingEmailConsent: checked as boolean })
                      }
                    />
                    <label htmlFor="marketingEmail" className="text-sm">
                      Samtykke til markedsføring på e-post
                    </label>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Avbryt
                  </Button>
                  <Button type="submit" disabled={createCustomer.isPending}>
                    {createCustomer.isPending ? "Oppretter..." : "Opprett kunde"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk etter navn, telefon eller e-post..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : filteredCustomers && filteredCustomers.length > 0 ? (
          <div className="grid gap-4">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>
                        {customer.firstName} {customer.lastName}
                      </CardTitle>
                      <CardDescription className="space-y-1 mt-2">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </div>
                        {customer.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </div>
                        )}
                        {customer.dateOfBirth && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {new Date(customer.dateOfBirth).toLocaleDateString("no-NO")}
                          </div>
                        )}
                        <CustomerLoyaltyPoints customerId={customer.id} />
                      </CardDescription>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>Besøk: {customer.totalVisits}</div>
                      <div>Omsetning: {customer.totalRevenue} NOK</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {customer.notes && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Notater:</strong> {customer.notes}
                    </p>
                  )}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => setLocation("/appointments")}
                    >
                      <CalendarPlus className="h-4 w-4" />
                      Book avtale
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => setLocation("/orders")}
                    >
                      <Receipt className="h-4 w-4" />
                      Se kjøpshistorikk
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              {searchTerm ? (
                <>
                  <h3 className="text-lg font-semibold mb-2">Ingen kunder funnet</h3>
                  <p className="text-muted-foreground mb-4">Prøv et annet søkeord</p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold mb-2">Ingen kunder ennå</h3>
                  <p className="text-muted-foreground mb-6 text-center max-w-md">
                    Legg til kunder for å booke avtaler, spore lojalitetspoeng og se kjøpshistorikk.
                  </p>
                  <div className="flex gap-3">
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Opprett første kunde
                    </Button>
                    <Button variant="outline" onClick={() => setLocation("/appointments")}>
                      <CalendarPlus className="h-4 w-4 mr-2" />
                      Se kalender
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
