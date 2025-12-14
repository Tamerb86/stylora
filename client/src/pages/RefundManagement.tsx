import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Undo2, Search, Filter, Plus, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export default function RefundManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed" | "failed">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<any>(null);

  // Create refund form state
  const [createOrderId, setCreateOrderId] = useState("");
  const [createAmount, setCreateAmount] = useState("");
  const [createReason, setCreateReason] = useState("");


  const { data: refunds, isLoading, refetch } = trpc.posRefunds.listRefunds.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    startDate: dateFrom || undefined,
    endDate: dateTo || undefined,
  });

  const { data: stats } = trpc.posRefunds.getRefundStats.useQuery({
    startDate: dateFrom || undefined,
    endDate: dateTo || undefined,
  });

  const createRefund = trpc.posRefunds.createRefund.useMutation({
    onSuccess: () => {
      toast.success("Refusjon opprettet");
      setShowCreateDialog(false);
      setCreateOrderId("");
      setCreateAmount("");
      setCreateReason("");

      refetch();
    },
    onError: (error: any) => {
      toast.error(`Feil: ${error.message}`);
    },
  });

  const handleCreateRefund = async () => {
    if (!createOrderId || !createAmount) {
      toast.error("Vennligst fyll ut alle påkrevde felt");
      return;
    }

    await createRefund.mutateAsync({
      orderId: parseInt(createOrderId),
      amount: parseFloat(createAmount),
      reason: createReason || "Kundeforespørsel",

    });
  };

  const filteredRefunds = refunds?.filter((r: any) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      r.orderId.toString().includes(search) ||
      r.reason.toLowerCase().includes(search)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600">Fullført</Badge>;
      case "pending":
        return <Badge className="bg-yellow-600">Venter</Badge>;
      case "failed":
        return <Badge variant="destructive">Feilet</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Refusjonsstyring
          </h1>
          <p className="text-muted-foreground mt-2">
            Administrer og spor alle refusjoner
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Totalt refundert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalRefunded.toFixed(2) || "0.00"} NOK
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Antall refusjoner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalCount || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Venter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats?.pendingCount || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Fullført
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats?.completedCount || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="search">Søk (ordre-ID eller årsak)</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Søk..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="pending">Venter</SelectItem>
                    <SelectItem value="completed">Fullført</SelectItem>
                    <SelectItem value="failed">Feilet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dateFrom">Fra dato</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="dateTo">Til dato</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ny refusjon
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Refunds Table */}
        <Card>
          <CardHeader>
            <CardTitle>Refusjoner</CardTitle>
            <CardDescription>
              {filteredRefunds?.length || 0} refusjoner funnet
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Laster...</div>
            ) : !filteredRefunds || filteredRefunds.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ingen refusjoner funnet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ordre-ID</TableHead>
                      <TableHead>Dato</TableHead>
                      <TableHead>Beløp</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Årsak</TableHead>
                      <TableHead>Behandlet av</TableHead>
                      <TableHead>Handlinger</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRefunds.map((refund: any) => (
                      <TableRow key={refund.id}>
                        <TableCell className="font-medium">#{refund.orderId}</TableCell>
                        <TableCell>
                          {format(new Date(refund.createdAt), "dd.MM.yyyy HH:mm", { locale: nb })}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {parseFloat(refund.amount).toFixed(2)} NOK
                        </TableCell>
                        <TableCell>{getStatusBadge(refund.status)}</TableCell>
                        <TableCell>{refund.reason}</TableCell>
                        <TableCell>{refund.processedBy}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRefund(refund);
                              setShowDetailsDialog(true);
                            }}
                          >
                            Detaljer
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Refund Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Opprett ny refusjon</DialogTitle>
              <DialogDescription>
                Fyll ut informasjonen for å opprette en refusjon
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="createOrderId">Ordre-ID *</Label>
                <Input
                  id="createOrderId"
                  type="number"
                  placeholder="123"
                  value={createOrderId}
                  onChange={(e) => setCreateOrderId(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="createAmount">Beløp (NOK) *</Label>
                <Input
                  id="createAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={createAmount}
                  onChange={(e) => setCreateAmount(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="createReason">Årsak</Label>
                <Select value={createReason} onValueChange={setCreateReason}>
                  <SelectTrigger id="createReason">
                    <SelectValue placeholder="Velg årsak" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kundeforespørsel">Kundeforespørsel</SelectItem>
                    <SelectItem value="Skadet produkt">Skadet produkt</SelectItem>
                    <SelectItem value="Feil vare">Feil vare</SelectItem>
                    <SelectItem value="Kanselleringspolicy">Kanselleringspolicy</SelectItem>
                    <SelectItem value="Teknisk feil">Teknisk feil</SelectItem>
                    <SelectItem value="Annet">Annet</SelectItem>
                  </SelectContent>
                </Select>
              </div>


            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Avbryt
              </Button>
              <Button onClick={handleCreateRefund} disabled={createRefund.isPending}>
                {createRefund.isPending ? "Oppretter..." : "Opprett refusjon"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Refund Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Refusjonsdetaljer</DialogTitle>
            </DialogHeader>

            {selectedRefund && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Ordre-ID</Label>
                    <div className="font-semibold">#{selectedRefund.orderId}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div>{getStatusBadge(selectedRefund.status)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Beløp</Label>
                    <div className="font-semibold text-lg">
                      {parseFloat(selectedRefund.amount).toFixed(2)} NOK
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Dato</Label>
                    <div>
                      {format(new Date(selectedRefund.createdAt), "dd.MM.yyyy HH:mm", { locale: nb })}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Årsak</Label>
                  <div>{selectedRefund.reason}</div>
                </div>



                <div>
                  <Label className="text-muted-foreground">Behandlet av</Label>
                  <div>{selectedRefund.processedBy}</div>
                </div>

                {selectedRefund.completedAt && (
                  <div>
                    <Label className="text-muted-foreground">Fullført</Label>
                    <div>
                      {format(new Date(selectedRefund.completedAt), "dd.MM.yyyy HH:mm", { locale: nb })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => setShowDetailsDialog(false)}>Lukk</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
