import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Users, 
  Filter,
  Calendar,
  MessageSquare,
  Mail
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function BulkMessaging() {
  const [messageType, setMessageType] = useState<"sms" | "email">("sms");
  const [campaignName, setCampaignName] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [filterType, setFilterType] = useState<"all" | "recent" | "high_value" | "inactive">("all");
  const [lastVisitDays, setLastVisitDays] = useState(30);
  const [minTotalSpent, setMinTotalSpent] = useState(1000);
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  // Fetch customers based on filter
  const { data: customers = [], refetch: refetchCustomers } = trpc.communications.getCustomersForBulk.useQuery({
    filter: filterType,
    lastVisitDays: filterType === "recent" || filterType === "inactive" ? lastVisitDays : undefined,
    minTotalSpent: filterType === "high_value" ? minTotalSpent : undefined,
  });

  // Fetch templates
  const { data: smsTemplates = [] } = trpc.communications.listTemplates.useQuery({ type: "sms" });
  const { data: emailTemplates = [] } = trpc.communications.listTemplates.useQuery({ type: "email" });

  // Mutation
  const createCampaignMutation = trpc.communications.createBulkCampaign.useMutation();

  const templates = messageType === "sms" ? smsTemplates : emailTemplates;

  const handleFilterChange = (value: string) => {
    setFilterType(value as any);
    setSelectedCustomers([]);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t: any) => t.id.toString() === templateId);
    if (template) {
      setContent(template.content);
      if (messageType === "email" && template.subject) {
        setSubject(template.subject);
      }
    }
  };

  const handleToggleCustomer = (customerId: number) => {
    setSelectedCustomers((prev) =>
      prev.includes(customerId)
        ? prev.filter((id) => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map((c: any) => c.id));
    }
  };

  const handleSendCampaign = async () => {
    if (!campaignName) {
      toast.error("Vennligst gi kampanjen et navn");
      return;
    }

    if (!content) {
      toast.error("Vennligst skriv inn meldingsinnhold");
      return;
    }

    if (selectedCustomers.length === 0) {
      toast.error("Vennligst velg minst én kunde");
      return;
    }

    if (messageType === "email" && !subject) {
      toast.error("Vennligst skriv inn emne for e-post");
      return;
    }

    try {
      let scheduledAt: Date | undefined;
      if (scheduleDate && scheduleTime) {
        scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);
      }

      await createCampaignMutation.mutateAsync({
        name: campaignName,
        type: messageType,
        templateId: selectedTemplate ? parseInt(selectedTemplate) : undefined,
        subject: messageType === "email" ? subject : undefined,
        content,
        customerIds: selectedCustomers,
        scheduledAt,
      });

      toast.success(
        scheduledAt
          ? "Kampanje planlagt!"
          : "Kampanje opprettet! Meldinger sendes snart."
      );

      // Reset form
      setCampaignName("");
      setSubject("");
      setContent("");
      setSelectedTemplate("");
      setSelectedCustomers([]);
      setScheduleDate("");
      setScheduleTime("");
    } catch (error) {
      toast.error("Kunne ikke opprette kampanje");
    }
  };

  const filteredCustomers = customers.filter((customer: any) => {
    if (messageType === "sms") {
      return customer.phone;
    } else {
      return customer.email;
    }
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Masseutsendelse</h1>
          <p className="text-muted-foreground">
            Send SMS eller e-post til flere kunder samtidig
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Campaign Setup */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Kampanjedetaljer</CardTitle>
                <CardDescription>
                  Konfigurer meldingen som skal sendes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="campaignName">Kampanjenavn</Label>
                  <Input
                    id="campaignName"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="F.eks. Sommertilbud 2024"
                  />
                </div>

                <Tabs value={messageType} onValueChange={(v) => setMessageType(v as any)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="sms">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      SMS
                    </TabsTrigger>
                    <TabsTrigger value="email">
                      <Mail className="h-4 w-4 mr-2" />
                      E-post
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="sms" className="space-y-4 mt-4">
                    {smsTemplates.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="smsTemplate">Velg mal (valgfritt)</Label>
                        <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                          <SelectTrigger id="smsTemplate">
                            <SelectValue placeholder="Velg en mal" />
                          </SelectTrigger>
                          <SelectContent>
                            {smsTemplates.map((template: any) => (
                              <SelectItem key={template.id} value={template.id.toString()}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="smsContent">SMS Innhold</Label>
                      <Textarea
                        id="smsContent"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Skriv inn SMS-melding..."
                        rows={5}
                      />
                      <p className="text-xs text-muted-foreground">
                        {content.length} tegn
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="email" className="space-y-4 mt-4">
                    {emailTemplates.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="emailTemplate">Velg mal (valgfritt)</Label>
                        <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                          <SelectTrigger id="emailTemplate">
                            <SelectValue placeholder="Velg en mal" />
                          </SelectTrigger>
                          <SelectContent>
                            {emailTemplates.map((template: any) => (
                              <SelectItem key={template.id} value={template.id.toString()}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="emailSubject">Emne</Label>
                      <Input
                        id="emailSubject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="F.eks. Spesialtilbud bare for deg!"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emailContent">E-post Innhold</Label>
                      <Textarea
                        id="emailContent"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Skriv inn e-postmelding..."
                        rows={10}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="border-t pt-4 space-y-4">
                  <h3 className="font-semibold">Planlegg sending (valgfritt)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="scheduleDate">Dato</Label>
                      <Input
                        id="scheduleDate"
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scheduleTime">Tid</Label>
                      <Input
                        id="scheduleTime"
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                      />
                    </div>
                  </div>
                  {scheduleDate && scheduleTime && (
                    <p className="text-sm text-muted-foreground">
                      Meldinger vil sendes: {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString("no-NO")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Customer Selection */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mottakere</CardTitle>
                <CardDescription>
                  Velg kunder som skal motta meldingen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="filterType">Filter</Label>
                  <Select value={filterType} onValueChange={handleFilterChange}>
                    <SelectTrigger id="filterType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle kunder</SelectItem>
                      <SelectItem value="recent">Nylige kunder</SelectItem>
                      <SelectItem value="high_value">Høyverdikunder</SelectItem>
                      <SelectItem value="inactive">Inaktive kunder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filterType === "recent" || filterType === "inactive" ? (
                  <div className="space-y-2">
                    <Label htmlFor="lastVisitDays">Siste besøk (dager)</Label>
                    <Input
                      id="lastVisitDays"
                      type="number"
                      value={lastVisitDays}
                      onChange={(e) => setLastVisitDays(parseInt(e.target.value))}
                      min={1}
                    />
                  </div>
                ) : null}

                {filterType === "high_value" && (
                  <div className="space-y-2">
                    <Label htmlFor="minTotalSpent">Min. totalforbruk (NOK)</Label>
                    <Input
                      id="minTotalSpent"
                      type="number"
                      value={minTotalSpent}
                      onChange={(e) => setMinTotalSpent(parseInt(e.target.value))}
                      min={0}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-medium">
                    {selectedCustomers.length} av {filteredCustomers.length} valgt
                  </span>
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    {selectedCustomers.length === filteredCustomers.length
                      ? "Fjern alle"
                      : "Velg alle"}
                  </Button>
                </div>

                <div className="border rounded-lg max-h-96 overflow-y-auto">
                  {filteredCustomers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Ingen kunder funnet med dette filteret
                    </p>
                  ) : (
                    <div className="divide-y">
                      {filteredCustomers.map((customer: any) => (
                        <div
                          key={customer.id}
                          className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleToggleCustomer(customer.id)}
                        >
                          <Checkbox
                            checked={selectedCustomers.includes(customer.id)}
                            onCheckedChange={() => handleToggleCustomer(customer.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{customer.firstName} {customer.lastName || ''}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {messageType === "sms" ? customer.phone : customer.email}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleSendCampaign}
                  className="w-full"
                  disabled={selectedCustomers.length === 0 || !content || createCampaignMutation.isPending}
                >
                  {createCampaignMutation.isPending ? (
                    "Oppretter..."
                  ) : scheduleDate && scheduleTime ? (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Planlegg Kampanje
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Nå
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
