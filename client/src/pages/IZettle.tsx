import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export default function IZettle() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to iZettle settings page
    setLocation("/izettle-settings");
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin mx-auto text-[#4a90e2] mb-4" />
        <p className="text-gray-600">Omdirigerer til iZettle-innstillinger...</p>
      </div>
    </div>
  );
}
