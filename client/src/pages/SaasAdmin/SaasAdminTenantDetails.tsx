import { useState, useEffect } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, LogIn, Save, Users, Calendar, ShoppingCart, DollarSign } from "lucide-react";

export default function SaasAdminTenantDetails() {
  const [match, params] = useRoute("/saas-admin/tenants/:tenantId");
  const [, setLocation] = useLocation();
  const tenantId = params?.tenantId as string;
  
  // Validate tenantId
  const isValidTenantId = tenantId && tenantId !== ":tenantId" && !tenantId.includes(":");

  const [selectedStatus, setSelectedStatus] = useState<"trial" | "active" | "suspended" | "canceled">("active");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  const { data: details, isLoading, refetch } = trpc.saasAdmin.getTenantDetails.useQuery(
    { tenantId },
    { enabled: !!tenantId }
  );

  const { data: plans } = trpc.saasAdmin.getSubscriptionPlans.useQuery();

  const impersonateMutation = trpc.saasAdmin.impersonateTenant.useMutation({
    onSuccess: (result) => {
      setLocation(result.redirectUrl);
    },
    onError: (error) => {
      alert(`Feil: ${error.message}`);
    },
  });

  const updateMutation = trpc.saasAdmin.updateTenantPlanAndStatus.useMutation({
    onSuccess: () => {
      alert("Oppdatert!");
      refetch();
    },
    onError: (error) => {
      alert(`Feil: ${error.message}`);
    },
  });

  // Initialize form values when data loads
  useEffect(() => {
    if (details) {
      if (details.tenant.status) {
        setSelectedStatus(details.tenant.status);
      }
      setSelectedPlanId(details.subscription?.planId ?? null);
    }
  }, [details]);

  const handleSave = () => {
    updateMutation.mutate({
      tenantId,
      status: selectedStatus,
      planId: selectedPlanId,
    });
  };

  // Show error if tenantId is invalid
  if (!isValidTenantId) {
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="text-red-600 text-lg font-semibold">Ugyldig salong-ID</div>
          <div className="text-muted-foreground">URL-en er ikke gyldig. Vennligst gå tilbake til salonglisten.</div>
          <Button onClick={() => setLocation("/saas-admin/tenants")}>Tilbake til salonger</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Laster...</div>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="text-muted-foreground text-lg">Salong ikke funnet</div>
          <Button onClick={() => setLocation("/saas-admin/tenants")}>Tilbake til salonger</Button>
        </div>
      </div>
    );
  }

  const { tenant, subscription, usage } = details;

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/saas-admin/tenants">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{tenant.name}</h1>
            <p className="text-muted-foreground mt-1">
              <code className="text-sm bg-muted px-2 py-1 rounded">
                {tenant.subdomain}.barbertime.app
              </code>
            </p>
          </div>
        </div>
        <Button
          onClick={() => impersonateMutation.mutate({ tenantId })}
          disabled={impersonateMutation.isPending}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600"
        >
          <LogIn className="h-4 w-4 mr-2" />
          Logg inn som denne salongen
        </Button>
      </div>

      {/* Basic Info */}
      <Card className="p-6 border-0 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Grunnleggende informasjon</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Navn</label>
            <p className="text-lg font-medium mt-1">{tenant.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Subdomene</label>
            <p className="text-lg font-medium mt-1">{tenant.subdomain}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Org.nummer</label>
            <p className="text-lg font-medium mt-1">{tenant.orgNumber || "Ikke angitt"}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Opprettet</label>
            <p className="text-lg font-medium mt-1">
              {new Date(tenant.createdAt).toLocaleDateString("no-NO")}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Status</label>
            <div className="mt-1">
              <Badge
                variant={
                  tenant.status === "active"
                    ? "default"
                    : tenant.status === "trial"
                    ? "secondary"
                    : "destructive"
                }
              >
                {tenant.status === "active"
                  ? "Aktiv"
                  : tenant.status === "trial"
                  ? "Prøve"
                  : tenant.status === "suspended"
                  ? "Suspendert"
                  : "Kansellert"}
              </Badge>
            </div>
          </div>
          {tenant.trialEndsAt && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Prøveperiode slutter
              </label>
              <p className="text-lg font-medium mt-1">
                {new Date(tenant.trialEndsAt).toLocaleDateString("no-NO")}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Subscription Management */}
      <Card className="p-6 border-0 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Abonnement</h2>
        
        {subscription && (
          <div className="grid gap-4 md:grid-cols-2 mb-6 p-4 bg-muted/50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nåværende plan</label>
              <p className="text-lg font-medium mt-1">{subscription.planName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Pris</label>
              <p className="text-lg font-medium mt-1">{subscription.priceMonthly} kr/mnd</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Abonnementsstatus</label>
              <p className="text-lg font-medium mt-1 capitalize">{subscription.status}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Periode</label>
              <p className="text-lg font-medium mt-1">
                {new Date(subscription.currentPeriodStart).toLocaleDateString("no-NO")} -{" "}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString("no-NO")}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Endre status</label>
            <Select
              value={selectedStatus}
              onValueChange={(value: typeof selectedStatus) => setSelectedStatus(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trial">Prøve</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="suspended">Suspendert</SelectItem>
                <SelectItem value="canceled">Kansellert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Endre plan</label>
            <Select
              value={selectedPlanId?.toString() || "none"}
              onValueChange={(value) => setSelectedPlanId(value === "none" ? null : parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ingen plan</SelectItem>
                {plans?.map((plan: any) => (
                  <SelectItem key={plan.id} value={plan.id.toString()}>
                    {plan.displayNameNo} - {plan.priceMonthly} kr/mnd
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <Save className="h-4 w-4 mr-2" />
            Lagre endringer
          </Button>
        </div>
      </Card>

      {/* Usage Stats */}
      <Card className="p-6 border-0 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Bruksstatistikk</h2>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Kunder</p>
              <p className="text-2xl font-bold">{usage.totalCustomers}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ansatte</p>
              <p className="text-2xl font-bold">{usage.totalEmployees}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Timer (totalt)</p>
              <p className="text-2xl font-bold">{usage.totalAppointments}</p>
              <p className="text-xs text-muted-foreground">
                {usage.totalCompletedAppointments} fullført
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ordre (totalt)</p>
              <p className="text-2xl font-bold">{usage.totalOrders}</p>
              <p className="text-xs text-muted-foreground">
                {usage.totalOrderAmount.toLocaleString("no-NO")} kr
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold mb-4">Siste 30 dager</h3>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Timer</p>
                <p className="text-2xl font-bold">{usage.last30DaysAppointments}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ordre</p>
                <p className="text-2xl font-bold">{usage.last30DaysOrders}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-teal-500">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Omsetning</p>
                <p className="text-2xl font-bold">
                  {usage.last30DaysOrderAmount.toLocaleString("no-NO")} kr
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
