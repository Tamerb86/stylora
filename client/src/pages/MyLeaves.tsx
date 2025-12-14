import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { toast } from "sonner";

export default function MyLeaves() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<"annual" | "sick" | "emergency" | "unpaid">("annual");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reason, setReason] = useState("");

  const { data: leaves, refetch: refetchLeaves } = trpc.leaves.myLeaves.useQuery({});
  const { data: balance } = trpc.leaves.myBalance.useQuery();
  const createLeave = trpc.leaves.create.useMutation({
    onSuccess: () => {
      toast.success("Ferieforespørsel sendt!");
      setIsDialogOpen(false);
      refetchLeaves();
      // Reset form
      setLeaveType("annual");
      setStartDate(undefined);
      setEndDate(undefined);
      setReason("");
    },
    onError: (error) => {
      toast.error(error.message || "Kunne ikke sende forespørsel");
    },
  });

  const handleSubmit = () => {
    if (!startDate || !endDate) {
      toast.error("Velg start- og sluttdato");
      return;
    }

    createLeave.mutate({
      leaveType,
      startDate,
      endDate,
      reason: reason || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            Godkjent
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="h-4 w-4" />
            Avslått
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="h-4 w-4" />
            Venter
          </span>
        );
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case "annual":
        return "Årlig ferie";
      case "sick":
        return "Sykefravær";
      case "emergency":
        return "Nødferie";
      case "unpaid":
        return "Ubetalt permisjon";
      default:
        return type;
    }
  };

  const calculateDays = (start: Date, end: Date) => {
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return days;
  };

  return (
    <DashboardLayout>
    <div className="container py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">Mine Ferier</h1>
          <p className="text-muted-foreground mt-2">
            Administrer ferieforespørsler og se saldo
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="h-14 gap-2">
              <Plus className="h-5 w-5" />
              Ny Ferieforespørsel
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Ny Ferieforespørsel</DialogTitle>
              <DialogDescription>
                Send en forespørsel om ferie til din leder
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={leaveType} onValueChange={(v: any) => setLeaveType(v)}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Årlig ferie</SelectItem>
                    <SelectItem value="sick">Sykefravær</SelectItem>
                    <SelectItem value="emergency">Nødferie</SelectItem>
                    <SelectItem value="unpaid">Ubetalt permisjon</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Startdato</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full h-12 justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP", { locale: nb }) : "Velg dato"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Sluttdato</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full h-12 justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP", { locale: nb }) : "Velg dato"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        disabled={(date) => startDate ? date < startDate : false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {startDate && endDate && (
                <div className="text-sm text-muted-foreground">
                  Antall dager: {calculateDays(startDate, endDate)}
                </div>
              )}

              <div className="space-y-2">
                <Label>Begrunnelse (valgfritt)</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Skriv en begrunnelse for ferieforespørselen..."
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Avbryt
              </Button>
              <Button onClick={handleSubmit} disabled={!startDate || !endDate || createLeave.isPending}>
                {createLeave.isPending ? "Sender..." : "Send Forespørsel"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Leave Balance */}
      {balance && (
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Årlig Ferie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{balance.annualLeaveTotal} dager</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Brukt Ferie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{balance.annualLeaveUsed} dager</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Gjenværende Ferie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {balance.annualLeaveRemaining} dager
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Leave History */}
      <Card>
        <CardHeader>
          <CardTitle>Feriehistorikk</CardTitle>
          <CardDescription>
            Alle dine ferieforespørsler og deres status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!leaves || leaves.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Ingen ferieforespørsler ennå</p>
              <p className="text-sm mt-2">Klikk "Ny Ferieforespørsel" for å komme i gang</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaves.map((leave: any) => (
                <div
                  key={leave.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold">{getLeaveTypeLabel(leave.leaveType)}</span>
                      {getStatusBadge(leave.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(leave.startDate), "PPP", { locale: nb })} -{" "}
                      {format(new Date(leave.endDate), "PPP", { locale: nb })}
                      {" "}({calculateDays(new Date(leave.startDate), new Date(leave.endDate))} dager)
                    </div>
                    {leave.reason && (
                      <div className="text-sm mt-2">{leave.reason}</div>
                    )}
                    {leave.status === "rejected" && leave.rejectionReason && (
                      <div className="text-sm mt-2 text-red-600 dark:text-red-400">
                        Avslått: {leave.rejectionReason}
                      </div>
                    )}
                    {leave.approverName && (
                      <div className="text-xs text-muted-foreground mt-2">
                        {leave.status === "approved" ? "Godkjent" : "Behandlet"} av: {leave.approverName}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </DashboardLayout>
  );
}
