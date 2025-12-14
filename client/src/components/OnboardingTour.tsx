import { useEffect, useState } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

const tourSteps: Step[] = [
  {
    target: "body",
    content: (
      <div className="space-y-3">
        <h2 className="text-xl font-bold">Velkommen til Stylora! 🎉</h2>
        <p>
          La oss ta en rask omvisning for å hjelpe deg i gang med systemet.
          Dette tar bare 2-3 minutter.
        </p>
        <p className="text-sm text-muted-foreground">
          Du kan hoppe over denne omvisningen når som helst ved å trykke "Hopp over".
        </p>
      </div>
    ),
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="ui-mode-toggle"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Enkel vs Avansert modus</h3>
        <p>
          Stylora har to visningsmoduser:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><strong>Enkel modus</strong>: Viser kun de viktigste funksjonene for daglig bruk</li>
          <li><strong>Avansert modus</strong>: Gir tilgang til alle funksjoner og rapporter</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Du starter i Enkel modus, men kan bytte når som helst her.
        </p>
      </div>
    ),
    placement: "top",
  },
  {
    target: '[data-tour="settings-link"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Innstillinger</h3>
        <p>
          Her finner du alle systeminnstillingene. La oss starte med å sette opp salonginformasjonen din.
        </p>
      </div>
    ),
    placement: "right",
  },
  {
    target: '[data-tour="services-link"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Tjenester</h3>
        <p>
          Legg til tjenestene salonen din tilbyr (klipp, farge, skjegg, etc.) med priser og varighet.
        </p>
        <p className="text-sm text-muted-foreground">
          Tjenester er nødvendige for å ta imot bestillinger.
        </p>
      </div>
    ),
    placement: "right",
  },
  {
    target: '[data-tour="employees-link"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Ansatte</h3>
        <p>
          Legg til frisører og andre ansatte som skal kunne ta imot bestillinger.
        </p>
        <p className="text-sm text-muted-foreground">
          Hver ansatt kan ha sin egen timebok og provisjonsmodell.
        </p>
      </div>
    ),
    placement: "right",
  },
  {
    target: '[data-tour="appointments-link"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Timebok</h3>
        <p>
          Her ser du alle avtaler i en kalendervisning. Du kan opprette, redigere og administrere alle timeavtaler herfra.
        </p>
        <p className="text-sm text-muted-foreground">
          Kunder kan også booke timer direkte via online booking-siden din.
        </p>
      </div>
    ),
    placement: "right",
  },
  {
    target: '[data-tour="dashboard-link"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Dashboard</h3>
        <p>
          Dashboard gir deg en rask oversikt over dagens avtaler, inntekter og viktige nøkkeltall.
        </p>
      </div>
    ),
    placement: "right",
  },
  {
    target: "body",
    content: (
      <div className="space-y-3">
        <h2 className="text-xl font-bold">Du er klar! 🚀</h2>
        <p>
          Du har nå fått en grunnleggende oversikt over Stylora.
        </p>
        <div className="bg-accent/50 p-3 rounded-lg space-y-2">
          <p className="font-semibold text-sm">Neste steg:</p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Gå til Innstillinger og fyll inn salonginformasjon</li>
            <li>Legg til minst én tjeneste</li>
            <li>Legg til ansatte</li>
            <li>Start å ta imot bestillinger!</li>
          </ol>
        </div>
        <p className="text-sm text-muted-foreground">
          Du kan når som helst starte omvisningen på nytt fra Innstillinger.
        </p>
      </div>
    ),
    placement: "center",
  },
];

export function OnboardingTour() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const completeOnboardingMutation = trpc.auth.completeOnboarding.useMutation();
  const updateStepMutation = trpc.auth.updateOnboardingStep.useMutation();

  // Auto-start tour for new users who haven't completed onboarding
  useEffect(() => {
    if (user && !user.onboardingCompleted) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setStepIndex(user.onboardingStep || 0);
        setRun(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index, type, action } = data;

    // Update step in database
    if (type === "step:after" && action === "next") {
      updateStepMutation.mutate({ step: index + 1 });
      setStepIndex(index + 1);
    }

    if (type === "step:after" && action === "prev") {
      updateStepMutation.mutate({ step: index - 1 });
      setStepIndex(index - 1);
    }

    // Handle tour completion or skip
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      completeOnboardingMutation.mutate();
    }

    // Navigate to settings when clicking on settings step
    if (index === 2 && type === "step:after" && action === "next") {
      setLocation("/settings");
    }
  };

  if (!user || user.onboardingCompleted) {
    return null;
  }

  return (
    <Joyride
      steps={tourSteps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "#3b82f6",
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 12,
          padding: 20,
        },
        buttonNext: {
          backgroundColor: "#3b82f6",
          borderRadius: 8,
          padding: "8px 16px",
        },
        buttonBack: {
          color: "#6b7280",
          marginRight: 8,
        },
        buttonSkip: {
          color: "#6b7280",
        },
      }}
      locale={{
        back: "Tilbake",
        close: "Lukk",
        last: "Fullfør",
        next: "Neste",
        open: "Åpne",
        skip: "Hopp over",
      }}
    />
  );
}
