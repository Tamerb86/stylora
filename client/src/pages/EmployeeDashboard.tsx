import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Clock, User, Scissors, Phone, Mail, CheckCircle, XCircle, AlertCircle, LogOut } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function EmployeeDashboard() {
  return (
    <DashboardLayout>
      <EmployeeDashboardContent />
    </DashboardLayout>
  );
}

function EmployeeDashboardContent() {
  const { user, logout, loading } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [noteText, setNoteText] = useState("");
  const [showNoteDialog, setShowNoteDialog] = useState(false);

  const { data: appointments, isLoading, refetch } = trpc.employee.myAppointments.useQuery({
    date: selectedDate,
  });

  const updateStatus = trpc.employee.updateAppointmentStatus.useMutation({
    onSuccess: () => {
      toast.success("Status oppdatert");
      refetch();
    },
    onError: (error) => {
      toast.error(`Feil: ${error.message}`);
    },
  });

  const addNote = trpc.employee.addAppointmentNote.useMutation({
    onSuccess: () => {
      toast.success("Notat lagt til");
      setShowNoteDialog(false);
      setNoteText("");
      setSelectedAppointment(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Feil: ${error.message}`);
    },
  });

  const handleAddNote = () => {
    if (!selectedAppointment || !noteText.trim()) return;
    addNote.mutate({
      appointmentId: selectedAppointment.id,
      note: noteText,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laster...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Logg inn</CardTitle>
            <CardDescription>Du må logge inn for å se dine avtaler</CardDescription>
          </CardHeader>
          <CardContent>
            <a href={getLoginUrl()}>
              <Button className="w-full">
                Logg inn
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-blue-500"><CheckCircle className="w-3 h-3 mr-1" />Bekreftet</Badge>;
      case "completed":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Fullført</Badge>;
      case "canceled":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Avlyst</Badge>;
      case "no_show":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Møtte ikke</Badge>;
      case "pending":
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Venter</Badge>;
    }
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // HH:MM
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("no-NO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const goToPreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Stylora</h1>
            <p className="text-sm text-muted-foreground">Ansatt: {user.name}</p>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logg ut
          </Button>
        </div>
      </header>

      <div className="container py-8 max-w-4xl">
        {/* Date Navigation */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-4">
              <Button variant="outline" size="sm" onClick={goToPreviousDay}>
                ← Forrige dag
              </Button>
              <div className="text-center flex-1">
                <p className="text-lg font-semibold">{formatDate(selectedDate)}</p>
                <Button variant="link" size="sm" onClick={goToToday} className="text-xs">
                  Gå til i dag
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={goToNextDay}>
                Neste dag →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appointments List */}
        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Laster avtaler...
            </CardContent>
          </Card>
        ) : !appointments || appointments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium mb-2">Ingen avtaler denne dagen</p>
              <p className="text-sm text-muted-foreground">Du har ingen planlagte avtaler for {formatDate(selectedDate)}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment: any) => (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <Clock className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">
                          {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {appointment.services?.map((s: any) => s?.name).join(", ") || "Ingen tjeneste"}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(appointment.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Customer Info */}
                  <div className="bg-muted/50 p-4 rounded-lg mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{appointment.customer?.firstName} {appointment.customer?.lastName}</span>
                    </div>
                    {appointment.customer?.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Phone className="w-4 h-4" />
                        <a href={`tel:${appointment.customer.phone}`} className="hover:text-primary">
                          {appointment.customer.phone}
                        </a>
                      </div>
                    )}
                    {appointment.customer?.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <a href={`mailto:${appointment.customer.email}`} className="hover:text-primary">
                          {appointment.customer.email}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Services */}
                  {appointment.services && appointment.services.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                        <Scissors className="w-4 h-4" />
                        Tjenester:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {appointment.services.map((service: any) => (
                          <Badge key={service?.id} variant="outline">
                            {service?.name} - {service?.duration} min
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {appointment.notes && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-medium mb-1">Notater:</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{appointment.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {appointment.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus.mutate({ appointmentId: appointment.id, status: "confirmed" })}
                        disabled={updateStatus.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Bekreft
                      </Button>
                    )}
                    {(appointment.status === "pending" || appointment.status === "confirmed") && (
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => updateStatus.mutate({ appointmentId: appointment.id, status: "completed" })}
                        disabled={updateStatus.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Fullfør
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setShowNoteDialog(true);
                      }}
                    >
                      Legg til notat
                    </Button>
                    {appointment.status !== "canceled" && appointment.status !== "completed" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateStatus.mutate({ appointmentId: appointment.id, status: "canceled" })}
                        disabled={updateStatus.isPending}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Avlys
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Legg til notat</DialogTitle>
            <DialogDescription>
              Skriv et notat for denne avtalen
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Skriv notat her..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
              Avbryt
            </Button>
            <Button
              onClick={() => {
                if (selectedAppointment && noteText.trim()) {
                  addNote.mutate({
                    appointmentId: selectedAppointment.id,
                    note: noteText.trim(),
                  });
                }
              }}
              disabled={!noteText.trim() || addNote.isPending}
            >
              Lagre notat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
