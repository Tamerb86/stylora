/**
 * Monitoring Dashboard
 *
 * Real-time monitoring of system health and integration performance
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Mail,
  MessageSquare,
  RefreshCw,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

export default function Monitoring() {
  const [timeRange, setTimeRange] = useState<number>(24);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Queries
  const {
    data: systemHealth,
    isLoading: healthLoading,
    refetch: refetchHealth,
  } = trpc.monitoring.getSystemHealth.useQuery(undefined, {
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds
  });

  const { data: unimicroMetrics, refetch: refetchUnimicro } =
    trpc.monitoring.getUnimicroMetrics.useQuery({ hoursAgo: timeRange });

  const { data: unimicroHealth } =
    trpc.monitoring.checkUnimicroHealth.useQuery();

  const { data: emailMetrics, refetch: refetchEmail } =
    trpc.monitoring.getEmailMetrics.useQuery({ hoursAgo: timeRange });

  const { data: smsMetrics, refetch: refetchSMS } =
    trpc.monitoring.getSMSMetrics.useQuery({ hoursAgo: timeRange });

  const { data: unimicroFailures } =
    trpc.monitoring.getUnimicroFailures.useQuery({ limit: 10 });

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refetchHealth();
        refetchUnimicro();
        refetchEmail();
        refetchSMS();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refetchHealth, refetchUnimicro, refetchEmail, refetchSMS]);

  const handleRefresh = () => {
    toast.info("Oppdaterer overvåkingsdata...");
    refetchHealth();
    refetchUnimicro();
    refetchEmail();
    refetchSMS();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600 bg-green-50";
      case "warning":
        return "text-yellow-600 bg-yellow-50";
      case "critical":
      case "degraded":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "critical":
      case "degraded":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  if (healthLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Laster overvåkingsdata...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Systemovervåking
          </h1>
          <p className="text-muted-foreground mt-1">
            Sanntidsovervåking av systemhelse og integrasjoner
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Zap
              className={`h-4 w-4 mr-2 ${autoRefresh ? "text-green-600" : ""}`}
            />
            {autoRefresh ? "Auto-oppdatering På" : "Auto-oppdatering Av"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Oppdater
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Systemhelse</CardTitle>
                <CardDescription>Overordnet systemstatus</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                {getStatusIcon(systemHealth.status)}
                <div className="text-right">
                  <div className="text-3xl font-bold">
                    {systemHealth.healthScore}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Helsepoeng
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Unimicro Status */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Unimicro</span>
                    <Badge
                      className={getStatusColor(
                        systemHealth.components.unimicro.status
                      )}
                    >
                      {systemHealth.components.unimicro.status}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold">
                    {(
                      systemHealth.components.unimicro.metrics?.successRate ?? 0
                    ).toFixed(1)}
                    %
                  </div>
                  <p className="text-xs text-muted-foreground">Suksessrate</p>
                </CardContent>
              </Card>

              {/* Email Status */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      E-post
                    </span>
                    <Badge
                      className={getStatusColor(
                        systemHealth.components.email.status
                      )}
                    >
                      {systemHealth.components.email.status}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold">
                    {(
                      systemHealth.components.email.metrics?.successRate ?? 0
                    ).toFixed(1)}
                    %
                  </div>
                  <p className="text-xs text-muted-foreground">Leveringsrate</p>
                </CardContent>
              </Card>

              {/* SMS Status */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      SMS
                    </span>
                    <Badge
                      className={getStatusColor(
                        systemHealth.components.sms.status
                      )}
                    >
                      {systemHealth.components.sms.status}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold">
                    {(
                      systemHealth.components.sms.metrics?.successRate ?? 0
                    ).toFixed(1)}
                    %
                  </div>
                  <p className="text-xs text-muted-foreground">Leveringsrate</p>
                </CardContent>
              </Card>

              {/* Endpoints Status */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      API
                    </span>
                    <Badge
                      className={getStatusColor(
                        systemHealth.components.endpoints.status
                      )}
                    >
                      {systemHealth.components.endpoints.status}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold">
                    {(
                      systemHealth.components.endpoints.metrics?.errorRate ?? 0
                    ).toFixed(1)}
                    %
                  </div>
                  <p className="text-xs text-muted-foreground">Feilrate</p>
                </CardContent>
              </Card>
            </div>

            {/* Alerts */}
            {unimicroHealth && unimicroHealth.alerts.length > 0 && (
              <div className="mt-6 space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  Aktive Varsler
                </h3>
                {unimicroHealth.alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      alert.severity === "critical"
                        ? "bg-red-50 border-red-200"
                        : alert.severity === "error"
                          ? "bg-orange-50 border-orange-200"
                          : "bg-yellow-50 border-yellow-200"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <Badge
                        variant="outline"
                        className={
                          alert.severity === "critical"
                            ? "border-red-600 text-red-600"
                            : alert.severity === "error"
                              ? "border-orange-600 text-orange-600"
                              : "border-yellow-600 text-yellow-600"
                        }
                      >
                        {alert.severity}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.timestamp).toLocaleString("nb-NO")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detailed Metrics Tabs */}
      <Tabs defaultValue="unimicro" className="space-y-4">
        <TabsList>
          <TabsTrigger value="unimicro">Unimicro Sync</TabsTrigger>
          <TabsTrigger value="email">E-post</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
        </TabsList>

        {/* Unimicro Tab */}
        <TabsContent value="unimicro" className="space-y-4">
          {unimicroMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {unimicroMetrics.totalSyncs}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Totalt synkroniseringer
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">
                    {unimicroMetrics.successfulSyncs}
                  </div>
                  <p className="text-xs text-muted-foreground">Vellykkede</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">
                    {unimicroMetrics.failedSyncs}
                  </div>
                  <p className="text-xs text-muted-foreground">Feilet</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    {(unimicroMetrics?.averageDuration ?? 0).toFixed(1)}s
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Gjennomsnittlig varighet
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Failures */}
          {unimicroFailures && unimicroFailures.failures.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Siste Feil</CardTitle>
                <CardDescription>
                  De 10 siste synkroniseringsfeilene
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {unimicroFailures.failures.map(failure => (
                    <div
                      key={failure.id}
                      className="p-3 rounded-lg border bg-red-50 border-red-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-900">
                            {failure.syncType || "Ukjent type"}
                          </p>
                          <p className="text-sm text-red-700 mt-1">
                            {failure.errorMessage}
                          </p>
                          <p className="text-xs text-red-600 mt-2">
                            {new Date(failure.startedAt).toLocaleString(
                              "nb-NO"
                            )}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-red-600 text-red-600"
                        >
                          Feilet
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email" className="space-y-4">
          {emailMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {emailMetrics.totalSent}
                  </div>
                  <p className="text-xs text-muted-foreground">Totalt sendt</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">
                    {emailMetrics.successful}
                  </div>
                  <p className="text-xs text-muted-foreground">Vellykkede</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">
                    {emailMetrics.failed}
                  </div>
                  <p className="text-xs text-muted-foreground">Feilet</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-yellow-600">
                    {emailMetrics.pending}
                  </div>
                  <p className="text-xs text-muted-foreground">Venter</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {(emailMetrics?.successRate ?? 0).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Suksessrate</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* SMS Tab */}
        <TabsContent value="sms" className="space-y-4">
          {smsMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {smsMetrics.totalSent}
                  </div>
                  <p className="text-xs text-muted-foreground">Totalt sendt</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">
                    {smsMetrics.successful}
                  </div>
                  <p className="text-xs text-muted-foreground">Vellykkede</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">
                    {smsMetrics.failed}
                  </div>
                  <p className="text-xs text-muted-foreground">Feilet</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-yellow-600">
                    {smsMetrics.pending}
                  </div>
                  <p className="text-xs text-muted-foreground">Venter</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {(smsMetrics?.successRate ?? 0).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Suksessrate</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
