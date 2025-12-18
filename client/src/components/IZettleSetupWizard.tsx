import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ArrowRight, ArrowLeft, ExternalLink, CreditCard, Smartphone, Zap } from "lucide-react";

interface IZettleSetupWizardProps {
  open: boolean;
  onClose: () => void;
  onStartConnection: () => void;
}

export function IZettleSetupWizard({ open, onClose, onStartConnection }: IZettleSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const steps = [
    {
      number: 1,
      title: "Hva er iZettle?",
      icon: <CreditCard className="w-12 h-12 text-primary" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            iZettle er en moderne betalingsløsning som lar deg ta imot kortbetalinger direkte i salongen din.
          </p>
          <div className="bg-primary/5 p-4 rounded-lg space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Fordeler med iZettle:
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Ta imot alle typer kortbetalinger (Visa, Mastercard, Vipps, Apple Pay)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Pengene går direkte til din egen bankkonto (neste virkedag)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Ingen ekstra kostnader fra Stylora - kun iZettles gebyr (1,75%)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Automatisk synkronisering med Stylora</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Sikker og PCI DSS-sertifisert</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      number: 2,
      title: "Opprett iZettle-konto",
      icon: <Smartphone className="w-12 h-12 text-primary" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Før du kan koble til iZettle, trenger du en aktiv iZettle-konto.
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-3">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">
              Har du allerede iZettle-konto?
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Hvis du allerede har en iZettle-konto, kan du hoppe over dette steget og gå videre til neste.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">Opprett ny iZettle-konto:</h4>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  1
                </span>
                <span>Gå til iZettles nettside og klikk "Kom i gang"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  2
                </span>
                <span>Fyll ut informasjon om salongen (org.nr, kontaktinfo, bankkonto)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  3
                </span>
                <span>Fullfør registreringen og verifiser e-postadressen din</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  4
                </span>
                <span>Vent på godkjenning (tar vanligvis 1-3 virkedager)</span>
              </li>
            </ol>
          </div>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.open("https://www.izettle.com/no", "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Åpne iZettle.com
          </Button>

          <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Viktig:</strong> Hver salong må ha sin egen iZettle-konto. Dette sikrer at pengene går til riktig bankkonto.
            </p>
          </div>
        </div>
      ),
    },
    {
      number: 3,
      title: "Koble til iZettle",
      icon: <Zap className="w-12 h-12 text-primary" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Nå skal vi koble din iZettle-konto til Stylora. Dette er en enkel og sikker prosess.
          </p>

          <div className="space-y-3">
            <h4 className="font-semibold">Slik fungerer det:</h4>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  1
                </span>
                <span>Klikk "Start tilkobling" nedenfor</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  2
                </span>
                <span>Du sendes til iZettles innloggingsside</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  3
                </span>
                <span>Logg inn med din iZettle-konto</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  4
                </span>
                <span>Klikk "Godkjenn" for å gi Stylora tilgang</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  5
                </span>
                <span>Du sendes tilbake til Stylora - ferdig!</span>
              </li>
            </ol>
          </div>

          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Sikkerhet
            </h4>
            <p className="text-sm text-green-800 dark:text-green-200">
              Stylora lagrer aldri kortnumre eller sensitive kortdata. All kommunikasjon er kryptert og sikker.
            </p>
          </div>

          <Button 
            className="w-full"
            size="lg"
            onClick={() => {
              onClose();
              onStartConnection();
            }}
          >
            <Zap className="w-4 h-4 mr-2" />
            Start tilkobling
          </Button>
        </div>
      ),
    },
    {
      number: 4,
      title: "Start å ta imot betalinger",
      icon: <CheckCircle2 className="w-12 h-12 text-green-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Gratulerer! Når du har koblet til iZettle, er du klar til å ta imot kortbetalinger.
          </p>

          <div className="space-y-3">
            <h4 className="font-semibold">Slik bruker du iZettle i Stylora:</h4>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  1
                </span>
                <span>Gå til <strong>Salg (POS)</strong> i menyen</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  2
                </span>
                <span>Legg til tjenester og/eller produkter i handlekurven</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  3
                </span>
                <span>Klikk på den grønne knappen <strong>"Betal med iZettle"</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  4
                </span>
                <span>Kunden betaler med kort via iZettle-terminal eller app</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  5
                </span>
                <span>Kvittering sendes automatisk og betalingen registreres</span>
              </li>
            </ol>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">
              💡 Tips
            </h4>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>• Pengene utbetales til din bankkonto neste virkedag</li>
              <li>• Du kan se alle betalinger under "Ordre" i menyen</li>
              <li>• Last ned iZettle-appen som backup</li>
              <li>• Test gjerne med ditt eget kort først</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Button 
              className="w-full"
              size="lg"
              onClick={onClose}
            >
              Ferdig - Lukk veiviseren
            </Button>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => window.open("/help/izettle", "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Les full brukerveiledning
            </Button>
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep - 1];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Kom i gang med iZettle</DialogTitle>
          <DialogDescription>
            En enkel guide for å sette opp kortbetalinger i salongen din
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicators */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    currentStep === step.number
                      ? "bg-primary text-primary-foreground"
                      : currentStep > step.number
                      ? "bg-green-600 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {currentStep > step.number ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    step.number
                  )}
                </div>
                <span className="text-xs mt-1 text-center hidden sm:block">
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 rounded transition-colors ${
                    currentStep > step.number ? "bg-green-600" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            {currentStepData.icon}
            <div>
              <h3 className="text-xl font-semibold">{currentStepData.title}</h3>
              <p className="text-sm text-muted-foreground">
                Steg {currentStep} av {totalSteps}
              </p>
            </div>
          </div>

          <div className="min-h-[300px]">{currentStepData.content}</div>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Forrige
          </Button>

          <div className="text-sm text-muted-foreground">
            {currentStep} / {totalSteps}
          </div>

          {currentStep < totalSteps ? (
            <Button onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}>
              Neste
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={onClose}>Ferdig</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
