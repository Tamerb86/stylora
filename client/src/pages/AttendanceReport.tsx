import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Download, Calendar, User, Pencil, Trash2, AlertCircle, FileDown, FileSpreadsheet, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { exportToPDF, exportToExcel, formatHours, formatDuration } from "../lib/exportUtils";

export default function AttendanceReport() {
  const [dateRange, setDateRange] = useState("thisMonth");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    clockIn: "",
    clockOut: "",
    editReason: "",
  });
  const [deleteReason, setDeleteReason] = useState("");

  const utils = trpc.useUtils();

  // Calculate date range
  const getDateRange = () => {
    // If custom dates are set, use them
    if (dateRange === "custom" && customStartDate && customEndDate) {
      return { startDate: customStartDate, endDate: customEndDate };
    }

    const today = new Date();
    let startDate: string;
    let endDate: string = today.toISOString().split("T")[0];

    switch (dateRange) {
      case "today":
        startDate = endDate;
        break;
      case "thisWeek": {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        startDate = weekStart.toISOString().split("T")[0];
        break;
      }
      case "thisMonth": {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate = monthStart.toISOString().split("T")[0];
        break;
      }
      case "lastMonth": {
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        startDate = lastMonthStart.toISOString().split("T")[0];
        endDate = lastMonthEnd.toISOString().split("T")[0];
        break;
      }
      case "custom":
        // Fallback to this month if custom dates not set
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate = monthStart.toISOString().split("T")[0];
        break;
      default:
        startDate = endDate;
    }

    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();

  const { data: timesheets = [], isLoading } = trpc.attendance.getAllTimesheets.useQuery({
    startDate,
    endDate,
    employeeId: selectedEmployee === "all" ? undefined : parseInt(selectedEmployee),
  });

  const { data: employeeTotals = [] } = trpc.attendance.getEmployeeTotals.useQuery({
    startDate,
    endDate,
  });

  const { data: employees = [] } = trpc.employees.list.useQuery();

  const updateMutation = trpc.attendance.updateTimesheet.useMutation({
    onSuccess: () => {
      utils.attendance.getAllTimesheets.invalidate();
      utils.attendance.getEmployeeTotals.invalidate();
      setEditDialogOpen(false);
      setSelectedTimesheet(null);
      setEditForm({ clockIn: "", clockOut: "", editReason: "" });
    },
  });

  const deleteMutation = trpc.attendance.deleteTimesheet.useMutation({
    onSuccess: () => {
      utils.attendance.getAllTimesheets.invalidate();
      utils.attendance.getEmployeeTotals.invalidate();
      setDeleteDialogOpen(false);
      setSelectedTimesheet(null);
      setDeleteReason("");
    },
  });

  const handleEdit = (timesheet: any) => {
    setSelectedTimesheet(timesheet);
    const clockInDate = new Date(timesheet.clockIn);
    const clockOutDate = timesheet.clockOut ? new Date(timesheet.clockOut) : null;
    
    setEditForm({
      clockIn: clockInDate.toISOString().slice(0, 16),
      clockOut: clockOutDate ? clockOutDate.toISOString().slice(0, 16) : "",
      editReason: "",
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (timesheet: any) => {
    setSelectedTimesheet(timesheet);
    setDeleteDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedTimesheet || !editForm.editReason.trim()) {
      alert("Vennligst fyll inn årsak for endring");
      return;
    }

    updateMutation.mutate({
      id: selectedTimesheet.id,
      clockIn: editForm.clockIn,
      clockOut: editForm.clockOut || undefined,
      editReason: editForm.editReason,
    });
  };

  const handleConfirmDelete = () => {
    if (!selectedTimesheet || !deleteReason.trim()) {
      alert("Vennligst fyll inn årsak for sletting");
      return;
    }

    deleteMutation.mutate({
      id: selectedTimesheet.id,
      reason: deleteReason,
    });
  };

  // Filter data based on current filters
  const getFilteredData = () => {
    return timesheets.filter((t: any) => {
      // Employee filter
      if (selectedEmployee !== "all" && t.employeeId?.toString() !== selectedEmployee) {
        return false;
      }
      // Status filter
      if (statusFilter === "active" && t.clockOut) {
        return false;
      }
      if (statusFilter === "completed" && !t.clockOut) {
        return false;
      }
      return true;
    });
  };

  const filteredTimesheets = getFilteredData();

  const handleExportPDF = () => {
    const exportData = filteredTimesheets.map((t: any) => ({
      employeeName: t.employeeName || "Ukjent",
      workDate: new Date(t.workDate),
      clockIn: t.clockIn ? new Date(t.clockIn).toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" }) : "-",
      clockOut: t.clockOut ? new Date(t.clockOut).toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" }) : "Aktiv",
      duration: formatDuration(t.totalHours || 0),
      edited: t.editReason ? "Ja" : "Nei",
    }));

    const columns = [
      { header: "Ansatt", key: "employeeName" },
      { header: "Dato", key: "workDate" },
      { header: "Inn", key: "clockIn" },
      { header: "Ut", key: "clockOut" },
      { header: "Varighet", key: "duration" },
      { header: "Redigert", key: "edited" },
    ];

    exportToPDF(exportData, columns, "Timeregistrering", `timeregistrering_${startDate}_${endDate}`);
  };

  const handleExportExcel = () => {
    const exportData = filteredTimesheets.map((t: any) => ({
      employeeName: t.employeeName || "Ukjent",
      workDate: new Date(t.workDate),
      clockIn: t.clockIn ? new Date(t.clockIn).toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" }) : "-",
      clockOut: t.clockOut ? new Date(t.clockOut).toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" }) : "Aktiv",
      duration: formatDuration(t.totalHours || 0),
      edited: t.editReason ? "Ja" : "Nei",
    }));

    const columns = [
      { header: "Ansatt", key: "employeeName" },
      { header: "Dato", key: "workDate" },
      { header: "Inn", key: "clockIn" },
      { header: "Ut", key: "clockOut" },
      { header: "Varighet", key: "duration" },
      { header: "Redigert", key: "edited" },
    ];

    exportToExcel(exportData, columns, "Timeregistrering", `timeregistrering_${startDate}_${endDate}`);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              Timeregistrering
            </h1>
            <p className="text-muted-foreground mt-1">
              Oversikt over ansattes arbeidstid
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportPDF} variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
              <FileDown className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button onClick={handleExportExcel} className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Periode
              </Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">I dag</SelectItem>
                  <SelectItem value="thisWeek">Denne uken</SelectItem>
                  <SelectItem value="thisMonth">Denne måneden</SelectItem>
                  <SelectItem value="lastMonth">Forrige måned</SelectItem>
                  <SelectItem value="custom">Egendefinert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Ansatt
              </Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle ansatte</SelectItem>
                  {employees.map((emp: any) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="mt-4 border-t pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between text-sm"
            >
              <span className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Avanserte filtre
              </span>
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>

            {showFilters && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Custom Date Range */}
                {dateRange === "custom" && (
                  <>
                    <div className="space-y-2">
                      <Label>Fra dato</Label>
                      <Input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Til dato</Label>
                      <Input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* Status Filter */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      <SelectItem value="active">Aktive (ikke stemplet ut)</SelectItem>
                      <SelectItem value="completed">Fullførte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Reset Filters Button */}
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDateRange("thisMonth");
                      setSelectedEmployee("all");
                      setStatusFilter("all");
                      setCustomStartDate("");
                      setCustomEndDate("");
                    }}
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Nullstill filtre
                  </Button>
                </div>
              </div>
            )}

            {/* Record Count Preview */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>{filteredTimesheets.length}</strong> av <strong>{timesheets.length}</strong> oppføringer vil bli eksportert
              </p>
            </div>
          </div>
        </Card>

        {/* Employee Totals */}
        {employeeTotals.length > 0 && (
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">Totalt per ansatt</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {employeeTotals.map((emp: any) => (
                <div key={emp.employeeId} className="p-4 bg-gradient-to-br from-blue-50 to-orange-50 rounded-lg">
                  <p className="font-medium">{emp.employeeName}</p>
                  <p className="text-2xl font-bold text-blue-600">{emp.totalHours || "0.00"} timer</p>
                  <p className="text-sm text-muted-foreground">{emp.shiftCount} skift</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Timesheets Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-orange-50">
                <tr>
                  <th className="text-left p-4 font-semibold">Ansatt</th>
                  <th className="text-left p-4 font-semibold">Dato</th>
                  <th className="text-left p-4 font-semibold">Inn</th>
                  <th className="text-left p-4 font-semibold">Ut</th>
                  <th className="text-left p-4 font-semibold">Timer</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold">Handlinger</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-muted-foreground">
                      Laster...
                    </td>
                  </tr>
                ) : timesheets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-muted-foreground">
                      Ingen registreringer funnet
                    </td>
                  </tr>
                ) : (
                  timesheets.map((t: any) => (
                    <tr key={t.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">{t.employeeName || "Ukjent"}</td>
                      <td className="p-4">{new Date(t.workDate).toLocaleDateString("no-NO")}</td>
                      <td className="p-4">
                        {t.clockIn
                          ? new Date(t.clockIn).toLocaleTimeString("no-NO", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </td>
                      <td className="p-4">
                        {t.clockOut
                          ? new Date(t.clockOut).toLocaleTimeString("no-NO", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : <span className="text-green-600 font-medium">Aktiv</span>}
                      </td>
                      <td className="p-4 font-medium">{t.totalHours || "0.00"}</td>
                      <td className="p-4">
                        {t.editReason ? (
                          <div className="flex items-center gap-1 text-amber-600 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            Redigert
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Original</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(t)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(t)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rediger timeregistrering</DialogTitle>
              <DialogDescription>
                Endre inn- og uttid for {selectedTimesheet?.employeeName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Inn-tid</Label>
                <Input
                  type="datetime-local"
                  value={editForm.clockIn}
                  onChange={(e) => setEditForm({ ...editForm, clockIn: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ut-tid</Label>
                <Input
                  type="datetime-local"
                  value={editForm.clockOut}
                  onChange={(e) => setEditForm({ ...editForm, clockOut: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Årsak til endring *</Label>
                <Textarea
                  placeholder="Beskriv hvorfor du endrer denne registreringen..."
                  value={editForm.editReason}
                  onChange={(e) => setEditForm({ ...editForm, editReason: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Avbryt
              </Button>
              <Button 
                onClick={handleSaveEdit}
                disabled={updateMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600"
              >
                {updateMutation.isPending ? "Lagrer..." : "Lagre endringer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Slett timeregistrering</DialogTitle>
              <DialogDescription>
                Er du sikker på at du vil slette denne registreringen for {selectedTimesheet?.employeeName}?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Advarsel:</strong> Denne handlingen kan ikke angres.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Årsak til sletting *</Label>
                <Textarea
                  placeholder="Beskriv hvorfor du sletter denne registreringen..."
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Avbryt
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Sletter..." : "Slett registrering"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
