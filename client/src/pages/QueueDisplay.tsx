import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap, Users, Clock, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { nb, enUS, ar, uk } from "date-fns/locale";
import { useTranslation } from "react-i18next";

export default function QueueDisplay() {
  const { t, i18n } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [prevQueueLength, setPrevQueueLength] = useState(0);

  // Get locale for date formatting
  const getDateLocale = () => {
    switch (i18n.language) {
      case "ar":
        return ar;
      case "en":
        return enUS;
      case "uk":
        return uk;
      default:
        return nb;
    }
  };

  // Fetch queue with auto-refresh every 10 seconds
  const { data: queue } = trpc.walkInQueue.getQueue.useQuery(undefined, {
    refetchInterval: 10000, // 10 seconds
  });

  const { data: barberStats } = trpc.walkInQueue.getAvailableBarbers.useQuery(
    undefined,
    {
      refetchInterval: 10000,
    }
  );

  const { data: services } = trpc.services.list.useQuery();

  // Fetch intelligent wait times
  const { data: waitTimesData } = trpc.walkInQueue.calculateWaitTimes.useQuery(
    undefined,
    {
      refetchInterval: 15000, // 15 seconds
    }
  );

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Get intelligent wait time from backend
  const getIntelligentWaitTime = (queueId: number) => {
    const waitTimeInfo = waitTimesData?.waitTimes?.find(
      (wt: any) => wt.queueId === queueId
    );
    if (waitTimeInfo) {
      return {
        estimated: waitTimeInfo.estimatedWaitMinutes,
        color: waitTimeInfo.color,
      };
    }
    return { estimated: 15, color: "green" };
  };

  const getWaitTimeGradient = (color: string) => {
    const gradients: Record<string, string> = {
      green: "from-green-500 to-emerald-600",
      yellow: "from-yellow-500 to-amber-600",
      orange: "from-orange-500 to-red-500",
      red: "from-red-500 to-rose-700",
    };
    return gradients[color] || "from-gray-500 to-gray-600";
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      vip: {
        icon: <Crown className="h-5 w-5" />,
        label: t("walkInQueue.priority.vip"),
        className: "bg-purple-500 text-white border-0 text-lg px-4 py-2",
      },
      urgent: {
        icon: <Zap className="h-5 w-5" />,
        label: t("walkInQueue.priority.urgent"),
        className: "bg-orange-500 text-white border-0 text-lg px-4 py-2",
      },
      normal: {
        icon: <Users className="h-5 w-5" />,
        label: t("walkInQueue.priority.normal"),
        className: "bg-gray-400 text-white border-0 text-lg px-4 py-2",
      },
    };

    const badge = badges[priority as keyof typeof badges] || badges.normal;

    return (
      <Badge variant="outline" className={`gap-2 ${badge.className}`}>
        {badge.icon}
        {badge.label}
      </Badge>
    );
  };

  // Sort queue by priority then position
  const sortedQueue = [...(queue || [])].sort((a, b) => {
    const priorityOrder = { vip: 0, urgent: 1, normal: 2 };
    const aPriority =
      priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2;
    const bPriority =
      priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2;

    if (aPriority !== bPriority) return aPriority - bPriority;
    return a.position - b.position;
  });

  const waitingCustomers =
    sortedQueue.filter((q: any) => q.status === "waiting") || [];

  // Track queue length changes for animation
  useEffect(() => {
    if (waitingCustomers.length !== prevQueueLength) {
      setPrevQueueLength(waitingCustomers.length);
    }
  }, [waitingCustomers.length]);

  // Get first name only for privacy
  const getFirstName = (fullName: string) => {
    return fullName.split(" ")[0];
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8"
      dir={i18n.language === "ar" ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4 mb-6 animate-fade-in">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-xl">
              <span className="text-4xl font-bold text-white">S</span>
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Stylora
            </h1>
          </div>

          <h2 className="text-4xl font-semibold text-gray-800 dark:text-gray-100">
            {t("walkInQueue.title")}
          </h2>

          <div className="flex items-center justify-center gap-8 text-2xl text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8" />
              <span className="font-mono font-semibold">
                {format(currentTime, "HH:mm:ss", { locale: getDateLocale() })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8" />
              <span className="font-semibold">
                {waitingCustomers.length} {t("walkInQueue.inQueue")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <span className="font-semibold text-green-600">
                {barberStats?.available || 0} {t("walkInQueue.availableStaff")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Queue List */}
      <div className="max-w-7xl mx-auto">
        {waitingCustomers.length === 0 ? (
          <Card className="p-16 text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 animate-fade-in">
            <Users className="h-32 w-32 mx-auto mb-6 text-gray-300 dark:text-gray-600 animate-pulse" />
            <p className="text-4xl font-semibold text-gray-500 dark:text-gray-400">
              {t("walkInQueue.noCustomers")}
            </p>
            <p className="text-2xl text-gray-400 dark:text-gray-500 mt-4">
              {t("walkInQueue.welcomeIn")}
            </p>
          </Card>
        ) : (
          <div className="grid gap-6">
            {waitingCustomers.map((customer: any, index: number) => {
              const service = services?.find(
                (s: any) => s.id === customer.serviceId
              );
              const waitTime = getIntelligentWaitTime(customer.id);

              return (
                <Card
                  key={customer.id}
                  className="p-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 hover:shadow-2xl transition-all duration-300 animate-slide-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between">
                    {/* Position Number */}
                    <div className="flex items-center gap-6">
                      <div
                        className={`h-24 w-24 rounded-2xl bg-gradient-to-br ${getWaitTimeGradient(waitTime.color)} flex items-center justify-center shadow-lg animate-scale-in`}
                      >
                        <span className="text-5xl font-bold text-white">
                          {index + 1}
                        </span>
                      </div>

                      {/* Customer Info */}
                      <div className="space-y-2">
                        <h3 className="text-4xl font-bold text-gray-800 dark:text-gray-100">
                          {getFirstName(customer.customerName)}
                        </h3>
                        <p className="text-2xl text-gray-600 dark:text-gray-300">
                          {service?.name || t("walkInQueue.service")}
                        </p>
                        <div className="flex items-center gap-3">
                          {getPriorityBadge(customer.priority)}
                        </div>
                      </div>
                    </div>

                    {/* Wait Time */}
                    <div className="text-right space-y-2">
                      <div className="text-2xl text-gray-500 dark:text-gray-400">
                        {t("walkInQueue.waitTime")}
                      </div>
                      <div
                        className={`text-6xl font-bold bg-gradient-to-r ${getWaitTimeGradient(waitTime.color)} bg-clip-text text-transparent animate-pulse-slow`}
                      >
                        ~{waitTime.estimated} {t("walkInQueue.minutes")}
                      </div>
                      <div className="text-xl text-gray-500 dark:text-gray-400">
                        {t("walkInQueue.serviceDuration")}:{" "}
                        {service?.durationMinutes || 30}{" "}
                        {t("walkInQueue.minutes")}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="max-w-7xl mx-auto mt-12 text-center">
        <p className="text-2xl text-gray-500 dark:text-gray-400">
          {t("walkInQueue.estimatedNote")}
        </p>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scale-in {
          from {
            transform: scale(0.8);
          }
          to {
            transform: scale(1);
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .animate-slide-in {
          animation: slide-in 0.6s ease-out backwards;
        }
        
        .animate-scale-in {
          animation: scale-in 0.4s ease-out;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
