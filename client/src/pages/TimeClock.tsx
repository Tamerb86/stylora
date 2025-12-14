import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, LogIn, LogOut, X, Delete, Users, Maximize2, Minimize2, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function TimeClock() {
  const { data: currentUser } = trpc.auth.me.useQuery();
  const [, setLocation] = useLocation();
  const [pin, setPin] = useState("");
  const tenantId = currentUser?.tenantId || "default-tenant";
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastAction, setLastAction] = useState<{
    type: "in" | "out";
    name: string;
    time: string;
    hours?: number;
    warning?: string;
  } | null>(null);

  const clockInMutation = trpc.employee.clockIn.useMutation();
  const clockOutMutation = trpc.employee.clockOut.useMutation();
  
  // Fetch active employees (auto-refresh every 30 seconds)
  const { data: activeEmployees = [] } = trpc.employee.getActiveEmployees.useQuery(
    { tenantId },
    { refetchInterval: 30000 }
  );

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-dismiss success message after 10 seconds
  useEffect(() => {
    if (lastAction) {
      const timer = setTimeout(() => setLastAction(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [lastAction]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Handle keyboard input for PIN
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard input when not in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Handle number keys (0-9)
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handlePinInput(e.key);
      }
      // Handle backspace
      else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      }
      // Handle Enter to submit
      else if (e.key === 'Enter' && pin.length >= 4) {
        e.preventDefault();
        handleClockIn();
      }
      // Handle Escape to clear
      else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  const handlePinInput = (digit: string) => {
    if (pin.length < 6) {
      setPin(pin + digit);
    }
  };

  const handleClear = () => {
    setPin("");
    setLastAction(null);
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleClockIn = async () => {
    if (pin.length < 4) return;

    try {
      const result = await clockInMutation.mutateAsync({ pin, tenantId });
      setLastAction({
        type: "in",
        name: result.employeeName || "Ansatt",
        time: new Date(result.clockIn).toLocaleTimeString("no-NO"),
      });
      setPin("");
    } catch (error: any) {
      alert(error.message || "Feil ved innstemplingstid");
    }
  };

  const handleClockOut = async () => {
    if (pin.length < 4) return;

    try {
      const result = await clockOutMutation.mutateAsync({ pin, tenantId });
      setLastAction({
        type: "out",
        name: result.employeeName || "Ansatt",
        time: new Date(result.clockOut).toLocaleTimeString("no-NO"),
        hours: result.totalHours,
        warning: result.warning || undefined,
      });
      setPin("");
    } catch (error: any) {
      alert(error.message || "Feil ved utstemplingstid");
    }
  };

  // Check if fullscreen API is available (not available in iframes with restrictive permissions policy)
  const isFullscreenSupported = () => {
    return (
      document.fullscreenEnabled ||
      (document as any).webkitFullscreenEnabled ||
      (document as any).mozFullScreenEnabled ||
      (document as any).msFullscreenEnabled
    );
  };

  const toggleFullscreen = async () => {
    // Silently fail if fullscreen is not supported (e.g., in iframe)
    if (!isFullscreenSupported()) {
      return;
    }

    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      // Silently fail - fullscreen might be blocked by permissions policy
      // This is expected in iframe environments like dev preview
    }
  };

  return (
    <DashboardLayout>
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {/* Back to Dashboard Button - Top Left Corner */}
      <button
        onClick={() => setLocation("/dashboard")}
        className="fixed top-4 left-4 z-40 p-3 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl hover:bg-white/20 transition-all duration-200 hover:scale-110 group"
        title="Tilbake til Dashboard"
      >
        <Home className="w-5 h-5 text-white group-hover:text-blue-200" />
      </button>

      {/* Fullscreen Toggle Button - Top Right Corner (only show if supported) */}
      {isFullscreenSupported() && (
        <button
          onClick={toggleFullscreen}
          className="fixed top-4 right-4 z-40 p-3 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl hover:bg-white/20 transition-all duration-200 hover:scale-110 group"
          title={isFullscreen ? "Avslutt fullskjerm" : "Fullskjerm"}
        >
        {isFullscreen ? (
          <Minimize2 className="w-5 h-5 text-white group-hover:text-blue-200" />
        ) : (
          <Maximize2 className="w-5 h-5 text-white group-hover:text-blue-200" />
        )}
        </button>
      )}

      {/* Main container with controlled height - fits within viewport on desktop */}
      <div className="w-full max-w-3xl flex flex-col justify-center" style={{ minHeight: 'calc(100vh - 2rem)' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* Left Column: Header + Time Display */}
          <div className="space-y-4">
            {/* Header with Logo */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-orange-500 mb-3 shadow-2xl">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-1">
                Tidsregistrering
              </h1>
              <p className="text-blue-200 text-sm">
                Tast inn din PIN-kode
              </p>
            </div>

            {/* Current Time Display */}
            <Card className="p-6 text-center lg:text-left bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
              <div className="text-5xl font-bold text-white mb-1 font-mono tracking-tight">
                {currentTime.toLocaleTimeString("no-NO", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </div>
              <div className="text-blue-200 text-sm">
                {currentTime.toLocaleDateString("no-NO", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </div>
            </Card>
          </div>

          {/* Right Column: PIN Entry + Keypad */}
          <Card className="p-6 bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
            {/* PIN Display */}
            <div className="mb-4">
              <div className="flex justify-center gap-3 mb-2">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-14 h-14 rounded-lg flex items-center justify-center text-3xl font-bold transition-all duration-200 ${
                      i < pin.length
                        ? "bg-gradient-to-br from-blue-500 to-orange-500 shadow-lg scale-110"
                        : "bg-white/10 border-2 border-white/30"
                    }`}
                  >
                    {i < pin.length && (
                      <span className="text-white">●</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-center text-blue-200 text-xs">
                {pin.length === 0 ? "4-6 siffer" : `${pin.length} / 6`}
              </p>
            </div>

            {/* Number Pad - Touch-optimized 3x4 grid */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <Button
                  key={num}
                  variant="outline"
                  onClick={() => handlePinInput(num.toString())}
                  className="h-20 text-3xl font-bold bg-white/10 hover:bg-white/20 border-white/30 text-white hover:scale-105 transition-all duration-200 shadow-lg active:scale-95"
                >
                  {num}
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={handleBackspace}
                disabled={pin.length === 0}
                className="h-20 text-sm bg-white/10 hover:bg-red-500/50 border-white/30 text-white hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-30 active:scale-95"
              >
                <Delete className="w-6 h-6" />
              </Button>
              <Button
                variant="outline"
                onClick={() => handlePinInput("0")}
                className="h-20 text-3xl font-bold bg-white/10 hover:bg-white/20 border-white/30 text-white hover:scale-105 transition-all duration-200 shadow-lg active:scale-95"
              >
                0
              </Button>
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={pin.length === 0}
                className="h-20 text-base bg-white/10 hover:bg-red-500/50 border-white/30 text-white hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-30 active:scale-95"
              >
                <X className="w-5 h-5 mr-1" />
                Slett
              </Button>
            </div>

            {/* Action Buttons - Touch-optimized */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={handleClockIn}
                disabled={pin.length < 4 || clockInMutation.isPending}
                className="h-16 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                <LogIn className="w-6 h-6 mr-2" />
                Inn
              </Button>
              <Button
                onClick={handleClockOut}
                disabled={pin.length < 4 || clockOutMutation.isPending}
                className="h-16 text-lg font-bold bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                <LogOut className="w-6 h-6 mr-2" />
                Ut
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Active Employees Display - Bottom Left Corner */}
      {activeEmployees.length > 0 && (
        <div className="fixed bottom-4 left-4 z-40">
          <Card className="p-4 bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl max-w-xs">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-green-400" />
              <h3 className="text-sm font-semibold text-white">Innstemplet nå</h3>
            </div>
            <div className="space-y-2">
              {activeEmployees.map((emp: any) => {
                const clockInTime = new Date(emp.clockIn);
                const now = new Date();
                const elapsedMs = now.getTime() - clockInTime.getTime();
                const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));
                const elapsedMinutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
                
                // Format elapsed time as "Xt Ym" or "Ym" for < 1 hour
                const elapsedDisplay = elapsedHours > 0 
                  ? `${elapsedHours}t ${elapsedMinutes}m`
                  : `${elapsedMinutes}m`;
                
                return (
                  <div key={emp.id} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                      <span className="text-white font-medium truncate">{emp.employeeName}</span>
                    </div>
                    <div className="text-blue-200 font-mono whitespace-nowrap flex-shrink-0">
                      {clockInTime.toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" })}
                      <span className="text-green-300 ml-1">({elapsedDisplay})</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Last Action Feedback - Fixed Position Overlay */}
      {lastAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className={`p-8 border-2 shadow-2xl animate-in zoom-in-95 duration-500 max-w-md w-full mx-4 ${
            lastAction.type === "in"
              ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-400/50"
              : "bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-400/50"
          }`}>
            <div className="text-center">
              {/* Animated Icon */}
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 shadow-2xl animate-bounce ${
                lastAction.type === "in" 
                  ? "bg-gradient-to-br from-green-400 to-emerald-500" 
                  : "bg-gradient-to-br from-orange-400 to-red-500"
              }`}>
                {lastAction.type === "in" ? (
                  <LogIn className="w-10 h-10 text-white" />
                ) : (
                  <LogOut className="w-10 h-10 text-white" />
                )}
              </div>
              
              {/* Success Message */}
              <div className="space-y-1 mb-3">
                <h3 className="text-2xl font-bold text-white">
                  {lastAction.type === "in" ? "✓ Velkommen!" : "✓ Ha en fin dag!"}
                </h3>
                <p className="text-xl font-semibold text-white/90">{lastAction.name}</p>
                <p className={`text-sm font-medium ${
                  lastAction.type === "in" ? "text-green-200" : "text-orange-200"
                }`}>
                  {lastAction.type === "in" ? "Du er nå innstemplet" : "Du er nå utstemplet"}
                </p>
              </div>
              
              {/* Time Display */}
              <div className="bg-white/10 rounded-xl p-3 mb-3">
                <p className="text-xs text-blue-200 mb-1">
                  {lastAction.type === "in" ? "Starttid" : "Sluttid"}
                </p>
                <p className="text-4xl font-bold text-white font-mono tracking-tight">
                  {lastAction.time}
                </p>
              </div>
              
              {/* Hours Worked (for clock-out) */}
              {lastAction.hours !== undefined && (
                <div className="bg-white/10 rounded-xl p-4 mt-3">
                  <p className="text-blue-200 text-xs mb-1">Total arbeidstid i dag</p>
                  <p className="text-4xl font-bold text-white mb-1">
                    {Math.floor(lastAction.hours)}t {Math.round((lastAction.hours % 1) * 60)}m
                  </p>
                  <p className="text-sm text-blue-200 font-medium">({lastAction.hours.toFixed(2)} timer)</p>
                </div>
              )}
              
              {/* Warning for long shifts */}
              {lastAction.warning && (
                <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-xl p-3 mt-3">
                  <p className="text-yellow-200 text-sm font-medium">⚠️ {lastAction.warning}</p>
                </div>
              )}
              
              {/* Auto-dismiss indicator */}
              <p className="text-xs text-white/50 mt-4">Forsvinner automatisk om 10 sek</p>
            </div>
          </Card>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
