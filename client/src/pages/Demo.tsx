import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Demo() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    const loginDemo = async () => {
      try {
        const response = await fetch("/api/auth/demo-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          setStatus("error");
          setError(data.error || "Demo-innlogging feilet");
          return;
        }

        setStatus("success");
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          setLocation("/dashboard");
        }, 1500);
      } catch (err) {
        setStatus("error");
        setError("Noe gikk galt. Prøv igjen.");
      }
    };

    loginDemo();
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Stylora Demo</h1>
          <p className="text-slate-600 mt-2">Prøv systemet uten registrering</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center">
              {status === "loading" && "Logger inn..."}
              {status === "success" && "Velkommen!"}
              {status === "error" && "Noe gikk galt"}
            </CardTitle>
            <CardDescription className="text-center">
              {status === "loading" && "Vennligst vent mens vi setter opp demo-kontoen"}
              {status === "success" && "Du blir nå videresendt til dashboardet"}
              {status === "error" && "Vi kunne ikke logge deg inn på demo-kontoen"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-8">
            {status === "loading" && (
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            )}
            
            {status === "success" && (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-slate-600">Omdirigerer til dashboard...</p>
              </div>
            )}
            
            {status === "error" && (
              <div className="text-center space-y-4">
                <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <div className="flex gap-2 justify-center mt-4">
                  <Button onClick={() => window.location.reload()}>
                    Prøv igjen
                  </Button>
                  <Link href="/login">
                    <Button variant="outline">
                      Logg inn manuelt
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <h3 className="font-semibold text-slate-900 mb-2">Demo-konto inneholder:</h3>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>✓ Demo Barbershop salong</li>
            <li>✓ 2 ansatte (Lars Olsen, Kari Hansen)</li>
            <li>✓ 5 tjenester (Herreklipp, Fade, Skjeggtrim, etc.)</li>
            <li>✓ 5 kunder med avtaler</li>
            <li>✓ Eksempel-data for rapporter</li>
          </ul>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Demo-kontoen nullstilles hver dag. Dine endringer vil ikke bli lagret.
        </p>
      </div>
    </div>
  );
}
