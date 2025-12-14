import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, Sparkles, ArrowRight, ArrowLeft, Scissors, Users, Clock, PartyPopper, Check, Cloud } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

type WizardStep = "welcome" | "service" | "employee" | "hours" | "complete";

const WORK_DAYS = [
  { value: 1, label: "Mandag" },
  { value: 2, label: "Tirsdag" },
  { value: 3, label: "Onsdag" },
  { value: 4, label: "Torsdag" },
  { value: 5, label: "Fredag" },
  { value: 6, label: "Lørdag" },
  { value: 0, label: "Søndag" },
];

export default function SetupWizard() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<WizardStep>("welcome");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Service form state
  const [serviceName, setServiceName] = useState("");
  const [serviceDuration, setServiceDuration] = useState("30");
  const [servicePrice, setServicePrice] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  
  // Employee form state
  const [employeeName, setEmployeeName] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeePhone, setEmployeePhone] = useState("");
  const [employeeCommission, setEmployeeCommission] = useState("40");
  const [skipEmployee, setSkipEmployee] = useState(false);
  
  // Business hours state
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("17:00");
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri

  const wizardStatus = trpc.wizard.getStatus.useQuery();
  const draftData = trpc.wizard.getDraftData.useQuery();
  const saveDraft = trpc.wizard.saveDraftData.useMutation();
  const updateStep = trpc.wizard.updateStep.useMutation();
  const addService = trpc.wizard.addFirstService.useMutation();
  const addEmployee = trpc.wizard.addFirstEmployee.useMutation();
  const setBusinessHours = trpc.wizard.setBusinessHours.useMutation();
  const completeWizard = trpc.wizard.complete.useMutation();
  const skipWizard = trpc.wizard.skip.useMutation();

  // Initialize wizard step from database
  useEffect(() => {
    if (wizardStatus.data?.onboardingStep) {
      setCurrentStep(wizardStatus.data.onboardingStep as WizardStep);
    }
  }, [wizardStatus.data]);

  // Restore draft data on load
  useEffect(() => {
    if (draftData.data) {
      const draft = draftData.data as any;
      if (draft.serviceName) setServiceName(draft.serviceName);
      if (draft.serviceDuration) setServiceDuration(draft.serviceDuration);
      if (draft.servicePrice) setServicePrice(draft.servicePrice);
      if (draft.serviceDescription) setServiceDescription(draft.serviceDescription);
      if (draft.employeeName) setEmployeeName(draft.employeeName);
      if (draft.employeeEmail) setEmployeeEmail(draft.employeeEmail);
      if (draft.employeePhone) setEmployeePhone(draft.employeePhone);
      if (draft.employeeCommission) setEmployeeCommission(draft.employeeCommission);
      if (draft.skipEmployee !== undefined) setSkipEmployee(draft.skipEmployee);
      if (draft.openTime) setOpenTime(draft.openTime);
      if (draft.closeTime) setCloseTime(draft.closeTime);
      if (draft.workDays) setWorkDays(draft.workDays);
    }
  }, [draftData.data]);

  // Track unsaved changes
  useEffect(() => {
    if (currentStep !== "welcome" && currentStep !== "complete") {
      setHasUnsavedChanges(true);
    }
  }, [
    currentStep,
    serviceName,
    serviceDuration,
    servicePrice,
    serviceDescription,
    employeeName,
    employeeEmail,
    employeePhone,
    employeeCommission,
    skipEmployee,
    openTime,
    closeTime,
    workDays,
  ]);

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && currentStep !== "complete") {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, currentStep]);

  // Auto-save draft data with debouncing
  useEffect(() => {
    // Skip auto-save on welcome and complete steps
    if (currentStep === "welcome" || currentStep === "complete") {
      return;
    }

    setSaveStatus("saving");
    const timeoutId = setTimeout(() => {
      saveDraft.mutate(
        {
          serviceName,
          serviceDuration,
          servicePrice,
          serviceDescription,
          employeeName,
          employeeEmail,
          employeePhone,
          employeeCommission,
          skipEmployee,
          openTime,
          closeTime,
          workDays,
        },
        {
        onSuccess: () => {
          setSaveStatus("saved");
          setHasUnsavedChanges(false);
          // Reset to idle after 2 seconds
          setTimeout(() => setSaveStatus("idle"), 2000);
        },
          onError: () => {
            setSaveStatus("idle");
          },
        }
      );
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [
    currentStep,
    serviceName,
    serviceDuration,
    servicePrice,
    serviceDescription,
    employeeName,
    employeeEmail,
    employeePhone,
    employeeCommission,
    skipEmployee,
    openTime,
    closeTime,
    workDays,
  ]);

  const handleManualSave = () => {
    if (currentStep === "welcome" || currentStep === "complete") {
      return;
    }

    setSaveStatus("saving");
    saveDraft.mutate(
      {
        serviceName,
        serviceDuration,
        servicePrice,
        serviceDescription,
        employeeName,
        employeeEmail,
        employeePhone,
        employeeCommission,
        skipEmployee,
        openTime,
        closeTime,
        workDays,
      },
      {
        onSuccess: () => {
          setSaveStatus("saved");
          setHasUnsavedChanges(false);
          toast.success("البيانات محفوظة");
          setTimeout(() => setSaveStatus("idle"), 2000);
        },
        onError: () => {
          setSaveStatus("idle");
          toast.error("فشل الحفظ - حاول مرة أخرى");
        },
      }
    );
  };

  const handleNext = async () => {
    if (currentStep === "welcome") {
      await updateStep.mutateAsync({ step: "service" });
      setCurrentStep("service");
    } else if (currentStep === "service") {
      // Validate service form
      if (!serviceName || !servicePrice) {
        toast.error("Vennligst fyll ut alle påkrevde felt");
        return;
      }

      try {
        await addService.mutateAsync({
          name: serviceName,
          duration: parseInt(serviceDuration),
          price: parseFloat(servicePrice),
          description: serviceDescription || undefined,
        });
        await updateStep.mutateAsync({ step: "employee" });
        setCurrentStep("employee");
        toast.success("Tjeneste lagt til!");
      } catch (error: any) {
        toast.error("Kunne ikke legge til tjeneste", {
          description: error.message,
        });
      }
    } else if (currentStep === "employee") {
      if (!skipEmployee) {
        // Validate employee form
        if (!employeeName) {
          toast.error("Vennligst fyll ut ansatt navn");
          return;
        }

        try {
          await addEmployee.mutateAsync({
            name: employeeName,
            email: employeeEmail || undefined,
            phone: employeePhone || undefined,
            commissionRate: parseFloat(employeeCommission),
          });
          toast.success("Ansatt lagt til!");
        } catch (error: any) {
          toast.error("Kunne ikke legge til ansatt", {
            description: error.message,
          });
          return;
        }
      }
      
      await updateStep.mutateAsync({ step: "hours" });
      setCurrentStep("hours");
    } else if (currentStep === "hours") {
      // Validate hours
      if (workDays.length === 0) {
        toast.error("Vennligst velg minst én arbeidsdag");
        return;
      }

      try {
        await setBusinessHours.mutateAsync({
          openTime,
          closeTime,
          workDays,
        });
        await completeWizard.mutateAsync();
        // Clear draft data after completion
        await saveDraft.mutateAsync({});
        setCurrentStep("complete");
        toast.success("Oppsettet er fullført!");
      } catch (error: any) {
        toast.error("Kunne ikke lagre åpningstider", {
          description: error.message,
        });
      }
    } else if (currentStep === "complete") {
      setLocation("/dashboard");
    }
  };

  const handleBack = () => {
    if (currentStep === "service") {
      setCurrentStep("welcome");
    } else if (currentStep === "employee") {
      setCurrentStep("service");
    } else if (currentStep === "hours") {
      setCurrentStep("employee");
    }
  };

  const handleSkip = async () => {
    try {
      await skipWizard.mutateAsync();
      toast.success("Veiviser hoppet over");
      setLocation("/dashboard");
    } catch (error: any) {
      toast.error("Kunne ikke hoppe over veiviser", {
        description: error.message,
      });
    }
  };

  const toggleWorkDay = (day: number) => {
    setWorkDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const getStepNumber = () => {
    const steps = ["welcome", "service", "employee", "hours", "complete"];
    return steps.indexOf(currentStep) + 1;
  };

  const isLoading = updateStep.isPending || addService.isPending || addEmployee.isPending || setBusinessHours.isPending || completeWizard.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-orange-500 mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
            Velkommen til Stylora!
          </h1>
          <p className="text-muted-foreground mt-2">
            La oss sette opp din salong på 2 minutter
          </p>
        </div>

        {/* Progress indicator */}
        {currentStep !== "complete" && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Steg {getStepNumber()} av 5
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                {Math.round((getStepNumber() / 5) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-orange-500 transition-all duration-500"
                style={{ width: `${(getStepNumber() / 5) * 100}%` }}
              />
            </div>
          </div>
        )}

        <Card className="border-2 shadow-xl relative">
          {/* Auto-save status indicator and manual save button */}
          {currentStep !== "welcome" && currentStep !== "complete" && (
            <div className="absolute top-4 right-4 flex items-center gap-3">
              {/* Save status indicator */}
              {saveStatus !== "idle" && (
                <div className="flex items-center gap-2 text-sm animate-in fade-in duration-300">
                  {saveStatus === "saving" && (
                    <>
                      <Cloud className="w-4 h-4 text-blue-500 animate-pulse" />
                      <span className="text-blue-600 font-medium">جاري الحفظ...</span>
                    </>
                  )}
                  {saveStatus === "saved" && (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 font-medium">تم الحفظ</span>
                    </>
                  )}
                </div>
              )}
              {/* Manual save button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleManualSave}
                disabled={saveStatus === "saving"}
                className="h-8 text-xs gap-1.5"
              >
                <Cloud className="w-3.5 h-3.5" />
                حفظ الآن
              </Button>
            </div>
          )}
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentStep === "welcome" && <Sparkles className="w-5 h-5 text-blue-600" />}
              {currentStep === "service" && <Scissors className="w-5 h-5 text-blue-600" />}
              {currentStep === "employee" && <Users className="w-5 h-5 text-blue-600" />}
              {currentStep === "hours" && <Clock className="w-5 h-5 text-blue-600" />}
              {currentStep === "complete" && <PartyPopper className="w-5 h-5 text-blue-600" />}
              
              {currentStep === "welcome" && "Velkommen!"}
              {currentStep === "service" && "Legg til din første tjeneste"}
              {currentStep === "employee" && "Legg til en ansatt (valgfritt)"}
              {currentStep === "hours" && "Sett åpningstider"}
              {currentStep === "complete" && "Alt klart!"}
            </CardTitle>
            <CardDescription>
              {currentStep === "welcome" && "Vi hjelper deg å komme i gang raskt"}
              {currentStep === "service" && "Hva slags tjenester tilbyr du?"}
              {currentStep === "employee" && "Hvem jobber i salongen din?"}
              {currentStep === "hours" && "Når er dere åpne?"}
              {currentStep === "complete" && "Din salong er klar til bruk!"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Welcome Step */}
            {currentStep === "welcome" && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-900 mb-3">Hva skjer nå?</h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Legg til din første tjeneste (f.eks. "Herreklipp")</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Legg til ansatte (eller hopp over hvis du jobber alene)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Sett åpningstider for din salong</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Begynn å ta imot bookinger!</span>
                    </li>
                  </ul>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Dette tar bare 2 minutter, og du kan alltid endre det senere
                </p>
              </div>
            )}

            {/* Service Step */}
            {currentStep === "service" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceName">
                    Tjenestenavn <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="serviceName"
                    placeholder="F.eks. Herreklipp, Dameklipp, Skjeggstuss"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceDuration">
                      Varighet (minutter) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="serviceDuration"
                      type="number"
                      placeholder="30"
                      value={serviceDuration}
                      onChange={(e) => setServiceDuration(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="servicePrice">
                      Pris (NOK) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="servicePrice"
                      type="number"
                      placeholder="350"
                      value={servicePrice}
                      onChange={(e) => setServicePrice(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceDescription">Beskrivelse (valgfritt)</Label>
                  <Input
                    id="serviceDescription"
                    placeholder="Kort beskrivelse av tjenesten"
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Employee Step */}
            {currentStep === "employee" && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <Checkbox
                    id="skipEmployee"
                    checked={skipEmployee}
                    onCheckedChange={(checked) => setSkipEmployee(checked as boolean)}
                  />
                  <label
                    htmlFor="skipEmployee"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Jeg jobber alene akkurat nå (hopp over dette steget)
                  </label>
                </div>

                {!skipEmployee && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="employeeName">
                        Navn <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="employeeName"
                        placeholder="F.eks. Ole Hansen"
                        value={employeeName}
                        onChange={(e) => setEmployeeName(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employeeEmail">E-post (valgfritt)</Label>
                      <Input
                        id="employeeEmail"
                        type="email"
                        placeholder="ole@example.com"
                        value={employeeEmail}
                        onChange={(e) => setEmployeeEmail(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employeePhone">Telefon (valgfritt)</Label>
                      <Input
                        id="employeePhone"
                        type="tel"
                        placeholder="+47 123 45 678"
                        value={employeePhone}
                        onChange={(e) => setEmployeePhone(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employeeCommission">Provisjon (%)</Label>
                      <Input
                        id="employeeCommission"
                        type="number"
                        placeholder="40"
                        value={employeeCommission}
                        onChange={(e) => setEmployeeCommission(e.target.value)}
                        disabled={isLoading}
                      />
                      <p className="text-xs text-muted-foreground">
                        Standard provisjon er 40% av tjenestepris
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Hours Step */}
            {currentStep === "hours" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="openTime">Åpningstid</Label>
                    <Input
                      id="openTime"
                      type="time"
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="closeTime">Stengetid</Label>
                    <Input
                      id="closeTime"
                      type="time"
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Arbeidsdager</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {WORK_DAYS.map((day) => (
                      <div key={day.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${day.value}`}
                          checked={workDays.includes(day.value)}
                          onCheckedChange={() => toggleWorkDay(day.value)}
                          disabled={isLoading}
                        />
                        <label
                          htmlFor={`day-${day.value}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {day.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Du kan alltid endre åpningstider senere i innstillinger
                </p>
              </div>
            )}

            {/* Complete Step */}
            {currentStep === "complete" && (
              <div className="space-y-6 text-center py-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Gratulerer! 🎉</h3>
                  <p className="text-muted-foreground">
                    Din salong er nå klar til å ta imot bookinger. Du kan begynne å legge til flere tjenester, ansatte og kunder fra dashbordet.
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Neste steg:</h4>
                  <ul className="text-sm text-blue-800 space-y-1 text-left">
                    <li>• Legg til flere tjenester og priser</li>
                    <li>• Inviter flere ansatte til systemet</li>
                    <li>• Del booking-linken med kundene dine</li>
                    <li>• Begynn å registrere avtaler</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6 pt-6 border-t">
              <div>
                {currentStep !== "welcome" && currentStep !== "complete" && (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={isLoading}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Tilbake
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                {currentStep !== "complete" && (
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    disabled={isLoading || skipWizard.isPending}
                  >
                    Hopp over
                  </Button>
                )}
                
                <Button
                  onClick={handleNext}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Vennligst vent...
                    </>
                  ) : currentStep === "complete" ? (
                    <>
                      Gå til Dashboard
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Neste
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
