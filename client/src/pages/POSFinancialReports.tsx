import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { TrendingUp, DollarSign, ShoppingCart, Users, Download, Calendar, Filter } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { format, subDays, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { nb } from "date-fns/locale";

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#6366f1"];

export default function POSFinancialReports() {
  const [dateRange, setDateRange] = useState<"today" | "7days" | "30days" | "month" | "custom">("today");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case "today":
        return { startDate: startOfDay(now), endDate: endOfDay(now) };
      case "7days":
        return { startDate: startOfDay(subDays(now, 7)), endDate: endOfDay(now) };
      case "30days":
        return { startDate: startOfDay(subDays(now, 30)), endDate: endOfDay(now) };
      case "month":
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
      case "custom":
        return {
          startDate: customStartDate ? new Date(customStartDate) : startOfDay(now),
          endDate: customEndDate ? new Date(customEndDate) : endOfDay(now),
        };
      default:
        return { startDate: startOfDay(now), endDate: endOfDay(now) };
    }
  }, [dateRange, customStartDate, customEndDate]);

  const { data: report, isLoading } = trpc.posReports.getDetailedReport.useQuery({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    employeeId: employeeFilter === "all" ? undefined : parseInt(employeeFilter),
    paymentMethod: paymentMethodFilter === "all" ? undefined : paymentMethodFilter as any,
  });

  const { data: employees } = trpc.employees.list.useQuery();

  // Prepare chart data
  const salesByEmployeeData = report?.salesByEmployee.map(e => ({
    name: e.employeeName,
    sales: parseFloat(e.totalSales),
    orders: e.orderCount,
  })) || [];

  const salesByPaymentMethodData = report?.salesByPaymentMethod.map(p => ({
    name: p.paymentMethod === "split" ? "Delt" : p.paymentMethod.charAt(0).toUpperCase() + p.paymentMethod.slice(1),
    value: parseFloat(p.totalAmount),
  })) || [];

  const hourlySalesData = report?.hourlySales.map(h => ({
    hour: `${h.hour}:00`,
    sales: parseFloat(h.totalSales),
  })) || [];

  const handleExportPDF = () => {
    toast.info("PDF-eksport kommer snart");
  };

  const handleExportExcel = () => {
    toast.info("Excel-eksport kommer snart");
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            POS Finansrapporter
          </h1>
          <p className="text-muted-foreground mt-2">
            Detaljert analyse av salg og betalinger
          </p>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="dateRange">Tidsperiode</Label>
                <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
                  <SelectTrigger id="dateRange">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">I dag</SelectItem>
                    <SelectItem value="7days">Siste 7 dager</SelectItem>
                    <SelectItem value="30days">Siste 30 dager</SelectItem>
                    <SelectItem value="month">Denne måneden</SelectItem>
                    <SelectItem value="custom">Egendefinert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateRange === "custom" && (
                <>
                  <div>
                    <Label htmlFor="customStart">Fra dato</Label>
                    <input
                      id="customStart"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customEnd">Til dato</Label>
                    <input
                      id="customEnd"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="employee">Ansatt</Label>
                <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                  <SelectTrigger id="employee">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle ansatte</SelectItem>
                    {employees?.map(e => (
                      <SelectItem key={e.id} value={e.id.toString()}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentMethod">Betalingsmetode</Label>
                <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                  <SelectTrigger id="paymentMethod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle metoder</SelectItem>
                    <SelectItem value="cash">Kontant</SelectItem>
                    <SelectItem value="card">Kort</SelectItem>
                    <SelectItem value="vipps">Vipps</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="split">Delt betaling</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex gap-2 justify-end">
              <Button variant="outline" onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Eksporter PDF
              </Button>
              <Button variant="outline" onClick={handleExportExcel}>
                <Download className="h-4 w-4 mr-2" />
                Eksporter Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Laster rapport...</div>
        ) : !report ? (
          <div className="text-center py-12 text-muted-foreground">Ingen data tilgjengelig</div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Totalt salg
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {parseFloat(report.summary.totalSales).toFixed(2)} NOK
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Antall ordrer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {report.summary.orderCount}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Gjennomsnittlig ordre
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {parseFloat(report.summary.averageOrderValue).toFixed(2)} NOK
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Nettoinntekt
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {parseFloat(report.summary.netRevenue).toFixed(2)} NOK
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Sales by Employee */}
              <Card>
                <CardHeader>
                  <CardTitle>Salg per ansatt</CardTitle>
                  <CardDescription>Totalt salg fordelt på ansatte</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salesByEmployeeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="sales" fill="#3b82f6" name="Salg (NOK)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Sales by Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Salg per betalingsmetode</CardTitle>
                  <CardDescription>Fordeling av betalingsmetoder</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={salesByPaymentMethodData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value.toFixed(0)} NOK`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {salesByPaymentMethodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Hourly Sales */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Salg per time</CardTitle>
                <CardDescription>Salgsfordeling gjennom dagen</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={hourlySalesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#8b5cf6" name="Salg (NOK)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Services and Products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Top Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Topp 10 tjenester</CardTitle>
                  <CardDescription>Mest solgte tjenester</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tjeneste</TableHead>
                        <TableHead className="text-right">Antall</TableHead>
                        <TableHead className="text-right">Inntekt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.topServices.slice(0, 10).map((service, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{service.serviceName}</TableCell>
                          <TableCell className="text-right">{service.count}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {parseFloat(service.totalRevenue).toFixed(2)} NOK
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Topp 10 produkter</CardTitle>
                  <CardDescription>Mest solgte produkter</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produkt</TableHead>
                        <TableHead className="text-right">Antall</TableHead>
                        <TableHead className="text-right">Inntekt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.topProducts.slice(0, 10).map((product, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{product.productName}</TableCell>
                          <TableCell className="text-right">{product.quantity}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {parseFloat(product.totalRevenue).toFixed(2)} NOK
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Split Payment Details */}
            {report.splitPaymentDetails.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Delte betalinger</CardTitle>
                  <CardDescription>Detaljer om delte betalinger i perioden</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ordre-ID</TableHead>
                        <TableHead>Totalt</TableHead>
                        <TableHead>Metoder</TableHead>
                        <TableHead>Dato</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.splitPaymentDetails.map((split) => (
                        <TableRow key={split.orderId}>
                          <TableCell className="font-medium">#{split.orderId}</TableCell>
                          <TableCell className="font-semibold">
                            {parseFloat(split.totalAmount).toFixed(2)} NOK
                          </TableCell>
                          <TableCell>{split.methodsUsed}</TableCell>
                          <TableCell>
                            {format(new Date(split.createdAt), "dd.MM.yyyy HH:mm", { locale: nb })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
