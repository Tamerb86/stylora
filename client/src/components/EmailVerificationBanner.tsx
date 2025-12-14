import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { AlertCircle, Mail, X } from "lucide-react";
import { toast } from "sonner";

export function EmailVerificationBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { data: user } = trpc.auth.me.useQuery();
  const utils = trpc.useUtils();

  const resendMutation = trpc.signup.resendVerification.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Kunne ikke sende e-post");
    },
  });

  // Don't show banner if:
  // - User dismissed it
  // - No user logged in
  // - Email already verified
  if (dismissed || !user || !user.tenantId) return null;

  // Check if tenant email is verified using special procedure that doesn't require verification
  const { data: tenant } = trpc.tenants.getVerificationStatus.useQuery(undefined, {
    enabled: !!user.tenantId,
  });

  if (!tenant || tenant.emailVerified) return null;

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-yellow-800">
              <strong>Bekreft e-postadressen din</strong> - Vi har sendt en bekreftelseslenke til{" "}
              <span className="font-medium">{tenant.email}</span>. Sjekk innboksen din.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="bg-white hover:bg-yellow-50 border-yellow-300"
            onClick={() => resendMutation.mutate()}
            disabled={resendMutation.isPending}
          >
            <Mail className="h-4 w-4 mr-2" />
            {resendMutation.isPending ? "Sender..." : "Send på nytt"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="hover:bg-yellow-100"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
