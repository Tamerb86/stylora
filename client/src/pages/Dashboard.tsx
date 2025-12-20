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
  Sparkles
} from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { data: stats, isLoading } = trpc.dashboard.todayStats.useQuery();
  const { data: wizardStatus } = trpc.wizard.getStatus.useQuery();
  const { data: upcomingAppointments } = trpc.appointments.list.useQuery({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  const [, setLocation] = useLocation();
  const isRTL = i18n.language === 'ar';

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
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[200px] bg-muted rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    {
      label: t('dashboard.todayAppointments'),
      value: stats?.todayAppointments || 0,
      bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
      textColor: "text-blue-700",
      icon: CalendarPlus,
      iconBg: "bg-blue-500",
    },
    {
      label: t('dashboard.pending'),
      value: stats?.pendingAppointments || 0,
      bgColor: "bg-gradient-to-br from-amber-50 to-amber-100",
      textColor: "text-amber-700",
      icon: AlertCircle,
      iconBg: "bg-amber-500",
    },
    {
      label: t('dashboard.completed'),
      value: stats?.completedAppointments || 0,
      bgColor: "bg-gradient-to-br from-emerald-50 to-emerald-100",
      textColor: "text-emerald-700",
      icon: CheckCircle2,
      iconBg: "bg-emerald-500",
    },
    {
      label: t('dashboard.totalCustomers'),
      value: stats?.totalCustomers || 0,
      bgColor: "bg-gradient-to-br from-purple-50 to-purple-100",
      textColor: "text-purple-700",
      icon: User,
      iconBg: "bg-purple-500",
    },
  ];

  const quickActions = [
    {
      label: t('dashboard.newAppointment'),
      icon: CalendarPlus,
      onClick: () => setLocation("/appointments"),
      color: "from-blue-600 via-blue-500 to-cyan-500",
    },
    {
      label: t('dashboard.newCustomer'),
      icon: UserPlus,
      onClick: () => setLocation("/customers"),
      color: "from-purple-600 via-purple-500 to-pink-500",
    },
    {
      label: t('dashboard.newSale'),
      icon: ShoppingCart,
      onClick: () => setLocation("/pos"),
      color: "from-orange-600 via-orange-500 to-red-500",
    },
  ];

  const formatTime = (dateString: string, timeString: string) => {
    return timeString ? timeString.substring(0, 5) : "N/A";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = i18n.language === 'ar' ? 'ar-SA' : 
                   i18n.language === 'uk' ? 'uk-UA' : 
                   i18n.language === 'en' ? 'en-US' : 'no-NO';
    return date.toLocaleDateString(locale, { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
            <Sparkles className="w-10 h-10 text-blue-600" />
            {t('dashboard.title')}
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {t('dashboard.welcome')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card 
                key={index} 
                className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <CardContent className={`${card.bgColor} p-6 relative`}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <p className={`${card.textColor} text-sm font-semibold opacity-90`}>
                        {card.label}
                      </p>
                      <p className={`${card.textColor} text-5xl font-bold tracking-tight`}>
                        {card.value}
                      </p>
                    </div>
                    <div className={`${card.iconBg} p-4 rounded-2xl shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  {/* Decorative element */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              {t('dashboard.quickActions')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    onClick={action.onClick}
                    className={`h-28 bg-gradient-to-r ${action.color} hover:opacity-90 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl border-0`}
                    size="lg"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                        <Icon className="w-7 h-7" />
                      </div>
                      <span className="text-lg font-bold">{action.label}</span>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Appointments */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                {t('dashboard.upcomingAppointments')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {upcomingAppointments && upcomingAppointments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAppointments.slice(0, 5).map((appointment: any) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl hover:from-slate-100 hover:to-slate-200 transition-all duration-300 cursor-pointer border border-slate-200 hover:shadow-md"
                      onClick={() => setLocation("/appointments")}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {appointment.customerFirstName?.[0] || "?"}
                        </div>
                        <div>
                          <p className="font-bold text-lg">
                            {appointment.customerFirstName} {appointment.customerLastName}
                          </p>
                          <p className="text-sm text-muted-foreground font-medium">
                            {formatDate(appointment.appointmentDate)} • {formatTime(appointment.appointmentDate, appointment.startTime)}
                          </p>
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm ${
                        appointment.status === 'confirmed' ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white' :
                        appointment.status === 'pending' ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white' :
                        'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                      }`}>
                        {appointment.status === 'confirmed' ? t('dashboard.confirmed') :
                         appointment.status === 'pending' ? t('dashboard.pendingStatus') :
                         appointment.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
                    <Clock className="w-10 h-10 opacity-50" />
                  </div>
                  <p className="text-lg font-semibold mb-2">{t('dashboard.noAppointments')}</p>
                  <p className="text-sm mb-4">{t('dashboard.createAppointment')}</p>
                  <Button
                    variant="outline"
                    size="lg"
                    className="mt-3 border-2 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600 transition-all"
                    onClick={() => setLocation("/appointments")}
                  >
                    {t('dashboard.createAppointment')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Performance */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                {t('dashboard.todayPerformance')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-all">
                  <div>
                    <p className="text-sm text-blue-700 font-bold mb-1">{t('dashboard.totalAppointments')}</p>
                    <p className="text-4xl font-black text-blue-800">
                      {stats?.todayAppointments || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg">
                    <CalendarPlus className="w-10 h-10 text-white" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-5 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200 shadow-sm hover:shadow-md transition-all">
                  <div>
                    <p className="text-sm text-emerald-700 font-bold mb-1">{t('dashboard.completedCount')}</p>
                    <p className="text-4xl font-black text-emerald-800">
                      {stats?.completedAppointments || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl shadow-lg">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 shadow-sm hover:shadow-md transition-all">
                  <div>
                    <p className="text-sm text-amber-700 font-bold mb-1">{t('dashboard.pendingCount')}</p>
                    <p className="text-4xl font-black text-amber-800">
                      {stats?.pendingAppointments || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg">
                    <AlertCircle className="w-10 h-10 text-white" />
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full h-14 text-lg font-bold border-2 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-500 hover:text-blue-600 transition-all"
                  onClick={() => setLocation("/analytics")}
                >
                  {t('dashboard.viewFullAnalytics')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
