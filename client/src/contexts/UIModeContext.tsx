import React, { createContext, useContext, useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

type UIMode = "simple" | "advanced";

interface UIModeContextType {
  uiMode: UIMode;
  setUIMode: (mode: UIMode) => void;
  isSimpleMode: boolean;
  isAdvancedMode: boolean;
  toggleMode: () => void;
}

const UIModeContext = createContext<UIModeContextType | undefined>(undefined);

export function UIModeProvider({ children }: { children: React.ReactNode }) {
  const { data: user } = trpc.auth.me.useQuery();
  const [uiMode, setUIModeState] = useState<UIMode>("simple");
  
  const updateUIModeMutation = trpc.auth.updateUIMode.useMutation();

  // Sync with user preference from backend
  useEffect(() => {
    if (user?.uiMode) {
      setUIModeState(user.uiMode as UIMode);
    }
  }, [user?.uiMode]);

  const setUIMode = async (mode: UIMode) => {
    setUIModeState(mode);
    
    // Persist to backend
    try {
      await updateUIModeMutation.mutateAsync({ uiMode: mode });
    } catch (error) {
      console.error("Failed to update UI mode:", error);
    }
  };

  const toggleMode = () => {
    const newMode = uiMode === "simple" ? "advanced" : "simple";
    setUIMode(newMode);
  };

  const value: UIModeContextType = {
    uiMode,
    setUIMode,
    isSimpleMode: uiMode === "simple",
    isAdvancedMode: uiMode === "advanced",
    toggleMode,
  };

  return <UIModeContext.Provider value={value}>{children}</UIModeContext.Provider>;
}

export function useUIMode() {
  const context = useContext(UIModeContext);
  if (context === undefined) {
    throw new Error("useUIMode must be used within a UIModeProvider");
  }
  return context;
}
