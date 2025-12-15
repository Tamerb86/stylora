import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

interface ProtectedSaasAdminRouteProps {
  children: ReactNode;
}

export default function ProtectedSaasAdminRoute({ children }: ProtectedSaasAdminRouteProps) {
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = trpc.auth.me.useQuery();

  // Check if user is platform owner by checking tenantId
  // Platform owner has tenantId = "platform-admin-tenant"
  const isPlatformOwner = user && user.tenantId === "platform-admin-tenant";

  useEffect(() => {
    // If not logged in, redirect to login page
    if (!isLoading && !user) {
      setLocation("/saas-admin/login");
    }
    // If logged in but not platform owner, redirect to login page (will show access denied)
    else if (!isLoading && user && !isPlatformOwner) {
      setLocation("/saas-admin/login");
    }
  }, [user, isLoading, setLocation, isPlatformOwner]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Verifiserer tilgang...</p>
        </div>
      </div>
    );
  }

  // If not logged in or not platform owner, don't render children (will redirect)
  if (!user || !isPlatformOwner) {
    return null;
  }

  // User is logged in and is platform owner, render protected content
  return <>{children}</>;
}
