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
  AlertCircle
} from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading } = trpc.dashboard.todayStats.useQuery();
  const { data: wizardStatus } = trpc.wizard.getStatus.useQuery();
  const { data: upcomingAppointments } = trpc.appointments.list.useQuery({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  const [, setLocation] = useLocation();

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
      label: "Dagens avtaler",
      value: stats?.todayAppointments || 0,
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      icon: CalendarPlus,
    },
    {
      label: "Ventende",
      value: stats?.pendingAppointments || 0,
      bgColor: "bg-pink-50",
      textColor: "text-pink-600",
      icon: AlertCircle,
    },
    {
      label: "Fullførte avtaler",
      value: stats?.completedAppointments || 0,
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      icon: CheckCircle2,
    },
    {
      label: "Totalt kunder",
      value: stats?.totalCustomers || 0,
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
      icon: User,
    },
  ];

  const quickActions = [
    {
      label: "Ny avtale",
      icon: CalendarPlus,
      onClick: () => setLocation("/appointments"),
      color: "from-blue-600 to-purple-600",
    },
    {
      label: "Ny kunde",
      icon: UserPlus,
      onClick: () => setLocation("/customers"),
      color: "from-purple-600 to-pink-600",
    },
    {
      label: "Nytt salg (POS)",
      icon: ShoppingCart,
      onClick: () => setLocation("/pos"),
      color: "from-orange-600 to-red-600",
    },
  ];

  const formatTime = (dateString: string, timeString: string) => {
    return timeString ? timeString.substring(0, 5) : "N/A";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("no-NO", { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card key={index} className="overflow-hidden">
                <CardContent className={`${card.bgColor} p-6`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`${card.textColor} text-sm font-medium opacity-80`}>
                        {card.label}
                      </p>
                      <p className={`${card.textColor} text-4xl font-bold mt-2`}>
                        {card.value}
                      </p>
                    </div>
                    <div className={`${card.bgColor} p-3 rounded-full`}>
                      <Icon className={`${card.textColor} w-8 h-8`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Hurtighandlinger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    onClick={action.onClick}
                    className={`h-24 bg-gradient-to-r ${action.color} hover:opacity-90 transition-opacity`}
                    size="lg"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Icon className="w-6 h-6" />
                      <span className="text-base font-semibold">{action.label}</span>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Kommende avtaler
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingAppointments && upcomingAppointments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAppointments.slice(0, 5).map((appointment: any) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => setLocation("/appointments")}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {appointment.customerFirstName?.[0] || "?"}
                        </div>
                        <div>
                          <p className="font-medium">
                            {appointment.customerFirstName} {appointment.customerLastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(appointment.appointmentDate)} • {formatTime(appointment.appointmentDate, appointment.startTime)}
                          </p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        appointment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {appointment.status === 'confirmed' ? 'Bekreftet' :
                         appointment.status === 'pending' ? 'Venter' :
                         appointment.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Ingen kommende avtaler</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setLocation("/appointments")}
                  >
                    Opprett ny avtale
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Dagens ytelse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Totale avtaler</p>
                    <p className="text-3xl font-bold text-blue-700 mt-1">
                      {stats?.todayAppointments || 0}
                    </p>
                  </div>
                  <CalendarPlus className="w-10 h-10 text-blue-600 opacity-50" />
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Fullførte</p>
                    <p className="text-3xl font-bold text-green-700 mt-1">
                      {stats?.completedAppointments || 0}
                    </p>
                  </div>
                  <CheckCircle2 className="w-10 h-10 text-green-600 opacity-50" />
                </div>

                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                  <div>
                    <p className="text-sm text-orange-600 font-medium">Ventende</p>
                    <p className="text-3xl font-bold text-orange-700 mt-1">
                      {stats?.pendingAppointments || 0}
                    </p>
                  </div>
                  <AlertCircle className="w-10 h-10 text-orange-600 opacity-50" />
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setLocation("/analytics")}
                >
                  Se fullstendig analyse →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
