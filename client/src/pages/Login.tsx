import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, LogIn, ArrowLeft, Shield } from "lucide-react";
import { Link } from "wouter";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{email?: string; password?: string}>({});

  const validateForm = () => {
    const errors: {email?: string; password?: string} = {};
    
    if (!email) {
      errors.email = "E-post er påkrevd";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Ugyldig e-postformat";
    }
    
    if (!password) {
      errors.password = "Passord er påkrevd";
    } else if (password.length < 6) {
      errors.password = "Passordet må være minst 6 tegn";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        // Provide more specific error messages based on status
        if (response.status === 401) {
          setError("Ugyldig e-post eller passord. Vennligst sjekk innloggingsinformasjonen din.");
        } else if (response.status === 403) {
          setError(data.error || "Kontoen din er deaktivert. Kontakt administrator for hjelp.");
        } else if (response.status === 500) {
          setError("Serverfeil. Vennligst prøv igjen senere eller kontakt support.");
        } else {
          setError(data.error || "Innlogging feilet. Vennligst prøv igjen.");
        }
        return;
      }

      // Redirect to dashboard on success
      setLocation("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError("Nettverksfeil. Sjekk internettforbindelsen din og prøv igjen.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbake til forsiden
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Stylora</h1>
          <p className="text-slate-600 mt-2">Logg inn på din salong</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center">Logg inn</CardTitle>
            <CardDescription className="text-center">
              Skriv inn e-post og passord for å fortsette
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-post</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="din@epost.no"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors({ ...fieldErrors, email: undefined });
                    }
                  }}
                  required
                  autoComplete="email"
                  className={fieldErrors.email ? "border-red-500" : ""}
                />
                {fieldErrors.email && (
                  <p className="text-sm text-red-500">{fieldErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Passord</Label>
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    Glemt passord?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors({ ...fieldErrors, password: undefined });
                    }
                  }}
                  required
                  autoComplete="current-password"
                  className={fieldErrors.password ? "border-red-500" : ""}
                />
                {fieldErrors.password && (
                  <p className="text-sm text-red-500">{fieldErrors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logger inn...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Logg inn
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-slate-600">
                Har du ikke konto?{" "}
                <Link href="/signup" className="text-primary font-medium hover:underline">
                  Registrer deg gratis
                </Link>
              </p>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">eller</span>
              </div>
            </div>

            <Link href="/demo">
              <Button variant="outline" className="w-full">
                Prøv demo-konto
              </Button>
            </Link>

            {/* SaaS Admin Login Button */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">Admin</span>
              </div>
            </div>

            <Link href="/saas-admin">
              <Button variant="ghost" className="w-full text-slate-500 hover:text-slate-700 hover:bg-slate-100">
                <Shield className="w-4 h-4 mr-2" />
                SaaS Admin Panel
              </Button>
            </Link>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-6">
          Ved å logge inn godtar du våre{" "}
          <a href="#" className="underline hover:text-slate-700">vilkår</a>
          {" "}og{" "}
          <a href="#" className="underline hover:text-slate-700">personvernregler</a>
        </p>
      </div>
    </div>
  );
}
