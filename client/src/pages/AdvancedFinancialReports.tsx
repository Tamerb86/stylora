import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Users, DollarSign, ShoppingCart, Download, Calendar } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from "date-fns";
import { nb } from "date-fns/locale";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

type DatePreset = "today" | "last7days" | "last30days" | "thisMonth" | "lastMonth" | "thisYear" | "custom";

export default function AdvancedFinancialReports() {
  return (
    <DashboardLayout>
      <AdvancedFinancialReportsContent />
    </DashboardLayout>
  );
}

function AdvancedFinancialReportsContent() {
  const [datePreset, setDatePreset] = useState<DatePreset>("thisMonth");
  const [paymentMethod, setPaymentMethod] = useState<"all" | "cash" | "card" | "stripe" | "vipps">("all");
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  // Calculate date range based on preset
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (datePreset) {
      case "today":
        start = now;
        break;
      case "last7days":
        start = subDays(now, 7);
        break;
      case "last30days":
        start = subDays(now, 30);
        break;
      case "thisMonth":
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case "lastMonth":
        const lastMonth = subMonths(now, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      case "thisYear":
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      default:
        start = subDays(now, 30);
    }

    return {
      startDate: format(start, "yyyy-MM-dd"),
      endDate: format(end, "yyyy-MM-dd"),
    };
  }, [datePreset]);

  // Fetch data
  const { data: summary, isLoading: summaryLoading } = trpc.financialReports.getSummary.useQuery({
    startDate,
    endDate,
  });

  const { data: salesByEmployee, isLoading: employeeLoading } = trpc.financialReports.salesByEmployee.useQuery({
    startDate,
    endDate,
    paymentMethod,
  });

  const { data: salesByService, isLoading: serviceLoading } = trpc.financialReports.salesByService.useQuery({
    startDate,
    endDate,
  });

  const { data: revenueTrends, isLoading: trendsLoading } = trpc.financialReports.revenueTrends.useQuery({
    startDate,
    endDate,
    period,
  });

  const { data: topPerformers, isLoading: performersLoading } = trpc.financialReports.topPerformers.useQuery({
    startDate,
    endDate,
    limit: 5,
  });

  const { data: topServices, isLoading: topServicesLoading } = trpc.financialReports.topServices.useQuery({
    startDate,
    endDate,
    limit: 5,
  });

  // Format data for charts
  const employeeChartData = useMemo(() => {
    if (!salesByEmployee) return [];
    return salesByEmployee.map((item) => ({
      name: item.employeeName || "Ukjent",
      revenue: parseFloat(item.totalRevenue),
      orders: item.orderCount,
    }));
  }, [salesByEmployee]);

  const serviceChartData = useMemo(() => {
    if (!salesByService) return [];
    return salesByService.map((item) => ({
      name: item.serviceName || "Ukjent",
      value: parseFloat(item.totalRevenue),
      count: item.itemCount,
    }));
  }, [salesByService]);

  const trendsChartData = useMemo(() => {
    if (!revenueTrends) return [];
    return revenueTrends.map((item) => ({
      period: item.period,
      revenue: parseFloat(item.revenue),
      orders: item.orderCount,
    }));
  }, [revenueTrends]);

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!salesByEmployee) return;

    const csvContent = [
      ["Ansatt", "Antall ordre", "Total omsetning", "Gjennomsnittlig ordrebeløp"],
      ...salesByEmployee.map((item) => [
        item.employeeName || "Ukjent",
        item.orderCount,
        item.totalRevenue,
        item.averageOrderValue,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `financial-report-${startDate}-${endDate}.csv`;
    link.click();
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Avanserte finansrapporter
          </h1>
          <p className="text-muted-foreground mt-1">
            Detaljert analyse av salg og inntekter
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportPDF} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Eksporter PDF
          </Button>
          <Button onClick={handleExportExcel} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Eksporter Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtre
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Periode</label>
            <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">I dag</SelectItem>
                <SelectItem value="last7days">Siste 7 dager</SelectItem>
                <SelectItem value="last30days">Siste 30 dager</SelectItem>
                <SelectItem value="thisMonth">Denne måneden</SelectItem>
                <SelectItem value="lastMonth">Forrige måned</SelectItem>
                <SelectItem value="thisYear">Dette året</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Betalingsmetode</label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="cash">Kontant</SelectItem>
                <SelectItem value="card">Kort</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="vipps">Vipps</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Trendperiode</label>
            <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daglig</SelectItem>
                <SelectItem value="weekly">Ukentlig</SelectItem>
                <SelectItem value="monthly">Månedlig</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Total omsetning
            </CardTitle>
            <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              {summaryLoading ? "..." : `${parseFloat(summary?.totalRevenue || "0").toFixed(2)} kr`}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">
              Antall ordre
            </CardTitle>
            <ShoppingCart className="h-5 w-5 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">
              {summaryLoading ? "..." : summary?.totalOrders || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">
              Gjennomsnittlig ordrebeløp
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
              {summaryLoading ? "..." : `${parseFloat(summary?.averageOrderValue || "0").toFixed(2)} kr`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Omsetningstrend
          </CardTitle>
          <CardDescription>
            {period === "daily" ? "Daglig" : period === "weekly" ? "Ukentlig" : "Månedlig"} omsetning
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trendsLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Laster data...</p>
            </div>
          ) : trendsChartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Ingen data tilgjengelig for valgt periode</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendsChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="Omsetning (kr)" strokeWidth={2} />
                <Line type="monotone" dataKey="orders" stroke="#10b981" name="Antall ordre" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Sales by Employee */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Salg per ansatt
          </CardTitle>
          <CardDescription>Omsetning fordelt på ansatte</CardDescription>
        </CardHeader>
        <CardContent>
          {employeeLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Laster data...</p>
            </div>
          ) : employeeChartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Ingen data tilgjengelig</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={employeeChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" name="Omsetning (kr)" />
                <Bar dataKey="orders" fill="#10b981" name="Antall ordre" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Sales by Service */}
      <Card>
        <CardHeader>
          <CardTitle>Salg per tjeneste</CardTitle>
          <CardDescription>Omsetning fordelt på tjenester</CardDescription>
        </CardHeader>
        <CardContent>
          {serviceLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Laster data...</p>
            </div>
          ) : serviceChartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Ingen data tilgjengelig</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={serviceChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value.toFixed(0)} kr`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {serviceChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Topp ansatte
            </CardTitle>
            <CardDescription>Beste presterende ansatte</CardDescription>
          </CardHeader>
          <CardContent>
            {performersLoading ? (
              <p className="text-muted-foreground">Laster...</p>
            ) : !topPerformers || topPerformers.length === 0 ? (
              <p className="text-muted-foreground">Ingen data tilgjengelig</p>
            ) : (
              <div className="space-y-4">
                {topPerformers.map((performer, index) => (
                  <div key={performer.employeeId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{performer.employeeName || "Ukjent"}</p>
                        <p className="text-sm text-muted-foreground">{performer.orderCount} ordre</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{parseFloat(performer.totalRevenue).toFixed(2)} kr</p>
                      <p className="text-sm text-muted-foreground">
                        Snitt: {parseFloat(performer.averageOrderValue).toFixed(2)} kr
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Topp tjenester</CardTitle>
            <CardDescription>Mest populære tjenester</CardDescription>
          </CardHeader>
          <CardContent>
            {topServicesLoading ? (
              <p className="text-muted-foreground">Laster...</p>
            ) : !topServices || topServices.length === 0 ? (
              <p className="text-muted-foreground">Ingen data tilgjengelig</p>
            ) : (
              <div className="space-y-4">
                {topServices.map((service, index) => (
                  <div key={service.serviceId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-500 text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{service.serviceName || "Ukjent"}</p>
                        <p className="text-sm text-muted-foreground">{service.bookingCount} bestillinger</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{parseFloat(service.totalRevenue).toFixed(2)} kr</p>
                      <p className="text-sm text-muted-foreground">
                        Snitt: {parseFloat(service.averagePrice).toFixed(2)} kr
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
