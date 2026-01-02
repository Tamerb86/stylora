import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  User,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface QuickBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuickBookingDialog({
  open,
  onOpenChange,
}: QuickBookingDialogProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<
    "customer" | "service" | "datetime" | "confirm"
  >("customer");

  // Customer form state
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    serviceId: "",
    employeeId: "",
    date: new Date(),
    time: "",
  });

  // Queries
  const { data: customers } = trpc.customers.list.useQuery();
  const { data: services } = trpc.services.list.useQuery();
  const { data: employees } = trpc.employees.list.useQuery();

  // Mutations
  const utils = trpc.useUtils();
  const createCustomerMutation = trpc.customers.create.useMutation({
    onSuccess: data => {
      setSelectedCustomerId(data.id);
      utils.customers.list.invalidate();
      toast.success(t("customers.created"));
      setCurrentStep("service");
    },
    onError: () => {
      toast.error(t("customers.createError"));
    },
  });

  const createAppointmentMutation = trpc.appointments.create.useMutation({
    onSuccess: () => {
      utils.appointments.list.invalidate();
      utils.dashboard.todayStats.invalidate();
      toast.success(t("appointments.created"));
      handleClose();
    },
    onError: () => {
      toast.error(t("appointments.createError"));
    },
  });

  const filteredCustomers = customers?.filter(
    (c: any) =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery)
  );

  const handleClose = () => {
    setCurrentStep("customer");
    setCustomerForm({ name: "", phone: "", email: "" });
    setSelectedCustomerId(null);
    setSearchQuery("");
    setBookingForm({
      serviceId: "",
      employeeId: "",
      date: new Date(),
      time: "",
    });
    onOpenChange(false);
  };

  const handleCustomerNext = () => {
    if (selectedCustomerId) {
      setCurrentStep("service");
    } else if (customerForm.name && customerForm.phone) {
      createCustomerMutation.mutate(customerForm);
    } else {
      toast.error(t("customers.fillRequired"));
    }
  };

  const handleServiceNext = () => {
    if (bookingForm.serviceId && bookingForm.employeeId) {
      setCurrentStep("datetime");
    } else {
      toast.error(t("appointments.selectServiceEmployee"));
    }
  };

  const handleDateTimeNext = () => {
    if (bookingForm.time) {
      setCurrentStep("confirm");
    } else {
      toast.error(t("appointments.selectTime"));
    }
  };

  const handleConfirm = () => {
    if (!selectedCustomerId) {
      toast.error(t("customers.selectCustomer"));
      return;
    }

    createAppointmentMutation.mutate({
      customerId: selectedCustomerId,
      serviceId: parseInt(bookingForm.serviceId),
      employeeId: parseInt(bookingForm.employeeId),
      appointmentDate: bookingForm.date.toISOString().split("T")[0],
      appointmentTime: bookingForm.time,
      status: "pending",
    });
  };

  const selectedCustomer = customers?.find(
    (c: any) => c.id === selectedCustomerId
  );
  const selectedService = services?.find(
    (s: any) => s.id === parseInt(bookingForm.serviceId)
  );
  const selectedEmployee = employees?.find(
    (e: any) => e.id === parseInt(bookingForm.employeeId)
  );

  // Generate time slots (9 AM to 6 PM, 30-minute intervals)
  const timeSlots = [];
  for (let hour = 9; hour < 18; hour++) {
    for (let minute of [0, 30]) {
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      timeSlots.push(time);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t("quickBooking.title", "Quick Booking")}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {[
            {
              key: "customer",
              icon: User,
              label: t("quickBooking.customer", "Customer"),
            },
            {
              key: "service",
              icon: CalendarIcon,
              label: t("quickBooking.service", "Service"),
            },
            {
              key: "datetime",
              icon: Clock,
              label: t("quickBooking.dateTime", "Date & Time"),
            },
            {
              key: "confirm",
              icon: CheckCircle,
              label: t("quickBooking.confirm", "Confirm"),
            },
          ].map((step, index) => {
            const Icon = step.icon;
            const isActive = step.key === currentStep;
            const isCompleted =
              ["customer", "service", "datetime", "confirm"].indexOf(step.key) <
              ["customer", "service", "datetime", "confirm"].indexOf(
                currentStep
              );

            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isActive
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-xs mt-1 ${isActive ? "font-semibold" : ""}`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < 3 && (
                  <div
                    className={`h-0.5 flex-1 ${isCompleted ? "bg-green-500" : "bg-gray-200"}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step 1: Customer */}
        {currentStep === "customer" && (
          <div className="space-y-4">
            <Tabs defaultValue="existing" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="existing">
                  {t("quickBooking.existingCustomer", "Existing Customer")}
                </TabsTrigger>
                <TabsTrigger value="new">
                  {t("quickBooking.newCustomer", "New Customer")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="existing" className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    {t("quickBooking.searchCustomer", "Search Customer")}
                  </Label>
                  <Input
                    placeholder={t(
                      "quickBooking.searchPlaceholder",
                      "Name or phone..."
                    )}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredCustomers?.map((customer: any) => (
                    <div
                      key={customer.id}
                      onClick={() => setSelectedCustomerId(customer.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedCustomerId === customer.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="font-semibold">{customer.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {customer.phone}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="new" className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("customers.name")} *</Label>
                  <Input
                    value={customerForm.name}
                    onChange={e =>
                      setCustomerForm({ ...customerForm, name: e.target.value })
                    }
                    placeholder={t("customers.namePlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("customers.phone")} *</Label>
                  <Input
                    value={customerForm.phone}
                    onChange={e =>
                      setCustomerForm({
                        ...customerForm,
                        phone: e.target.value,
                      })
                    }
                    placeholder={t("customers.phonePlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("customers.email")}</Label>
                  <Input
                    type="email"
                    value={customerForm.email}
                    onChange={e =>
                      setCustomerForm({
                        ...customerForm,
                        email: e.target.value,
                      })
                    }
                    placeholder={t("customers.emailPlaceholder")}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleCustomerNext}>{t("common.next")}</Button>
            </div>
          </div>
        )}

        {/* Step 2: Service */}
        {currentStep === "service" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("appointments.service")} *</Label>
              <Select
                value={bookingForm.serviceId}
                onValueChange={value =>
                  setBookingForm({ ...bookingForm, serviceId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("appointments.selectService")} />
                </SelectTrigger>
                <SelectContent>
                  {services?.map((service: any) => (
                    <SelectItem key={service.id} value={service.id.toString()}>
                      {service.name} - {service.duration} min - {service.price}{" "}
                      kr
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("appointments.employee")} *</Label>
              <Select
                value={bookingForm.employeeId}
                onValueChange={value =>
                  setBookingForm({ ...bookingForm, employeeId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("appointments.selectEmployee")} />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    ?.filter((e: any) => e.isActive)
                    .map((employee: any) => (
                      <SelectItem
                        key={employee.id}
                        value={employee.id.toString()}
                      >
                        {employee.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("customer")}
              >
                {t("common.back")}
              </Button>
              <Button onClick={handleServiceNext}>{t("common.next")}</Button>
            </div>
          </div>
        )}

        {/* Step 3: Date & Time */}
        {currentStep === "datetime" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("appointments.date")} *</Label>
              <Calendar
                mode="single"
                selected={bookingForm.date}
                onSelect={date =>
                  date && setBookingForm({ ...bookingForm, date })
                }
                disabled={date =>
                  date < new Date(new Date().setHours(0, 0, 0, 0))
                }
                className="rounded-md border"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("appointments.time")} *</Label>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {timeSlots.map(time => (
                  <Button
                    key={time}
                    variant={bookingForm.time === time ? "default" : "outline"}
                    size="sm"
                    onClick={() => setBookingForm({ ...bookingForm, time })}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("service")}
              >
                {t("common.back")}
              </Button>
              <Button onClick={handleDateTimeNext}>{t("common.next")}</Button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {currentStep === "confirm" && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg space-y-4">
              <h3 className="font-semibold text-lg">
                {t("quickBooking.summary", "Booking Summary")}
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("quickBooking.customer")}:
                  </span>
                  <span className="font-semibold">
                    {selectedCustomer?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("appointments.service")}:
                  </span>
                  <span className="font-semibold">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("appointments.employee")}:
                  </span>
                  <span className="font-semibold">
                    {selectedEmployee?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("appointments.date")}:
                  </span>
                  <span className="font-semibold">
                    {bookingForm.date.toLocaleDateString("no-NO")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("appointments.time")}:
                  </span>
                  <span className="font-semibold">{bookingForm.time}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-muted-foreground">
                    {t("appointments.price")}:
                  </span>
                  <span className="font-bold text-lg">
                    {selectedService?.price} kr
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("datetime")}
              >
                {t("common.back")}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={createAppointmentMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                {createAppointmentMutation.isPending
                  ? t("common.creating")
                  : t("quickBooking.confirmBooking", "Confirm Booking")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
