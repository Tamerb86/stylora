import { AlertTriangle, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export function ImpersonationBanner() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  
  const clearImpersonation = trpc.saasAdmin.clearImpersonation.useMutation({
    onSuccess: async (data) => {
      // Invalidate auth to refresh user state
      await utils.auth.me.invalidate();
      // Redirect to SaaS admin panel
      window.location.href = data.redirectUrl;
    },
    onError: (error) => {
      alert(`Feil ved avslutning av innlogging: ${error.message}`);
    },
  });

  const handleExit = () => {
    clearImpersonation.mutate();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5" />
          <div>
            <p className="font-semibold text-sm">
              Du er logget inn som en annen salong (Impersonation Mode)
            </p>
            <p className="text-xs opacity-90">
              Alle handlinger utføres på vegne av denne salongen
            </p>
          </div>
        </div>
        <Button
          onClick={handleExit}
          disabled={clearImpersonation.isPending}
          variant="outline"
          size="sm"
          className="bg-white text-orange-600 hover:bg-gray-100 border-none"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {clearImpersonation.isPending ? "Avslutter..." : "Avslutt innlogging"}
        </Button>
      </div>
    </div>
  );
}
