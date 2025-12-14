import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calendar, TrendingUp, Users, Briefcase, DollarSign, Activity } from "lucide-react";
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

type DateRange = "7days" | "30days" | "thisMonth" | "lastMonth" | "thisYear";

const COLORS = ["#1e3a5f", "#ff6b35", "#4a90e2", "#50c878", "#f4a261", "#e76f51"];

const STATUS_LABELS: Record<string, string> = {
  pending: "Ventende",
  confirmed: "Bekreftet",
  completed: "Fullført",
  canceled: "Kansellert",
  no_show: "Møtte ikke",
};

export default function Analytics() {
  return (
    <DashboardLayout>
      <AnalyticsContent />
    </DashboardLayout>
  );
}

function AnalyticsContent() {
  const [dateRange, setDateRange] = useState<DateRange>("30days");

  const getDateRangeValues = () => {
    const now = new Date();
    switch (dateRange) {
      case "7days":
        return {
          startDate: subDays(now, 7),
          endDate: now,
        };
      case "30days":
        return {
          startDate: subDays(now, 30),
          endDate: now,
        };
      case "thisMonth":
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now),
        };
      case "lastMonth":
        const lastMonth = subMonths(now, 1);
        return {
          startDate: startOfMonth(lastMonth),
          endDate: endOfMonth(lastMonth),
        };
      case "thisYear":
        return {
          startDate: startOfYear(now),
          endDate: endOfYear(now),
        };
    }
  };

  const dateRangeValues = getDateRangeValues();

  const { data: customerGrowth, isLoading: loadingCustomers } = trpc.analytics.customerGrowth.useQuery(dateRangeValues);
  const { data: employeePerformance, isLoading: loadingEmployees } = trpc.analytics.employeePerformance.useQuery(dateRangeValues);
  const { data: topServices, isLoading: loadingServices } = trpc.analytics.topServices.useQuery(dateRangeValues);
  const { data: revenueTrends, isLoading: loadingRevenue } = trpc.analytics.revenueTrends.useQuery(dateRangeValues);
  const { data: statusDistribution, isLoading: loadingStatus } = trpc.analytics.appointmentStatusDistribution.useQuery(dateRangeValues);

  const customerGrowthData = customerGrowth?.map((item) => ({
    date: format(new Date(item.date), "dd.MM"),
    kunder: item.count,
  })) || [];

  const employeePerformanceData = employeePerformance?.map((item) => ({
    navn: item.employeeName || "Ukjent",
    avtaler: item.appointmentCount,
    inntekt: parseFloat(item.totalRevenue),
  })) || [];

  const topServicesData = topServices?.map((item) => ({
    tjeneste: item.serviceName || "Ukjent",
    bookinger: item.bookingCount,
    inntekt: parseFloat(item.totalRevenue),
  })) || [];

  const revenueTrendsData = revenueTrends?.map((item) => ({
    date: format(new Date(item.date), "dd.MM"),
    inntekt: parseFloat(item.revenue),
  })) || [];

  const statusDistributionData = statusDistribution?.map((item) => ({
    name: item.status ? (STATUS_LABELS[item.status] || item.status) : "Ukjent",
    value: item.count,
  })) || [];

  const totalRevenue = revenueTrendsData.reduce((sum, item) => sum + item.inntekt, 0);
  const totalCustomers = customerGrowthData.reduce((sum, item) => sum + item.kunder, 0);
  const totalAppointments = employeePerformanceData.reduce((sum, item) => sum + item.avtaler, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Analyse</h1>
          <p className="text-gray-600 mt-1">Detaljert innsikt i din virksomhet</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Siste 7 dager</SelectItem>
              <SelectItem value="30days">Siste 30 dager</SelectItem>
              <SelectItem value="thisMonth">Denne måneden</SelectItem>
              <SelectItem value="lastMonth">Forrige måned</SelectItem>
              <SelectItem value="thisYear">Dette året</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inntekt</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toFixed(2)} kr</div>
            <p className="text-xs text-muted-foreground">Fra fullførte avtaler</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nye Kunder</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">I valgt periode</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Avtaler</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAppointments}</div>
            <p className="text-xs text-muted-foreground">Fullførte avtaler</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#1e3a5f]" />
            Kundevekst
          </CardTitle>
          <CardDescription>Antall nye kunder over tid</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingCustomers ? (
            <div className="h-80 flex items-center justify-center text-gray-500">Laster...</div>
          ) : customerGrowthData.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-gray-500">Ingen data tilgjengelig</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={customerGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="kunder" stroke="#1e3a5f" strokeWidth={2} name="Nye kunder" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Revenue Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-[#ff6b35]" />
            Inntektstrend
          </CardTitle>
          <CardDescription>Daglig inntekt fra fullførte avtaler</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingRevenue ? (
            <div className="h-80 flex items-center justify-center text-gray-500">Laster...</div>
          ) : revenueTrendsData.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-gray-500">Ingen data tilgjengelig</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTrendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `${value} kr`} />
                <Legend />
                <Line type="monotone" dataKey="inntekt" stroke="#ff6b35" strokeWidth={2} name="Inntekt (kr)" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Employee Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-[#4a90e2]" />
            Ansattes Ytelse
          </CardTitle>
          <CardDescription>Fullførte avtaler og inntekt per ansatt</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingEmployees ? (
            <div className="h-80 flex items-center justify-center text-gray-500">Laster...</div>
          ) : employeePerformanceData.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-gray-500">Ingen data tilgjengelig</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={employeePerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="navn" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="avtaler" fill="#4a90e2" name="Avtaler" />
                <Bar yAxisId="right" dataKey="inntekt" fill="#50c878" name="Inntekt (kr)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Services Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#50c878]" />
            Mest Populære Tjenester
          </CardTitle>
          <CardDescription>Topp 10 mest bookede tjenester</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingServices ? (
            <div className="h-80 flex items-center justify-center text-gray-500">Laster...</div>
          ) : topServicesData.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-gray-500">Ingen data tilgjengelig</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topServicesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="tjeneste" type="category" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="bookinger" fill="#50c878" name="Bookinger" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Appointment Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#f4a261]" />
            Avtale Status Fordeling
          </CardTitle>
          <CardDescription>Fordeling av avtaler etter status</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingStatus ? (
            <div className="h-80 flex items-center justify-center text-gray-500">Laster...</div>
          ) : statusDistributionData.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-gray-500">Ingen data tilgjengelig</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
