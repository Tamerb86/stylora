import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, CheckCircle2, Sparkles, ArrowRight, ArrowLeft, Building2, User, CreditCard, Check } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

type Step = 1 | 2 | 3 | 4;

export default function SignUp() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState({
    // Step 1: Business Information
    salonName: "",
    address: "",
    orgNumber: "",
    salonType: "hair", // hair, beauty, barbershop, spa
    
    // Step 2: Owner Details
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    
    // Step 3: Plan Selection
    selectedPlan: "pro", // start, pro, enterprise
  });

  const createTenant = trpc.signup.createTenant.useMutation({
    onSuccess: (data) => {
      toast.success("Velkommen til Stylora! 🎉", {
        description: `Kontoen din er opprettet!`,
      });
      
      // Redirect to setup wizard after short delay
      setTimeout(() => {
        setLocation("/setup-wizard");
      }, 1500);
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette konto", {
        description: error.message,
      });
    },
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: Step): boolean => {
    switch (step) {
      case 1:
        if (!formData.salonName) {
          toast.error("Vennligst fyll inn salongnavn");
          return false;
        }
        if (!formData.address) {
          toast.error("Vennligst fyll inn adresse");
          return false;
        }
        return true;
      case 2:
        if (!formData.ownerName) {
          toast.error("Vennligst fyll inn ditt navn");
          return false;
        }
        if (!formData.ownerEmail) {
          toast.error("Vennligst fyll inn e-postadresse");
          return false;
        }
        if (!formData.ownerPhone) {
          toast.error("Vennligst fyll inn telefonnummer");
          return false;
        }
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.ownerEmail)) {
          toast.error("Vennligst fyll inn en gyldig e-postadresse");
          return false;
        }
        return true;
      case 3:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(4, prev + 1) as Step);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1) as Step);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      return;
    }

    // Send only the fields expected by the API
    createTenant.mutate({
      salonName: formData.salonName,
      ownerEmail: formData.ownerEmail,
      ownerPhone: formData.ownerPhone,
      address: formData.address,
      orgNumber: formData.orgNumber,
    });
  };

  const plans = [
    {
      id: "start",
      name: "Start",
      price: "299",
      description: "Perfekt for enkeltpersonforetak",
      features: ["1 behandler", "100 SMS/mnd", "Online booking", "Grunnleggende rapporter"],
    },
    {
      id: "pro",
      name: "Pro",
      price: "699",
      description: "For voksende salonger",
      features: ["Opptil 5 behandlere", "500 SMS/mnd", "Alle funksjoner", "Avanserte rapporter"],
      highlighted: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "1499",
      description: "For kjeder og store salonger",
      features: ["Ubegrenset behandlere", "2000 SMS/mnd", "Flerlokalitetsstyring", "API-tilgang"],
    },
  ];

  const salonTypes = [
    { id: "hair", label: "Frisørsalong", icon: "✂️" },
    { id: "beauty", label: "Skjønnhetssalong", icon: "💄" },
    { id: "barbershop", label: "Barbershop", icon: "💈" },
    { id: "spa", label: "Spa & Wellness", icon: "🧖" },
  ];

  const steps = [
    { number: 1, title: "Bedriftsinformasjon", icon: Building2 },
    { number: 2, title: "Dine opplysninger", icon: User },
    { number: 3, title: "Velg plan", icon: CreditCard },
    { number: 4, title: "Bekreft", icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-orange-500 mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
            Kom i gang med Stylora
          </h1>
          <p className="text-muted-foreground mt-2">
            14 dagers gratis prøveperiode • Ingen kredittkort nødvendig
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      currentStep >= step.number
                        ? "bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-lg scale-110"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {currentStep > step.number ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  <span className={`text-xs mt-2 font-medium hidden md:block ${currentStep >= step.number ? "text-primary" : "text-muted-foreground"}`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-all duration-300 ${
                      currentStep > step.number ? "bg-gradient-to-r from-blue-600 to-orange-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && "Fortell oss om din bedrift"}
              {currentStep === 2 && "Dine kontaktopplysninger"}
              {currentStep === 3 && "Velg din plan"}
              {currentStep === 4 && "Bekreft og opprett konto"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Grunnleggende informasjon om salongen din"}
              {currentStep === 2 && "Slik at vi kan kontakte deg"}
              {currentStep === 3 && "Du kan endre plan når som helst"}
              {currentStep === 4 && "Gjennomgå informasjonen før du oppretter kontoen"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Business Information */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="space-y-2">
                    <Label htmlFor="salonName">
                      Salongnavn <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="salonName"
                      placeholder="Min Frisørsalong"
                      value={formData.salonName}
                      onChange={(e) => handleChange("salonName", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Type virksomhet</Label>
                    <RadioGroup
                      value={formData.salonType}
                      onValueChange={(value) => handleChange("salonType", value)}
                      className="grid grid-cols-2 gap-4"
                    >
                      {salonTypes.map((type) => (
                        <Label
                          key={type.id}
                          htmlFor={type.id}
                          className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            formData.salonType === type.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <RadioGroupItem value={type.id} id={type.id} className="sr-only" />
                          <span className="text-2xl">{type.icon}</span>
                          <span className="font-medium">{type.label}</span>
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">
                      Adresse <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="address"
                      placeholder="Storgata 1, 0123 Oslo"
                      value={formData.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orgNumber">Organisasjonsnummer (valgfritt)</Label>
                    <Input
                      id="orgNumber"
                      placeholder="123 456 789"
                      value={formData.orgNumber}
                      onChange={(e) => handleChange("orgNumber", e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Owner Details */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="space-y-2">
                    <Label htmlFor="ownerName">
                      Ditt navn <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="ownerName"
                      placeholder="Ola Nordmann"
                      value={formData.ownerName}
                      onChange={(e) => handleChange("ownerName", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ownerEmail">
                      E-postadresse <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="ownerEmail"
                      type="email"
                      placeholder="ola@example.com"
                      value={formData.ownerEmail}
                      onChange={(e) => handleChange("ownerEmail", e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Vi sender bekreftelse og påloggingsinformasjon til denne adressen
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ownerPhone">
                      Telefonnummer <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="ownerPhone"
                      type="tel"
                      placeholder="+47 123 45 678"
                      value={formData.ownerPhone}
                      onChange={(e) => handleChange("ownerPhone", e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Plan Selection */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <RadioGroup
                    value={formData.selectedPlan}
                    onValueChange={(value) => handleChange("selectedPlan", value)}
                    className="grid md:grid-cols-3 gap-4"
                  >
                    {plans.map((plan) => (
                      <Label
                        key={plan.id}
                        htmlFor={plan.id}
                        className={`relative flex flex-col p-6 border-2 rounded-xl cursor-pointer transition-all ${
                          formData.selectedPlan === plan.id
                            ? "border-primary bg-primary/5 shadow-lg scale-105"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {plan.highlighted && (
                          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-orange-500 text-white">
                            Mest populær
                          </Badge>
                        )}
                        <RadioGroupItem value={plan.id} id={plan.id} className="sr-only" />
                        <div className="text-center mb-4">
                          <h3 className="font-bold text-xl mb-2">{plan.name}</h3>
                          <div className="mb-2">
                            <span className="text-4xl font-bold">{plan.price}</span>
                            <span className="text-muted-foreground"> kr/mnd</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{plan.description}</p>
                        </div>
                        <ul className="space-y-2 text-sm">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500 shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </Label>
                    ))}
                  </RadioGroup>
                  <p className="text-center text-sm text-muted-foreground">
                    Alle planer inkluderer 14 dagers gratis prøveperiode
                  </p>
                </div>
              )}

              {/* Step 4: Confirmation */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="bg-accent/30 p-6 rounded-lg space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        Bedriftsinformasjon
                      </h4>
                      <div className="pl-7 space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Salongnavn:</span> {formData.salonName}</p>
                        <p><span className="text-muted-foreground">Type:</span> {salonTypes.find(t => t.id === formData.salonType)?.label}</p>
                        <p><span className="text-muted-foreground">Adresse:</span> {formData.address}</p>
                        {formData.orgNumber && (
                          <p><span className="text-muted-foreground">Org.nr:</span> {formData.orgNumber}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Kontaktperson
                      </h4>
                      <div className="pl-7 space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Navn:</span> {formData.ownerName}</p>
                        <p><span className="text-muted-foreground">E-post:</span> {formData.ownerEmail}</p>
                        <p><span className="text-muted-foreground">Telefon:</span> {formData.ownerPhone}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        Valgt plan
                      </h4>
                      <div className="pl-7 text-sm">
                        <p>
                          <span className="font-semibold">{plans.find(p => p.id === formData.selectedPlan)?.name}</span>
                          {" - "}
                          <span className="text-muted-foreground">
                            {plans.find(p => p.id === formData.selectedPlan)?.price} kr/mnd
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                          14 dagers gratis prøveperiode
                        </p>
                        <p className="text-blue-700 dark:text-blue-300">
                          Du vil ikke bli belastet før prøveperioden er over. Du kan avslutte når som helst.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-4 pt-4">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={createTenant.isPending}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Tilbake
                  </Button>
                )}
                
                {currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white"
                  >
                    Neste
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={createTenant.isPending}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white"
                  >
                    {createTenant.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Oppretter konto...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Opprett konto
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Ved å opprette en konto godtar du våre{" "}
          <a href="#" className="text-primary hover:underline">
            vilkår og betingelser
          </a>
          {" "}og{" "}
          <a href="#" className="text-primary hover:underline">
            personvernregler
          </a>
        </p>
      </div>
    </div>
  );
}
