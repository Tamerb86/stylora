import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bell, CheckCircle, XCircle, Clock, Send } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function Notifications() {
  const [filter, setFilter] = useState<"all" | "pending" | "sent" | "delivered" | "failed">("all");
  
  const { data: notifications, isLoading, refetch } = trpc.notifications.list.useQuery({
    limit: 50,
    status: filter === "all" ? undefined : filter,
  });

  const triggerReminders = trpc.notifications.triggerReminders.useMutation({
    onSuccess: (result) => {
      toast.success(`Påminnelser sendt: ${result.sent} vellykket, ${result.failed} feilet`);
      refetch();
    },
    onError: (error) => {
      toast.error(`Feil ved sending av påminnelser: ${error.message}`);
    },
  });

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">Ukjent</Badge>;
    switch (status) {
      case "sent":
      case "delivered":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Sendt</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Feilet</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Venter</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString("no-NO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bell className="w-8 h-8" />
              Varsler
            </h1>
            <p className="text-muted-foreground mt-1">
              SMS-påminnelser og varsler sendt til kunder
            </p>
          </div>
          <Button
            onClick={() => triggerReminders.mutate()}
            disabled={triggerReminders.isPending}
          >
            <Send className="w-4 h-4 mr-2" />
            {triggerReminders.isPending ? "Sender..." : "Send påminnelser nå"}
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Automatiske SMS-påminnelser</CardTitle>
            <CardDescription>
              Systemet sender automatisk SMS-påminnelser til kunder 24 timer før deres avtale.
              Påminnelsene sendes hver time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                Alle
              </Button>
              <Button
                variant={filter === "sent" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("sent")}
              >
                Sendt
              </Button>
              <Button
                variant={filter === "failed" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("failed")}
              >
                Feilet
              </Button>
              <Button
                variant={filter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("pending")}
              >
                Venter
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Laster varsler...
            </CardContent>
          </Card>
        ) : !notifications || notifications.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Ingen varsler funnet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card key={notification.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(notification.status)}
                        <span className="text-sm text-muted-foreground">
                          {notification.notificationType.toUpperCase()}
                        </span>
                        {notification.template != null && (
                          <Badge variant="outline" className="text-xs">
                            {notification.template}
                          </Badge>
                        )}
                      </div>
                      <div className="mb-2">
                        {notification.subject && <p className="font-medium">{notification.subject}</p>}
                        <p className="text-sm text-muted-foreground">
                          Til: {notification.recipientContact}
                        </p>
                      </div>
                      <p className="text-sm bg-muted p-3 rounded-md">
                        {notification.content}
                      </p>
                      {notification.errorMessage && (
                        <p className="text-sm text-destructive mt-2">
                          Feil: {notification.errorMessage}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm text-muted-foreground ml-4">
                      <p>Planlagt: {formatDate(notification.scheduledAt)}</p>
                      {notification.sentAt && (
                        <p>Sendt: {formatDate(notification.sentAt)}</p>
                      )}
                      {notification.attempts != null && notification.attempts > 0 && (
                        <p className="mt-1">
                          Forsøk: {notification.attempts}/{notification.maxAttempts}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
