import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Calendar,
  Clock,
  User,
  Scissors,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export default function TodayAppointments() {
  const { data: appointments = [], isLoading } =
    trpc.appointments.getToday.useQuery();

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500">Bekreftet</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Venter</Badge>;
      case "completed":
        return <Badge className="bg-blue-500">Fullført</Badge>;
      case "canceled":
        return <Badge variant="destructive">Kansellert</Badge>;
      case "no_show":
        return <Badge variant="secondary">Ikke møtt</Badge>;
      default:
        return <Badge variant="outline">Ukjent</Badge>;
    }
  };

  const formatTime = (timeStr: string | Date) => {
    if (!timeStr) return "";
    const time = typeof timeStr === "string" ? timeStr : timeStr.toISOString();
    return time.substring(11, 16); // Extract HH:MM from ISO string
  };

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Dagens avtaler
            </CardTitle>
            <CardDescription>
              {format(new Date(), "EEEE d. MMMM yyyy", { locale: nb })}
            </CardDescription>
          </div>
          <Link href="/timebok">
            <Button variant="outline" size="sm" className="gap-2">
              Se alle
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Ingen avtaler i dag</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt: any) => (
              <div
                key={apt.id}
                className="flex items-center justify-between p-4 rounded-lg border-2 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Time */}
                  <div className="flex items-center gap-2 min-w-[80px]">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold text-gray-900">
                      {formatTime(apt.startTime)}
                    </span>
                  </div>

                  {/* Customer */}
                  <div className="flex items-center gap-2 min-w-[150px]">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900">
                      {apt.customerName || `Kunde #${apt.customerId}`}
                    </span>
                  </div>

                  {/* Services */}
                  <div className="flex items-center gap-2 flex-1">
                    <Scissors className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {apt.services && apt.services.length > 0
                        ? apt.services.join(", ")
                        : "Ingen tjeneste"}
                    </span>
                  </div>

                  {/* Employee */}
                  <div className="text-sm text-gray-600 min-w-[120px]">
                    <span className="font-medium">
                      {apt.employeeName || `Ansatt #${apt.employeeId}`}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="ml-4">{getStatusBadge(apt.status)}</div>
              </div>
            ))}

            {/* Summary */}
            {appointments.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {appointments.length}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Totalt</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {
                        appointments.filter(
                          (a: any) => a.status === "confirmed"
                        ).length
                      }
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Bekreftet</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {
                        appointments.filter((a: any) => a.status === "pending")
                          .length
                      }
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Venter</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {
                        appointments.filter(
                          (a: any) => a.status === "completed"
                        ).length
                      }
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Fullført</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
