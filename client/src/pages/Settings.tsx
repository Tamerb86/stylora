import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Clock, Bell, CreditCard, Globe, Palette, Printer, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { BookingSettingsSection } from "@/components/BookingSettingsSection";
import { DomainSettingsTab } from "@/components/DomainSettingsTab";
import { BrandingSettingsTab } from "@/components/BrandingSettingsTab";
import { PrintSettingsTab } from "@/components/settings/PrintSettingsTab";
import { SMSSettingsTab } from "@/components/settings/SMSSettingsTab";
import { BusinessHoursTab } from "@/components/BusinessHoursTab";
import { trpc } from "@/lib/trpc";
import { useUIMode } from "@/contexts/UIModeContext";

function ResetOnboardingButton() {
  const resetMutation = trpc.auth.resetOnboarding.useMutation({
    onSuccess: () => {
      toast.success("Omvisning startet på nytt! Last inn siden på nytt for å se den.");
      setTimeout(() => window.location.reload(), 1500);
    },
  });

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => resetMutation.mutate()}
      disabled={resetMutation.isPending}
    >
      🎯 Start omvisning på nytt
    </Button>
  );
}

export default function Settings() {
  const { isSimpleMode } = useUIMode();
  const [salonName, setSalonName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("18:00");
  const [slotDuration, setSlotDuration] = useState("30");
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [reminderHours, setReminderHours] = useState("24");

  // Load salon info
  const { data: salonInfo, isLoading } = trpc.salonSettings.getSalonInfo.useQuery();
  const updateSalonInfoMutation = trpc.salonSettings.updateSalonInfo.useMutation({
    onSuccess: () => {
      toast.success("Salonginformasjon lagret!");
    },
    onError: (error) => {
      toast.error(error.message || "Kunne ikke lagre salonginformasjon");
    },
  });

  // Populate form when data loads
  useEffect(() => {
    if (salonInfo) {
      setSalonName(salonInfo.name);
      setPhone(salonInfo.phone);
      setEmail(salonInfo.email);
      setAddress(salonInfo.address);
    }
  }, [salonInfo]);

  const handleSaveSalonInfo = () => {
    updateSalonInfoMutation.mutate({
      name: salonName,
      phone: phone || undefined,
      email: email || undefined,
      address: address || undefined,
    });
  };

  const handleSaveBookingSettings = () => {
    toast.success("Bookinginnstillinger lagret!");
  };

  const handleSaveNotifications = () => {
    toast.success("Varslingsinnstillinger lagret!");
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Innstillinger</h1>
            <p className="text-muted-foreground">Administrer salongens innstillinger</p>
          </div>
          <ResetOnboardingButton />
        </div>

        <Tabs defaultValue="salon" className="space-y-6">
          <TabsList className={`grid w-full ${isSimpleMode ? 'grid-cols-6' : 'grid-cols-9'}`}>
            <TabsTrigger value="salon">
              <Building2 className="h-4 w-4 mr-2" />
              Salong
            </TabsTrigger>
            <TabsTrigger value="booking">
              <Clock className="h-4 w-4 mr-2" />
              Booking
            </TabsTrigger>
            <TabsTrigger value="hours">
              <Clock className="h-4 w-4 mr-2" />
              Åpningstider
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Varsler
            </TabsTrigger>
            <TabsTrigger value="payment">
              <CreditCard className="h-4 w-4 mr-2" />
              Betaling
            </TabsTrigger>
            <TabsTrigger value="domain">
              <Globe className="h-4 w-4 mr-2" />
              Domene
            </TabsTrigger>
            {!isSimpleMode && (
              <>
                <TabsTrigger value="branding">
                  <Palette className="h-4 w-4 mr-2" />
                  Branding
                </TabsTrigger>
                <TabsTrigger value="print">
                  <Printer className="h-4 w-4 mr-2" />
                  Utskrift
                </TabsTrigger>
                <TabsTrigger value="sms">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  SMS
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Salon Info Tab */}
          <TabsContent value="salon">
            <Card>
              <CardHeader>
                <CardTitle>Salonginformasjon</CardTitle>
                <CardDescription>
                  Grunnleggende informasjon om salonen din
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="salonName">Salongnavn</Label>
                  <Input
                    id="salonName"
                    value={salonName}
                    onChange={(e) => setSalonName(e.target.value)}
                    placeholder="Navn på salonen"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Gateadresse, postnummer, sted"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+47 123 45 678"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-post</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="post@salong.no"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Beskrivelse</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Kort beskrivelse av salonen..."
                    rows={4}
                  />
                </div>

                <Button 
                  onClick={handleSaveSalonInfo}
                  disabled={updateSalonInfoMutation.isPending || isLoading}
                >
                  {updateSalonInfoMutation.isPending ? "Lagrer..." : "Lagre endringer"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Booking Settings Tab */}
          <TabsContent value="booking" className="space-y-6">
            <BookingSettingsSection />
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Varslingsinnstillinger</CardTitle>
                <CardDescription>
                  Konfigurer hvordan kunder mottar varsler
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>E-postvarsler</Label>
                    <p className="text-sm text-muted-foreground">
                      Send bekreftelser og påminnelser via e-post
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS-varsler</Label>
                    <p className="text-sm text-muted-foreground">
                      Send påminnelser via SMS
                    </p>
                  </div>
                  <Switch
                    checked={smsNotifications}
                    onCheckedChange={setSmsNotifications}
                  />
                </div>

                <div>
                  <Label htmlFor="reminderHours">Påminnelse før avtale (timer)</Label>
                  <Input
                    id="reminderHours"
                    type="number"
                    value={reminderHours}
                    onChange={(e) => setReminderHours(e.target.value)}
                    placeholder="24"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Hvor mange timer før avtalen skal påminnelse sendes
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <h3 className="font-medium">Meldingsmaler</h3>
                  
                  <div>
                    <Label htmlFor="confirmationTemplate">Bekreftelsesmelding</Label>
                    <Textarea
                      id="confirmationTemplate"
                      placeholder="Hei {navn}, din avtale er bekreftet for {dato} kl {tid}."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="reminderTemplate">Påminnelsesmelding</Label>
                    <Textarea
                      id="reminderTemplate"
                      placeholder="Hei {navn}, påminnelse om din avtale i morgen kl {tid}."
                      rows={3}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveNotifications}>
                  Lagre varsler
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>Betalingsinnstillinger</CardTitle>
                <CardDescription>
                  Konfigurer betalingsmetoder og fakturering
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Vipps-betaling</Label>
                    <p className="text-sm text-muted-foreground">
                      Tillat betaling med Vipps
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Kortbetaling</Label>
                    <p className="text-sm text-muted-foreground">
                      Tillat betaling med kort
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Kontant</Label>
                    <p className="text-sm text-muted-foreground">
                      Tillat kontantbetaling
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-3">Stripe-integrasjon</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Koble til Stripe for å motta online betalinger
                  </p>
                  <Button variant="outline">
                    Koble til Stripe
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-3">Fakturering</h3>
                  
                  <div>
                    <Label htmlFor="invoicePrefix">Fakturaprefiks</Label>
                    <Input
                      id="invoicePrefix"
                      placeholder="INV-"
                      defaultValue="INV-"
                    />
                  </div>

                  <div className="mt-3">
                    <Label htmlFor="vatNumber">Organisasjonsnummer</Label>
                    <Input
                      id="vatNumber"
                      placeholder="123 456 789 MVA"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Domain Tab */}
          <TabsContent value="domain">
            <DomainSettingsTab />
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding">
            <BrandingSettingsTab />
          </TabsContent>

          {/* Print Settings Tab */}
          <TabsContent value="print">
            <PrintSettingsTab />
          </TabsContent>

          {/* SMS Settings Tab */}
          <TabsContent value="sms">
            <SMSSettingsTab />
          </TabsContent>

          {/* Business Hours Tab */}
          <TabsContent value="hours">
            <Card>
              <CardHeader>
                <CardTitle>Åpningstider</CardTitle>
                <CardDescription>
                  Administrer når salongen din er åpen for booking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BusinessHoursTab />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
