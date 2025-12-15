import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Search, ArrowLeft, LogIn, Eye, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SaasAdminTenants() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "trial" | "active" | "suspended" | "canceled">("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Activation dialog state
  const [activationDialog, setActivationDialog] = useState<{
    open: boolean;
    tenantId: string;
    tenantName: string;
    action: "activate" | "suspend";
  }>({ open: false, tenantId: "", tenantName: "", action: "activate" });

  const { data, isLoading, refetch } = trpc.saasAdmin.listTenants.useQuery({
    search: search || undefined,
    status,
    page,
    pageSize,
  });

  const { data: plans } = trpc.saasAdmin.getSubscriptionPlans.useQuery();

  const impersonateMutation = trpc.saasAdmin.impersonateTenant.useMutation({
    onSuccess: (result) => {
      setLocation(result.redirectUrl);
    },
    onError: (error) => {
      toast.error(`Feil: ${error.message}`);
    },
  });

  const updateMutation = trpc.saasAdmin.updateTenantPlanAndStatus.useMutation({
    onSuccess: () => {
      toast.success(activationDialog.action === "activate" ? "Salong aktivert!" : "Salong suspendert!");
      setActivationDialog({ open: false, tenantId: "", tenantName: "", action: "activate" });
      refetch();
    },
    onError: (error) => {
      toast.error(`Feil: ${error.message}`);
    },
  });

  const handleImpersonate = (tenantId: string) => {
    impersonateMutation.mutate({ tenantId });
  };

  const handleQuickActivate = (tenantId: string, tenantName: string) => {
    setActivationDialog({ open: true, tenantId, tenantName, action: "activate" });
  };

  const handleQuickSuspend = (tenantId: string, tenantName: string) => {
    setActivationDialog({ open: true, tenantId, tenantName, action: "suspend" });
  };

  const confirmActivation = () => {
    // Get the first available plan (Basic) for activation
    const basicPlan = plans?.find((p: any) => p.name === "basic") || plans?.[0];
    
    updateMutation.mutate({
      tenantId: activationDialog.tenantId,
      status: activationDialog.action === "activate" ? "active" : "suspended",
      planId: activationDialog.action === "activate" ? basicPlan?.id : null,
    });
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
              Salonger
            </h1>
            <p className="text-muted-foreground mt-1">
              Administrer alle salonger i plattformen
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/saas-admin/subscriptions">
            <Button variant="outline">
              Abonnementer
            </Button>
          </Link>
          <Link href="/saas-admin/tenants/new">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Opprett ny salong
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6 border-0 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk etter navn, subdomene eller org.nr..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select
            value={status}
            onValueChange={(value: typeof status) => {
              setStatus(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Velg status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="trial">Prøve</SelectItem>
              <SelectItem value="active">Aktiv</SelectItem>
              <SelectItem value="suspended">Suspendert</SelectItem>
              <SelectItem value="canceled">Kansellert</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-lg">
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Laster...</div>
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">Ingen salonger funnet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Prøv å endre søkekriteriene
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Navn</TableHead>
                    <TableHead>Subdomene</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Opprettet</TableHead>
                    <TableHead className="text-right">Siste 30 dager</TableHead>
                    <TableHead className="text-right">Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">{tenant.name}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {tenant.subdomain}
                        </code>
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {tenant.planName || "Ingen plan"}
                        </span>
                        {tenant.planPriceMonthly && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({tenant.planPriceMonthly} kr/mnd)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(tenant.createdAt).toLocaleDateString("no-NO")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="font-medium">
                              {tenant.appointmentCountLast30Days}
                            </span>{" "}
                            timer
                          </div>
                          <div>
                            <span className="font-medium">
                              {tenant.orderCountLast30Days}
                            </span>{" "}
                            ordre
                          </div>
                          <div className="text-muted-foreground">
                            {tenant.totalOrderAmountLast30Days.toLocaleString(
                              "no-NO"
                            )}{" "}
                            kr
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Quick Activate/Suspend Button */}
                          {tenant.status === "trial" || tenant.status === "suspended" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickActivate(tenant.id, tenant.name)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aktiver
                            </Button>
                          ) : tenant.status === "active" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickSuspend(tenant.id, tenant.name)}
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Suspender
                            </Button>
                          ) : null}
                          
                          <Link href={`/saas-admin/tenants/${tenant.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Detaljer
                            </Button>
                          </Link>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleImpersonate(tenant.id)}
                            disabled={impersonateMutation.isPending}
                            className="bg-gradient-to-r from-blue-600 to-purple-600"
                          >
                            <LogIn className="h-4 w-4 mr-1" />
                            Logg inn
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <div className="text-sm text-muted-foreground">
                    Viser {(page - 1) * pageSize + 1} til{" "}
                    {Math.min(page * pageSize, data.totalItems)} av{" "}
                    {data.totalItems} salonger
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Forrige
                    </Button>
                    <div className="text-sm">
                      Side {page} av {data.totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                      disabled={page === data.totalPages}
                    >
                      Neste
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Activation Confirmation Dialog */}
      <Dialog open={activationDialog.open} onOpenChange={(open) => setActivationDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activationDialog.action === "activate" ? "Aktiver salong" : "Suspender salong"}
            </DialogTitle>
            <DialogDescription>
              {activationDialog.action === "activate" ? (
                <>
                  Er du sikker på at du vil aktivere <strong>{activationDialog.tenantName}</strong>?
                  <br /><br />
                  Salongen vil få tilgang til alle funksjoner og vil bli satt til "Basic" plan.
                </>
              ) : (
                <>
                  Er du sikker på at du vil suspendere <strong>{activationDialog.tenantName}</strong>?
                  <br /><br />
                  Salongen vil miste tilgang til systemet inntil den aktiveres igjen.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActivationDialog(prev => ({ ...prev, open: false }))}
            >
              Avbryt
            </Button>
            <Button
              onClick={confirmActivation}
              disabled={updateMutation.isPending}
              className={activationDialog.action === "activate" 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-orange-600 hover:bg-orange-700"
              }
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Behandler...
                </>
              ) : activationDialog.action === "activate" ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aktiver
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Suspender
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
