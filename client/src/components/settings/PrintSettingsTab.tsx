import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useThermalPrinter } from "@/contexts/ThermalPrinterContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Printer, FileText, Type, Eye, Upload, X, Usb, Loader2, CheckCircle2, XCircle } from "lucide-react";

export function PrintSettingsTab() {
  const { data: printSettings, isLoading } = trpc.salonSettings.getPrintSettings.useQuery();
  const { data: settings } = trpc.salonSettings.getBranding.useQuery();
  const updatePrintSettings = trpc.salonSettings.updatePrintSettings.useMutation();
  const uploadLogo = trpc.salonSettings.uploadReceiptLogo.useMutation();
  const removeLogo = trpc.salonSettings.removeReceiptLogo.useMutation();
  const utils = trpc.useUtils();
  
  // Thermal printer context
  const thermalPrinter = useThermalPrinter();

  const [printerType, setPrinterType] = useState<"thermal_80mm" | "a4">("thermal_80mm");
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium");
  const [showLogo, setShowLogo] = useState(true);
  const [customFooterText, setCustomFooterText] = useState("Takk for besøket! Velkommen tilbake!");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(false);
  const [autoOpenCashDrawer, setAutoOpenCashDrawer] = useState(false);
  const [orgNumber, setOrgNumber] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [website, setWebsite] = useState("");
  const [businessHours, setBusinessHours] = useState("");

  // Load settings when data arrives
  useEffect(() => {
    if (printSettings) {
      setPrinterType((printSettings as any).printerType || "thermal_80mm");
      setFontSize(printSettings.fontSize);
      setShowLogo(printSettings.showLogo);
      setCustomFooterText(printSettings.customFooterText);
      setAutoPrintReceipt((printSettings as any).autoPrintReceipt ?? false);
      setAutoOpenCashDrawer((printSettings as any).autoOpenCashDrawer ?? false);
      setOrgNumber((printSettings as any).orgNumber || "");
      setBankAccount((printSettings as any).bankAccount || "");
      setWebsite((printSettings as any).website || "");
      setBusinessHours((printSettings as any).businessHours || "");
    }
  }, [printSettings]);

  // Load logo URL from settings
  useEffect(() => {
    if (settings?.receiptLogoUrl) {
      setLogoUrl(settings.receiptLogoUrl);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updatePrintSettings.mutateAsync({
        printerType,
        fontSize,
        showLogo,
        customFooterText,
        autoPrintReceipt,
        autoOpenCashDrawer,
        orgNumber: orgNumber || undefined,
        bankAccount: bankAccount || undefined,
        website: website || undefined,
        businessHours: businessHours || undefined,
      });
      toast.success("Utskriftsinnstillinger lagret!");
    } catch (error) {
      toast.error("Kunne ikke lagre innstillinger");
      console.error(error);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Kun JPEG, PNG og WebP bilder er tillatt");
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Bildet må være mindre enn 2MB");
      return;
    }

    setIsUploadingLogo(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(",")[1]; // Remove data:image/...;base64, prefix

        const result = await uploadLogo.mutateAsync({
          fileData: base64Data,
          fileName: file.name,
          mimeType: file.type,
        });

        setLogoUrl(result.logoUrl);
        await utils.salonSettings.getBranding.invalidate();
        toast.success("Logo lastet opp!");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Kunne ikke laste opp logo");
      console.error(error);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await removeLogo.mutateAsync();
      setLogoUrl(null);
      await utils.salonSettings.getBranding.invalidate();
      toast.success("Logo fjernet!");
    } catch (error) {
      toast.error("Kunne ikke fjerne logo");
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Laster innstillinger...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
          Utskriftsinnstillinger
        </h3>
        <p className="text-muted-foreground mt-1">
          Tilpass hvordan kvitteringer ser ut når de skrives ut
        </p>
      </div>

      {/* Thermal Printer Direct Connection */}
      {thermalPrinter.isSupported && (
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Usb className="w-5 h-5 text-blue-600" />
              Direkte utskrift (Termisk skriver)
            </CardTitle>
            <CardDescription>
              Koble til termisk skriver direkte via USB eller Serial port for raskere utskrift
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Connection Status */}
            {thermalPrinter.connectedPrinter ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900">
                      {thermalPrinter.connectedPrinter.name}
                    </p>
                    <p className="text-sm text-green-700">
                      {thermalPrinter.connectedPrinter.type === "usb" ? "USB" : "Serial"} - Tilkoblet
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => thermalPrinter.testPrint()}
                    disabled={thermalPrinter.isPrinting || thermalPrinter.isOpeningDrawer}
                  >
                    {thermalPrinter.isPrinting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Skriver ut...
                      </>
                    ) : (
                      <>
                        <Printer className="w-4 h-4 mr-2" />
                        Test utskrift
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => thermalPrinter.openCashDrawer()}
                    disabled={thermalPrinter.isPrinting || thermalPrinter.isOpeningDrawer}
                    className="bg-green-50 hover:bg-green-100 border-green-300"
                  >
                    {thermalPrinter.isOpeningDrawer ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Åpner...
                      </>
                    ) : (
                      <>
                        <Usb className="w-4 h-4 mr-2" />
                        Test åpne skuff
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => thermalPrinter.disconnectPrinter()}
                    disabled={thermalPrinter.isPrinting || thermalPrinter.isOpeningDrawer}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Koble fra
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <XCircle className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-700">Ingen skriver tilkoblet</p>
                    <p className="text-sm text-gray-500">
                      Koble til en termisk skriver for direkte utskrift
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => thermalPrinter.connectPrinter("usb")}
                    disabled={thermalPrinter.isConnecting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {thermalPrinter.isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Kobler til...
                      </>
                    ) : (
                      <>
                        <Usb className="w-4 h-4 mr-2" />
                        Koble til USB
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => thermalPrinter.connectPrinter("serial")}
                    disabled={thermalPrinter.isConnecting}
                  >
                    {thermalPrinter.isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Kobler til...
                      </>
                    ) : (
                      <>
                        <Usb className="w-4 h-4 mr-2" />
                        Koble til Serial
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <p>💡 <strong>Tips:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Koble til skriveren via USB eller Serial port</li>
                    <li>Nettleseren vil be om tillatelse til å få tilgang til enheten</li>
                    <li>Velg riktig skriver fra listen</li>
                    <li>Test utskrift for å bekrefte at den fungerer</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-blue-600" />
              Innstillinger
            </CardTitle>
            <CardDescription>
              Juster utskriftsformat for kvitteringer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Printer Type */}
            <div className="space-y-2">
              <Label htmlFor="printerType" className="flex items-center gap-2">
                <Printer className="w-4 h-4" />
                Skrivertype
              </Label>
              <Select value={printerType} onValueChange={(value: any) => setPrinterType(value)}>
                <SelectTrigger id="printerType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thermal_80mm">Termisk skriver (80mm)</SelectItem>
                  <SelectItem value="a4">A4 skriver</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Velg type skriver du bruker for utskrift
              </p>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <Label htmlFor="fontSize" className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                Skriftstørrelse
              </Label>
              <Select value={fontSize} onValueChange={(value: any) => setFontSize(value)}>
                <SelectTrigger id="fontSize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Liten (8pt)</SelectItem>
                  <SelectItem value="medium">Medium (10pt)</SelectItem>
                  <SelectItem value="large">Stor (12pt)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Velg skriftstørrelse for kvitteringstekst
              </p>
            </div>

            {/* Show Logo */}
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="showLogo" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Vis logo
                </Label>
                <p className="text-xs text-muted-foreground">
                  Vis salongens logo øverst på kvitteringen
                </p>
              </div>
              <Switch
                id="showLogo"
                checked={showLogo}
                onCheckedChange={setShowLogo}
              />
            </div>

            {/* Auto Print Receipt */}
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="autoPrintReceipt" className="flex items-center gap-2">
                  <Printer className="w-4 h-4" />
                  Automatisk utskrift
                </Label>
                <p className="text-xs text-muted-foreground">
                  Skriv ut kvittering automatisk etter vellykket betaling
                </p>
              </div>
              <Switch
                id="autoPrintReceipt"
                checked={autoPrintReceipt}
                onCheckedChange={setAutoPrintReceipt}
              />
            </div>

            {/* Auto Open Cash Drawer (only show if thermal printer connected) */}
            {thermalPrinter.connectedPrinter && (
              <div className="flex items-center justify-between space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="autoOpenCashDrawer" className="flex items-center gap-2">
                    <Usb className="w-4 h-4 text-blue-600" />
                    Automatisk åpne kassaskuff
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Åpne kassaskuff automatisk ved kontantbetaling (krever termisk skriver)
                  </p>
                </div>
                <Switch
                  id="autoOpenCashDrawer"
                  checked={autoOpenCashDrawer}
                  onCheckedChange={setAutoOpenCashDrawer}
                />
              </div>
            )}

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Kvitteringslogo
              </Label>
              
              {logoUrl ? (
                <div className="space-y-2">
                  <div className="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                    <img src={logoUrl} alt="Receipt logo" className="w-full h-full object-contain" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveLogo}
                    disabled={removeLogo.isPending}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Fjern logo
                  </Button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    id="logoUpload"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("logoUpload")?.click()}
                    disabled={isUploadingLogo}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploadingLogo ? "Laster opp..." : "Last opp logo"}
                  </Button>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                Last opp en logo som vises øverst på kvitteringen. Maks 2MB, JPEG/PNG/WebP.
              </p>
            </div>

            {/* Custom Footer Text */}
            <div className="space-y-2">
              <Label htmlFor="customFooterText">Bunntekst</Label>
              <Input
                id="customFooterText"
                value={customFooterText}
                onChange={(e) => setCustomFooterText(e.target.value)}
                placeholder="Takk for besøket! Velkommen tilbake!"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                Tekst som vises nederst på kvitteringen ({customFooterText.length}/200)
              </p>
            </div>

            {/* Business Information Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold">Bedriftsinformasjon (valgfritt)</h3>
              
              {/* Organization Number */}
              <div className="space-y-2">
                <Label htmlFor="orgNumber">Organisasjonsnummer</Label>
                <Input
                  id="orgNumber"
                  value={orgNumber}
                  onChange={(e) => setOrgNumber(e.target.value)}
                  placeholder="123 456 789"
                  maxLength={50}
                />
              </div>

              {/* Bank Account */}
              <div className="space-y-2">
                <Label htmlFor="bankAccount">Kontonummer</Label>
                <Input
                  id="bankAccount"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="1234 56 78901"
                  maxLength={50}
                />
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label htmlFor="website">Nettside</Label>
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://www.eksempel.no"
                  maxLength={200}
                />
              </div>

              {/* Business Hours */}
              <div className="space-y-2">
                <Label htmlFor="businessHours">Åpningstider</Label>
                <Input
                  id="businessHours"
                  value={businessHours}
                  onChange={(e) => setBusinessHours(e.target.value)}
                  placeholder="Man-Fre: 09:00-18:00, Lør: 10:00-15:00"
                  maxLength={200}
                />
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={updatePrintSettings.isPending}
              className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white"
            >
              {updatePrintSettings.isPending ? "Lagrer..." : "Lagre innstillinger"}
            </Button>
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-orange-600" />
              Forhåndsvisning
            </CardTitle>
            <CardDescription>
              Slik vil kvitteringen se ut
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`border rounded-lg bg-white space-y-4 mx-auto ${
              printerType === "thermal_80mm" 
                ? "max-w-[226px] p-3" // 80mm thermal printer width with smaller padding
                : "p-6" // A4 full width with normal padding
            }`}>
              {/* Logo */}
              {showLogo && (
                <div className="flex items-center justify-center pb-4 border-b">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center">
                    <Printer className="w-8 h-8 text-white" />
                  </div>
                </div>
              )}

              {/* Salon Name */}
              <div className="text-center">
                <h4 className={`font-bold ${fontSize === "small" ? "text-sm" : fontSize === "large" ? "text-lg" : "text-base"}`}>
                  Din Salong AS
                </h4>
                <p className={`text-muted-foreground ${fontSize === "small" ? "text-xs" : fontSize === "large" ? "text-sm" : "text-xs"}`}>
                  Storgata 1, 0123 Oslo
                </p>
              </div>

              {/* Receipt Title */}
              <div className="text-center border-b pb-2">
                <h5 className={`font-semibold ${fontSize === "small" ? "text-xs" : fontSize === "large" ? "text-base" : "text-sm"}`}>
                  KVITTERING
                </h5>
                <p className={`text-muted-foreground ${fontSize === "small" ? "text-xs" : fontSize === "large" ? "text-sm" : "text-xs"}`}>
                  #12345 - 01.12.2025, 14:30
                </p>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={fontSize === "small" ? "text-xs" : fontSize === "large" ? "text-sm" : "text-xs"}>
                    Herreklipp
                  </span>
                  <span className={fontSize === "small" ? "text-xs" : fontSize === "large" ? "text-sm" : "text-xs"}>
                    299,00 kr
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={fontSize === "small" ? "text-xs" : fontSize === "large" ? "text-sm" : "text-xs"}>
                    Voks
                  </span>
                  <span className={fontSize === "small" ? "text-xs" : fontSize === "large" ? "text-sm" : "text-xs"}>
                    150,00 kr
                  </span>
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between">
                  <span className={`${fontSize === "small" ? "text-xs" : fontSize === "large" ? "text-sm" : "text-xs"}`}>
                    Subtotal:
                  </span>
                  <span className={fontSize === "small" ? "text-xs" : fontSize === "large" ? "text-sm" : "text-xs"}>
                    449,00 kr
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`${fontSize === "small" ? "text-xs" : fontSize === "large" ? "text-sm" : "text-xs"}`}>
                    MVA (25%):
                  </span>
                  <span className={fontSize === "small" ? "text-xs" : fontSize === "large" ? "text-sm" : "text-xs"}>
                    112,25 kr
                  </span>
                </div>
                <div className="flex justify-between font-bold border-t pt-1">
                  <span className={fontSize === "small" ? "text-sm" : fontSize === "large" ? "text-base" : "text-sm"}>
                    TOTAL:
                  </span>
                  <span className={fontSize === "small" ? "text-sm" : fontSize === "large" ? "text-base" : "text-sm"}>
                    561,25 kr
                  </span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="text-center border-t pt-2">
                <p className={`text-muted-foreground ${fontSize === "small" ? "text-xs" : fontSize === "large" ? "text-sm" : "text-xs"}`}>
                  Betalt med: Kontant
                </p>
              </div>

              {/* Footer */}
              <div className="text-center border-t pt-3">
                <p className={`${fontSize === "small" ? "text-xs" : fontSize === "large" ? "text-sm" : "text-xs"}`}>
                  {customFooterText}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
