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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { FileDown, FileSpreadsheet, Clock, Calendar, Users, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { exportToPDF, exportToExcel } from "../lib/exportUtils";

const MONTH_NAMES = [
  "Januar", "Februar", "Mars", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Desember"
];

export default function WorkHoursReport() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("weekly");

  // Fetch employees
  const { data: employees = [] } = trpc.employees.list.useQuery();

  // Fetch weekly summary
  const { data: weeklySummary = [], isLoading: weeklyLoading } = trpc.attendance.getWeeklySummary.useQuery({
    year: selectedYear,
    month: selectedMonth,
  });

  // Fetch monthly summary
  const { data: monthlySummary = [], isLoading: monthlyLoading } = trpc.attendance.getMonthlySummary.useQuery({
    year: selectedYear,
  });

  // Calculate date range for detailed report
  const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split("T")[0];
  const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split("T")[0];

  // Fetch detailed report
  const { data: detailedReport } = trpc.attendance.getEmployeeWorkReport.useQuery({
    employeeId: selectedEmployee === "all" ? undefined : parseInt(selectedEmployee),
    startDate,
    endDate,
  });

  // Filter data by selected employee
  const filteredWeekly = selectedEmployee === "all" 
    ? weeklySummary 
    : weeklySummary.filter((w: any) => w.employeeId?.toString() === selectedEmployee);

  const filteredMonthly = selectedEmployee === "all"
    ? monthlySummary
    : monthlySummary.filter((m: any) => m.employeeId?.toString() === selectedEmployee);

  // Group weekly data by employee
  const weeklyByEmployee = filteredWeekly.reduce((acc: any, item: any) => {
    const empId = item.employeeId;
    if (!acc[empId]) {
      acc[empId] = {
        employeeName: item.employeeName,
        weeks: [],
        totalHours: 0,
      };
    }
    acc[empId].weeks.push(item);
    acc[empId].totalHours += parseFloat(item.totalHours || "0");
    return acc;
  }, {});

  // Calculate totals
  const totalWeeklyHours = filteredWeekly.reduce((sum: number, w: any) => sum + parseFloat(w.totalHours || "0"), 0);
  const totalMonthlyHours = filteredMonthly
    .filter((m: any) => m.month === selectedMonth)
    .reduce((sum: number, m: any) => sum + parseFloat(m.totalHours || "0"), 0);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleExportWeeklyPDF = () => {
    const exportData = Object.values(weeklyByEmployee).flatMap((emp: any) =>
      emp.weeks.map((w: any) => ({
        employeeName: emp.employeeName,
        weekNumber: `Uke ${w.weekNumber}`,
        period: `${new Date(w.weekStart).toLocaleDateString("no-NO")} - ${new Date(w.weekEnd).toLocaleDateString("no-NO")}`,
        hours: parseFloat(w.totalHours || "0").toFixed(2),
        shifts: w.shiftCount,
      }))
    );

    const columns = [
      { header: "Ansatt", key: "employeeName" },
      { header: "Uke", key: "weekNumber" },
      { header: "Periode", key: "period" },
      { header: "Timer", key: "hours" },
      { header: "Skift", key: "shifts" },
    ];

    exportToPDF(exportData, columns, `Ukentlig Arbeidstid - ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`, `arbeidstid_ukentlig_${selectedYear}_${selectedMonth}`);
  };

  const handleExportMonthlyPDF = () => {
    const exportData = filteredMonthly.map((m: any) => ({
      employeeName: m.employeeName,
      month: MONTH_NAMES[m.month - 1],
      hours: parseFloat(m.totalHours || "0").toFixed(2),
      shifts: m.shiftCount,
      daysWorked: m.daysWorked,
    }));

    const columns = [
      { header: "Ansatt", key: "employeeName" },
      { header: "Måned", key: "month" },
      { header: "Timer", key: "hours" },
      { header: "Skift", key: "shifts" },
      { header: "Dager", key: "daysWorked" },
    ];

    exportToPDF(exportData, columns, `Månedlig Arbeidstid - ${selectedYear}`, `arbeidstid_maanedlig_${selectedYear}`);
  };

  const handleExportWeeklyExcel = () => {
    const exportData = Object.values(weeklyByEmployee).flatMap((emp: any) =>
      emp.weeks.map((w: any) => ({
        employeeName: emp.employeeName,
        weekNumber: w.weekNumber,
        weekStart: new Date(w.weekStart),
        weekEnd: new Date(w.weekEnd),
        hours: parseFloat(w.totalHours || "0"),
        shifts: w.shiftCount,
      }))
    );

    const columns = [
      { header: "Ansatt", key: "employeeName" },
      { header: "Uke", key: "weekNumber" },
      { header: "Fra", key: "weekStart" },
      { header: "Til", key: "weekEnd" },
      { header: "Timer", key: "hours" },
      { header: "Skift", key: "shifts" },
    ];

    exportToExcel(exportData, columns, "Ukentlig Arbeidstid", `arbeidstid_ukentlig_${selectedYear}_${selectedMonth}`);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              Arbeidstidsrapport
            </h1>
            <p className="text-muted-foreground mt-1">
              Oversikt over ansattes arbeidstimer - ukentlig og månedlig
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-700">Timer denne måneden</p>
                <p className="text-2xl font-bold text-blue-900">{totalMonthlyHours.toFixed(1)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700">Gj.snitt per uke</p>
                <p className="text-2xl font-bold text-green-900">
                  {Object.keys(weeklyByEmployee).length > 0 
                    ? (totalWeeklyHours / Math.max(1, filteredWeekly.length / Object.keys(weeklyByEmployee).length)).toFixed(1)
                    : "0"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-700">Ansatte med timer</p>
                <p className="text-2xl font-bold text-purple-900">{Object.keys(weeklyByEmployee).length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-orange-700">Totalt skift</p>
                <p className="text-2xl font-bold text-orange-900">
                  {filteredWeekly.reduce((sum: number, w: any) => sum + (w.shiftCount || 0), 0)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Month Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="text-lg font-semibold min-w-[180px] text-center">
                {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </div>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Employee Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Ansatt:</span>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Alle ansatte" />
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

            {/* Export Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={activeTab === "weekly" ? handleExportWeeklyPDF : handleExportMonthlyPDF} 
                variant="outline" 
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <FileDown className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button 
                onClick={handleExportWeeklyExcel} 
                className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="weekly">Ukentlig</TabsTrigger>
            <TabsTrigger value="monthly">Månedlig</TabsTrigger>
          </TabsList>

          {/* Weekly Tab */}
          <TabsContent value="weekly" className="space-y-4">
            {weeklyLoading ? (
              <Card className="p-8 text-center text-muted-foreground">
                Laster ukentlig rapport...
              </Card>
            ) : Object.keys(weeklyByEmployee).length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                Ingen arbeidstimer registrert for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </Card>
            ) : (
              Object.entries(weeklyByEmployee).map(([empId, emp]: [string, any]) => (
                <Card key={empId} className="overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">{emp.employeeName}</h3>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{emp.totalHours.toFixed(1)} timer</p>
                        <p className="text-sm opacity-80">totalt denne måneden</p>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-3 font-medium">Uke</th>
                          <th className="text-left p-3 font-medium">Periode</th>
                          <th className="text-right p-3 font-medium">Timer</th>
                          <th className="text-right p-3 font-medium">Skift</th>
                          <th className="text-right p-3 font-medium">Gj.snitt/dag</th>
                        </tr>
                      </thead>
                      <tbody>
                        {emp.weeks.map((week: any, idx: number) => {
                          const hours = parseFloat(week.totalHours || "0");
                          const avgPerDay = week.shiftCount > 0 ? hours / week.shiftCount : 0;
                          return (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="p-3">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Uke {week.weekNumber}
                                </span>
                              </td>
                              <td className="p-3 text-sm text-muted-foreground">
                                {new Date(week.weekStart).toLocaleDateString("no-NO", { day: "numeric", month: "short" })} - {new Date(week.weekEnd).toLocaleDateString("no-NO", { day: "numeric", month: "short" })}
                              </td>
                              <td className="p-3 text-right font-semibold">{hours.toFixed(2)}</td>
                              <td className="p-3 text-right">{week.shiftCount}</td>
                              <td className="p-3 text-right text-muted-foreground">{avgPerDay.toFixed(1)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-blue-50">
                        <tr>
                          <td colSpan={2} className="p-3 font-semibold">Totalt</td>
                          <td className="p-3 text-right font-bold text-blue-600">{emp.totalHours.toFixed(2)}</td>
                          <td className="p-3 text-right font-semibold">
                            {emp.weeks.reduce((sum: number, w: any) => sum + w.shiftCount, 0)}
                          </td>
                          <td className="p-3"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Monthly Tab */}
          <TabsContent value="monthly" className="space-y-4">
            {monthlyLoading ? (
              <Card className="p-8 text-center text-muted-foreground">
                Laster månedlig rapport...
              </Card>
            ) : filteredMonthly.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                Ingen arbeidstimer registrert for {selectedYear}
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-blue-50 to-orange-50">
                      <tr>
                        <th className="text-left p-4 font-semibold">Ansatt</th>
                        {MONTH_NAMES.map((month, idx) => (
                          <th key={idx} className="text-center p-4 font-semibold text-sm">
                            {month.substring(0, 3)}
                          </th>
                        ))}
                        <th className="text-right p-4 font-semibold bg-blue-100">Totalt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Group by employee */}
                      {Array.from(new Set(filteredMonthly.map((m: any) => m.employeeId))).map((empId: any) => {
                        const empData = filteredMonthly.filter((m: any) => m.employeeId === empId);
                        const empName = empData[0]?.employeeName || "Ukjent";
                        const monthlyHours: { [key: number]: number } = {};
                        empData.forEach((m: any) => {
                          monthlyHours[m.month] = parseFloat(m.totalHours || "0");
                        });
                        const yearTotal = Object.values(monthlyHours).reduce((sum, h) => sum + h, 0);

                        return (
                          <tr key={empId} className="border-b hover:bg-gray-50">
                            <td className="p-4 font-medium">{empName}</td>
                            {MONTH_NAMES.map((_, idx) => {
                              const hours = monthlyHours[idx + 1] || 0;
                              return (
                                <td key={idx} className={`text-center p-4 ${hours > 0 ? "font-medium" : "text-muted-foreground"}`}>
                                  {hours > 0 ? hours.toFixed(1) : "-"}
                                </td>
                              );
                            })}
                            <td className="text-right p-4 font-bold text-blue-600 bg-blue-50">
                              {yearTotal.toFixed(1)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gradient-to-r from-blue-100 to-orange-100">
                      <tr>
                        <td className="p-4 font-bold">Totalt alle</td>
                        {MONTH_NAMES.map((_, idx) => {
                          const monthTotal = filteredMonthly
                            .filter((m: any) => m.month === idx + 1)
                            .reduce((sum: number, m: any) => sum + parseFloat(m.totalHours || "0"), 0);
                          return (
                            <td key={idx} className="text-center p-4 font-semibold">
                              {monthTotal > 0 ? monthTotal.toFixed(1) : "-"}
                            </td>
                          );
                        })}
                        <td className="text-right p-4 font-bold text-blue-700 bg-blue-200">
                          {filteredMonthly.reduce((sum: number, m: any) => sum + parseFloat(m.totalHours || "0"), 0).toFixed(1)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
// Trigger deploy Wed Dec 17 02:53:20 EST 2025
