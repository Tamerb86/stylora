import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function Demo() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("Velkommen til demo-kontoen!");
      // Redirect to dashboard
      window.location.href = "/dashboard";
    },
    onError: (error: any) => {
      toast.error(error.message || "Kunne ikke logge inn på demo-kontoen");
      setIsLoading(false);
      // Redirect back to home after 2 seconds
      setTimeout(() => setLocation("/"), 2000);
    },
  });

  useEffect(() => {
    // Auto-login with demo credentials
    loginMutation.mutate({
      email: "demo@barbertime.no",
      password: "demo123",
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="text-center space-y-6 p-8">
        {/* Logo/Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative bg-white rounded-full p-6 shadow-2xl">
              <Sparkles className="h-16 w-16 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
            Starter demo-kontoen...
          </h1>
          <p className="text-gray-600 text-lg">
            Du blir snart logget inn på en fullstendig demo av BarberTime
          </p>
        </div>

        {/* Loading Spinner */}
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>

        {/* Features Preview */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span>Eksempeldata inkludert</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
            <span>Alle funksjoner tilgjengelig</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-orange-500"></div>
            <span>30 dagers gratis prøveperiode</span>
          </div>
        </div>
      </div>
    </div>
  );
}
