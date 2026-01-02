import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarPlus,
  UserPlus,
  ShoppingCart,
  Clock,
  User,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Users,
  Star,
  Package,
  ArrowUpRight,
  Activity,
  Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import AppointmentsChart from "@/components/charts/AppointmentsChart";
import StatusDistributionChart from "@/components/charts/StatusDistributionChart";
import MiniCalendar from "@/components/MiniCalendar";
import TodayAppointments from "@/components/TodayAppointments";
import { BarChart3, PieChart, Calendar as CalendarIcon } from "lucide-react";
import QuickBookingDialog from "@/components/QuickBookingDialog";
import { useState } from "react";

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { data: stats, isLoading } = trpc.dashboard.todayStats.useQuery();
  const { data: wizardStatus } = trpc.wizard.getStatus.useQuery();
  const { data: upcomingAppointments } = trpc.appointments.list.useQuery({
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
  });
  const { data: employees } = trpc.employees.list.useQuery();
  const { data: services } = trpc.services.list.useQuery();
  const { data: appointmentsOverTime } =
    trpc.dashboard.appointmentsOverTime.useQuery();
  const { data: statusDistribution } =
    trpc.dashboard.statusDistribution.useQuery();
  const [, setLocation] = useLocation();
  const isRTL = i18n.language === "ar";
  const [showQuickBooking, setShowQuickBooking] = useState(false);

  // Redirect to wizard if not completed
  if (wizardStatus && !wizardStatus.onboardingCompleted) {
    setLocation("/setup-wizard");
    return null;
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="h-[140px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    {
      label: t("dashboard.todayAppointments"),
      value: stats?.todayAppointments || 0,
      gradient: "from-blue-500 via-blue-600 to-indigo-600",
      icon: CalendarPlus,
      iconBg: "bg-white/20",
      trend: "+12%",
      trendUp: true,
    },
    {
      label: t("dashboard.pending"),
      value: stats?.pendingAppointments || 0,
      gradient: "from-amber-500 via-orange-500 to-red-500",
      icon: AlertCircle,
      iconBg: "bg-white/20",
      trend: "-5%",
      trendUp: false,
    },
    {
      label: t("dashboard.completed"),
      value: stats?.completedAppointments || 0,
      gradient: "from-emerald-500 via-green-500 to-teal-500",
      icon: CheckCircle2,
      iconBg: "bg-white/20",
      trend: "+18%",
      trendUp: true,
    },
    {
      label: t("dashboard.totalCustomers"),
      value: stats?.totalCustomers || 0,
      gradient: "from-purple-500 via-violet-500 to-pink-500",
      icon: User,
      iconBg: "bg-white/20",
      trend: "+24%",
      trendUp: true,
    },
  ];

  const quickActions = [
    {
      label: t("dashboard.quickBooking", "Quick Booking"),
      icon: CalendarPlus,
      onClick: () => setShowQuickBooking(true),
      gradient: "from-blue-600 via-cyan-500 to-teal-500",
      description: "Book new appointment",
    },
    {
      label: t("dashboard.newCustomer"),
      icon: UserPlus,
      onClick: () => setLocation("/customers"),
      gradient: "from-purple-600 via-pink-500 to-rose-500",
      description: "Add new customer",
    },
    {
      label: t("dashboard.newSale"),
      icon: ShoppingCart,
      onClick: () => setLocation("/pos"),
      gradient: "from-orange-600 via-amber-500 to-yellow-500",
      description: "Create new sale",
    },
  ];

  const formatTime = (dateString: string, timeString: string) => {
    return timeString ? timeString.substring(0, 5) : "N/A";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale =
      i18n.language === "ar"
        ? "ar-SA"
        : i18n.language === "uk"
          ? "uk-UA"
          : i18n.language === "en"
            ? "en-US"
            : "no-NO";
    return date.toLocaleDateString(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  // Calculate salon insights
  const activeEmployees = employees?.filter(e => e.isActive).length || 0;
  const totalServices = services?.length || 0;
  const mostPopularService = services?.[0]?.name || t("dashboard.noData");

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 min-h-screen">
        {/* Welcome Header - Enhanced with Animation */}
        <div className="mb-6 animate-in fade-in slide-in-from-top duration-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl shadow-lg animate-pulse">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t("dashboard.title")}
              </h1>
              <p className="text-muted-foreground text-sm md:text-base flex items-center gap-2">
                <Activity className="w-4 h-4" />
                {t("dashboard.welcome")}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid - Enhanced Cards with Gradients */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 animate-in fade-in slide-in-from-bottom"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Gradient Background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-100`}
                ></div>

                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.8),rgba(255,255,255,0))]"></div>
                </div>

                {/* Content */}
                <CardContent className="relative p-6 text-white">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <p className="text-white/90 text-sm font-medium">
                        {card.label}
                      </p>
                      <p className="text-5xl font-bold tracking-tight">
                        {card.value}
                      </p>
                    </div>
                    <div
                      className={`${card.iconBg} p-3 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                  </div>

                  {/* Trend Indicator */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        card.trendUp ? "bg-white/20" : "bg-black/20"
                      }`}
                    >
                      <ArrowUpRight
                        className={`w-3 h-3 ${card.trendUp ? "" : "rotate-90"}`}
                      />
                      {card.trend}
                    </div>
                    <span className="text-xs text-white/80">vs last week</span>
                  </div>
                </CardContent>
              </div>
            );
          })}
        </div>

        {/* Quick Actions - Enhanced with Gradients */}
        <Card className="border-0 shadow-xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom duration-700">
          <CardHeader className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                <Zap className="w-5 h-5" />
              </div>
              {t("dashboard.quickActions")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 bg-gradient-to-br from-white to-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    onClick={action.onClick}
                    className={`group relative h-28 bg-gradient-to-br ${action.gradient} hover:opacity-90 transition-all duration-500 hover:scale-105 shadow-lg hover:shadow-2xl border-0 overflow-hidden`}
                  >
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.3),rgba(255,255,255,0))] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="relative flex flex-col items-center gap-3">
                      <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                        <Icon className="w-7 h-7" />
                      </div>
                      <div className="text-center">
                        <span className="text-base font-bold block">
                          {action.label}
                        </span>
                        <span className="text-xs opacity-90">
                          {action.description}
                        </span>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Today's Appointments Widget */}
        <div className="animate-in fade-in slide-in-from-bottom duration-700">
          <TodayAppointments />
        </div>

        {/* Salon Insights - Enhanced */}
        <Card className="border-0 shadow-xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom duration-700">
          <CardHeader className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                <TrendingUp className="w-5 h-5" />
              </div>
              {t("dashboard.salonInsights")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 bg-gradient-to-br from-white to-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="group relative p-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.3),rgba(255,255,255,0))]"></div>
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm font-semibold text-white/90">
                      {t("dashboard.activeStaff")}
                    </p>
                  </div>
                  <p className="text-4xl font-bold text-white">
                    {activeEmployees}
                  </p>
                </div>
              </div>

              <div className="group relative p-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.3),rgba(255,255,255,0))]"></div>
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm font-semibold text-white/90">
                      {t("dashboard.totalServices")}
                    </p>
                  </div>
                  <p className="text-4xl font-bold text-white">
                    {totalServices}
                  </p>
                </div>
              </div>

              <div className="group relative p-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.3),rgba(255,255,255,0))]"></div>
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm font-semibold text-white/90">
                      {t("dashboard.popularService")}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-white truncate">
                    {mostPopularService}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Section - Enhanced */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 animate-in fade-in slide-in-from-left duration-700">
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden h-full">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  {t("dashboard.appointmentsTrend")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 bg-gradient-to-br from-white to-blue-50/30">
                {appointmentsOverTime ? (
                  <AppointmentsChart data={appointmentsOverTime} />
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    {t("dashboard.noData", "No data available")}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="animate-in fade-in slide-in-from-right duration-700">
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden h-full">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                    <PieChart className="w-5 h-5" />
                  </div>
                  {t("dashboard.statusDistribution")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 bg-gradient-to-br from-white to-purple-50/30">
                {statusDistribution ? (
                  <StatusDistributionChart data={statusDistribution} />
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    {t("dashboard.noData", "No data available")}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mini Calendar - Enhanced */}
        <div className="animate-in fade-in slide-in-from-bottom duration-700">
          <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                {t("dashboard.monthlyCalendar")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 bg-gradient-to-br from-white to-emerald-50/30">
              <MiniCalendar />
            </CardContent>
          </Card>
        </div>

        {/* Quick Booking Dialog */}
        <QuickBookingDialog
          open={showQuickBooking}
          onOpenChange={setShowQuickBooking}
        />
      </div>
    </DashboardLayout>
  );
}
