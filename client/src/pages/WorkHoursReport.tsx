import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { nb } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, User } from "lucide-react";

export default function WorkHoursReport() {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>(undefined);
  
  // Calculate date ranges
  const today = new Date();
  const startDate = period === "week" 
    ? format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd")
    : format(startOfMonth(today), "yyyy-MM-dd");
  const endDate = period === "week"
    ? format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd")
    : format(endOfMonth(today), "yyyy-MM-dd");

  // Fetch employees
  const { data: employees } = trpc.employees.list.useQuery();

  // Fetch work hours report
  const { data: report, isLoading } = trpc.timesheets.getEmployeeWorkReport.useQuery({
    employeeId: selectedEmployeeId,
    startDate,
    endDate,
  });

  const handlePeriodChange = (value: "week" | "month") => {
    setPeriod(value);
  };

  const handleEmployeeChange = (value: string) => {
    setSelectedEmployeeId(value === "all" ? undefined : parseInt(value));
  };

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Timeregistrering", href: "/timeclock" },
        { label: "Timer rapport" },
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Timer rapport</h1>
            <p className="text-gray-600 mt-1">Ukentlig og månedlig sammendrag av arbeidstimer</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtrer rapport</CardTitle>
            <CardDescription>Velg periode og ansatt for å se rapporter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Period selector */}
              <div>
                <label className="text-sm font-medium mb-2 block">Periode</label>
                <Select value={period} onValueChange={handlePeriodChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Denne uken</SelectItem>
                    <SelectItem value="month">Denne måneden</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Employee selector */}
              <div>
                <label className="text-sm font-medium mb-2 block">Ansatt</label>
                <Select 
                  value={selectedEmployeeId?.toString() || "all"} 
                  onValueChange={handleEmployeeChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle ansatte</SelectItem>
                    {employees?.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>
                Periode: {format(new Date(startDate), "d. MMM yyyy", { locale: nb })} -{" "}
                {format(new Date(endDate), "d. MMM yyyy", { locale: nb })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {!isLoading && report && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Totale timer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="w-8 h-8 text-blue-500" />
                  <span className="text-3xl font-bold">{report.summary.totalHours}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Totale vakter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Calendar className="w-8 h-8 text-green-500" />
                  <span className="text-3xl font-bold">{report.summary.totalShifts}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Gj.snitt timer/dag</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <User className="w-8 h-8 text-purple-500" />
                  <span className="text-3xl font-bold">{report.summary.averageHoursPerDay}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Employee Details */}
        {!isLoading && report && report.employees.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Detaljer per ansatt</CardTitle>
              <CardDescription>Oversikt over arbeidstimer for hver ansatt</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Ansatt</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Totale timer</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Antall vakter</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Dager arbeidet</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Gj.snitt timer/vakt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.employees.map((emp: any) => (
                      <tr key={emp.employeeId} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{emp.employeeName}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 font-semibold text-blue-600">
                          {parseFloat(emp.totalHours).toFixed(2)}h
                        </td>
                        <td className="text-right py-3 px-4">{emp.shiftCount}</td>
                        <td className="text-right py-3 px-4">{emp.daysWorked}</td>
                        <td className="text-right py-3 px-4 text-gray-600">
                          {parseFloat(emp.avgHoursPerShift).toFixed(2)}h
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                <p className="text-gray-600">Laster rapport...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && report && report.employees.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-600">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Ingen arbeidstimer registrert for valgt periode</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
