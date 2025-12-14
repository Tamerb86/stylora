import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Clock, 
  LogOut, 
  Users, 
  AlertTriangle,
  RefreshCw,
  Phone
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Toast notifications replaced with alerts for compatibility

export default function TimeClockAdmin() {
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [showClockOutDialog, setShowClockOutDialog] = useState(false);
  const [showClockOutAllDialog, setShowClockOutAllDialog] = useState(false);
  const [clockOutReason, setClockOutReason] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch active shifts (auto-refresh every 30 seconds)
  const { 
    data: activeShifts = [], 
    isLoading,
    refetch 
  } = trpc.employee.adminGetAllActiveShifts.useQuery(undefined, {
    refetchInterval: 30000, // 30 seconds
  });

  const adminClockOutMutation = trpc.employee.adminClockOut.useMutation({
    onSuccess: (data) => {
      alert(`✓ Utstemplet\n\n${data.employeeName} ble stemplet ut. Arbeidet ${formatHours(data.totalHours)}.`);
      refetch();
      setShowClockOutDialog(false);
      setSelectedShift(null);
      setClockOutReason("");
    },
    onError: (error) => {
      alert(`Feil: ${error.message || "Kunne ikke stemple ut ansatt"}`);
    },
  });

  const adminClockOutAllMutation = trpc.employee.adminClockOutAll.useMutation({
    onSuccess: (data) => {
      alert(`✓ Alle utstemplet\n\n${data.message}`);
      refetch();
      setShowClockOutAllDialog(false);
      setClockOutReason("");
    },
    onError: (error) => {
      alert(`Feil: ${error.message || "Kunne ikke stemple ut ansatte"}`);
    },
  });

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}t ${m}m`;
  };

  const calculateElapsedTime = (clockIn: Date) => {
    const elapsedMs = currentTime.getTime() - new Date(clockIn).getTime();
    const elapsedHours = elapsedMs / (1000 * 60 * 60);
    return elapsedHours;
  };

  const handleClockOut = (shift: any) => {
    setSelectedShift(shift);
    setShowClockOutDialog(true);
  };

  const confirmClockOut = () => {
    if (!selectedShift) return;
    adminClockOutMutation.mutate({
      timesheetId: selectedShift.id,
      reason: clockOutReason || undefined,
    });
  };

  const confirmClockOutAll = () => {
    adminClockOutAllMutation.mutate({
      reason: clockOutReason || undefined,
    });
  };

  const isLongShift = (clockIn: Date) => {
    const hours = calculateElapsedTime(clockIn);
    return hours > 12;
  };

  return (
    <DashboardLayout>
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center shadow-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Tidsregistrering - Administrasjon</h1>
              <p className="text-muted-foreground">
                Administrer aktive vakter og stemple ut ansatte
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Oppdater
            </Button>
            {activeShifts.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowClockOutAllDialog(true)}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Stemple ut alle
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aktive vakter</p>
              <p className="text-2xl font-bold">{activeShifts.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Klokken nå</p>
              <p className="text-2xl font-bold font-mono">
                {currentTime.toLocaleTimeString("no-NO", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lange vakter (&gt;12t)</p>
              <p className="text-2xl font-bold">
                {activeShifts.filter((s: any) => isLongShift(s.clockIn)).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Active Shifts List */}
      {isLoading ? (
        <Card className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Laster...</span>
          </div>
        </Card>
      ) : activeShifts.length === 0 ? (
        <Card className="p-8">
          <div className="text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-1">Ingen aktive vakter</h3>
            <p className="text-muted-foreground">
              Alle ansatte er for øyeblikket utstemplet
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeShifts.map((shift: any) => {
            const elapsedHours = calculateElapsedTime(shift.clockIn);
            const isLong = elapsedHours > 12;
            const isVeryLong = elapsedHours > 16;

            return (
              <Card 
                key={shift.id} 
                className={`p-5 transition-all hover:shadow-lg ${
                  isVeryLong 
                    ? 'border-red-500 border-2' 
                    : isLong 
                    ? 'border-orange-500 border-2' 
                    : ''
                }`}
              >
                {/* Employee Info */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <h3 className="font-semibold text-lg">{shift.employeeName}</h3>
                    </div>
                    {isVeryLong && (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  {shift.employeePhone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      <span>{shift.employeePhone}</span>
                    </div>
                  )}
                </div>

                {/* Clock In Time */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Innstemplet</span>
                    <span className="font-mono font-semibold">
                      {new Date(shift.clockIn).toLocaleTimeString("no-NO", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Dato</span>
                    <span className="font-semibold">
                      {new Date(shift.workDate).toLocaleDateString("no-NO", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                </div>

                {/* Elapsed Time */}
                <div className="mb-4 p-3 rounded-lg bg-gradient-to-br from-blue-50 to-orange-50 dark:from-blue-950 dark:to-orange-950">
                  <p className="text-xs text-muted-foreground mb-1">Arbeidet så langt</p>
                  <p className="text-2xl font-bold">
                    {formatHours(elapsedHours)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ({elapsedHours.toFixed(2)} timer)
                  </p>
                </div>

                {/* Warning */}
                {isVeryLong && (
                  <div className="mb-4 p-2 rounded bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                      ⚠️ Svært lang vakt! Glemte ansatt å stemple ut?
                    </p>
                  </div>
                )}
                {isLong && !isVeryLong && (
                  <div className="mb-4 p-2 rounded bg-orange-500/10 border border-orange-500/20">
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                      ⚠️ Lang vakt
                    </p>
                  </div>
                )}

                {/* Clock Out Button */}
                <Button
                  onClick={() => handleClockOut(shift)}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                  disabled={adminClockOutMutation.isPending}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Stemple ut
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Clock Out Single Employee Dialog */}
      <Dialog open={showClockOutDialog} onOpenChange={setShowClockOutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stemple ut ansatt</DialogTitle>
            <DialogDescription>
              Er du sikker på at du vil stemple ut {selectedShift?.employeeName}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Årsak (valgfritt)</Label>
              <Input
                id="reason"
                placeholder="F.eks: Glemte å stemple ut, teknisk problem..."
                value={clockOutReason}
                onChange={(e) => setClockOutReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowClockOutDialog(false);
                setClockOutReason("");
              }}
            >
              Avbryt
            </Button>
            <Button
              onClick={confirmClockOut}
              disabled={adminClockOutMutation.isPending}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
            >
              {adminClockOutMutation.isPending ? "Stempler ut..." : "Stemple ut"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clock Out All Dialog */}
      <Dialog open={showClockOutAllDialog} onOpenChange={setShowClockOutAllDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stemple ut alle ansatte</DialogTitle>
            <DialogDescription>
              Er du sikker på at du vil stemple ut alle {activeShifts.length} ansatte?
              Dette brukes vanligvis ved slutten av dagen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason-all">Årsak (valgfritt)</Label>
              <Input
                id="reason-all"
                placeholder="F.eks: Slutt på dagen, stengetid..."
                value={clockOutReason}
                onChange={(e) => setClockOutReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowClockOutAllDialog(false);
                setClockOutReason("");
              }}
            >
              Avbryt
            </Button>
            <Button
              onClick={confirmClockOutAll}
              disabled={adminClockOutAllMutation.isPending}
              variant="destructive"
            >
              {adminClockOutAllMutation.isPending ? "Stempler ut..." : "Stemple ut alle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
}
