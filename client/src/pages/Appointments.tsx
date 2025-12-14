import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/Calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Plus, ShoppingCart, Copy, Repeat } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Appointments() {
  const [, setLocation] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [notes, setNotes] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<"weekly" | "biweekly" | "monthly">("weekly");
  const [recurringEndType, setRecurringEndType] = useState<"date" | "count">("date");
  const [recurringEndDate, setRecurringEndDate] = useState("");
  const [recurringCount, setRecurringCount] = useState("4");
  const [viewingAppointment, setViewingAppointment] = useState<any>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [refundPreview, setRefundPreview] = useState<any>(null);

  // Create dates at midnight local time to avoid timezone issues
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  today.setDate(today.getDate() - 30); // Look back 30 days instead of 7
  const futureDate = new Date();
  futureDate.setHours(0, 0, 0, 0);
  futureDate.setDate(futureDate.getDate() + 60);
  
  const utils = trpc.useUtils();
  const { data: appointments = [] } = trpc.appointments.list.useQuery({ 
    startDate: today.toISOString(), 
    endDate: futureDate.toISOString() 
  });
  const { data: customers = [] } = trpc.customers.list.useQuery();
  const { data: services = [] } = trpc.services.list.useQuery();
  const { data: employees = [] } = trpc.employees.list.useQuery();
  
  // Fetch leaves and holidays for calendar
  const { data: leaves = [] } = trpc.leaves.getForDateRange.useQuery({
    startDate: today.toISOString(),
    endDate: futureDate.toISOString(),
  });
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const { data: holidays = [] } = trpc.holidays.getForMonth.useQuery({
    year: currentYear,
    month: currentMonth,
  });

  // Fetch available slots count for calendar
  const { data: availableSlotsCount = {} } = trpc.appointments.getAvailableSlotsCount.useQuery({
    startDate: today.toISOString().split('T')[0],
    endDate: futureDate.toISOString().split('T')[0],
  });

  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [conflictDetails, setConflictDetails] = useState<any>(null);

  const createRecurringMutation = trpc.appointments.createRecurring.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.appointmentIds.length} gjentakende avtaler opprettet!`);
      setIsCreateOpen(false);
      utils.appointments.list.invalidate();
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Kunne ikke opprette gjentakende avtaler");
    },
  });

  const createMutation = trpc.appointments.create.useMutation({
    onSuccess: () => {
      toast.success("Avtale opprettet!");
      setIsCreateOpen(false);
      utils.appointments.list.invalidate();
      resetForm();
    },
    onError: (error: any) => {
      console.log("Full error object:", error);
      console.log("Error message:", error.message);
      console.log("Error data:", error.data);
      console.log("Error shape:", error.shape);
      
      // Check if it's a conflict error - check both error.message and error.data
      const isConflict = error.message?.includes("APPOINTMENT_CONFLICT");
      const conflictData = error.data?.cause?.existingAppointment || error.shape?.data?.cause?.existingAppointment;
      
      if (isConflict && conflictData) {
        // Play alert sound
        const audio = new Audio('/sounds/alert.wav');
        audio.play().catch(err => console.log('Could not play sound:', err));
        
        setConflictDetails(conflictData);
        setConflictDialogOpen(true);
      } else {
        toast.error("Kunne ikke opprette avtale: " + error.message);
      }
    },
  });

  const updateStatusMutation = trpc.appointments.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status oppdatert!");
      setIsViewOpen(false);
      utils.appointments.list.invalidate();
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere status: " + error.message);
    },
  });

  const rescheduleMutation = trpc.appointments.reschedule.useMutation({
    onSuccess: () => {
      toast.success("Avtale flyttet!");
      utils.appointments.list.invalidate();
    },
    onError: (error) => {
      toast.error("Kunne ikke flytte avtale: " + error.message);
    },
  });

  const cancelWithRefundMutation = trpc.appointments.cancelWithRefund.useMutation({
    onSuccess: (data) => {
      if (data.refundProcessed) {
        toast.success(`Avtale avbrutt! Refusjon på ${data.refundAmount.toFixed(2)} NOK behandlet.`);
      } else if (data.refundAmount > 0 && data.error) {
        toast.warning(`Avtale avbrutt, men refusjon feilet: ${data.error}`);
      } else {
        toast.success("Avtale avbrutt!");
      }
      setIsCancelDialogOpen(false);
      setIsViewOpen(false);
      setCancelReason("");
      setRefundPreview(null);
      utils.appointments.list.invalidate();
    },
    onError: (error) => {
      toast.error("Kunne ikke avbryte avtale: " + error.message);
    },
  });

  const { data: refundCalc } = trpc.appointments.calculateRefund.useQuery(
    {
      appointmentId: viewingAppointment?.id || 0,
      cancellationType: "staff",
    },
    {
      enabled: isCancelDialogOpen && !!viewingAppointment,
    }
  );

  // Update refund preview when data changes
  useEffect(() => {
    if (refundCalc) {
      setRefundPreview(refundCalc);
    }
  }, [refundCalc]);

  const resetForm = () => {
    setSelectedDate("");
    setSelectedTime("");
    setSelectedCustomerId("");
    setSelectedServiceId("");
    setSelectedEmployeeId("");
    setNotes("");
    setIsRecurring(false);
    setRecurringFrequency("weekly");
    setRecurringEndType("date");
    setRecurringEndDate("");
    setRecurringCount("4");
  };

  // Set default date to today when dialog opens without a pre-selected date
  useEffect(() => {
    if (isCreateOpen && !selectedDate) {
      const today = new Date();
      setSelectedDate(today.toISOString().split("T")[0]);
    }
  }, [isCreateOpen]);

  const handleTimeSlotClick = (date: Date, time: string) => {
    setSelectedDate(date.toISOString().split("T")[0]);
    setSelectedTime(time);
    setIsCreateOpen(true);
  };

  const handleAppointmentClick = (appointment: any) => {
    setViewingAppointment(appointment);
    setIsViewOpen(true);
  };

  const handleCreate = () => {
    if (!selectedCustomerId || !selectedServiceId || !selectedEmployeeId || !selectedDate || !selectedTime) {
      toast.error("Vennligst fyll ut alle obligatoriske felt");
      return;
    }

    if (isRecurring) {
      // Validate recurring fields
      if (recurringEndType === "date" && !recurringEndDate) {
        toast.error("Vennligst velg sluttdato for gjentakende avtale");
        return;
      }
      if (recurringEndType === "count" && (!recurringCount || parseInt(recurringCount) < 2)) {
        toast.error("Antall gjentagelser må være minst 2");
        return;
      }

      const startTime = new Date(`${selectedDate}T${selectedTime}`);
      const service = services.find(s => s.id === parseInt(selectedServiceId));
      const endTime = new Date(startTime.getTime() + (service?.durationMinutes || 30) * 60000);

      createRecurringMutation.mutate({
        customerId: parseInt(selectedCustomerId),
        employeeId: parseInt(selectedEmployeeId),
        serviceId: parseInt(selectedServiceId),
        duration: service?.durationMinutes || 30,
        frequency: recurringFrequency,
        startDate: selectedDate,
        preferredTime: selectedTime,
        endDate: recurringEndType === "date" ? recurringEndDate : undefined,
        maxOccurrences: recurringEndType === "count" ? parseInt(recurringCount) : undefined,
        notes: notes || undefined,
      });
    } else {
      const startTime = new Date(`${selectedDate}T${selectedTime}`);
      const service = services.find(s => s.id === parseInt(selectedServiceId));
      const endTime = new Date(startTime.getTime() + (service?.durationMinutes || 30) * 60000);

      createMutation.mutate({
        customerId: parseInt(selectedCustomerId),
        employeeId: parseInt(selectedEmployeeId),
        appointmentDate: selectedDate,
        startTime: selectedTime,
        endTime: endTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }),
        serviceIds: [parseInt(selectedServiceId)],
        notes: notes || undefined,
      });
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case "confirmed":
        return "Bekreftet";
      case "pending":
        return "Venter";
      case "canceled":
        return "Avbrutt";
      case "completed":
        return "Fullført";
      case "no_show":
        return "Møtte ikke";
      default:
        return status || "Ukjent";
    }
  };

  // Keep appointments as-is (startTime and endTime are already in correct format from DB)
  const transformedAppointments = appointments;
  


  return (
    <DashboardLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Timebok" },
      ]}
    >
      <div className="p-6 max-w-[1400px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Timebok</h1>
            <p className="text-muted-foreground">Kalendervisning av avtaler</p>
          </div>
          <Button 
            size="lg"
            onClick={() => setIsCreateOpen(true)} 
            className="h-14 text-base bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Ny avtale
          </Button>
        </div>

        <CalendarComponent
          appointments={transformedAppointments}
          employees={employees}
          services={services}
          leaves={leaves}
          holidays={holidays}
          availableSlotsCount={availableSlotsCount}
          onTimeSlotClick={handleTimeSlotClick}
          onAppointmentClick={handleAppointmentClick}
          onAppointmentDrop={(appointmentId, newDate, newTime) => {
            const dateStr = newDate.toISOString().split("T")[0];
            rescheduleMutation.mutate({
              id: appointmentId,
              newDate: dateStr,
              newTime: newTime,
            });
          }}
        />

        {/* Create Appointment Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ny avtale</DialogTitle>
              <DialogDescription>
                Opprett en ny avtale for en kunde
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="customer">Kunde *</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg kunde" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.firstName} {customer.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="service">Tjeneste *</Label>
                <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg tjeneste" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        {service.name} ({service.durationMinutes} min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="employee">Behandler *</Label>
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg behandler" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Dato *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="time">Tid *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notater</Label>
                <Input
                  id="notes"
                  placeholder="Valgfrie notater..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Recurring Appointment Options */}
              <div className="border-t pt-4">
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="isRecurring" className="flex items-center gap-2 cursor-pointer">
                    <Repeat className="h-4 w-4" />
                    Gjentakende avtale
                  </Label>
                </div>

                {isRecurring && (
                  <div className="space-y-3 pl-6 border-l-2 border-blue-200">
                    <div>
                      <Label htmlFor="frequency">Frekvens</Label>
                      <Select value={recurringFrequency} onValueChange={(val: any) => setRecurringFrequency(val)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Ukentlig</SelectItem>
                          <SelectItem value="biweekly">Hver 2. uke</SelectItem>
                          <SelectItem value="monthly">Månedlig</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Avslutt etter</Label>
                      <div className="flex gap-2 mt-1">
                        <Button
                          type="button"
                          variant={recurringEndType === "date" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setRecurringEndType("date")}
                          className="flex-1"
                        >
                          Dato
                        </Button>
                        <Button
                          type="button"
                          variant={recurringEndType === "count" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setRecurringEndType("count")}
                          className="flex-1"
                        >
                          Antall
                        </Button>
                      </div>
                    </div>

                    {recurringEndType === "date" ? (
                      <div>
                        <Label htmlFor="endDate">Sluttdato</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={recurringEndDate}
                          onChange={(e) => setRecurringEndDate(e.target.value)}
                          min={selectedDate}
                        />
                      </div>
                    ) : (
                      <div>
                        <Label htmlFor="count">Antall gjentagelser</Label>
                        <Input
                          id="count"
                          type="number"
                          min="2"
                          max="52"
                          value={recurringCount}
                          onChange={(e) => setRecurringCount(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                      {recurringEndType === "date" && recurringEndDate ? (
                        <p>Avtaler vil opprettes fra {selectedDate} til {recurringEndDate}</p>
                      ) : recurringEndType === "count" && recurringCount ? (
                        <p>{recurringCount} avtaler vil bli opprettet</p>
                      ) : (
                        <p>Velg sluttdato eller antall gjentagelser</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Avbryt
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending || createRecurringMutation.isPending}>
                {createMutation.isPending || createRecurringMutation.isPending ? "Oppretter..." : isRecurring ? "Opprett gjentakende avtaler" : "Opprett avtale"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Appointment Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Avtaledetaljer</DialogTitle>
              <DialogDescription>
                Informasjon om avtalen
              </DialogDescription>
            </DialogHeader>

            {viewingAppointment && (
              <div className="space-y-4">
                {viewingAppointment.recurringRuleId && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Repeat className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-700 font-medium">Del av gjentakende serie</span>
                  </div>
                )}
                <div>
                  <Label>Kunde</Label>
                  <div className="text-sm">
                    {customers.find(c => c.id === viewingAppointment.customerId)?.firstName}{" "}
                    {customers.find(c => c.id === viewingAppointment.customerId)?.lastName}
                  </div>
                </div>

                <div>
                  <Label>Behandler</Label>
                  <div className="text-sm">
                    {employees.find(e => e.id === viewingAppointment.employeeId)?.name}
                  </div>
                </div>

                <div>
                  <Label>Dato og tid</Label>
                  <div className="text-sm">
                    {new Date(viewingAppointment.startTime).toLocaleDateString("no-NO", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    kl.{" "}
                    {new Date(viewingAppointment.startTime).toLocaleTimeString("no-NO", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                <div>
                  <Label>Status</Label>
                  <div className="text-sm">{getStatusText(viewingAppointment.status)}</div>
                </div>

                {viewingAppointment.notes && (
                  <div>
                    <Label>Notater</Label>
                    <div className="text-sm">{viewingAppointment.notes}</div>
                  </div>
                )}

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex gap-2">
                    {viewingAppointment.status === "pending" && (
                      <Button
                        className="flex-1"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: viewingAppointment.id,
                            status: "confirmed",
                          })
                        }
                      >
                        Bekreft
                      </Button>
                    )}
                    {viewingAppointment.status === "confirmed" && (
                      <Button
                        className="flex-1"
                        variant="outline"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: viewingAppointment.id,
                            status: "completed",
                          })
                        }
                      >
                        Fullfør
                      </Button>
                    )}
                    {viewingAppointment.status !== "canceled" && viewingAppointment.status !== "completed" && (
                      <Button
                        className="flex-1"
                        variant="destructive"
                        onClick={() => {
                          setIsCancelDialogOpen(true);
                        }}
                      >
                        Avbryt avtale
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => {
                      setIsViewOpen(false);
                      setLocation("/pos");
                    }}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Gå til salgssted (POS)
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200"
                    onClick={() => {
                      // Pre-fill form with existing appointment data
                      setSelectedCustomerId(viewingAppointment.customerId.toString());
                      setSelectedEmployeeId(viewingAppointment.employeeId.toString());
                      // Get service ID from appointment services (assuming first service)
                      const aptServices = (viewingAppointment as any).services;
                      if (aptServices && aptServices.length > 0) {
                        setSelectedServiceId(aptServices[0].serviceId.toString());
                      }
                      setNotes(viewingAppointment.notes || "");
                      // Leave date and time empty for user to select new ones
                      setSelectedDate("");
                      setSelectedTime("");
                      // Close view dialog and open create dialog
                      setIsViewOpen(false);
                      setIsCreateOpen(true);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    Dupliser avtale
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewOpen(false)}>
                Lukk
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel with Refund Dialog */}
        <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Avbryt avtale</DialogTitle>
              <DialogDescription>
                Bekreft avbestilling og refusjon
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {refundPreview && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Opprinnelig beløp:</span>
                    <span className="font-medium">{refundPreview.originalAmount.toFixed(2)} NOK</span>
                  </div>
                  {refundPreview.isLateCancellation && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Avbestillingsgebyr ({refundPreview.feePercent}%):</span>
                      <span className="font-medium text-orange-600">-{refundPreview.feeAmount.toFixed(2)} NOK</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold border-t pt-2">
                    <span>Refusjon:</span>
                    <span className="text-green-600">{refundPreview.refundAmount.toFixed(2)} NOK</span>
                  </div>
                  {refundPreview.isLateCancellation && (
                    <div className="text-xs text-orange-600 mt-2">
                      ⚠️ Sen avbestilling - gebyr påligger
                    </div>
                  )}
                </div>
              )}

              {!refundPreview?.originalAmount && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
                  Ingen betaling registrert for denne avtalen.
                </div>
              )}

              <div>
                <Label htmlFor="cancelReason">Grunn til avbestilling *</Label>
                <textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full min-h-[80px] px-3 py-2 border rounded-md"
                  placeholder="F.eks: Kunde ba om å avbestille, sykdom, etc."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsCancelDialogOpen(false);
                setCancelReason("");
                setRefundPreview(null);
              }}>
                Avbryt
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (!cancelReason.trim()) {
                    toast.error("Vennligst oppgi en grunn for avbestillingen");
                    return;
                  }
                  cancelWithRefundMutation.mutate({
                    appointmentId: viewingAppointment.id,
                    reason: cancelReason,
                    cancellationType: "staff",
                  });
                }}
                disabled={cancelWithRefundMutation.isPending || !cancelReason.trim()}
              >
                {cancelWithRefundMutation.isPending ? "Behandler..." : "Bekreft avbestilling"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Conflict Warning Dialog */}
        <Dialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-orange-600">⚠️ Tidskonflikt oppdaget</DialogTitle>
              <DialogDescription>
                Det finnes allerede en avtale på dette tidspunktet
              </DialogDescription>
            </DialogHeader>

            {conflictDetails && (
              <div className="space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-orange-900 mb-2">
                    Eksisterende avtale:
                  </div>
                  <div className="space-y-1 text-sm text-orange-800">
                    <div><strong>Kunde:</strong> {conflictDetails.customerName}</div>
                    <div><strong>Tid:</strong> {conflictDetails.startTime} - {conflictDetails.endTime}</div>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  Vennligst velg et annet tidspunkt eller en annen behandler for å unngå dobbeltbooking.
                </div>
              </div>
            )}

            <DialogFooter>
              <Button 
                onClick={() => {
                  setConflictDialogOpen(false);
                  setConflictDetails(null);
                }}
                className="w-full"
              >
                OK, jeg forstår
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
