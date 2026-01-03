import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, CheckCircle, ArrowLeft, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export default function ResetPassword() {
  const { t } = useTranslation();
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
      setError(t("auth.resetPassword.invalidLinkMessage"));
      setTokenValid(false);
    }
  }, [searchParams, t]);

  const validateForm = () => {
    if (!password) {
      setError(t("auth.validation.passwordRequired"));
      return false;
    }

    if (password.length < 6) {
      setError(t("auth.validation.passwordMinLength"));
      return false;
    }

    if (password !== confirmPassword) {
      setError(t("auth.validation.passwordMismatch"));
      return false;
    }

    // Additional password strength validation
    if (!/[A-Z]/.test(password)) {
      setError(t("auth.validation.passwordUppercase"));
      return false;
    }

    if (!/[a-z]/.test(password)) {
      setError(t("auth.validation.passwordLowercase"));
      return false;
    }

    if (!/[0-9]/.test(password)) {
      setError(t("auth.validation.passwordNumber"));
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
      setError(t("auth.errors.invalidToken"));
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
          setError(data.error || t("auth.errors.invalidRequest"));
        } else if (response.status === 401) {
          setError(t("auth.errors.tokenExpired"));
        } else {
          setError(data.error || t("auth.errors.resetFailed"));
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
      setError(t("auth.errors.networkErrorReset"));
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
              <CardTitle className="text-2xl text-center">{t("auth.resetPassword.invalidLinkTitle")}</CardTitle>
              <CardDescription className="text-center">
                {t("auth.resetPassword.invalidLinkMessage")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600 text-center">
                {t("auth.resetPassword.requestNewLink")}
              </p>
              <Link href="/forgot-password">
                <Button variant="default" className="w-full">
                  {t("auth.resetPassword.requestNewButton")}
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t("auth.resetPassword.backToLogin")}
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
              <CardTitle className="text-2xl text-center">{t("auth.resetPassword.successTitle")}</CardTitle>
              <CardDescription className="text-center">
                {t("auth.resetPassword.successMessage")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600 text-center">
                {t("auth.resetPassword.redirectMessage")}
              </p>
              <Link href="/login">
                <Button variant="default" className="w-full">
                  {t("auth.resetPassword.continueToLogin")}
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
            {t("auth.resetPassword.backToLogin")}
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">{t("auth.resetPassword.heading")}</h1>
          <p className="text-slate-600 mt-2">{t("auth.resetPassword.headingSubtitle")}</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center">{t("auth.resetPassword.title")}</CardTitle>
            <CardDescription className="text-center">
              {t("auth.resetPassword.subtitle")}
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
                <Label htmlFor="password">{t("auth.resetPassword.newPassword")}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t("auth.resetPassword.newPasswordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <p className="text-xs text-slate-500">
                  {t("auth.resetPassword.passwordHint")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("auth.resetPassword.confirmPassword")}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t("auth.resetPassword.confirmPasswordPlaceholder")}
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
                    {t("auth.resetPassword.resetting")}
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    {t("auth.resetPassword.resetButton")}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-slate-600">
                {t("auth.resetPassword.rememberPassword")}{" "}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  {t("auth.resetPassword.loginLink")}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
