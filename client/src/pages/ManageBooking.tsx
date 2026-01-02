import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export default function ManageBooking() {
  const [, params] = useRoute("/manage-booking/:token");
  const token = params?.token || "";

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");

  const {
    data: booking,
    isLoading,
    refetch,
  } = trpc.publicBooking.getBookingByToken.useQuery(
    { token },
    { enabled: !!token }
  );

  const { data: availableSlots = [] } =
    trpc.publicBooking.getAvailableTimeSlots.useQuery(
      {
        tenantId: booking?.tenantId || "",
        date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : "",
        serviceId: booking?.services[0]?.name ? 1 : 0, // Simplified - would need service ID
        employeeId: booking?.employeeId,
      },
      {
        enabled: !!selectedDate && !!booking,
      }
    );

  const cancelMutation = trpc.publicBooking.cancelBooking.useMutation({
    onSuccess: data => {
      toast.success(data.message);
      setShowCancelDialog(false);
      refetch();
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const rescheduleMutation = trpc.publicBooking.rescheduleBooking.useMutation({
    onSuccess: data => {
      toast.success(data.message);
      setShowRescheduleDialog(false);
      setSelectedDate(undefined);
      setSelectedTime("");
      refetch();
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const handleCancel = () => {
    if (!token) return;
    cancelMutation.mutate({
      token,
      reason: cancellationReason || undefined,
    });
  };

  const handleReschedule = () => {
    if (!token || !selectedDate || !selectedTime) {
      toast.error("Vennligst velg ny dato og tid");
      return;
    }
    rescheduleMutation.mutate({
      token,
      newDate: format(selectedDate, "yyyy-MM-dd"),
      newTime: selectedTime,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Laster booking...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-purple-50/30 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <div className="flex items-center gap-3 text-red-600 mb-2">
              <XCircle className="h-8 w-8" />
              <CardTitle>Booking ikke funnet</CardTitle>
            </div>
            <CardDescription>
              Vi kunne ikke finne bookingen din. Vennligst sjekk linken eller
              kontakt salongen direkte.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const appointmentDate = new Date(booking.startTime);
  const isCompleted = booking.status === "completed";
  const isCanceled = booking.status === "canceled";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-purple-50/30 py-12">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Din Booking</h1>
          <p className="text-gray-600">
            Administrer din time hos {booking.salonName}
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center mb-6">
          {isCanceled && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">Kansellert</span>
            </div>
          )}
          {isCompleted && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Fullført</span>
            </div>
          )}
          {!isCanceled && !isCompleted && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Bekreftet</span>
            </div>
          )}
        </div>

        {/* Booking Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Bookingdetaljer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CalendarIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Dato og tid</p>
                  <p className="font-medium">
                    {format(appointmentDate, "EEEE d. MMMM yyyy", {
                      locale: nb,
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    Kl. {format(appointmentDate, "HH:mm")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Frisør</p>
                  <p className="font-medium">{booking.employeeName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Kunde</p>
                  <p className="font-medium">{booking.customerName}</p>
                  <p className="text-sm text-gray-600">
                    {booking.customerPhone}
                  </p>
                  {booking.customerEmail && (
                    <p className="text-sm text-gray-600">
                      {booking.customerEmail}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Salong</p>
                  <p className="font-medium">{booking.salonName}</p>
                  {booking.salonAddress && (
                    <p className="text-sm text-gray-600">
                      {booking.salonAddress}
                    </p>
                  )}
                  {booking.salonPhone && (
                    <p className="text-sm text-gray-600">
                      {booking.salonPhone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-2">Tjenester</p>
              {booking.services.map((service, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center mb-1"
                >
                  <span className="font-medium">{service.name}</span>
                  <span className="text-gray-600">{service.price} kr</span>
                </div>
              ))}
              <div className="flex justify-between items-center mt-3 pt-3 border-t font-bold">
                <span>Totalt</span>
                <span>{booking.totalPrice} kr</span>
              </div>
            </div>

            {booking.notes && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-1">Notater</p>
                <p className="text-gray-700">{booking.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cancellation Policy */}
        {!isCanceled && !isCompleted && (
          <Card className="mb-6 border-blue-200 bg-blue-50/50">
            <CardHeader>
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <CardTitle className="text-blue-900">
                    Avbestillingsregler
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    Du kan avbestille eller endre timen din gratis frem til{" "}
                    {booking.cancellationWindowHours} timer før avtalt tid.
                    Avbestilling etter dette regnes som sen avbestilling.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Action Buttons */}
        {!isCanceled && !isCompleted && (
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => setShowRescheduleDialog(true)}
              disabled={!booking.canReschedule}
              className="flex-1"
              variant="outline"
            >
              <Clock className="h-4 w-4 mr-2" />
              Endre tid
            </Button>
            <Button
              onClick={() => setShowCancelDialog(true)}
              disabled={!booking.canCancel}
              variant="destructive"
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Avbestill
            </Button>
          </div>
        )}

        {!booking.canCancel && !isCanceled && !isCompleted && (
          <p className="text-center text-sm text-gray-500 mt-4">
            Du kan ikke lenger endre eller avbestille denne bookingen online.
            Vennligst kontakt salongen direkte på {booking.salonPhone}.
          </p>
        )}

        {/* Cancel Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Avbestill booking</DialogTitle>
              <DialogDescription>
                Er du sikker på at du vil avbestille denne bookingen?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Årsak til avbestilling (valgfritt)
                </label>
                <Textarea
                  value={cancellationReason}
                  onChange={e => setCancellationReason(e.target.value)}
                  placeholder="Fortell oss hvorfor du avbestiller..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(false)}
              >
                Avbryt
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending
                  ? "Avbestiller..."
                  : "Bekreft avbestilling"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reschedule Dialog */}
        <Dialog
          open={showRescheduleDialog}
          onOpenChange={setShowRescheduleDialog}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Endre tid</DialogTitle>
              <DialogDescription>
                Velg ny dato og tid for din booking
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Velg ny dato
                </label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={date => date < new Date()}
                  className="rounded-md border"
                  locale={nb}
                />
              </div>
              {selectedDate && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Velg ny tid
                  </label>
                  {availableSlots.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Ingen ledige tider denne dagen
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map(slot => (
                        <Button
                          key={slot.time}
                          variant={
                            selectedTime === slot.time ? "default" : "outline"
                          }
                          onClick={() => setSelectedTime(slot.time)}
                          className="text-sm"
                        >
                          {slot.time}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRescheduleDialog(false);
                  setSelectedDate(undefined);
                  setSelectedTime("");
                }}
              >
                Avbryt
              </Button>
              <Button
                onClick={handleReschedule}
                disabled={
                  !selectedDate || !selectedTime || rescheduleMutation.isPending
                }
              >
                {rescheduleMutation.isPending ? "Endrer..." : "Bekreft endring"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
