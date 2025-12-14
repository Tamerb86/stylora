import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Eye,
  MousePointerClick,
  Mail,
  MessageSquare,
  Calendar,
  Users
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function CampaignAnalytics() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);

  // Fetch campaigns
  const { data: campaigns = [] } = trpc.communications.listCampaigns.useQuery();

  // Fetch campaign details when selected
  const { data: campaignDetails } = trpc.communications.getCampaignDetails.useQuery(
    { campaignId: selectedCampaignId! },
    { enabled: selectedCampaignId !== null }
  );

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="secondary">Ukjent</Badge>;
    const variants: Record<string, { variant: any; label: string }> = {
      draft: { variant: "secondary", label: "Utkast" },
      scheduled: { variant: "default", label: "Planlagt" },
      sending: { variant: "default", label: "Sender" },
      completed: { variant: "default", label: "Fullført" },
      failed: { variant: "destructive", label: "Feilet" },
    };

    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getRecipientStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      pending: { variant: "secondary", label: "Venter", icon: Clock },
      sent: { variant: "default", label: "Sendt", icon: Send },
      delivered: { variant: "default", label: "Levert", icon: CheckCircle2 },
      failed: { variant: "destructive", label: "Feilet", icon: XCircle },
      opened: { variant: "default", label: "Åpnet", icon: Eye },
      clicked: { variant: "default", label: "Klikket", icon: MousePointerClick },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const calculateMetrics = (campaign: any) => {
    const deliveryRate =
      campaign.recipientCount > 0
        ? ((campaign.deliveredCount / campaign.recipientCount) * 100).toFixed(1)
        : "0.0";

    const openRate =
      campaign.deliveredCount > 0
        ? ((campaign.openedCount / campaign.deliveredCount) * 100).toFixed(1)
        : "0.0";

    const clickRate =
      campaign.openedCount > 0
        ? ((campaign.clickedCount / campaign.openedCount) * 100).toFixed(1)
        : "0.0";

    return { deliveryRate, openRate, clickRate };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kampanjeanalyse</h1>
          <p className="text-muted-foreground">
            Følg med på ytelsen til dine SMS- og e-postkampanjer
          </p>
        </div>

        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center space-y-4">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="font-semibold text-lg">Ingen kampanjer ennå</h3>
                  <p className="text-muted-foreground">
                    Opprett din første masseutsendelse for å se analyser her
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign: any) => {
              const metrics = calculateMetrics(campaign);
              const Icon = campaign.type === "sms" ? MessageSquare : Mail;

              return (
                <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <CardTitle>{campaign.name}</CardTitle>
                          {getStatusBadge(campaign.status)}
                        </div>
                        <CardDescription>
                          {campaign.type === "sms" ? "SMS-kampanje" : "E-postkampanje"} •{" "}
                          {new Date(campaign.createdAt).toLocaleDateString("no-NO")}
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCampaignId(campaign.id)}
                      >
                        Se detaljer
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span className="text-sm">Mottakere</span>
                        </div>
                        <p className="text-2xl font-bold">{campaign.recipientCount}</p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Send className="h-4 w-4" />
                          <span className="text-sm">Sendt</span>
                        </div>
                        <p className="text-2xl font-bold">{campaign.sentCount}</p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-sm">Levert</span>
                        </div>
                        <p className="text-2xl font-bold">{campaign.deliveredCount}</p>
                        <p className="text-xs text-muted-foreground">{metrics.deliveryRate}%</p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <XCircle className="h-4 w-4" />
                          <span className="text-sm">Feilet</span>
                        </div>
                        <p className="text-2xl font-bold">{campaign.failedCount}</p>
                      </div>

                      {campaign.type === "email" && (
                        <>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Eye className="h-4 w-4" />
                              <span className="text-sm">Åpnet</span>
                            </div>
                            <p className="text-2xl font-bold">{campaign.openedCount}</p>
                            <p className="text-xs text-muted-foreground">{metrics.openRate}%</p>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MousePointerClick className="h-4 w-4" />
                              <span className="text-sm">Klikket</span>
                            </div>
                            <p className="text-2xl font-bold">{campaign.clickedCount}</p>
                            <p className="text-xs text-muted-foreground">{metrics.clickRate}%</p>
                          </div>
                        </>
                      )}
                    </div>

                    {campaign.scheduledAt && campaign.status === "scheduled" && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Planlagt:{" "}
                          {new Date(campaign.scheduledAt).toLocaleString("no-NO")}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Campaign Details Dialog */}
      <Dialog
        open={selectedCampaignId !== null}
        onOpenChange={(open) => !open && setSelectedCampaignId(null)}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kampanjedetaljer</DialogTitle>
            <DialogDescription>
              Detaljert oversikt over mottakere og status
            </DialogDescription>
          </DialogHeader>

          {campaignDetails && (
            <div className="space-y-6">
              {/* Campaign Info */}
              <div className="space-y-2">
                <h3 className="font-semibold">{campaignDetails.campaign.name}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    {campaignDetails.campaign.type === "sms" ? "SMS" : "E-post"}
                  </span>
                  <span>•</span>
                  <span>
                    {new Date(campaignDetails.campaign.createdAt).toLocaleString("no-NO")}
                  </span>
                  <span>•</span>
                  {getStatusBadge(campaignDetails.campaign.status)}
                </div>
              </div>

              {/* Message Content */}
              <div className="border rounded-lg p-4 bg-muted/50">
                {campaignDetails.campaign.subject && (
                  <p className="font-semibold mb-2">
                    Emne: {campaignDetails.campaign.subject}
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap">
                  {campaignDetails.campaign.content}
                </p>
              </div>

              {/* Recipients Table */}
              <div>
                <h4 className="font-semibold mb-4">
                  Mottakere ({campaignDetails.recipients.length})
                </h4>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kunde</TableHead>
                        <TableHead>Kontakt</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sendt</TableHead>
                        <TableHead>Levert</TableHead>
                        {campaignDetails.campaign.type === "email" && (
                          <>
                            <TableHead>Åpnet</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaignDetails.recipients.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            Ingen mottakere
                          </TableCell>
                        </TableRow>
                      ) : (
                        campaignDetails.recipients.map((recipient: any) => (
                          <TableRow key={recipient.id}>
                            <TableCell className="font-medium">
                              {recipient.customerName}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {recipient.recipientContact}
                            </TableCell>
                            <TableCell>{getRecipientStatusBadge(recipient.status)}</TableCell>
                            <TableCell className="text-sm">
                              {recipient.sentAt
                                ? new Date(recipient.sentAt).toLocaleString("no-NO", {
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  })
                                : "-"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {recipient.deliveredAt
                                ? new Date(recipient.deliveredAt).toLocaleString("no-NO", {
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  })
                                : "-"}
                            </TableCell>
                            {campaignDetails.campaign.type === "email" && (
                              <>
                                <TableCell className="text-sm">
                                  {recipient.openedAt
                                    ? new Date(recipient.openedAt).toLocaleString("no-NO", {
                                        dateStyle: "short",
                                        timeStyle: "short",
                                      })
                                    : "-"}
                                </TableCell>
                              </>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Error Messages */}
              {campaignDetails.recipients.some((r: any) => r.errorMessage) && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-destructive">Feilmeldinger</h4>
                  <div className="border border-destructive/50 rounded-lg p-4 space-y-2">
                    {campaignDetails.recipients
                      .filter((r: any) => r.errorMessage)
                      .map((recipient: any) => (
                        <div key={recipient.id} className="text-sm">
                          <span className="font-medium">{recipient.customerName}:</span>{" "}
                          <span className="text-muted-foreground">
                            {recipient.errorMessage}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
