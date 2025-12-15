import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export default function SaasAdminSubscriptions() {
  const [activeTab, setActiveTab] = useState("overview");
  const [editPlanDialog, setEditPlanDialog] = useState<{
    open: boolean;
    plan: any | null;
  }>({ open: false, plan: null });
  const [newPlanDialog, setNewPlanDialog] = useState(false);

  // Form state for new/edit plan
  const [planForm, setPlanForm] = useState({
    name: "",
    displayNameNo: "",
    displayNameEn: "",
    priceMonthly: 0,
    priceYearly: 0,
    maxEmployees: 0,
    maxCustomers: 0,
    maxAppointmentsPerMonth: 0,
    features: "",
    isActive: true,
  });

  const { data: plans, isLoading: plansLoading, refetch: refetchPlans } = trpc.saasAdmin.getSubscriptionPlans.useQuery();
  const { data: tenants } = trpc.saasAdmin.listTenants.useQuery({ page: 1, pageSize: 1000 });

  // Mutations for creating and updating plans
  const createPlanMutation = trpc.saasAdmin.createSubscriptionPlan.useMutation({
    onSuccess: () => {
      toast.success("Plan opprettet!");
      setNewPlanDialog(false);
      resetPlanForm();
      refetchPlans();
    },
    onError: (error) => {
      toast.error(`Feil: ${error.message}`);
    },
  });

  const updatePlanMutation = trpc.saasAdmin.updateSubscriptionPlan.useMutation({
    onSuccess: () => {
      toast.success("Plan oppdatert!");
      setEditPlanDialog({ open: false, plan: null });
      refetchPlans();
    },
    onError: (error) => {
      toast.error(`Feil: ${error.message}`);
    },
  });

  const deletePlanMutation = trpc.saasAdmin.deleteSubscriptionPlan.useMutation({
    onSuccess: () => {
      toast.success("Plan slettet!");
      refetchPlans();
    },
    onError: (error) => {
      toast.error(`Feil: ${error.message}`);
    },
  });

  const handleCreatePlan = () => {
    createPlanMutation.mutate({
      name: planForm.name,
      displayNameNo: planForm.displayNameNo,
      displayNameEn: planForm.displayNameEn || undefined,
      priceMonthly: planForm.priceMonthly,
      priceYearly: planForm.priceYearly || undefined,
      maxEmployees: planForm.maxEmployees || undefined,
      maxCustomers: planForm.maxCustomers || undefined,
      maxAppointmentsPerMonth: planForm.maxAppointmentsPerMonth || undefined,
      features: planForm.features || undefined,
      isActive: planForm.isActive,
    });
  };

  const handleUpdatePlan = () => {
    if (!editPlanDialog.plan) return;
    updatePlanMutation.mutate({
      planId: editPlanDialog.plan.id,
      name: planForm.name,
      displayNameNo: planForm.displayNameNo,
      displayNameEn: planForm.displayNameEn || undefined,
      priceMonthly: planForm.priceMonthly,
      priceYearly: planForm.priceYearly || undefined,
      maxEmployees: planForm.maxEmployees || null,
      maxCustomers: planForm.maxCustomers || null,
      maxAppointmentsPerMonth: planForm.maxAppointmentsPerMonth || null,
      features: planForm.features || null,
      isActive: planForm.isActive,
    });
  };

  // Calculate subscription statistics
  const stats = {
    totalActive: tenants?.items.filter(t => t.status === "active").length || 0,
    totalTrial: tenants?.items.filter(t => t.status === "trial").length || 0,
    totalSuspended: tenants?.items.filter(t => t.status === "suspended").length || 0,
    totalCanceled: tenants?.items.filter(t => t.status === "canceled").length || 0,
    monthlyRevenue: tenants?.items
      .filter(t => t.status === "active" && t.planPriceMonthly)
      .reduce((sum, t) => sum + (Number(t.planPriceMonthly) || 0), 0) || 0,
  };

  // Group tenants by plan
  const tenantsByPlan = plans?.reduce((acc: any, plan: any) => {
    acc[plan.id] = tenants?.items.filter(t => t.planName === plan.displayNameNo) || [];
    return acc;
  }, {}) || {};

  const resetPlanForm = () => {
    setPlanForm({
      name: "",
      displayNameNo: "",
      displayNameEn: "",
      priceMonthly: 0,
      priceYearly: 0,
      maxEmployees: 0,
      maxCustomers: 0,
      maxAppointmentsPerMonth: 0,
      features: "",
      isActive: true,
    });
  };

  const openEditPlan = (plan: any) => {
    setPlanForm({
      name: plan.name,
      displayNameNo: plan.displayNameNo,
      displayNameEn: plan.displayNameEn || "",
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly || plan.priceMonthly * 10,
      maxEmployees: plan.maxEmployees || 0,
      maxCustomers: plan.maxCustomers || 0,
      maxAppointmentsPerMonth: plan.maxAppointmentsPerMonth || 0,
      features: plan.features || "",
      isActive: plan.isActive !== false,
    });
    setEditPlanDialog({ open: true, plan });
  };

  const openNewPlan = () => {
    resetPlanForm();
    setNewPlanDialog(true);
  };

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/saas-admin">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Abonnementer
            </h1>
            <p className="text-muted-foreground mt-1">
              Administrer planer og abonnementer
            </p>
          </div>
        </div>
        <Button 
          onClick={openNewPlan}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ny plan
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="p-6 border-0 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aktive</p>
              <p className="text-2xl font-bold">{stats.totalActive}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-0 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Prøveperiode</p>
              <p className="text-2xl font-bold">{stats.totalTrial}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-0 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Suspendert</p>
              <p className="text-2xl font-bold">{stats.totalSuspended}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-0 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-gray-500 to-slate-500">
              <XCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Kansellert</p>
              <p className="text-2xl font-bold">{stats.totalCanceled}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-0 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">MRR</p>
              <p className="text-2xl font-bold">{stats.monthlyRevenue.toLocaleString("no-NO")} kr</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="overview">Oversikt</TabsTrigger>
          <TabsTrigger value="plans">Planer</TabsTrigger>
          <TabsTrigger value="active">Aktive abonnenter</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans?.map((plan: any) => {
              const subscriberCount = tenantsByPlan[plan.id]?.length || 0;
              const activeCount = tenantsByPlan[plan.id]?.filter((t: any) => t.status === "active").length || 0;
              
              return (
                <Card key={plan.id} className="p-6 border-0 shadow-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{plan.displayNameNo}</h3>
                      <p className="text-2xl font-bold text-primary mt-1">
                        {plan.priceMonthly} kr<span className="text-sm font-normal text-muted-foreground">/mnd</span>
                      </p>
                    </div>
                    <Badge variant={plan.isActive !== false ? "default" : "secondary"}>
                      {plan.isActive !== false ? "Aktiv" : "Inaktiv"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <div className="flex justify-between">
                      <span>Maks ansatte:</span>
                      <span className="font-medium text-foreground">{plan.maxEmployees || "Ubegrenset"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Maks kunder:</span>
                      <span className="font-medium text-foreground">{plan.maxCustomers || "Ubegrenset"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Timer/mnd:</span>
                      <span className="font-medium text-foreground">{plan.maxAppointmentsPerMonth || "Ubegrenset"}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          <strong>{activeCount}</strong> aktive av {subscriberCount} totalt
                        </span>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => openEditPlan(plan)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans">
          <Card className="border-0 shadow-lg">
            <div className="p-6">
              {plansLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead>Pris/mnd</TableHead>
                      <TableHead>Pris/år</TableHead>
                      <TableHead>Maks ansatte</TableHead>
                      <TableHead>Maks kunder</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Abonnenter</TableHead>
                      <TableHead className="text-right">Handlinger</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans?.map((plan: any) => (
                      <TableRow key={plan.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{plan.displayNameNo}</div>
                            <div className="text-xs text-muted-foreground">{plan.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>{plan.priceMonthly} kr</TableCell>
                        <TableCell>{plan.priceYearly || plan.priceMonthly * 10} kr</TableCell>
                        <TableCell>{plan.maxEmployees || "∞"}</TableCell>
                        <TableCell>{plan.maxCustomers || "∞"}</TableCell>
                        <TableCell>
                          <Badge variant={plan.isActive !== false ? "default" : "secondary"}>
                            {plan.isActive !== false ? "Aktiv" : "Inaktiv"}
                          </Badge>
                        </TableCell>
                        <TableCell>{tenantsByPlan[plan.id]?.length || 0}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => openEditPlan(plan)}>
                            <Edit className="h-4 w-4 mr-1" />
                            Rediger
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Active Subscribers Tab */}
        <TabsContent value="active">
          <Card className="border-0 shadow-lg">
            <div className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Salong</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Startet</TableHead>
                    <TableHead>Neste faktura</TableHead>
                    <TableHead className="text-right">Månedlig</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants?.items
                    .filter(t => t.status === "active" || t.status === "trial")
                    .map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <Link href={`/saas-admin/tenants/${tenant.id}`} className="hover:underline">
                            <div className="font-medium">{tenant.name}</div>
                            <div className="text-xs text-muted-foreground">{tenant.subdomain}</div>
                          </Link>
                        </TableCell>
                        <TableCell>{tenant.planName || "Ingen plan"}</TableCell>
                        <TableCell>
                          <Badge variant={tenant.status === "active" ? "default" : "secondary"}>
                            {tenant.status === "active" ? "Aktiv" : "Prøve"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(tenant.createdAt).toLocaleDateString("no-NO")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {tenant.status === "trial" && tenant.trialEndsAt
                            ? new Date(tenant.trialEndsAt).toLocaleDateString("no-NO")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {tenant.planPriceMonthly ? `${tenant.planPriceMonthly} kr` : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Plan Dialog */}
      <Dialog open={editPlanDialog.open} onOpenChange={(open) => setEditPlanDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Rediger plan</DialogTitle>
            <DialogDescription>
              Oppdater planens detaljer og begrensninger
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Navn (intern)</Label>
                <Input
                  value={planForm.name}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="basic"
                />
              </div>
              <div className="space-y-2">
                <Label>Visningsnavn (NO)</Label>
                <Input
                  value={planForm.displayNameNo}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, displayNameNo: e.target.value }))}
                  placeholder="Basis"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pris/mnd (kr)</Label>
                <Input
                  type="number"
                  value={planForm.priceMonthly}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, priceMonthly: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Pris/år (kr)</Label>
                <Input
                  type="number"
                  value={planForm.priceYearly}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, priceYearly: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Maks ansatte</Label>
                <Input
                  type="number"
                  value={planForm.maxEmployees}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, maxEmployees: parseInt(e.target.value) || 0 }))}
                  placeholder="0 = ubegrenset"
                />
              </div>
              <div className="space-y-2">
                <Label>Maks kunder</Label>
                <Input
                  type="number"
                  value={planForm.maxCustomers}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, maxCustomers: parseInt(e.target.value) || 0 }))}
                  placeholder="0 = ubegrenset"
                />
              </div>
              <div className="space-y-2">
                <Label>Timer/mnd</Label>
                <Input
                  type="number"
                  value={planForm.maxAppointmentsPerMonth}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, maxAppointmentsPerMonth: parseInt(e.target.value) || 0 }))}
                  placeholder="0 = ubegrenset"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Funksjoner (kommaseparert)</Label>
              <Input
                value={planForm.features}
                onChange={(e) => setPlanForm(prev => ({ ...prev, features: e.target.value }))}
                placeholder="Online booking, SMS påminnelser, Rapporter"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPlanDialog({ open: false, plan: null })}>
              Avbryt
            </Button>
            <Button 
              className="bg-gradient-to-r from-blue-600 to-purple-600"
              onClick={handleUpdatePlan}
              disabled={updatePlanMutation.isPending}
            >
              {updatePlanMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Lagrer...</>
              ) : (
                "Lagre endringer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Plan Dialog */}
      <Dialog open={newPlanDialog} onOpenChange={setNewPlanDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Opprett ny plan</DialogTitle>
            <DialogDescription>
              Legg til en ny abonnementsplan
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Navn (intern)</Label>
                <Input
                  value={planForm.name}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="premium"
                />
              </div>
              <div className="space-y-2">
                <Label>Visningsnavn (NO)</Label>
                <Input
                  value={planForm.displayNameNo}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, displayNameNo: e.target.value }))}
                  placeholder="Premium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pris/mnd (kr)</Label>
                <Input
                  type="number"
                  value={planForm.priceMonthly}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, priceMonthly: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Pris/år (kr)</Label>
                <Input
                  type="number"
                  value={planForm.priceYearly}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, priceYearly: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Maks ansatte</Label>
                <Input
                  type="number"
                  value={planForm.maxEmployees}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, maxEmployees: parseInt(e.target.value) || 0 }))}
                  placeholder="0 = ubegrenset"
                />
              </div>
              <div className="space-y-2">
                <Label>Maks kunder</Label>
                <Input
                  type="number"
                  value={planForm.maxCustomers}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, maxCustomers: parseInt(e.target.value) || 0 }))}
                  placeholder="0 = ubegrenset"
                />
              </div>
              <div className="space-y-2">
                <Label>Timer/mnd</Label>
                <Input
                  type="number"
                  value={planForm.maxAppointmentsPerMonth}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, maxAppointmentsPerMonth: parseInt(e.target.value) || 0 }))}
                  placeholder="0 = ubegrenset"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Funksjoner (kommaseparert)</Label>
              <Input
                value={planForm.features}
                onChange={(e) => setPlanForm(prev => ({ ...prev, features: e.target.value }))}
                placeholder="Online booking, SMS påminnelser, Rapporter"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNewPlanDialog(false)}>
              Avbryt
            </Button>
            <Button 
              className="bg-gradient-to-r from-blue-600 to-purple-600"
              onClick={handleCreatePlan}
              disabled={createPlanMutation.isPending || !planForm.name || !planForm.displayNameNo}
            >
              {createPlanMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Oppretter...</>
              ) : (
                "Opprett plan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
