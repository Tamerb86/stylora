import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Register() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    salonName: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      setSuccess(true);
      // Redirect to email verification page after 3 seconds
      setTimeout(() => {
        setLocation("/email-verification-required");
      }, 3000);
    },
    onError: (error) => {
      setError(error.message || "Registrering mislyktes. Vennligst prøv igjen.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.salonName) {
      setError("Vennligst fyll ut alle feltene");
      return;
    }

    if (formData.password.length < 8) {
      setError("Passordet må være minst 8 tegn");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passordene stemmer ikke overens");
      return;
    }

    registerMutation.mutate({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      salonName: formData.salonName,
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Registrering vellykket!</CardTitle>
            <CardDescription className="text-center">
              Vi har sendt en bekreftelseslink til din e-post. Vennligst bekreft e-posten din for å fortsette.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button
              onClick={() => setLocation("/email-verification-required")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Fortsett
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-white">S</span>
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Opprett konto</CardTitle>
          <CardDescription className="text-center">
            Registrer din salong og kom i gang med Stylora
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Ditt navn</Label>
              <Input
                id="name"
                type="text"
                placeholder="Ola Nordmann"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                disabled={registerMutation.isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                type="email"
                placeholder="din@epost.no"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                disabled={registerMutation.isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salonName">Salongnavn</Label>
              <Input
                id="salonName"
                type="text"
                placeholder="Min Salong AS"
                value={formData.salonName}
                onChange={(e) => handleChange("salonName", e.target.value)}
                disabled={registerMutation.isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passord</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minst 8 tegn"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                disabled={registerMutation.isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Bekreft passord</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Gjenta passord"
                value={formData.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                disabled={registerMutation.isPending}
                required
              />
            </div>

            <div className="text-xs text-muted-foreground">
              Ved å registrere deg godtar du våre{" "}
              <a href="/terms" className="underline hover:text-primary">
                vilkår
              </a>{" "}
              og{" "}
              <a href="/privacy" className="underline hover:text-primary">
                personvernregler
              </a>
              .
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrerer...
                </>
              ) : (
                "Opprett konto"
              )}
            </Button>

            <div className="text-sm text-center text-muted-foreground">
              Har du allerede konto?{" "}
              <Button
                type="button"
                variant="link"
                className="px-0"
                onClick={() => setLocation("/login")}
              >
                Logg inn her
              </Button>
            </div>

            <div className="text-sm text-center text-muted-foreground">
              <Button
                type="button"
                variant="link"
                className="px-0"
                onClick={() => setLocation("/")}
              >
                ← Tilbake til forsiden
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
