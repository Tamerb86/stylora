import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, Edit, Send, RotateCcw, Upload, Palette } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TemplateType = "reminder_24h" | "reminder_2h" | "booking_confirmation" | "booking_cancellation" | "booking_update";

interface TemplateInfo {
  type: TemplateType;
  title: string;
  description: string;
  icon: string;
}

const templateTypes: TemplateInfo[] = [
  {
    type: "reminder_24h",
    title: "24-timers påminnelse",
    description: "Sendes 24 timer før avtalen",
    icon: "🕐",
  },
  {
    type: "reminder_2h",
    title: "2-timers påminnelse",
    description: "Sendes 2 timer før avtalen",
    icon: "⏰",
  },
  {
    type: "booking_confirmation",
    title: "Bookingbekreftelse",
    description: "Sendes når en booking er bekreftet",
    icon: "✅",
  },
  {
    type: "booking_cancellation",
    title: "Avbestilling",
    description: "Sendes når en booking er kansellert",
    icon: "❌",
  },
  {
    type: "booking_update",
    title: "Oppdatering",
    description: "Sendes når en booking er endret",
    icon: "🔄",
  },
];

export function EmailTemplates() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [testEmailDialogOpen, setTestEmailDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Form state
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#8b5cf6");
  const [secondaryColor, setSecondaryColor] = useState("#6366f1");

  const utils = trpc.useUtils();
  const { data: templates, isLoading } = trpc.emailTemplates.list.useQuery();
  
  const updateMutation = trpc.emailTemplates.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Mal oppdatert",
        description: "E-postmalen er oppdatert",
      });
      utils.emailTemplates.list.invalidate();
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Feil",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadLogoMutation = trpc.emailTemplates.uploadLogo.useMutation({
    onSuccess: (data) => {
      setLogoUrl(data.url);
      toast({
        title: "Logo lastet opp",
        description: "Logoen er lastet opp til S3",
      });
    },
    onError: (error) => {
      toast({
        title: "Feil ved opplasting",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendTestMutation = trpc.emailTemplates.sendTest.useMutation({
    onSuccess: () => {
      toast({
        title: "Test-e-post sendt",
        description: `E-post sendt til ${testEmail}`,
      });
      setTestEmailDialogOpen(false);
      setTestEmail("");
    },
    onError: (error) => {
      toast({
        title: "Feil ved sending",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetMutation = trpc.emailTemplates.resetToDefault.useMutation({
    onSuccess: () => {
      toast({
        title: "Mal tilbakestilt",
        description: "E-postmalen er tilbakestilt til standard",
      });
      utils.emailTemplates.list.invalidate();
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Feil",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditTemplate = async (type: TemplateType) => {
    setSelectedTemplate(type);
    
    // Get existing template or use defaults
    const existing = templates?.find(t => t.templateType === type);
    if (existing) {
      setSubject(existing.subject);
      setBodyHtml(existing.bodyHtml);
      setLogoUrl(existing.logoUrl || "");
      setPrimaryColor(existing.primaryColor || "#8b5cf6");
      setSecondaryColor(existing.secondaryColor || "#6366f1");
    } else {
      // Set defaults
      setSubject("");
      setBodyHtml("");
      setLogoUrl("");
      setPrimaryColor("#8b5cf6");
      setSecondaryColor("#6366f1");
    }
    
    setEditDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    if (!selectedTemplate) return;
    
    updateMutation.mutate({
      templateType: selectedTemplate,
      subject,
      bodyHtml,
      logoUrl: logoUrl || undefined,
      primaryColor,
      secondaryColor,
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Ugyldig filtype",
        description: "Vennligst last opp et bilde",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Fil for stor",
        description: "Maksimal filstørrelse er 2MB",
        variant: "destructive",
      });
      return;
    }

    setLogoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to S3
    const base64Reader = new FileReader();
    base64Reader.onloadend = () => {
      const base64 = (base64Reader.result as string).split(",")[1];
      uploadLogoMutation.mutate({
        fileName: file.name,
        fileType: file.type,
        base64Data: base64,
      });
    };
    base64Reader.readAsDataURL(file);
  };

  const handleSendTest = () => {
    if (!selectedTemplate || !testEmail) return;
    
    sendTestMutation.mutate({
      templateType: selectedTemplate,
      testEmail,
    });
  };

  const handleResetToDefault = () => {
    if (!selectedTemplate) return;
    
    if (confirm("Er du sikker på at du vil tilbakestille denne malen til standard?")) {
      resetMutation.mutate({
        templateType: selectedTemplate,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Laster e-postmaler...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
          E-postmaler
        </h1>
        <p className="text-muted-foreground">
          Tilpass e-postmaler for automatiske meldinger til kunder
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templateTypes.map((template) => {
          const existing = templates?.find(t => t.templateType === template.type);
          
          return (
            <Card key={template.type} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{template.icon}</div>
                    <div>
                      <CardTitle className="text-lg">{template.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {template.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {existing ? (
                    <div className="text-sm text-muted-foreground mb-4">
                      <p className="font-medium">Emne:</p>
                      <p className="truncate">{existing.subject}</p>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground mb-4">
                      <p>Ingen mal konfigurert ennå</p>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditTemplate(template.type)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Rediger
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate(template.type);
                        setTestEmailDialogOpen(true);
                      }}
                      disabled={!existing}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Template Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Rediger mal: {templateTypes.find(t => t.type === selectedTemplate)?.title}
            </DialogTitle>
            <DialogDescription>
              Tilpass e-postinnhold, logo og farger. Bruk variabler som {`{{customerName}}`}, {`{{appointmentDate}}`}, {`{{appointmentTime}}`}, {`{{serviceName}}`}, {`{{employeeName}}`}, {`{{salonName}}`}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Innhold</TabsTrigger>
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="preview">Forhåndsvisning</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <div>
                <Label htmlFor="subject">E-postemne</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Emne for e-posten"
                />
              </div>

              <div>
                <Label htmlFor="bodyHtml">E-postinnhold (HTML)</Label>
                <Textarea
                  id="bodyHtml"
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                  placeholder="HTML-innhold for e-posten"
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>

            <TabsContent value="design" className="space-y-4">
              <div>
                <Label htmlFor="logo">Logo</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="flex-1"
                  />
                  {(logoPreview || logoUrl) && (
                    <img
                      src={logoPreview || logoUrl}
                      alt="Logo preview"
                      className="h-16 w-16 object-contain border rounded"
                    />
                  )}
                </div>
                {logoUrl && (
                  <p className="text-xs text-muted-foreground mt-1">
                    URL: {logoUrl}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primaryColor">Primærfarge</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#8b5cf6"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="secondaryColor">Sekundærfarge</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      placeholder="#6366f1"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="mb-4">
                  <p className="text-sm font-medium">Emne:</p>
                  <p className="text-lg">{subject || "(Ingen emne)"}</p>
                </div>
                <div 
                  className="bg-white p-4 rounded border"
                  dangerouslySetInnerHTML={{ 
                    __html: bodyHtml
                      .replace(/{{primaryColor}}/g, primaryColor)
                      .replace(/{{secondaryColor}}/g, secondaryColor)
                      .replace(/{{customerName}}/g, "Test Kunde")
                      .replace(/{{salonName}}/g, "Din Salong")
                      .replace(/{{appointmentDate}}/g, "15. desember 2024")
                      .replace(/{{appointmentTime}}/g, "14:00")
                      .replace(/{{serviceName}}/g, "Herreklipp")
                      .replace(/{{employeeName}}/g, "Stylist Test")
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleResetToDefault}
              disabled={resetMutation.isPending}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Tilbakestill til standard
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Avbryt
              </Button>
              <Button
                onClick={handleSaveTemplate}
                disabled={updateMutation.isPending || !subject || !bodyHtml}
              >
                Lagre mal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Test Email Dialog */}
      <Dialog open={testEmailDialogOpen} onOpenChange={setTestEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send test-e-post</DialogTitle>
            <DialogDescription>
              Send en test-e-post for å se hvordan malen ser ut
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="testEmail">E-postadresse</Label>
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="din@epost.no"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setTestEmailDialogOpen(false)}
              >
                Avbryt
              </Button>
              <Button
                onClick={handleSendTest}
                disabled={sendTestMutation.isPending || !testEmail}
              >
                <Send className="h-4 w-4 mr-2" />
                Send test
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
