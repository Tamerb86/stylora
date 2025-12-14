import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { toast } from "sonner";

export default function LeaveApprovals() {
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: pendingLeaves, refetch } = trpc.leaves.pending.useQuery();
  const approveLeave = trpc.leaves.approve.useMutation({
    onSuccess: (data) => {
      toast.success(data.approved ? "Ferie godkjent!" : "Ferie avslått");
      setSelectedLeave(null);
      setRejectionReason("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Kunne ikke behandle forespørsel");
    },
  });

  const handleApprove = (approved: boolean) => {
    if (!selectedLeave) return;

    if (!approved && !rejectionReason.trim()) {
      toast.error("Vennligst oppgi en begrunnelse for avslag");
      return;
    }

    approveLeave.mutate({
      leaveId: selectedLeave.id,
      approved,
      rejectionReason: approved ? undefined : rejectionReason,
    });
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
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Feriegodkjenninger</h1>
        <p className="text-muted-foreground mt-2">
          Behandle ventende ferieforespørsler fra ansatte
        </p>
      </div>

      {/* Pending Requests Count */}
      {pendingLeaves && pendingLeaves.length > 0 && (
        <Card className="mb-6 border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-900/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              <div>
                <div className="font-semibold text-yellow-900 dark:text-yellow-100">
                  {pendingLeaves.length} ventende forespørsel{pendingLeaves.length !== 1 ? "er" : ""}
                </div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  Venter på din godkjenning
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Leaves List */}
      <Card>
        <CardHeader>
          <CardTitle>Ventende Forespørsler</CardTitle>
          <CardDescription>
            Godkjenn eller avslå ferieforespørsler
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!pendingLeaves || pendingLeaves.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Ingen ventende forespørsler</p>
              <p className="text-sm mt-2">Alle ferieforespørsler er behandlet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingLeaves.map((leave: any) => (
                <div
                  key={leave.id}
                  className="flex items-center justify-between p-6 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-lg">{leave.employeeName}</span>
                      </div>
                      <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {getLeaveTypeLabel(leave.leaveType)}
                      </span>
                    </div>

                    <div className="text-sm text-muted-foreground mb-2">
                      {format(new Date(leave.startDate), "PPP", { locale: nb })} -{" "}
                      {format(new Date(leave.endDate), "PPP", { locale: nb })}
                      {" "}({calculateDays(new Date(leave.startDate), new Date(leave.endDate))} dager)
                    </div>

                    {leave.reason && (
                      <div className="text-sm mt-3 p-3 bg-muted/50 rounded">
                        <span className="font-medium">Begrunnelse:</span> {leave.reason}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground mt-3">
                      Sendt: {format(new Date(leave.createdAt), "PPP 'kl.' HH:mm", { locale: nb })}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-6">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-14 gap-2 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-900/20"
                      onClick={() => {
                        setSelectedLeave(leave);
                        setIsApproving(false);
                      }}
                    >
                      <XCircle className="h-5 w-5" />
                      Avslå
                    </Button>
                    <Button
                      size="lg"
                      className="h-14 gap-2 bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        setSelectedLeave(leave);
                        setIsApproving(true);
                        // Auto-approve without dialog for approval
                        approveLeave.mutate({
                          leaveId: leave.id,
                          approved: true,
                        });
                      }}
                      disabled={approveLeave.isPending}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      Godkjenn
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={selectedLeave && !isApproving} onOpenChange={(open) => {
        if (!open) {
          setSelectedLeave(null);
          setRejectionReason("");
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Avslå Ferieforespørsel</DialogTitle>
            <DialogDescription>
              Oppgi en begrunnelse for avslaget
            </DialogDescription>
          </DialogHeader>

          {selectedLeave && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="font-semibold mb-2">{selectedLeave.employeeName}</div>
                <div className="text-sm text-muted-foreground">
                  {getLeaveTypeLabel(selectedLeave.leaveType)} •{" "}
                  {format(new Date(selectedLeave.startDate), "PPP", { locale: nb })} -{" "}
                  {format(new Date(selectedLeave.endDate), "PPP", { locale: nb })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Begrunnelse for avslag *</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Forklar hvorfor ferieforespørselen avslås..."
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedLeave(null);
                setRejectionReason("");
              }}
            >
              Avbryt
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleApprove(false)}
              disabled={!rejectionReason.trim() || approveLeave.isPending}
            >
              {approveLeave.isPending ? "Avslår..." : "Avslå Forespørsel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
}
