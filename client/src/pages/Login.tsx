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
  const [errorHint, setErrorHint] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setErrorHint("");
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
        setError(data.error || "Innlogging feilet");
        setErrorHint(data.hint || "");
        return;
      }

      // Redirect to dashboard on success
      setLocation("/dashboard");
    } catch (err) {
      setError("Noe gikk galt. Prøv igjen.");
      setErrorHint("");
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
                  <AlertDescription>
                    <div className="font-medium">{error}</div>
                    {errorHint && (
                      <div className="text-sm mt-1 opacity-90">{errorHint}</div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-post</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="din@epost.no"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
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
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
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
