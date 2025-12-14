import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Mail, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Settings,
  Plus,
  Edit,
  Trash2,
  Save
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function Communications() {
  const [activeTab, setActiveTab] = useState("sms");
  
  // Fetch settings from database
  const { data: settings, refetch: refetchSettings } = trpc.communications.getSettings.useQuery();
  const updateSettingsMutation = trpc.communications.updateSettings.useMutation();
  
  // Fetch templates
  const { data: smsTemplates = [], refetch: refetchSmsTemplates } = trpc.communications.listTemplates.useQuery({ type: "sms" });
  const { data: emailTemplates = [], refetch: refetchEmailTemplates } = trpc.communications.listTemplates.useQuery({ type: "email" });
  
  // Mutations
  const createTemplateMutation = trpc.communications.createTemplate.useMutation();
  const updateTemplateMutation = trpc.communications.updateTemplate.useMutation();
  const deleteTemplateMutation = trpc.communications.deleteTemplate.useMutation();

  // Local state for settings form
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsProvider, setSmsProvider] = useState("");
  const [smsApiKey, setSmsApiKey] = useState("");
  const [smsSenderName, setSmsSenderName] = useState("");
  
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [emailFromAddress, setEmailFromAddress] = useState("");
  const [emailFromName, setEmailFromName] = useState("");
  
  const [autoReminderEnabled, setAutoReminderEnabled] = useState(false);
  const [reminderHoursBefore, setReminderHoursBefore] = useState(24);

  // Template dialog state
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateContent, setTemplateContent] = useState("");
  const [templateType, setTemplateType] = useState<"sms" | "email">("sms");

  // Load settings into form when data arrives
  useEffect(() => {
    if (settings) {
      setSmsEnabled(settings.smsEnabled || false);
      setSmsProvider(settings.smsProvider || "");
      setSmsApiKey(settings.smsApiKey || "");
      setSmsSenderName(settings.smsSenderName || "");
      
      setEmailEnabled(settings.emailEnabled || false);
      setSmtpHost(settings.smtpHost || "");
      setSmtpPort(settings.smtpPort || 587);
      setSmtpUser(settings.smtpUser || "");
      setSmtpPassword(settings.smtpPassword || "");
      setSmtpSecure(settings.smtpSecure !== false);
      setEmailFromAddress(settings.emailFromAddress || "");
      setEmailFromName(settings.emailFromName || "");
      
      setAutoReminderEnabled(settings.autoReminderEnabled || false);
      setReminderHoursBefore(settings.reminderHoursBefore || 24);
    }
  }, [settings]);

  const handleSaveSettings = async () => {
    try {
      await updateSettingsMutation.mutateAsync({
        smsEnabled,
        smsProvider,
        smsApiKey,
        smsSenderName,
        emailEnabled,
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPassword,
        smtpSecure,
        emailFromAddress,
        emailFromName,
        autoReminderEnabled,
        reminderHoursBefore,
      });
      
      toast.success("Innstillinger lagret!");
      refetchSettings();
    } catch (error) {
      toast.error("Kunne ikke lagre innstillinger");
    }
  };

  const handleOpenTemplateDialog = (type: "sms" | "email", template?: any) => {
    setTemplateType(type);
    if (template) {
      setEditingTemplate(template);
      setTemplateName(template.name);
      setTemplateSubject(template.subject || "");
      setTemplateContent(template.content);
    } else {
      setEditingTemplate(null);
      setTemplateName("");
      setTemplateSubject("");
      setTemplateContent("");
    }
    setTemplateDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    try {
      if (editingTemplate) {
        // Update existing template
        await updateTemplateMutation.mutateAsync({
          id: editingTemplate.id,
          name: templateName,
          subject: templateType === "email" ? templateSubject : undefined,
          content: templateContent,
        });
        toast.success("Mal oppdatert!");
      } else {
        // Create new template
        await createTemplateMutation.mutateAsync({
          type: templateType,
          name: templateName,
          subject: templateType === "email" ? templateSubject : undefined,
          content: templateContent,
          variables: ["{customer_name}", "{salon_name}", "{date}", "{time}", "{service}"],
        });
        toast.success("Mal opprettet!");
      }
      
      setTemplateDialogOpen(false);
      if (templateType === "sms") {
        refetchSmsTemplates();
      } else {
        refetchEmailTemplates();
      }
    } catch (error) {
      toast.error("Kunne ikke lagre mal");
    }
  };

  const handleDeleteTemplate = async (id: number, type: "sms" | "email") => {
    if (!confirm("Er du sikker på at du vil slette denne malen?")) return;
    
    try {
      await deleteTemplateMutation.mutateAsync({ id });
      toast.success("Mal slettet!");
      
      if (type === "sms") {
        refetchSmsTemplates();
      } else {
        refetchEmailTemplates();
      }
    } catch (error) {
      toast.error("Kunne ikke slette mal");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kommunikasjon</h1>
          <p className="text-muted-foreground">
            Administrer SMS og e-post innstillinger, maler og automatisering
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sms">
              <MessageSquare className="h-4 w-4 mr-2" />
              SMS
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" />
              E-post
            </TabsTrigger>
            <TabsTrigger value="automation">
              <Settings className="h-4 w-4 mr-2" />
              Automatisering
            </TabsTrigger>
          </TabsList>

          {/* SMS Tab */}
          <TabsContent value="sms" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>SMS Innstillinger</CardTitle>
                <CardDescription>
                  Konfigurer SMS-leverandør og avsenderinformasjon
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Aktiver SMS</Label>
                    <p className="text-sm text-muted-foreground">
                      Slå på SMS-varsler for kunder
                    </p>
                  </div>
                  <Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} />
                </div>

                {smsEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="smsProvider">SMS Leverandør</Label>
                      <Select value={smsProvider} onValueChange={setSmsProvider}>
                        <SelectTrigger id="smsProvider">
                          <SelectValue placeholder="Velg leverandør" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="twilio">Twilio</SelectItem>
                          <SelectItem value="link_mobility">Link Mobility</SelectItem>
                          <SelectItem value="telenor">Telenor SMS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smsApiKey">API Nøkkel</Label>
                      <Input
                        id="smsApiKey"
                        type="password"
                        value={smsApiKey}
                        onChange={(e) => setSmsApiKey(e.target.value)}
                        placeholder="Din API nøkkel"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smsSenderName">Avsendernavn (maks 11 tegn)</Label>
                      <Input
                        id="smsSenderName"
                        value={smsSenderName}
                        onChange={(e) => setSmsSenderName(e.target.value.slice(0, 11))}
                        placeholder="SALONG"
                        maxLength={11}
                      />
                      <p className="text-xs text-muted-foreground">
                        Dette navnet vises som avsender på SMS
                      </p>
                    </div>
                  </>
                )}

                <Button onClick={handleSaveSettings} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Lagre Innstillinger
                </Button>
              </CardContent>
            </Card>

            {/* SMS Templates */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>SMS Maler</CardTitle>
                    <CardDescription>
                      Lag og administrer SMS-maler for forskjellige formål
                    </CardDescription>
                  </div>
                  <Button onClick={() => handleOpenTemplateDialog("sms")} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ny Mal
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {smsTemplates.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Ingen SMS-maler ennå. Klikk "Ny Mal" for å opprette en.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {smsTemplates.map((template: any) => (
                      <div key={template.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{template.name}</h4>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenTemplateDialog("sms", template)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTemplate(template.id, "sms")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{template.content}</p>
                        {!template.isActive && (
                          <Badge variant="secondary">Inaktiv</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>E-post Innstillinger</CardTitle>
                <CardDescription>
                  Konfigurer SMTP-server og avsenderinformasjon
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Aktiver E-post</Label>
                    <p className="text-sm text-muted-foreground">
                      Slå på e-postvarsler for kunder
                    </p>
                  </div>
                  <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
                </div>

                {emailEnabled && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtpHost">SMTP Server</Label>
                        <Input
                          id="smtpHost"
                          value={smtpHost}
                          onChange={(e) => setSmtpHost(e.target.value)}
                          placeholder="smtp.gmail.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="smtpPort">Port</Label>
                        <Input
                          id="smtpPort"
                          type="number"
                          value={smtpPort}
                          onChange={(e) => setSmtpPort(parseInt(e.target.value))}
                          placeholder="587"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smtpUser">SMTP Brukernavn</Label>
                      <Input
                        id="smtpUser"
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                        placeholder="din@epost.no"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smtpPassword">SMTP Passord</Label>
                      <Input
                        id="smtpPassword"
                        type="password"
                        value={smtpPassword}
                        onChange={(e) => setSmtpPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Bruk TLS/SSL</Label>
                        <p className="text-sm text-muted-foreground">
                          Anbefalt for sikker tilkobling
                        </p>
                      </div>
                      <Switch checked={smtpSecure} onCheckedChange={setSmtpSecure} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emailFromAddress">Avsender E-post</Label>
                      <Input
                        id="emailFromAddress"
                        type="email"
                        value={emailFromAddress}
                        onChange={(e) => setEmailFromAddress(e.target.value)}
                        placeholder="salong@eksempel.no"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emailFromName">Avsender Navn</Label>
                      <Input
                        id="emailFromName"
                        value={emailFromName}
                        onChange={(e) => setEmailFromName(e.target.value)}
                        placeholder="Min Salong"
                      />
                    </div>
                  </>
                )}

                <Button onClick={handleSaveSettings} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Lagre Innstillinger
                </Button>
              </CardContent>
            </Card>

            {/* Email Templates */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>E-post Maler</CardTitle>
                    <CardDescription>
                      Lag og administrer e-postmaler for forskjellige formål
                    </CardDescription>
                  </div>
                  <Button onClick={() => handleOpenTemplateDialog("email")} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ny Mal
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {emailTemplates.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Ingen e-postmaler ennå. Klikk "Ny Mal" for å opprette en.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {emailTemplates.map((template: any) => (
                      <div key={template.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{template.name}</h4>
                            {template.subject && (
                              <p className="text-sm text-muted-foreground">
                                Emne: {template.subject}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenTemplateDialog("email", template)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTemplate(template.id, "email")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {template.content}
                        </p>
                        {!template.isActive && (
                          <Badge variant="secondary">Inaktiv</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Automatiske Påminnelser</CardTitle>
                <CardDescription>
                  Konfigurer automatiske påminnelser for avtaler
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Aktiver Automatiske Påminnelser</Label>
                    <p className="text-sm text-muted-foreground">
                      Send automatiske påminnelser til kunder
                    </p>
                  </div>
                  <Switch
                    checked={autoReminderEnabled}
                    onCheckedChange={setAutoReminderEnabled}
                  />
                </div>

                {autoReminderEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="reminderHoursBefore">Send påminnelse (timer før)</Label>
                    <Select
                      value={reminderHoursBefore.toString()}
                      onValueChange={(value) => setReminderHoursBefore(parseInt(value))}
                    >
                      <SelectTrigger id="reminderHoursBefore">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 timer før</SelectItem>
                        <SelectItem value="24">24 timer før (1 dag)</SelectItem>
                        <SelectItem value="48">48 timer før (2 dager)</SelectItem>
                        <SelectItem value="72">72 timer før (3 dager)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button onClick={handleSaveSettings} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Lagre Innstillinger
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tilgjengelige Variabler</CardTitle>
                <CardDescription>
                  Bruk disse variablene i malene dine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {"{customer_name}"}
                    </code>
                    <p className="text-xs text-muted-foreground">Kundens navn</p>
                  </div>
                  <div className="space-y-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {"{salon_name}"}
                    </code>
                    <p className="text-xs text-muted-foreground">Salongens navn</p>
                  </div>
                  <div className="space-y-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded">{"{date}"}</code>
                    <p className="text-xs text-muted-foreground">Avtaledato</p>
                  </div>
                  <div className="space-y-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded">{"{time}"}</code>
                    <p className="text-xs text-muted-foreground">Avtaletid</p>
                  </div>
                  <div className="space-y-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded">{"{service}"}</code>
                    <p className="text-xs text-muted-foreground">Tjenestenavn</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Rediger Mal" : "Ny Mal"}
            </DialogTitle>
            <DialogDescription>
              {templateType === "sms" ? "SMS-mal" : "E-postmal"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">Malnavn</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="F.eks. Avtale påminnelse"
              />
            </div>

            {templateType === "email" && (
              <div className="space-y-2">
                <Label htmlFor="templateSubject">Emne</Label>
                <Input
                  id="templateSubject"
                  value={templateSubject}
                  onChange={(e) => setTemplateSubject(e.target.value)}
                  placeholder="F.eks. Påminnelse om din time"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="templateContent">Innhold</Label>
              <Textarea
                id="templateContent"
                value={templateContent}
                onChange={(e) => setTemplateContent(e.target.value)}
                placeholder={
                  templateType === "sms"
                    ? "Hei {customer_name}! Påminnelse om din time..."
                    : "Hei {customer_name},\n\nDette er en påminnelse..."
                }
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                Bruk variabler som {"{customer_name}"}, {"{date}"}, {"{time}"}, etc.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleSaveTemplate}>
              <Save className="h-4 w-4 mr-2" />
              Lagre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
