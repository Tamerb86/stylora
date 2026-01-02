import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, CheckCircle, ArrowLeft, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    // Extract token from URL query parameters
    const urlParams = new URLSearchParams(searchParams);
    const tokenParam = urlParams.get("token");
    
    if (tokenParam) {
      setToken(tokenParam);
      setTokenValid(true);
    } else {
      setError("Ugyldig eller manglende tilbakestillingslenke");
      setTokenValid(false);
    }
  }, [searchParams]);

  const validateForm = () => {
    if (!password) {
      setError("Passord er påkrevd");
      return false;
    }

    if (password.length < 6) {
      setError("Passordet må være minst 6 tegn");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passordene stemmer ikke overens");
      return false;
    }

    // Additional password strength validation
    if (!/[A-Z]/.test(password)) {
      setError("Passordet må inneholde minst én stor bokstav");
      return false;
    }

    if (!/[a-z]/.test(password)) {
      setError("Passordet må inneholde minst én liten bokstav");
      return false;
    }

    if (!/[0-9]/.test(password)) {
      setError("Passordet må inneholde minst ett tall");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    if (!token) {
      setError("Ugyldig tilbakestillingslenke");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          setError(data.error || "Ugyldig forespørsel");
        } else if (response.status === 401) {
          setError("Tilbakestillingslenken er utløpt eller ugyldig");
        } else {
          setError(data.error || "Kunne ikke tilbakestille passord");
        }
        return;
      }

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        setLocation("/login");
      }, 3000);
    } catch (err) {
      console.error("Reset password error:", err);
      setError("Nettverksfeil. Sjekk internettforbindelsen din og prøv igjen.");
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-0">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">Ugyldig lenke</CardTitle>
              <CardDescription className="text-center">
                Tilbakestillingslenken er ugyldig eller mangler
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600 text-center">
                Vennligst be om en ny lenke for tilbakestilling av passord.
              </p>
              <Link href="/forgot-password">
                <Button variant="default" className="w-full">
                  Be om ny lenke
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Tilbake til innlogging
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-lg border-0">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">Passord tilbakestilt!</CardTitle>
              <CardDescription className="text-center">
                Passordet ditt har blitt oppdatert
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600 text-center">
                Du vil bli videresendt til innloggingssiden om litt...
              </p>
              <Link href="/login">
                <Button variant="default" className="w-full">
                  Fortsett til innlogging
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/login" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbake til innlogging
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Stylora</h1>
          <p className="text-slate-600 mt-2">Tilbakestill passord</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center">Nytt passord</CardTitle>
            <CardDescription className="text-center">
              Skriv inn ditt nye passord nedenfor
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
                <Label htmlFor="password">Nytt passord</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <p className="text-xs text-slate-500">
                  Passordet må være minst 6 tegn og inneholde stor bokstav, liten bokstav og tall
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Bekreft passord</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Tilbakestiller...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Tilbakestill passord
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-slate-600">
                Husker du passordet?{" "}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Logg inn
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
