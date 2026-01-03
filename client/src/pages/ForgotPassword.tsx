import { useState } from "react";
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
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t("auth.errors.somethingWrong"));
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError(t("auth.errors.somethingWrong"));
    } finally {
      setIsLoading(false);
    }
  };

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
              <CardTitle className="text-2xl text-center">
                {t("auth.forgotPassword.successTitle")}
              </CardTitle>
              <CardDescription className="text-center">
                {t("auth.forgotPassword.successMessage")}{" "}
                <strong>{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600 text-center">
                {t("auth.forgotPassword.checkSpam")}
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t("auth.forgotPassword.backToLogin")}
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
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("auth.forgotPassword.backToLogin")}
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">{t("auth.forgotPassword.heading")}</h1>
          <p className="text-slate-600 mt-2">{t("auth.forgotPassword.headingSubtitle")}</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center">
              {t("auth.forgotPassword.title")}
            </CardTitle>
            <CardDescription className="text-center">
              {t("auth.forgotPassword.subtitle")}
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
                <Label htmlFor="email">{t("auth.forgotPassword.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("auth.forgotPassword.emailPlaceholder")}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("auth.forgotPassword.sending")}
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    {t("auth.forgotPassword.sendButton")}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-slate-600">
                {t("auth.forgotPassword.rememberPassword")}{" "}
                <Link
                  href="/login"
                  className="text-primary font-medium hover:underline"
                >
                  {t("auth.forgotPassword.loginLink")}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
