import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";

interface MiniCalendarProps {
  appointments: {
    appointmentDate: string;
    status: string;
  }[];
}

export default function MiniCalendar({ appointments }: MiniCalendarProps) {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const locale =
    i18n.language === "ar"
      ? "ar-SA"
      : i18n.language === "uk"
        ? "uk-UA"
        : i18n.language === "en"
          ? "en-US"
          : "no-NO";

  const monthName = currentDate.toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });
  const dayNames = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(2024, 0, i); // Start from Sunday
    return date.toLocaleDateString(locale, { weekday: "short" });
  });

  const getAppointmentsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return appointments?.filter(apt => apt.appointmentDate === dateStr) || [];
  };

  const getDateColor = (day: number) => {
    const appts = getAppointmentsForDate(day);
    if (appts.length === 0) return "";

    const hasConfirmed = appts.some(a => a.status === "confirmed");
    const hasPending = appts.some(a => a.status === "pending");

    if (hasConfirmed) return "bg-emerald-500 text-white hover:bg-emerald-600";
    if (hasPending) return "bg-amber-500 text-white hover:bg-amber-600";
    return "bg-blue-500 text-white hover:bg-blue-600";
  };

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const appts = getAppointmentsForDate(day);
    if (appts.length > 0) {
      setLocation("/appointments");
    }
  };

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="h-8"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const appts = getAppointmentsForDate(day);
    const hasAppointments = appts.length > 0;
    const isToday =
      day === new Date().getDate() &&
      month === new Date().getMonth() &&
      year === new Date().getFullYear();

    days.push(
      <button
        key={day}
        onClick={() => handleDateClick(day)}
        className={`
          h-8 flex items-center justify-center text-xs font-medium rounded-lg
          transition-all duration-200
          ${
            hasAppointments
              ? `${getDateColor(day)} cursor-pointer shadow-sm`
              : "hover:bg-slate-100 text-slate-700"
          }
          ${isToday && !hasAppointments ? "ring-2 ring-blue-500 ring-offset-1" : ""}
        `}
      >
        <span className="relative">
          {day}
          {hasAppointments && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-white rounded-full"></span>
          )}
        </span>
      </button>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-700 capitalize">
          {monthName}
        </h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={previousMonth}
            className="h-7 w-7 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={nextMonth}
            className="h-7 w-7 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day, i) => (
          <div
            key={i}
            className="text-center text-xs font-semibold text-slate-500"
          >
            {day.substring(0, 2)}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">{days}</div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className="text-slate-600">{t("dashboard.confirmed")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span className="text-slate-600">{t("dashboard.pendingStatus")}</span>
        </div>
      </div>
    </div>
  );
}
