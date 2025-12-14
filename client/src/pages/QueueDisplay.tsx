import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap, Users, Clock } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export default function QueueDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch queue with auto-refresh every 10 seconds
  const { data: queue } = trpc.walkInQueue.getQueue.useQuery(undefined, {
    refetchInterval: 10000, // 10 seconds
  });

  const { data: barberStats } = trpc.walkInQueue.getAvailableBarbers.useQuery(undefined, {
    refetchInterval: 10000,
  });

  const { data: services } = trpc.services.list.useQuery();

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate dynamic wait time
  const calculateDynamicWaitTime = (position: number, priority: string, serviceDuration: number) => {
    const availableBarbers = barberStats?.available || 1;
    const priorityMultiplier = priority === "vip" ? 0.5 : priority === "urgent" ? 0.75 : 1;
    
    const baseWaitTime = (position * serviceDuration) / availableBarbers;
    const adjustedWaitTime = Math.round(baseWaitTime * priorityMultiplier);
    
    return adjustedWaitTime;
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      vip: {
        icon: <Crown className="h-5 w-5" />,
        label: "VIP",
        className: "bg-purple-500 text-white border-0 text-lg px-4 py-2",
      },
      urgent: {
        icon: <Zap className="h-5 w-5" />,
        label: "Haster",
        className: "bg-orange-500 text-white border-0 text-lg px-4 py-2",
      },
      normal: {
        icon: <Users className="h-5 w-5" />,
        label: "Normal",
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
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2;
    
    if (aPriority !== bPriority) return aPriority - bPriority;
    return a.position - b.position;
  });

  const waitingCustomers = sortedQueue.filter((q: any) => q.status === "waiting") || [];

  // Get first name only for privacy
  const getFirstName = (fullName: string) => {
    return fullName.split(" ")[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-xl">
              <span className="text-4xl font-bold text-white">S</span>
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Stylora
            </h1>
          </div>
          
          <h2 className="text-4xl font-semibold text-gray-800 dark:text-gray-100">
            Walk-in Kø
          </h2>
          
          <div className="flex items-center justify-center gap-8 text-2xl text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8" />
              <span className="font-mono font-semibold">
                {format(currentTime, "HH:mm:ss", { locale: nb })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8" />
              <span className="font-semibold">
                {waitingCustomers.length} i kø
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Queue List */}
      <div className="max-w-7xl mx-auto">
        {waitingCustomers.length === 0 ? (
          <Card className="p-16 text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2">
            <Users className="h-32 w-32 mx-auto mb-6 text-gray-300 dark:text-gray-600" />
            <p className="text-4xl font-semibold text-gray-500 dark:text-gray-400">
              Ingen kunder i kø
            </p>
            <p className="text-2xl text-gray-400 dark:text-gray-500 mt-4">
              Velkommen inn!
            </p>
          </Card>
        ) : (
          <div className="grid gap-6">
            {waitingCustomers.map((customer: any, index: number) => {
              const service = services?.find((s: any) => s.id === customer.serviceId);
              const waitTime = calculateDynamicWaitTime(
                customer.position,
                customer.priority,
                service?.durationMinutes || 30
              );

              return (
                <Card
                  key={customer.id}
                  className="p-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 hover:shadow-2xl transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    {/* Position Number */}
                    <div className="flex items-center gap-6">
                      <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
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
                          {service?.name || "Tjeneste"}
                        </p>
                        <div className="flex items-center gap-3">
                          {getPriorityBadge(customer.priority)}
                        </div>
                      </div>
                    </div>

                    {/* Wait Time */}
                    <div className="text-right space-y-2">
                      <div className="text-2xl text-gray-500 dark:text-gray-400">
                        Ventetid
                      </div>
                      <div className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        {waitTime} min
                      </div>
                      <div className="text-xl text-gray-500 dark:text-gray-400">
                        ca. {service?.durationMinutes || 30} min behandling
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
          Ventetiden er estimert og kan variere
        </p>
      </div>
    </div>
  );
}
