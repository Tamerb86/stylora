import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Search,
  Phone,
  Mail,
  Calendar,
  Users,
  Gift,
  CalendarPlus,
  Receipt,
  Trash2,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { BulkActionToolbar } from "@/components/BulkActionToolbar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { safeToFixed } from "@/lib/utils";

function CustomerLoyaltyPoints({ customerId }: { customerId: number }) {
  const { data: loyaltyPoints } = trpc.loyalty.getPoints.useQuery({
    customerId,
  });

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSMSDialog, setShowSMSDialog] = useState(false);
  const [smsMessage, setSmsMessage] = useState("");
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

  const {
    data: customers,
    isLoading,
    refetch,
  } = trpc.customers.list.useQuery();

  // Filter customers first
  const filteredCustomers = customers?.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.firstName.toLowerCase().includes(searchLower) ||
      (customer.lastName?.toLowerCase() || "").includes(searchLower) ||
      customer.phone.includes(searchTerm) ||
      (customer.email?.toLowerCase() || "").includes(searchLower)
    );
  });

  // Then use filtered customers for bulk selection
  const bulkSelection = useBulkSelection(filteredCustomers || []);

  const deleteCustomer = trpc.customers.delete.useMutation({
    onSuccess: () => {
      toast.success("Kunde slettet!");
      refetch();
    },
    onError: error => {
      toast.error(`Feil ved sletting: ${error.message}`);
    },
  });

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
    onError: error => {
      toast.error(`Feil: ${error.message}`);
    },
  });

  const handleBulkDelete = async () => {
    setShowDeleteDialog(false);
    const promises = bulkSelection.selectedIds.map(id =>
      deleteCustomer.mutateAsync({ id: Number(id) })
    );

    try {
      await Promise.all(promises);
      toast.success(`${bulkSelection.selectedCount} kunder slettet!`);
      bulkSelection.clearSelection();
      refetch();
    } catch (error) {
      toast.error("Noen kunder kunne ikke slettes");
    }
  };

  const handleBulkSMS = () => {
    setShowSMSDialog(false);
    // TODO: Implement bulk SMS sending
    toast.success(`SMS sendt til ${bulkSelection.selectedCount} kunder!`);
    bulkSelection.clearSelection();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCustomer.mutate(formData);
  };

  // Calculate stats
  const totalCustomers = customers?.length || 0;
  const totalRevenue =
    customers?.reduce((sum, c) => sum + (c.totalRevenue || 0), 0) || 0;
  const totalVisits =
    customers?.reduce((sum, c) => sum + (c.totalVisits || 0), 0) || 0;
  const avgRevenuePerCustomer =
    totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Kunder" },
      ]}
    >
      <BulkActionToolbar
        selectedCount={bulkSelection.selectedCount}
        onClear={bulkSelection.clearSelection}
        onDelete={() => setShowDeleteDialog(true)}
        onSendSMS={() => setShowSMSDialog(true)}
        isLoading={deleteCustomer.isPending}
      />

      {/* Background gradient */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-50 via-purple-50 to-orange-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900"></div>

      <div className="p-8 space-y-6">
        {/* Header with gradient */}
        <div className="flex justify-between items-center animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 bg-clip-text text-transparent">
              Kunder
            </h1>
            <p className="text-muted-foreground mt-1">
              Administrer kunderegisteret
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
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
                      onChange={e =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Etternavn</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={e =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
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
                      onChange={e =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-post</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={e =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Fødselsdato</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={e =>
                      setFormData({ ...formData, dateOfBirth: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={e =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">
                    Notater (allergier, preferanser)
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={e =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Markedsføringssamtykke</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="marketingSms"
                      checked={formData.marketingSmsConsent}
                      onCheckedChange={checked =>
                        setFormData({
                          ...formData,
                          marketingSmsConsent: checked as boolean,
                        })
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
                      onCheckedChange={checked =>
                        setFormData({
                          ...formData,
                          marketingEmailConsent: checked as boolean,
                        })
                      }
                    />
                    <label htmlFor="marketingEmail" className="text-sm">
                      Samtykke til markedsføring på e-post
                    </label>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Avbryt
                  </Button>
                  <Button type="submit" disabled={createCustomer.isPending}>
                    {createCustomer.isPending
                      ? "Oppretter..."
                      : "Opprett kunde"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-90"></div>
            <CardHeader className="relative pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white/90">
                  Totalt kunder
                </CardTitle>
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <Users className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white">
                {totalCustomers}
              </div>
              <p className="text-xs text-white/80 mt-1">Registrerte kunder</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-600 opacity-90"></div>
            <CardHeader className="relative pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white/90">
                  Total omsetning
                </CardTitle>
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <Receipt className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white">
                {safeToFixed(totalRevenue, 0)} kr
              </div>
              <p className="text-xs text-white/80 mt-1">Fra alle kunder</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-90"></div>
            <CardHeader className="relative pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white/90">
                  Totalt besøk
                </CardTitle>
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <CalendarPlus className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white">{totalVisits}</div>
              <p className="text-xs text-white/80 mt-1">Fullførte avtaler</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 opacity-90"></div>
            <CardHeader className="relative pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white/90">
                  Snitt per kunde
                </CardTitle>
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white">
                {safeToFixed(avgRevenuePerCustomer, 0)} kr
              </div>
              <p className="text-xs text-white/80 mt-1">
                Gjennomsnittlig verdi
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div
          className="flex items-center space-x-2 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk etter navn, telefon eller e-post..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/80 backdrop-blur-sm border-gray-200 shadow-sm"
            />
          </div>
        </div>

        {/* Customer Cards */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="h-32 bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse rounded-lg"
              ></div>
            ))}
          </div>
        ) : filteredCustomers && filteredCustomers.length > 0 ? (
          <div
            className="grid gap-4 animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            {filteredCustomers.map((customer, index) => (
              <Card
                key={customer.id}
                className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-none bg-white/80 backdrop-blur-sm animate-slide-in"
                style={{ animationDelay: `${0.05 * index}s` }}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={bulkSelection.isSelected(customer.id)}
                        onCheckedChange={() =>
                          bulkSelection.toggleSelection(customer.id)
                        }
                        className="mt-1"
                      />
                      <div>
                        <CardTitle className="text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
                              {new Date(
                                customer.dateOfBirth
                              ).toLocaleDateString("no-NO")}
                            </div>
                          )}
                          <CustomerLoyaltyPoints customerId={customer.id} />
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-sm font-semibold text-blue-700 mb-2">
                        <Users className="h-3 w-3" />
                        {customer.totalVisits} besøk
                      </div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-100 to-green-100 text-sm font-semibold text-emerald-700">
                        <Receipt className="h-3 w-3" />
                        {customer.totalRevenue} kr
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {customer.notes && (
                    <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
                      <strong>Notater:</strong> {customer.notes}
                    </p>
                  )}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-2 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                      onClick={() => setLocation(`/customers/${customer.id}`)}
                    >
                      <Users className="h-4 w-4" />
                      Se detaljer
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white transition-all duration-300"
                      onClick={() => setLocation("/appointments")}
                    >
                      <CalendarPlus className="h-4 w-4" />
                      Book avtale
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-none bg-white/80 backdrop-blur-sm shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-4">
                <Users className="h-12 w-12 text-blue-600" />
              </div>
              {searchTerm ? (
                <>
                  <h3 className="text-lg font-semibold mb-2">
                    Ingen kunder funnet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Prøv et annet søkeord
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold mb-2">
                    Ingen kunder ennå
                  </h3>
                  <p className="text-muted-foreground mb-6 text-center max-w-md">
                    Legg til kunder for å booke avtaler, spore lojalitetspoeng
                    og se kjøpshistorikk.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setIsDialogOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Opprett første kunde
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setLocation("/appointments")}
                    >
                      <CalendarPlus className="h-4 w-4 mr-2" />
                      Se kalender
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Bulk Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Bekreft sletting</AlertDialogTitle>
              <AlertDialogDescription>
                Er du sikker på at du vil slette {bulkSelection.selectedCount}{" "}
                kunde(r)? Denne handlingen kan ikke angres.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Slett
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk SMS Dialog */}
        <AlertDialog open={showSMSDialog} onOpenChange={setShowSMSDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Send SMS til {bulkSelection.selectedCount} kunde(r)
              </AlertDialogTitle>
              <AlertDialogDescription>
                Skriv meldingen du vil sende til de valgte kundene.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Textarea
                placeholder="Skriv melding her..."
                value={smsMessage}
                onChange={e => setSmsMessage(e.target.value)}
                rows={4}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkSMS}
                disabled={!smsMessage.trim()}
              >
                Send SMS
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
