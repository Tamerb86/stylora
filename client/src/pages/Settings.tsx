import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  Clock,
  Bell,
  CreditCard,
  Globe,
  Palette,
  Printer,
  MessageSquare,
  Database,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { BookingSettingsSection } from "@/components/BookingSettingsSection";
import { DomainSettingsTab } from "@/components/DomainSettingsTab";
import { BrandingSettingsTab } from "@/components/BrandingSettingsTab";
import { PrintSettingsTab } from "@/components/settings/PrintSettingsTab";
import { SMSSettingsTab } from "@/components/settings/SMSSettingsTab";
import { DefaultDataTab } from "@/components/settings/DefaultDataTab";
import { PaymentSettingsTab } from "@/components/settings/PaymentSettingsTab";
import { BusinessHoursTab } from "@/components/BusinessHoursTab";
import { trpc } from "@/lib/trpc";
import { useUIMode } from "@/contexts/UIModeContext";

function ResetOnboardingButton() {
  const { t } = useTranslation();
  const resetMutation = trpc.auth.resetOnboarding.useMutation({
    onSuccess: () => {
      toast.success(t("settings.resetOnboardingSuccess"));
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
      {t("settings.resetOnboarding")}
    </Button>
  );
}

export default function Settings() {
  const { t } = useTranslation();
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
  const { data: salonInfo, isLoading } =
    trpc.salonSettings.getSalonInfo.useQuery();
  const updateSalonInfoMutation =
    trpc.salonSettings.updateSalonInfo.useMutation({
      onSuccess: () => {
        toast.success(t("settings.salon.saved"));
      },
      onError: error => {
        toast.error(error.message || t("settings.salon.saveFailed"));
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
    toast.success(t("settings.booking.saved"));
  };

  const handleSaveNotifications = () => {
    toast.success(t("settings.notifications.saved"));
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              {t("settings.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("settings.subtitle")}
            </p>
          </div>
          <ResetOnboardingButton />
        </div>

        <Tabs defaultValue="salon" className="space-y-6">
          <TabsList
            className={`grid w-full ${isSimpleMode ? "grid-cols-7" : "grid-cols-10"}`}
          >
            <TabsTrigger value="salon">
              <Building2 className="h-4 w-4 mr-2" />
              {t("settings.tabs.salon")}
            </TabsTrigger>
            <TabsTrigger value="booking">
              <Clock className="h-4 w-4 mr-2" />
              {t("settings.tabs.booking")}
            </TabsTrigger>
            <TabsTrigger value="hours">
              <Clock className="h-4 w-4 mr-2" />
              {t("settings.tabs.hours")}
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              {t("settings.tabs.notifications")}
            </TabsTrigger>
            <TabsTrigger value="payment">
              <CreditCard className="h-4 w-4 mr-2" />
              {t("settings.tabs.payment")}
            </TabsTrigger>
            <TabsTrigger value="domain">
              <Globe className="h-4 w-4 mr-2" />
              {t("settings.tabs.domain")}
            </TabsTrigger>
            <TabsTrigger value="defaultdata">
              <Database className="h-4 w-4 mr-2" />
              {t("settings.tabs.defaultData")}
            </TabsTrigger>
            {!isSimpleMode && (
              <>
                <TabsTrigger value="branding">
                  <Palette className="h-4 w-4 mr-2" />
                  {t("settings.tabs.branding")}
                </TabsTrigger>
                <TabsTrigger value="print">
                  <Printer className="h-4 w-4 mr-2" />
                  {t("settings.tabs.print")}
                </TabsTrigger>
                <TabsTrigger value="sms">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {t("settings.tabs.sms")}
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Salon Info Tab */}
          <TabsContent value="salon">
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.salon.title")}</CardTitle>
                <CardDescription>
                  {t("settings.salon.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="salonName">{t("settings.salon.salonName")}</Label>
                  <Input
                    id="salonName"
                    value={salonName}
                    onChange={e => setSalonName(e.target.value)}
                    placeholder={t("settings.salon.salonNamePlaceholder")}
                  />
                </div>

                <div>
                  <Label htmlFor="address">{t("settings.salon.address")}</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder={t("settings.salon.addressPlaceholder")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">{t("settings.salon.phone")}</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder={t("settings.salon.phonePlaceholder")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">{t("settings.salon.email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder={t("settings.salon.emailPlaceholder")}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">{t("settings.salon.description_field")}</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder={t("settings.salon.descriptionPlaceholder")}
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleSaveSalonInfo}
                  disabled={updateSalonInfoMutation.isPending || isLoading}
                >
                  {updateSalonInfoMutation.isPending
                    ? t("settings.salon.saving")
                    : t("settings.salon.saveChanges")}
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
                <CardTitle>{t("settings.notifications.title")}</CardTitle>
                <CardDescription>
                  {t("settings.notifications.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("settings.notifications.emailNotifications")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("settings.notifications.emailNotificationsDesc")}
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("settings.notifications.smsNotifications")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("settings.notifications.smsNotificationsDesc")}
                    </p>
                  </div>
                  <Switch
                    checked={smsNotifications}
                    onCheckedChange={setSmsNotifications}
                  />
                </div>

                <div>
                  <Label htmlFor="reminderHours">
                    {t("settings.notifications.reminderHours")}
                  </Label>
                  <Input
                    id="reminderHours"
                    type="number"
                    value={reminderHours}
                    onChange={e => setReminderHours(e.target.value)}
                    placeholder={t("settings.notifications.reminderHoursPlaceholder")}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("settings.notifications.reminderHoursDesc")}
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <h3 className="font-medium">{t("settings.notifications.messageTemplates")}</h3>

                  <div>
                    <Label htmlFor="confirmationTemplate">
                      {t("settings.notifications.confirmationMessage")}
                    </Label>
                    <Textarea
                      id="confirmationTemplate"
                      placeholder={t("settings.notifications.confirmationPlaceholder")}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="reminderTemplate">{t("settings.notifications.reminderMessage")}</Label>
                    <Textarea
                      id="reminderTemplate"
                      placeholder={t("settings.notifications.reminderPlaceholder")}
                      rows={3}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveNotifications}>{t("settings.notifications.saveNotifications")}</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment">
            <PaymentSettingsTab />
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

          {/* Default Data Tab */}
          <TabsContent value="defaultdata">
            <DefaultDataTab />
          </TabsContent>

          {/* Business Hours Tab */}
          <TabsContent value="hours">
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.hours.title")}</CardTitle>
                <CardDescription>
                  {t("settings.hours.description")}
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
