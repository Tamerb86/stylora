import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { BarChart3, Calendar, Download, TrendingUp, Users, DollarSign, FileDown, FileSpreadsheet, Filter, X } from "lucide-react";
import { useState } from "react";
import { exportToPDF, exportToExcel } from "@/lib/exportUtils";

export default function Reports() {
  const [period, setPeriod] = useState("week");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  
  // Calculate date range based on period
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    if (customStartDate && customEndDate) {
      return {
        startDate: customStartDate,
        endDate: customEndDate,
      };
    }
    
    switch (period) {
      case "today":
        start.setHours(0, 0, 0, 0);
        break;
      case "week":
        start.setDate(end.getDate() - 7);
        break;
      case "month":
        start.setDate(end.getDate() - 30);
        break;
      case "year":
        start.setDate(end.getDate() - 365);
        break;
      default:
        start.setDate(end.getDate() - 7);
    }
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  const dateRange = getDateRange();

  const { data: customers = [] } = trpc.customers.list.useQuery();
  const { data: employees = [] } = trpc.employees.list.useQuery();
  const { data: services = [] } = trpc.services.list.useQuery();

  // Fetch employee sales data
  const { data: salesByEmployee = [], isLoading: employeeSalesLoading } = trpc.financialReports.salesByEmployee.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    paymentMethod: "all",
  });

  // Fetch detailed orders for export
  const { data: ordersData = [] } = trpc.financialReports.detailedOrdersList.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    employeeId: selectedEmployee !== "all" ? parseInt(selectedEmployee) : undefined,
    serviceId: selectedService !== "all" ? parseInt(selectedService) : undefined,
  });

  const filteredCount = ordersData.length;
  const totalCount = ordersData.length;

  const resetFilters = () => {
    setSelectedEmployee("all");
    setSelectedService("all");
    setCustomStartDate("");
    setCustomEndDate("");
  };

  const totalRevenue = ordersData.reduce((sum, order) => sum + parseFloat(order.total || "0"), 0);
  const completedOrders = ordersData.length;

  const handleExportPDF = () => {
    const exportData = ordersData
      .map((order: any) => ({
        date: new Date(order.orderDate),
        customer: order.customerName || "Ukjent",
        service: order.serviceName || "Diverse",
        employee: order.employeeName || "Ansatt",
        amount: parseFloat(order.total || "0"),
        status: "Fullført",
      }));

    const columns = [
      { header: "Dato", key: "date" },
      { header: "Kunde", key: "customer" },
      { header: "Tjeneste", key: "service" },
      { header: "Ansatt", key: "employee" },
      { header: "Beløp (kr)", key: "amount" },
      { header: "Status", key: "status" },
    ];

    exportToPDF(exportData, columns, "Salgsrapport", `salgsrapport_${period}`);
  };

  const handleExportExcel = () => {
    const exportData = ordersData
      .map((order: any) => ({
        date: new Date(order.orderDate),
        customer: order.customerName || "Ukjent",
        service: order.serviceName || "Diverse",
        employee: order.employeeName || "Ansatt",
        amount: parseFloat(order.total || "0"),
        status: "Fullført",
      }));

    const columns = [
      { header: "Dato", key: "date" },
      { header: "Kunde", key: "customer" },
      { header: "Tjeneste", key: "service" },
      { header: "Ansatt", key: "employee" },
      { header: "Beløp (kr)", key: "amount" },
      { header: "Status", key: "status" },
    ];

    exportToExcel(exportData, columns, "Salgsrapport", `salgsrapport_${period}`);
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Rapporter</h1>
            <p className="text-muted-foreground">Oversikt over salg og statistikk</p>
          </div>
          <div className="flex gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Siste 7 dager</SelectItem>
                <SelectItem value="month">Siste 30 dager</SelectItem>
                <SelectItem value="quarter">Siste 90 dager</SelectItem>
                <SelectItem value="year">Siste år</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => handleExportPDF()} variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
              <FileDown className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button onClick={() => handleExportExcel()} className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Eksporter
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="w-full sm:w-auto"
              >
                <Filter className="h-4 w-4 mr-2" />
                Avanserte filtre
              </Button>
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-orange-600">{filteredCount}</span> av <span className="font-semibold">{totalCount}</span> oppføringer vil bli eksportert
              </div>
            </div>
          </CardHeader>
          {showAdvancedFilters && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Ansatt</label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg ansatt" />
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

                <div>
                  <label className="text-sm font-medium mb-2 block">Tjeneste</label>
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg tjeneste" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle tjenester</SelectItem>
                      {services.map((svc: any) => (
                        <SelectItem key={svc.id} value={svc.id.toString()}>
                          {svc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Egendefinert periode</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Fra dato"
                    />
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Til dato"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="w-full sm:w-auto"
                >
                  <X className="h-4 w-4 mr-2" />
                  Nullstill filtre
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total omsetning</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} NOK</div>
              <p className="text-xs text-muted-foreground">
                +12.5% fra forrige periode
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fullførte avtaler</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedOrders}</div>
              <p className="text-xs text-muted-foreground">
                0 avbrutt
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fullføringsrate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedOrders > 0 ? "100" : "0"}%</div>
              <p className="text-xs text-muted-foreground">
                Av totalt {completedOrders} avtaler
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktive kunder</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
              <p className="text-xs text-muted-foreground">
                +{Math.floor(customers.length * 0.08)} denne måneden
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Omsetning per uke</CardTitle>
              <CardDescription>Siste 8 uker</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  <p>Graf kommer snart</p>
                  <p className="text-sm">Krever Chart.js integrasjon</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Populære tjenester</CardTitle>
              <CardDescription>Mest bookede tjenester</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  <p>Graf kommer snart</p>
                  <p className="text-sm">Krever Chart.js integrasjon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Sales Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Salg per ansatt</CardTitle>
            <CardDescription>Oversikt over hver ansatts omsetning</CardDescription>
          </CardHeader>
          <CardContent>
            {employeeSalesLoading ? (
              <div className="text-center py-8 text-muted-foreground">Laster...</div>
            ) : salesByEmployee.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ingen salgsdata tilgjengelig for valgt periode</p>
              </div>
            ) : (
              <div className="space-y-4">
                {salesByEmployee.map((emp: any, index: number) => (
                  <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center text-white font-bold">
                        {emp.employeeName?.charAt(0) || 'A'}
                      </div>
                      <div>
                        <p className="font-medium">{emp.employeeName || 'Ukjent ansatt'}</p>
                        <p className="text-sm text-muted-foreground">{emp.orderCount || 0} ordre</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{parseFloat(emp.totalRevenue || 0).toLocaleString('nb-NO')} kr</p>
                      <p className="text-sm text-muted-foreground">
                        Snitt: {emp.orderCount > 0 ? (parseFloat(emp.totalRevenue) / emp.orderCount).toFixed(0) : 0} kr
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Detaljert statistikk</CardTitle>
            <CardDescription>Ytterligere innsikt i virksomheten</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium">Gjennomsnittlig avtaleverdi</p>
                  <p className="text-sm text-muted-foreground">Per fullført avtale</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">500 NOK</p>
                </div>
              </div>

              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium">Gjennomsnittlig varighet</p>
                  <p className="text-sm text-muted-foreground">Per avtale</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">45 min</p>
                </div>
              </div>

              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium">Kundelojalitet</p>
                  <p className="text-sm text-muted-foreground">Gjentakende kunder</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">68%</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Beste dag</p>
                  <p className="text-sm text-muted-foreground">Mest bookede dag</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">Lørdag</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
