import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * SignUp page - redirects to the unified onboarding flow
 * 
 * This page now redirects to /onboard for a unified salon creation experience.
 * The /onboard page provides a comprehensive guided setup for new salons.
 */
export default function SignUp() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Redirect to unified onboarding page
    setLocation("/onboard");
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
        <p className="text-lg text-muted-foreground">
          {t("auth.signup.redirecting")}
        </p>
      </div>
    </div>
  );
}
