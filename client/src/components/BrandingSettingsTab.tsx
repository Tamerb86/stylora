import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Upload, Palette, Type, Eye, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function BrandingSettingsTab() {
  const { data: branding, isLoading, refetch } = trpc.salonSettings.getBranding.useQuery();
  const updateBranding = trpc.salonSettings.updateBranding.useMutation();

  // Local state for live preview
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [accentColor, setAccentColor] = useState("#ea580c");
  const [welcomeTitle, setWelcomeTitle] = useState("Velkommen!");
  const [welcomeSubtitle, setWelcomeSubtitle] = useState("Bestill din time på nett.");
  const [showStaffSection, setShowStaffSection] = useState(true);
  const [showSummaryCard, setShowSummaryCard] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update local state when branding data loads
  useEffect(() => {
    if (branding) {
      setLogoUrl(branding.logoUrl ?? null);
      setPrimaryColor(branding.primaryColor || "#2563eb");
      setAccentColor(branding.accentColor || "#ea580c");
      setWelcomeTitle(branding.welcomeTitle || "Velkommen!");
      setWelcomeSubtitle(branding.welcomeSubtitle || "Bestill din time på nett.");
      setShowStaffSection(branding.showStaffSection ?? true);
      setShowSummaryCard(branding.showSummaryCard ?? true);
    }
  }, [branding]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Vennligst last opp en bildefil");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Bildet er for stort. Maks 5MB.");
      return;
    }

    setIsUploading(true);

    try {
      // Upload to Manus storage
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const { url } = await response.json();
      setLogoUrl(url);
      toast.success("Logo lastet opp!");
    } catch (error) {
      console.error("Logo upload error:", error);
      toast.error("Kunne ikke laste opp logo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateBranding.mutateAsync({
        logoUrl,
        primaryColor,
        accentColor,
        welcomeTitle,
        welcomeSubtitle,
        showStaffSection,
        showSummaryCard,
      });

      toast.success("Branding lagret!");
      refetch();
    } catch (error: any) {
      console.error("Save branding error:", error);
      toast.error(error.message || "Kunne ikke lagre branding");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Branding</h2>
        <p className="text-muted-foreground mt-1">
          Tilpass utseendet på bookingsiden din
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <div className="space-y-6">
          {/* Logo Upload */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Logo</h3>
            </div>

            <div className="space-y-4">
              {logoUrl && (
                <div className="relative w-32 h-32 border-2 border-dashed rounded-lg overflow-hidden">
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />

              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Laster opp...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {logoUrl ? "Endre logo" : "Last opp logo"}
                  </>
                )}
              </Button>

              {logoUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLogoUrl(null)}
                >
                  Fjern logo
                </Button>
              )}
            </div>
          </Card>

          {/* Colors */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Farger</h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="primaryColor">Primærfarge</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#2563eb"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="accentColor">Aksentfarge</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="accentColor"
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    placeholder="#ea580c"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Text Content */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Type className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Tekst</h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="welcomeTitle">Velkomsttittel</Label>
                <Input
                  id="welcomeTitle"
                  value={welcomeTitle}
                  onChange={(e) => setWelcomeTitle(e.target.value)}
                  placeholder="Velkommen!"
                  maxLength={100}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="welcomeSubtitle">Undertekst</Label>
                <Input
                  id="welcomeSubtitle"
                  value={welcomeSubtitle}
                  onChange={(e) => setWelcomeSubtitle(e.target.value)}
                  placeholder="Bestill din time på nett."
                  maxLength={200}
                  className="mt-2"
                />
              </div>
            </div>
          </Card>

          {/* Visibility Toggles */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Synlighet</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showStaffSection">Vis ansatte-seksjon</Label>
                  <p className="text-sm text-muted-foreground">
                    La kunder velge ansatt
                  </p>
                </div>
                <Switch
                  id="showStaffSection"
                  checked={showStaffSection}
                  onCheckedChange={setShowStaffSection}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showSummaryCard">Vis sammendragskort</Label>
                  <p className="text-sm text-muted-foreground">
                    Vis oppsummering av valg
                  </p>
                </div>
                <Switch
                  id="showSummaryCard"
                  checked={showSummaryCard}
                  onCheckedChange={setShowSummaryCard}
                />
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={updateBranding.isPending}
            className="w-full"
            size="lg"
          >
            {updateBranding.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Lagrer...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Lagre endringer
              </>
            )}
          </Button>
        </div>

        {/* Live Preview Panel */}
        <div className="lg:sticky lg:top-6 h-fit">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Forhåndsvisning</h3>
            </div>

            <div
              className="border-2 rounded-lg p-8 space-y-6"
              style={{
                backgroundColor: "#f9fafb",
                borderColor: primaryColor,
              }}
            >
              {/* Logo Preview */}
              {logoUrl && (
                <div className="flex justify-center">
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="h-16 object-contain"
                  />
                </div>
              )}

              {/* Welcome Text */}
              <div className="text-center space-y-2">
                <h2
                  className="text-3xl font-bold"
                  style={{ color: primaryColor }}
                >
                  {welcomeTitle}
                </h2>
                <p className="text-muted-foreground">{welcomeSubtitle}</p>
              </div>

              {/* Mock Booking Steps */}
              <div className="space-y-3">
                <div
                  className="p-4 rounded-lg text-white font-medium"
                  style={{ backgroundColor: primaryColor }}
                >
                  1. Velg tjeneste
                </div>

                {showStaffSection && (
                  <div
                    className="p-4 rounded-lg border-2"
                    style={{ borderColor: accentColor, color: accentColor }}
                  >
                    2. Velg ansatt
                  </div>
                )}

                <div className="p-4 rounded-lg border-2 border-gray-300 text-gray-500">
                  {showStaffSection ? "3" : "2"}. Velg tid
                </div>
              </div>

              {/* Summary Card */}
              {showSummaryCard && (
                <div
                  className="p-4 rounded-lg border-2"
                  style={{ borderColor: accentColor }}
                >
                  <p
                    className="font-semibold mb-2"
                    style={{ color: accentColor }}
                  >
                    Sammendrag
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ditt valg vises her
                  </p>
                </div>
              )}

              {/* Mock Button */}
              <button
                className="w-full py-3 rounded-lg text-white font-semibold"
                style={{ backgroundColor: accentColor }}
              >
                Bekreft booking
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
