import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Repeat } from "lucide-react";
import { useState } from "react";

type CalendarView = "day" | "week" | "month";

interface Appointment {
  id: number;
  appointmentDate: Date | string;
  startTime: Date | string;
  endTime: Date | string;
  customerId: number;
  employeeId: number;
  status: string | null;
  notes?: string | null;
  recurringRuleId?: number | null;
}

interface Leave {
  id: number;
  employeeId: number;
  employeeName: string | null;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  reason?: string | null;
}

interface Holiday {
  id: number;
  name: string;
  date: Date;
  isRecurring: boolean | null;
  description?: string | null;
}

interface CalendarProps {
  appointments: Appointment[];
  employees: Array<{ id: number; name: string | null }>;
  services?: Array<{ id: number; name: string; categoryId?: number | null }>;
  leaves?: Leave[];
  holidays?: Holiday[];
  availableSlotsCount?: Record<string, number>;
  onTimeSlotClick: (date: Date, time: string) => void;
  onAppointmentClick: (appointment: Appointment) => void;
  onAppointmentDrop?: (appointmentId: number, newDate: Date, newTime: string) => void;
}

export function Calendar({ 
  appointments, 
  employees,
  services = [],
  leaves = [],
  holidays = [],
  availableSlotsCount = {},
  onTimeSlotClick, 
  onAppointmentClick,
  onAppointmentDrop 
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("week");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("all");
  const [showAvailableOnly, setShowAvailableOnly] = useState<boolean>(false);
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null);
  const [dropTarget, setDropTarget] = useState<{ date: Date; time: string } | null>(null);

  // Apply all filters
  let filteredAppointments = appointments;
  
  // Filter by employee
  if (selectedEmployeeId !== "all") {
    filteredAppointments = filteredAppointments.filter(
      apt => apt.employeeId === parseInt(selectedEmployeeId)
    );
  }
  
  // Filter by status
  if (selectedStatus !== "all") {
    filteredAppointments = filteredAppointments.filter(
      apt => apt.status === selectedStatus
    );
  }
  
  // Filter by service (requires serviceId in appointment data)
  if (selectedServiceId !== "all") {
    filteredAppointments = filteredAppointments.filter(
      apt => (apt as any).serviceId === parseInt(selectedServiceId)
    );
  }

  const getWeekDays = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    const startDay = firstDay.getDay();
    const adjustedStart = startDay === 0 ? 6 : startDay - 1;

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = adjustedStart - 1; i >= 0; i--) {
      const day = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({ date: day, isCurrentMonth: false });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const day = new Date(year, month, i);
      days.push({ date: day, isCurrentMonth: true });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const day = new Date(year, month + 1, i);
      days.push({ date: day, isCurrentMonth: false });
    }

    return days;
  };

  const getTimeSlots = (date?: Date) => {
    const slots = [];
    for (let hour = 8; hour < 20; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
      slots.push(`${hour.toString().padStart(2, "0")}:30`);
    }
    
    // Filter out booked slots if "available only" is enabled
    if (showAvailableOnly && date) {
      return slots.filter(time => {
        const appointments = getAppointmentsForDateAndTime(date, time);
        return appointments.length === 0;
      });
    }
    
    return slots;
  };

  const getAppointmentsForDateAndTime = (date: Date, time: string) => {
    const dateStr = date.toISOString().split("T")[0];
    
    return filteredAppointments.filter(apt => {
      // Convert appointmentDate to YYYY-MM-DD format
      // Handle both string and Date formats from DB
      const aptDateStr = typeof apt.appointmentDate === 'string' 
        ? apt.appointmentDate.substring(0, 10) // Extract YYYY-MM-DD from string
        : apt.appointmentDate.toISOString().substring(0, 10);
      // Extract time from apt.startTime (format: "HH:MM:SS")
      const aptTime = typeof apt.startTime === 'string' 
        ? apt.startTime.substring(0, 5) // Get "HH:MM" from "HH:MM:SS"
        : new Date(apt.startTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
      return aptDateStr === dateStr && aptTime === time;
    });
  };

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return filteredAppointments.filter(apt => {
      // Convert appointmentDate to YYYY-MM-DD format
      // Handle both string and Date formats from DB
      const aptDateStr = typeof apt.appointmentDate === 'string' 
        ? apt.appointmentDate.substring(0, 10) // Extract YYYY-MM-DD from string
        : apt.appointmentDate.toISOString().substring(0, 10);
      return aptDateStr === dateStr;
    });
  };

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (view === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "canceled":
        return "bg-red-500";
      case "completed":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatDateHeader = () => {
    if (view === "week") {
      const weekDays = getWeekDays(currentDate);
      const start = weekDays[0];
      const end = weekDays[6];
      return `${start.getDate()} ${start.toLocaleDateString("no-NO", { month: "short" })} - ${end.getDate()} ${end.toLocaleDateString("no-NO", { month: "short", year: "numeric" })}`;
    } else {
      return currentDate.toLocaleDateString("no-NO", { month: "long", year: "numeric" });
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, appointment: Appointment) => {
    setDraggedAppointment(appointment);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.currentTarget.innerHTML);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    setDraggedAppointment(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, date: Date, time: string) => {
    e.preventDefault();
    
    // Check if slot is available
    const dayIsHoliday = isHoliday(date);
    const employeeOnLeave = draggedAppointment && selectedEmployeeId !== "all"
      ? isEmployeeOnLeave(draggedAppointment.employeeId, date)
      : false;
    const hasAppointments = getAppointmentsForDateAndTime(date, time).length > 0;
    
    if (dayIsHoliday || employeeOnLeave || hasAppointments) {
      e.dataTransfer.dropEffect = "none";
      return;
    }
    
    e.dataTransfer.dropEffect = "move";
    setDropTarget({ date, time });
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, date: Date, time: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedAppointment || !onAppointmentDrop) {
      setDraggedAppointment(null);
      setDropTarget(null);
      return;
    }
    
    // Validate drop target
    const dayIsHoliday = isHoliday(date);
    const employeeOnLeave = isEmployeeOnLeave(draggedAppointment.employeeId, date);
    const hasAppointments = getAppointmentsForDateAndTime(date, time).length > 0;
    
    if (dayIsHoliday || employeeOnLeave || hasAppointments) {
      // Show error - slot not available
      setDraggedAppointment(null);
      setDropTarget(null);
      return;
    }
    
    // Check if appointment is confirmed and needs confirmation
    if (draggedAppointment.status === "confirmed") {
      // For now, allow move - confirmation can be added later
      onAppointmentDrop(draggedAppointment.id, date, time);
    } else {
      onAppointmentDrop(draggedAppointment.id, date, time);
    }
    
    setDraggedAppointment(null);
    setDropTarget(null);
  };

  const isDropTarget = (date: Date, time: string) => {
    if (!dropTarget) return false;
    const dateStr = date.toISOString().split("T")[0];
    const targetDateStr = dropTarget.date.toISOString().split("T")[0];
    return dateStr === targetDateStr && time === dropTarget.time;
  };

  // Check if date is a holiday
  const isHoliday = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return holidays.some(h => {
      const holidayStr = new Date(h.date).toISOString().split("T")[0];
      return holidayStr === dateStr;
    });
  };

  // Get holiday for date
  const getHolidayForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return holidays.find(h => {
      const holidayStr = new Date(h.date).toISOString().split("T")[0];
      return holidayStr === dateStr;
    });
  };

  // Check if employee is on leave on date
  const isEmployeeOnLeave = (employeeId: number, date: Date) => {
    return leaves.some(leave => {
      if (leave.employeeId !== employeeId) return false;
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      return date >= leaveStart && date <= leaveEnd;
    });
  };

  // Get leave for employee on date
  const getEmployeeLeave = (employeeId: number, date: Date) => {
    return leaves.find(leave => {
      if (leave.employeeId !== employeeId) return false;
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      return date >= leaveStart && date <= leaveEnd;
    });
  };

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
          <span>🏖️ Helligdag (stengt)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded flex items-center justify-center">✈️</div>
          <span>Ansatt på ferie</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
          <span>I dag</span>
        </div>
      </div>

      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={navigatePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            I dag
          </Button>
          <Button variant="outline" size="sm" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold capitalize">{formatDateHeader()}</h2>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Alle ansatte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle ansatte</SelectItem>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id.toString()}>
                  {emp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Alle statuser" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statuser</SelectItem>
              <SelectItem value="pending">Venter</SelectItem>
              <SelectItem value="confirmed">Bekreftet</SelectItem>
              <SelectItem value="completed">Fullført</SelectItem>
              <SelectItem value="canceled">Kansellert</SelectItem>
              <SelectItem value="no_show">Ikke møtt</SelectItem>
            </SelectContent>
          </Select>

          {services.length > 0 && (
            <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Alle tjenester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle tjenester</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id.toString()}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={view} onValueChange={(v) => setView(v as CalendarView)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Dag</SelectItem>
              <SelectItem value="week">Uke</SelectItem>
              <SelectItem value="month">Måned</SelectItem>
            </SelectContent>
          </Select>

          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={showAvailableOnly}
              onChange={(e) => setShowAvailableOnly(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Vis kun ledige</span>
          </label>

          {(selectedEmployeeId !== "all" || selectedStatus !== "all" || selectedServiceId !== "all" || showAvailableOnly) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedEmployeeId("all");
                setSelectedStatus("all");
                setSelectedServiceId("all");
                setShowAvailableOnly(false);
              }}
            >
              Nullstill filtre
            </Button>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      {view === "day" ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Day Header - All Employees */}
                <div className="grid border-b" style={{ gridTemplateColumns: `80px repeat(${employees.length}, 1fr)` }}>
                  <div className="p-2 border-r bg-muted"></div>
                  {employees.map((emp) => {
                    const employeeOnLeave = isEmployeeOnLeave(emp.id, currentDate);
                    return (
                      <div
                        key={emp.id}
                        className={`p-2 text-center border-r ${
                          employeeOnLeave ? "bg-gray-100" : ""
                        }`}
                        title={employeeOnLeave ? `${emp.name} er på ferie` : ""}
                      >
                        <div className="text-sm font-medium">{emp.name}</div>
                        {employeeOnLeave && (
                          <div className="text-xs text-gray-500">✈️ Ferie</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Time Slots */}
                <div className="max-h-[600px] overflow-y-auto">
                  {getTimeSlots(currentDate).map((time) => (
                    <div key={time} className="grid border-b" style={{ gridTemplateColumns: `80px repeat(${employees.length}, 1fr)` }}>
                      <div className="p-2 border-r bg-muted text-sm font-medium text-muted-foreground">
                        {time}
                      </div>
                      {employees.map((emp) => {
                        const appointments = getAppointmentsForDateAndTime(currentDate, time).filter(
                          (apt) => apt.employeeId === emp.id
                        );
                        const isTarget = isDropTarget(currentDate, time);
                        const dayIsHoliday = isHoliday(currentDate);
                        const employeeOnLeave = isEmployeeOnLeave(emp.id, currentDate);
                        const isDisabled = dayIsHoliday || employeeOnLeave;

                        return (
                          <div
                            key={emp.id}
                            className={`p-1 border-r min-h-[80px] transition-colors relative ${
                              isDisabled
                                ? "bg-gray-100 cursor-not-allowed"
                                : appointments.length > 0
                                ? "bg-red-50 border-l-4 border-l-red-400"
                                : "bg-green-50 hover:bg-green-100 cursor-pointer"
                            } ${
                              isTarget ? "bg-blue-100 border-2 border-blue-400" : ""
                            }`}
                            onClick={() => !isDisabled && appointments.length === 0 && onTimeSlotClick(currentDate, time)}
                            onDragOver={(e) => !isDisabled && handleDragOver(e, currentDate, time)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => !isDisabled && handleDrop(e, currentDate, time)}
                            title={
                              dayIsHoliday
                                ? "Stengt (helligdag)"
                                : employeeOnLeave
                                ? `${emp.name} er på ferie`
                                : ""
                            }
                          >
                            {isDisabled && (
                              <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                                {dayIsHoliday ? "🏖️" : "✈️"}
                              </div>
                            )}
                            {appointments.map((apt) => (
                              <div
                                key={apt.id}
                                draggable={apt.status !== "completed" && apt.status !== "canceled"}
                                onDragStart={(e) => handleDragStart(e, apt)}
                                onDragEnd={handleDragEnd}
                                className={`text-sm p-2 rounded mb-2 text-white cursor-move ${getStatusColor(apt.status)} ${
                                  apt.status === "completed" || apt.status === "canceled" ? "cursor-not-allowed opacity-70" : ""
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAppointmentClick(apt);
                                }}
                              >
                                <div className="flex items-center gap-1">
                                  {apt.recurringRuleId && (
                                    <Repeat className="h-3 w-3 flex-shrink-0" />
                                  )}
                                  <div className="font-medium truncate">
                                    Kunde #{apt.customerId}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : view === "week" ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Week Header */}
                <div className="grid grid-cols-8 border-b">
                  <div className="p-2 border-r bg-muted"></div>
                  {getWeekDays(currentDate).map((day, idx) => {
                    const isToday = day.toDateString() === new Date().toDateString();
                    const holiday = getHolidayForDate(day);
                    const hasHoliday = !!holiday;
                    return (
                      <div
                        key={idx}
                        className={`p-2 text-center border-r relative ${
                          hasHoliday ? "bg-red-50" : isToday ? "bg-blue-50" : ""
                        }`}
                        title={hasHoliday ? `Helligdag: ${holiday.name}` : ""}
                      >
                        <div className="text-xs text-muted-foreground">
                          {day.toLocaleDateString("no-NO", { weekday: "short" })}
                        </div>
                        <div className={`text-sm font-medium ${
                          hasHoliday ? "text-red-600" : isToday ? "text-blue-600" : ""
                        }`}>
                          {day.getDate()}
                        </div>
                        {hasHoliday && (
                          <div className="absolute top-1 right-1 text-xs">🏖️</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Time Slots */}
                <div className="max-h-[600px] overflow-y-auto">
                  {getTimeSlots(getWeekDays(currentDate)[0]).map((time) => (
                    <div key={time} className="grid grid-cols-8 border-b">
                      <div className="p-2 border-r bg-muted text-sm font-medium text-muted-foreground">
                        {time}
                      </div>
                      {getWeekDays(currentDate).map((day, idx) => {
                        const appointments = getAppointmentsForDateAndTime(day, time);
                        const isTarget = isDropTarget(day, time);
                        const dayIsHoliday = isHoliday(day);
                        const holiday = getHolidayForDate(day);
                        
                        // Check if any employee is on leave (for "all employees" view)
                        const employeeOnLeave = selectedEmployeeId !== "all" 
                          ? isEmployeeOnLeave(parseInt(selectedEmployeeId), day)
                          : false;
                        const employeeLeave = selectedEmployeeId !== "all"
                          ? getEmployeeLeave(parseInt(selectedEmployeeId), day)
                          : null;
                        
                        const isDisabled = dayIsHoliday || employeeOnLeave;
                        
                        return (
                          <div
                            key={idx}
                            className={`p-1 border-r min-h-[80px] transition-colors relative ${
                              isDisabled 
                                ? "bg-gray-100 cursor-not-allowed" 
                                : appointments.length > 0
                                ? "bg-red-50 border-l-4 border-l-red-400"
                                : "bg-green-50 hover:bg-green-100 cursor-pointer"
                            } ${
                              isTarget ? "bg-blue-100 border-2 border-blue-400" : ""
                            }`}
                            onClick={() => !isDisabled && appointments.length === 0 && onTimeSlotClick(day, time)}
                            onDragOver={(e) => !isDisabled && handleDragOver(e, day, time)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => !isDisabled && handleDrop(e, day, time)}
                            title={
                              dayIsHoliday 
                                ? `Stengt: ${holiday?.name}` 
                                : employeeOnLeave
                                ? `${employeeLeave?.employeeName} er på ${employeeLeave?.leaveType} ferie`
                                : ""
                            }
                          >
                            {isDisabled && (
                              <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                                {dayIsHoliday ? "🏖️" : "✈️"}
                              </div>
                            )}
                            {appointments.map((apt) => (
                              <div
                                key={apt.id}
                                draggable={apt.status !== "completed" && apt.status !== "canceled"}
                                onDragStart={(e) => handleDragStart(e, apt)}
                                onDragEnd={handleDragEnd}
                                className={`text-sm p-2 rounded mb-2 text-white cursor-move ${getStatusColor(apt.status)} ${
                                  apt.status === "completed" || apt.status === "canceled" ? "cursor-not-allowed opacity-70" : ""
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAppointmentClick(apt);
                                }}
                              >
                                <div className="flex items-center gap-1">
                                  {apt.recurringRuleId && (
                                    <Repeat className="h-3 w-3 flex-shrink-0" />
                                  )}
                                  <div className="font-medium truncate">
                                    Kunde #{apt.customerId}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            {/* Month Header */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Month Days */}
            <div className="grid grid-cols-7 gap-2">
              {getMonthDays(currentDate).map((day, idx) => {
                const isToday = day.date.toDateString() === new Date().toDateString();
                const dayAppointments = getAppointmentsForDate(day.date);
                const dateStr = day.date.toISOString().split('T')[0];
                const availableSlots = availableSlotsCount[dateStr] || 0;
                
                return (
                  <div
                    key={idx}
                    className={`min-h-[100px] p-2 border rounded-lg ${
                      !day.isCurrentMonth ? "bg-muted/30" : "bg-background"
                    } ${isToday ? "border-blue-500 border-2" : ""} hover:bg-muted/50 cursor-pointer`}
                    onClick={() => onTimeSlotClick(day.date, "09:00")}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className={`text-sm ${!day.isCurrentMonth ? "text-muted-foreground" : ""}`}>
                        {day.date.getDate()}
                      </div>
                      {day.isCurrentMonth && availableSlots > 0 && (
                        <div className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                          {availableSlots} ledig
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map((apt) => (
                        <div
                          key={apt.id}
                          draggable={apt.status !== "completed" && apt.status !== "canceled"}
                          onDragStart={(e) => handleDragStart(e, apt)}
                          onDragEnd={handleDragEnd}
                          className={`text-xs p-1 rounded text-white cursor-move ${getStatusColor(apt.status)} ${
                            apt.status === "completed" || apt.status === "canceled" ? "cursor-not-allowed opacity-70" : ""
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAppointmentClick(apt);
                          }}
                        >
                          <div className="flex items-center gap-1 truncate">
                            {apt.recurringRuleId && (
                              <Repeat className="h-3 w-3 flex-shrink-0" />
                            )}
                            <span className="truncate">
                              {new Date(apt.startTime).toLocaleTimeString("no-NO", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      ))}
                      {dayAppointments.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayAppointments.length - 3} mer
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
