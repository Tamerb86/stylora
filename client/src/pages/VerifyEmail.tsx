import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";

export function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const [verificationStatus, setVerificationStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  // Extract token from URL
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const token = searchParams.get("token");

  const verifyMutation = trpc.signup.verifyEmail.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setVerificationStatus("success");
        setMessage(data.message);
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          setLocation("/dashboard");
        }, 3000);
      } else {
        setVerificationStatus("error");
        setMessage(data.message);
      }
    },
    onError: (error) => {
      setVerificationStatus("error");
      setMessage(error.message || "Noe gikk galt. Vennligst prøv igjen.");
    },
  });

  useEffect(() => {
    if (token) {
      verifyMutation.mutate({ token });
    } else {
      setVerificationStatus("error");
      setMessage("Ingen bekreftelseskode funnet i URL-en");
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            {verificationStatus === "loading" && <Loader2 className="h-8 w-8 text-white animate-spin" />}
            {verificationStatus === "success" && <CheckCircle2 className="h-8 w-8 text-white" />}
            {verificationStatus === "error" && <XCircle className="h-8 w-8 text-white" />}
          </div>
          <CardTitle className="text-2xl">
            {verificationStatus === "loading" && "Bekrefter e-post..."}
            {verificationStatus === "success" && "E-post bekreftet!"}
            {verificationStatus === "error" && "Bekreftelse mislyktes"}
          </CardTitle>
          <CardDescription>
            {verificationStatus === "loading" && "Vennligst vent mens vi bekrefter e-postadressen din"}
            {verificationStatus === "success" && "Du blir omdirigert til dashboardet..."}
            {verificationStatus === "error" && "Det oppstod et problem med bekreftelsen"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <div className={`p-4 rounded-lg ${
              verificationStatus === "success" 
                ? "bg-green-50 text-green-800 border border-green-200" 
                : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              <p className="text-sm">{message}</p>
            </div>
          )}

          {verificationStatus === "success" && (
            <Button 
              onClick={() => setLocation("/dashboard")} 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Gå til Dashboard
            </Button>
          )}

          {verificationStatus === "error" && (
            <div className="space-y-2">
              <Button 
                onClick={() => setLocation("/")} 
                variant="outline" 
                className="w-full"
              >
                Tilbake til forsiden
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
