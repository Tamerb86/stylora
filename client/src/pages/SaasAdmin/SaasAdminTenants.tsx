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
import { Search, ArrowLeft, LogIn, Eye } from "lucide-react";

export default function SaasAdminTenants() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "trial" | "active" | "suspended" | "canceled">("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = trpc.saasAdmin.listTenants.useQuery({
    search: search || undefined,
    status,
    page,
    pageSize,
  });

  const impersonateMutation = trpc.saasAdmin.impersonateTenant.useMutation({
    onSuccess: (result) => {
      setLocation(result.redirectUrl);
    },
    onError: (error) => {
      alert(`Feil: ${error.message}`);
    },
  });

  const handleImpersonate = (tenantId: string) => {
    impersonateMutation.mutate({ tenantId });
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
        <Link href="/saas-admin/tenants/new">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            Opprett ny salong
          </Button>
        </Link>
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
    </div>
  );
}
