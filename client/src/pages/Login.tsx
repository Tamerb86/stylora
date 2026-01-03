import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, LogIn, ArrowLeft, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Login() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [errorHint, setErrorHint] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};

    if (!email) {
      errors.email = t("auth.validation.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = t("auth.validation.emailInvalid");
    }

    if (!password) {
      errors.password = t("auth.validation.passwordRequired");
    } else if (password.length < 6) {
      errors.password = t("auth.validation.passwordMinLength");
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setErrorHint("");

    // validate + show field errors
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Prefer backend message + hint if available
        setError(data?.error || t("auth.errors.loginFailed"));
        setErrorHint(data?.hint || "");
        return;
      }

      setLocation("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(t("auth.errors.networkError"));
      setErrorHint("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("auth.login.backToHome")}
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">{t("auth.login.heading")}</h1>
          <p className="text-slate-600 mt-2">{t("auth.login.headingSubtitle")}</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center">{t("auth.login.title")}</CardTitle>
            <CardDescription className="text-center">
              {t("auth.login.subtitle")}
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
                <Label htmlFor="email">{t("auth.login.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("auth.login.emailPlaceholder")}
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
                  <Label htmlFor="password">{t("auth.login.password")}</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    {t("auth.login.forgotPassword")}
                  </Link>
                </div>

                <Input
                  id="password"
                  type="password"
                  placeholder={t("auth.login.passwordPlaceholder")}
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("auth.login.loggingIn")}
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    {t("auth.login.loginButton")}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-slate-600">
                {t("auth.login.noAccount")}{" "}
                <Link
                  href="/signup"
                  className="text-primary font-medium hover:underline"
                >
                  {t("auth.login.signupLink")}
                </Link>
              </p>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">{t("auth.login.or")}</span>
              </div>
            </div>

            <Link href="/demo">
              <Button variant="outline" className="w-full">
                {t("auth.login.tryDemo")}
              </Button>
            </Link>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">{t("auth.login.admin")}</span>
              </div>
            </div>

            <Link href="/saas-admin">
              <Button
                variant="ghost"
                className="w-full text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              >
                <Shield className="w-4 h-4 mr-2" />
                {t("auth.login.adminPanel")}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-6">
          {t("auth.login.termsAgreement")}{" "}
          <a href="#" className="underline hover:text-slate-700">
            {t("auth.login.terms")}
          </a>{" "}
          {t("auth.login.and")}{" "}
          <a href="#" className="underline hover:text-slate-700">
            {t("auth.login.privacy")}
          </a>
        </p>
      </div>
    </div>
  );
}
