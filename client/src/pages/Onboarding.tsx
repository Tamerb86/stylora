import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { 
  CheckCircle2, Building2, User, Clock, Users, Scissors, CreditCard, FileCheck,
  Plus, Trash2, Edit2, Check, X
} from "lucide-react";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";

// Helper function to create schemas with i18n
const createSchemas = (t: (key: string) => string) => {
  // Step 1: Salon Information
  const salonInfoSchema = z.object({
    salonName: z.string().min(2, t("onboarding.salonInfo.salonNameRequired")),
    subdomain: z.string().min(3, t("onboarding.salonInfo.subdomainRequired")).regex(/^[a-z0-9-]+$/, t("onboarding.salonInfo.subdomainPattern")),
    address: z.string().min(5, t("onboarding.salonInfo.addressRequired")),
    city: z.string().min(2, t("onboarding.salonInfo.cityRequired")),
    phone: z.string().min(8, t("onboarding.salonInfo.phoneRequired")),
    email: z.string().email(t("onboarding.salonInfo.emailInvalid")),
  });

  // Step 2: Owner Account
  const ownerAccountSchema = z.object({
    ownerName: z.string().min(2, t("onboarding.ownerAccount.fullNameRequired")),
    ownerEmail: z.string().email(t("onboarding.ownerAccount.emailInvalid")),
    password: z.string().min(8, t("onboarding.ownerAccount.passwordMinLength")),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t("onboarding.ownerAccount.passwordsMismatch"),
    path: ["confirmPassword"],
  });

  return { salonInfoSchema, ownerAccountSchema };
};

// Step 3: Business Hours
const businessHoursSchema = z.object({
  mondayOpen: z.string(),
  mondayClose: z.string(),
  tuesdayOpen: z.string(),
  tuesdayClose: z.string(),
  wednesdayOpen: z.string(),
  wednesdayClose: z.string(),
  thursdayOpen: z.string(),
  thursdayClose: z.string(),
  fridayOpen: z.string(),
  fridayClose: z.string(),
  saturdayOpen: z.string(),
  saturdayClose: z.string(),
  sundayClosed: z.boolean(),
});

// Employee type
type Employee = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "employee" | "manager" | "admin";
  permissions: {
    viewAppointments: boolean;
    manageCustomers: boolean;
    accessReports: boolean;
  };
};

// Service type
type Service = {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  description: string;
  color: string;
};

type OnboardingData = {
  salonInfo: z.infer<ReturnType<typeof createSchemas>["salonInfoSchema"]>;
  ownerAccount: z.infer<ReturnType<typeof createSchemas>["ownerAccountSchema"]>;
  businessHours: z.infer<typeof businessHoursSchema>;
  employees: Employee[];
  services: Service[];
  paymentSettings: { stripeEnabled: boolean; vippsEnabled: boolean };
};

export default function Onboarding() {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<Partial<OnboardingData>>({
    employees: [],
    services: [],
    paymentSettings: { stripeEnabled: false, vippsEnabled: false },
  });
  const [, setLocation] = useLocation();
  
  // Create schemas with current translations
  const { salonInfoSchema, ownerAccountSchema } = createSchemas(t);

  // Define steps with translations
  const steps = [
    { id: 1, name: t("onboarding.steps.salonInfo"), icon: Building2 },
    { id: 2, name: t("onboarding.steps.ownerAccount"), icon: User },
    { id: 3, name: t("onboarding.steps.businessHours"), icon: Clock },
    { id: 4, name: t("onboarding.steps.employees"), icon: Users },
    { id: 5, name: t("onboarding.steps.services"), icon: Scissors },
    { id: 6, name: t("onboarding.steps.paymentSettings"), icon: CreditCard },
    { id: 7, name: t("onboarding.steps.review"), icon: FileCheck },
  ];

  // Service colors with translations
  const serviceColors = [
    { value: "#667eea", label: t("onboarding.services.colorOptions.purple") },
    { value: "#f56565", label: t("onboarding.services.colorOptions.red") },
    { value: "#48bb78", label: t("onboarding.services.colorOptions.green") },
    { value: "#ed8936", label: t("onboarding.services.colorOptions.orange") },
    { value: "#4299e1", label: t("onboarding.services.colorOptions.blue") },
    { value: "#9f7aea", label: t("onboarding.services.colorOptions.violet") },
    { value: "#ed64a6", label: t("onboarding.services.colorOptions.pink") },
    { value: "#38b2ac", label: t("onboarding.services.colorOptions.teal") },
  ];
  
  // Employee form state
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: "",
    email: "",
    phone: "",
    role: "employee",
    permissions: {
      viewAppointments: true,
      manageCustomers: false,
      accessReports: false,
    },
  });
  
  // Service form state
  const [newService, setNewService] = useState<Partial<Service>>({
    name: "",
    category: t("onboarding.services.defaultCategory"),
    duration: 30,
    price: 250,
    description: "",
    color: "#667eea",
  });
  
  const [serviceCategories, setServiceCategories] = useState<string[]>([t("onboarding.services.defaultCategory")]);
  const [newCategory, setNewCategory] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const progress = (currentStep / steps.length) * 100;

  // Step 1: Salon Info Form
  const salonInfoForm = useForm<z.infer<typeof salonInfoSchema>>({
    resolver: zodResolver(salonInfoSchema),
    defaultValues: onboardingData.salonInfo,
  });

  // Step 2: Owner Account Form
  const ownerAccountForm = useForm<z.infer<typeof ownerAccountSchema>>({
    resolver: zodResolver(ownerAccountSchema),
    defaultValues: onboardingData.ownerAccount,
  });

  // Step 3: Business Hours Form
  const businessHoursForm = useForm<z.infer<typeof businessHoursSchema>>({
    resolver: zodResolver(businessHoursSchema),
    defaultValues: onboardingData.businessHours || {
      mondayOpen: "09:00",
      mondayClose: "18:00",
      tuesdayOpen: "09:00",
      tuesdayClose: "18:00",
      wednesdayOpen: "09:00",
      wednesdayClose: "18:00",
      thursdayOpen: "09:00",
      thursdayClose: "18:00",
      fridayOpen: "09:00",
      fridayClose: "18:00",
      saturdayOpen: "10:00",
      saturdayClose: "16:00",
      sundayClosed: true,
    },
  });

  const completeOnboarding = trpc.onboarding.complete.useMutation({
    onSuccess: (data) => {
      toast.success(t("onboarding.messages.accountCreated"));
      toast.info(t("onboarding.messages.welcomeEmailSent", { email: data.email }));
      setTimeout(() => {
        setLocation("/login");
      }, 2000);
    },
    onError: (error) => {
      toast.error(t("onboarding.messages.error", { message: error.message }));
    },
  });

  // Employee functions
  const addEmployee = () => {
    if (!newEmployee.name || !newEmployee.email) {
      toast.error(t("onboarding.employees.nameRequired") + " & " + t("onboarding.employees.emailRequired"));
      return;
    }
    
    if (onboardingData.employees && onboardingData.employees.length >= 10) {
      toast.error(t("onboarding.employees.maxEmployeesReached"));
      return;
    }

    const employee: Employee = {
      id: Math.random().toString(36).substr(2, 9),
      name: newEmployee.name!,
      email: newEmployee.email!,
      phone: newEmployee.phone || "",
      role: newEmployee.role || "employee",
      permissions: newEmployee.permissions || {
        viewAppointments: true,
        manageCustomers: false,
        accessReports: false,
      },
    };

    setOnboardingData((prev) => ({
      ...prev,
      employees: [...(prev.employees || []), employee],
    }));

    setNewEmployee({
      name: "",
      email: "",
      phone: "",
      role: "employee",
      permissions: {
        viewAppointments: true,
        manageCustomers: false,
        accessReports: false,
      },
    });

    toast.success(t("onboarding.employees.employeeAdded"));
  };

  const removeEmployee = (id: string) => {
    setOnboardingData((prev) => ({
      ...prev,
      employees: prev.employees?.filter((e) => e.id !== id),
    }));
    toast.success(t("onboarding.employees.employeeRemoved"));
  };

  // Service functions
  const addService = () => {
    if (!newService.name) {
      toast.error(t("onboarding.services.serviceNameRequired"));
      return;
    }
    
    if (onboardingData.services && onboardingData.services.length >= 20) {
      toast.error(t("onboarding.services.maxServicesReached"));
      return;
    }

    const service: Service = {
      id: Math.random().toString(36).substr(2, 9),
      name: newService.name!,
      category: newService.category || t("onboarding.services.defaultCategory"),
      duration: newService.duration || 30,
      price: newService.price || 250,
      description: newService.description || "",
      color: newService.color || "#667eea",
    };

    setOnboardingData((prev) => ({
      ...prev,
      services: [...(prev.services || []), service],
    }));

    setNewService({
      name: "",
      category: t("onboarding.services.defaultCategory"),
      duration: 30,
      price: 250,
      description: "",
      color: "#667eea",
    });

    toast.success(t("onboarding.services.serviceAdded"));
  };

  const removeService = (id: string) => {
    setOnboardingData((prev) => ({
      ...prev,
      services: prev.services?.filter((s) => s.id !== id),
    }));
    toast.success(t("onboarding.services.serviceRemoved"));
  };

  const addCategory = () => {
    if (!newCategory.trim()) {
      toast.error(t("onboarding.services.categoryRequired"));
      return;
    }
    
    if (serviceCategories.includes(newCategory.trim())) {
      toast.error(t("onboarding.services.categoryExists"));
      return;
    }

    setServiceCategories([...serviceCategories, newCategory.trim()]);
    setNewService({ ...newService, category: newCategory.trim() });
    setNewCategory("");
    toast.success(t("onboarding.services.categoryAdded"));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      salonInfoForm.handleSubmit((data) => {
        setOnboardingData((prev) => ({ ...prev, salonInfo: data }));
        setCurrentStep(2);
      })();
    } else if (currentStep === 2) {
      ownerAccountForm.handleSubmit((data) => {
        setOnboardingData((prev) => ({ ...prev, ownerAccount: data }));
        setCurrentStep(3);
      })();
    } else if (currentStep === 3) {
      businessHoursForm.handleSubmit((data) => {
        setOnboardingData((prev) => ({ ...prev, businessHours: data }));
        setCurrentStep(4);
      })();
    } else if (currentStep === 4) {
      // Employees step - optional, can skip
      if (!onboardingData.employees || onboardingData.employees.length === 0) {
        toast.info(t("onboarding.employees.canAddLater"));
      }
      setCurrentStep(5);
    } else if (currentStep === 5) {
      // Services step - at least one service required
      if (!onboardingData.services || onboardingData.services.length === 0) {
        toast.error(t("onboarding.services.atLeastOneServiceRequired"));
        return;
      }
      setCurrentStep(6);
    } else if (currentStep === 6) {
      // Payment settings - optional
      setCurrentStep(7);
    } else if (currentStep === 7) {
      // Final review - submit
      if (!acceptedTerms) {
        toast.error(t("onboarding.review.termsRequired"));
        return;
      }
      completeOnboarding.mutate(onboardingData as OnboardingData);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent mb-2">
            {t("onboarding.welcome")}
          </h1>
          <p className="text-gray-600">{t("onboarding.subtitle")}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-4">
            {steps.map((step) => {
              const Icon = step.icon;
              const isCompleted = step.id < currentStep;
              const isCurrent = step.id === currentStep;
              
              return (
                <div 
                  key={step.id} 
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => goToStep(step.id)}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isCurrent
                        ? "bg-gradient-to-r from-purple-600 to-orange-500 text-white"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs hidden md:block ${isCurrent ? "font-semibold" : ""}`}>
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{steps[currentStep - 1].name}</CardTitle>
            <CardDescription>
              {currentStep === 1 && t("onboarding.stepDescriptions.salonInfo")}
              {currentStep === 2 && t("onboarding.stepDescriptions.ownerAccount")}
              {currentStep === 3 && t("onboarding.stepDescriptions.businessHours")}
              {currentStep === 4 && t("onboarding.stepDescriptions.employees")}
              {currentStep === 5 && t("onboarding.stepDescriptions.services")}
              {currentStep === 6 && t("onboarding.stepDescriptions.paymentSettings")}
              {currentStep === 7 && t("onboarding.stepDescriptions.review")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Salon Information */}
            {currentStep === 1 && (
              <form className="space-y-4">
                <div>
                  <Label htmlFor="salonName">{t("onboarding.salonInfo.salonName")} *</Label>
                  <Input
                    id="salonName"
                    {...salonInfoForm.register("salonName")}
                    placeholder={t("onboarding.salonInfo.salonNamePlaceholder")}
                  />
                  {salonInfoForm.formState.errors.salonName && (
                    <p className="text-sm text-red-500 mt-1">
                      {salonInfoForm.formState.errors.salonName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="subdomain">{t("onboarding.salonInfo.subdomain")} *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="subdomain"
                      {...salonInfoForm.register("subdomain")}
                      placeholder={t("onboarding.salonInfo.subdomainPlaceholder")}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-500">{t("onboarding.salonInfo.subdomainSuffix")}</span>
                  </div>
                  {salonInfoForm.formState.errors.subdomain && (
                    <p className="text-sm text-red-500 mt-1">
                      {salonInfoForm.formState.errors.subdomain.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {t("onboarding.salonInfo.subdomainHint")}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="address">{t("onboarding.salonInfo.address")} *</Label>
                    <Input
                      id="address"
                      {...salonInfoForm.register("address")}
                      placeholder={t("onboarding.salonInfo.addressPlaceholder")}
                    />
                    {salonInfoForm.formState.errors.address && (
                      <p className="text-sm text-red-500 mt-1">
                        {salonInfoForm.formState.errors.address.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="city">{t("onboarding.salonInfo.city")} *</Label>
                    <Input
                      id="city"
                      {...salonInfoForm.register("city")}
                      placeholder={t("onboarding.salonInfo.cityPlaceholder")}
                    />
                    {salonInfoForm.formState.errors.city && (
                      <p className="text-sm text-red-500 mt-1">
                        {salonInfoForm.formState.errors.city.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">{t("onboarding.salonInfo.phone")} *</Label>
                    <Input
                      id="phone"
                      {...salonInfoForm.register("phone")}
                      placeholder={t("onboarding.salonInfo.phonePlaceholder")}
                    />
                    {salonInfoForm.formState.errors.phone && (
                      <p className="text-sm text-red-500 mt-1">
                        {salonInfoForm.formState.errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">{t("onboarding.salonInfo.email")} *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...salonInfoForm.register("email")}
                      placeholder={t("onboarding.salonInfo.emailPlaceholder")}
                    />
                    {salonInfoForm.formState.errors.email && (
                      <p className="text-sm text-red-500 mt-1">
                        {salonInfoForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                </div>
              </form>
            )}

            {/* Step 2: Owner Account */}
            {currentStep === 2 && (
              <form className="space-y-4">
                <div>
                  <Label htmlFor="ownerName">{t("onboarding.ownerAccount.fullName")} *</Label>
                  <Input
                    id="ownerName"
                    {...ownerAccountForm.register("ownerName")}
                    placeholder={t("onboarding.ownerAccount.fullNamePlaceholder")}
                  />
                  {ownerAccountForm.formState.errors.ownerName && (
                    <p className="text-sm text-red-500 mt-1">
                      {ownerAccountForm.formState.errors.ownerName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="ownerEmail">{t("onboarding.ownerAccount.email")} *</Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    {...ownerAccountForm.register("ownerEmail")}
                    placeholder={t("onboarding.ownerAccount.emailPlaceholder")}
                  />
                  {ownerAccountForm.formState.errors.ownerEmail && (
                    <p className="text-sm text-red-500 mt-1">
                      {ownerAccountForm.formState.errors.ownerEmail.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password">{t("onboarding.ownerAccount.password")} *</Label>
                  <Input
                    id="password"
                    type="password"
                    {...ownerAccountForm.register("password")}
                    placeholder="••••••••"
                  />
                  {ownerAccountForm.formState.errors.password && (
                    <p className="text-sm text-red-500 mt-1">
                      {ownerAccountForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword">{t("onboarding.ownerAccount.confirmPassword")} *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...ownerAccountForm.register("confirmPassword")}
                    placeholder="••••••••"
                  />
                  {ownerAccountForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-500 mt-1">
                      {ownerAccountForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </form>
            )}

            {/* Step 3: Business Hours */}
            {currentStep === 3 && (
              <form className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  {t("onboarding.businessHours.title")}
                </p>

                {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map((day) => {
                  const dayNames: Record<string, string> = {
                    monday: t("onboarding.businessHours.monday"),
                    tuesday: t("onboarding.businessHours.tuesday"),
                    wednesday: t("onboarding.businessHours.wednesday"),
                    thursday: t("onboarding.businessHours.thursday"),
                    friday: t("onboarding.businessHours.friday"),
                    saturday: t("onboarding.businessHours.saturday"),
                  };

                  return (
                    <div key={day} className="grid grid-cols-3 gap-4 items-center">
                      <Label>{dayNames[day]}</Label>
                      <div>
                        <Input
                          type="time"
                          {...businessHoursForm.register(`${day}Open` as any)}
                        />
                      </div>
                      <div>
                        <Input
                          type="time"
                          {...businessHoursForm.register(`${day}Close` as any)}
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center gap-2 pt-4 border-t">
                  <input
                    type="checkbox"
                    id="sundayClosed"
                    {...businessHoursForm.register("sundayClosed")}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="sundayClosed">{t("onboarding.businessHours.sundayClosed")}</Label>
                </div>
              </form>
            )}

            {/* Step 4: Employees */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    {t("onboarding.employees.optionalNote")}
                  </p>
                </div>

                {/* Add Employee Form */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold text-lg">{t("onboarding.employees.addNewEmployee")}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>{t("onboarding.employees.name")} *</Label>
                      <Input
                        value={newEmployee.name}
                        onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                        placeholder={t("onboarding.employees.namePlaceholder")}
                      />
                    </div>
                    <div>
                      <Label>{t("onboarding.employees.email")} *</Label>
                      <Input
                        type="email"
                        value={newEmployee.email}
                        onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                        placeholder={t("onboarding.employees.emailPlaceholder")}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>{t("onboarding.employees.phone")}</Label>
                      <Input
                        value={newEmployee.phone}
                        onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                        placeholder={t("onboarding.salonInfo.phonePlaceholder")}
                      />
                    </div>
                    <div>
                      <Label>{t("onboarding.employees.role")}</Label>
                      <Select
                        value={newEmployee.role}
                        onValueChange={(value: any) => setNewEmployee({ ...newEmployee, role: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">{t("onboarding.employees.roleEmployee")}</SelectItem>
                          <SelectItem value="manager">{t("onboarding.employees.roleManager")}</SelectItem>
                          <SelectItem value="admin">{t("onboarding.employees.roleAdmin")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">{t("onboarding.employees.permissions")}</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="viewAppointments"
                          checked={newEmployee.permissions?.viewAppointments}
                          onCheckedChange={(checked) =>
                            setNewEmployee({
                              ...newEmployee,
                              permissions: { ...newEmployee.permissions!, viewAppointments: !!checked },
                            })
                          }
                        />
                        <Label htmlFor="viewAppointments" className="font-normal">
                          {t("onboarding.employees.viewAppointments")}
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="manageCustomers"
                          checked={newEmployee.permissions?.manageCustomers}
                          onCheckedChange={(checked) =>
                            setNewEmployee({
                              ...newEmployee,
                              permissions: { ...newEmployee.permissions!, manageCustomers: !!checked },
                            })
                          }
                        />
                        <Label htmlFor="manageCustomers" className="font-normal">
                          {t("onboarding.employees.manageCustomers")}
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="accessReports"
                          checked={newEmployee.permissions?.accessReports}
                          onCheckedChange={(checked) =>
                            setNewEmployee({
                              ...newEmployee,
                              permissions: { ...newEmployee.permissions!, accessReports: !!checked },
                            })
                          }
                        />
                        <Label htmlFor="accessReports" className="font-normal">
                          {t("onboarding.employees.accessReports")}
                        </Label>
                      </div>
                    </div>
                  </div>

                  <Button onClick={addEmployee} className="w-full">
                    <Plus className="w-4 h-4 ml-2" />
                    {t("onboarding.employees.addEmployee")}
                  </Button>
                </div>

                {/* Employees List */}
                {onboardingData.employees && onboardingData.employees.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">
                      {t("onboarding.employees.employeeList", { count: `${onboardingData.employees.length}/10` })}
                    </h3>
                    {onboardingData.employees.map((emp) => (
                      <div
                        key={emp.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-sm text-gray-600">{emp.email}</p>
                          <p className="text-xs text-gray-500">
                            {emp.role === "employee" && t("onboarding.employees.roleEmployee")}
                            {emp.role === "manager" && t("onboarding.employees.roleManager")}
                            {emp.role === "admin" && t("onboarding.employees.roleAdmin")}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEmployee(emp.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Services */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    {t("onboarding.services.requiredNote")}
                  </p>
                </div>

                {/* Add Category */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold">{t("onboarding.services.addNewCategory")}</h3>
                  <div className="flex gap-2">
                    <Input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder={t("onboarding.services.categoryPlaceholder")}
                      className="flex-1"
                    />
                    <Button onClick={addCategory}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {serviceCategories.map((cat) => (
                      <span
                        key={cat}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Add Service Form */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold text-lg">{t("onboarding.services.addNewService")}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>{t("onboarding.services.serviceName")} *</Label>
                      <Input
                        value={newService.name}
                        onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                        placeholder={t("onboarding.services.serviceNamePlaceholder")}
                      />
                    </div>
                    <div>
                      <Label>{t("onboarding.services.category")}</Label>
                      <Select
                        value={newService.category}
                        onValueChange={(value) => setNewService({ ...newService, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>{t("onboarding.services.duration")}</Label>
                      <Input
                        type="number"
                        value={newService.duration}
                        onChange={(e) => setNewService({ ...newService, duration: parseInt(e.target.value) })}
                        min="5"
                        step="5"
                      />
                    </div>
                    <div>
                      <Label>{t("onboarding.services.price")}</Label>
                      <Input
                        type="number"
                        value={newService.price}
                        onChange={(e) => setNewService({ ...newService, price: parseInt(e.target.value) })}
                        min="0"
                        step="10"
                      />
                    </div>
                    <div>
                      <Label>{t("onboarding.services.color")}</Label>
                      <Select
                        value={newService.color}
                        onValueChange={(value) => setNewService({ ...newService, color: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceColors.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded"
                                  style={{ backgroundColor: color.value }}
                                />
                                {color.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>{t("onboarding.services.description")}</Label>
                    <Textarea
                      value={newService.description}
                      onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                      placeholder={t("onboarding.services.descriptionPlaceholder")}
                      rows={2}
                    />
                  </div>

                  <Button onClick={addService} className="w-full">
                    <Plus className="w-4 h-4 ml-2" />
                    {t("onboarding.services.addService")}
                  </Button>
                </div>

                {/* Services List */}
                {onboardingData.services && onboardingData.services.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">
                      {t("onboarding.services.serviceList", { count: `${onboardingData.services.length}/20` })}
                    </h3>
                    {onboardingData.services.map((svc) => (
                      <div
                        key={svc.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: svc.color }}
                          />
                          <div>
                            <p className="font-medium">{svc.name}</p>
                            <p className="text-sm text-gray-600">
                              {svc.category} • {svc.duration} دقيقة • {svc.price} NOK
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeService(svc.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 6: Payment Settings */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    {t("onboarding.payment.optionalNote")}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Stripe */}
                  <div className="border rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">Stripe</h3>
                        <p className="text-sm text-gray-600">
                          {t("onboarding.payment.stripe.description")}
                        </p>
                      </div>
                      <Checkbox
                        checked={onboardingData.paymentSettings?.stripeEnabled}
                        onCheckedChange={(checked) =>
                          setOnboardingData({
                            ...onboardingData,
                            paymentSettings: {
                              ...onboardingData.paymentSettings!,
                              stripeEnabled: !!checked,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      <p>{t("onboarding.payment.stripe.feature1")}</p>
                      <p>{t("onboarding.payment.stripe.feature2")}</p>
                      <p>{t("onboarding.payment.stripe.feature3")}</p>
                    </div>
                  </div>

                  {/* Vipps */}
                  <div className="border rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">Vipps</h3>
                        <p className="text-sm text-gray-600">
                          {t("onboarding.payment.vipps.description")}
                        </p>
                      </div>
                      <Checkbox
                        checked={onboardingData.paymentSettings?.vippsEnabled}
                        onCheckedChange={(checked) =>
                          setOnboardingData({
                            ...onboardingData,
                            paymentSettings: {
                              ...onboardingData.paymentSettings!,
                              vippsEnabled: !!checked,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      <p>{t("onboarding.payment.vipps.feature1")}</p>
                      <p>{t("onboarding.payment.vipps.feature2")}</p>
                      <p>{t("onboarding.payment.vipps.feature3")}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    {t("onboarding.payment.setupNote")}
                  </p>
                </div>
              </div>
            )}

            {/* Step 7: Final Review */}
            {currentStep === 7 && (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    {t("onboarding.review.almostDone")}
                  </p>
                </div>

                {/* Salon Info Summary */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">{t("onboarding.review.salonInfo")}</h3>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><strong>{t("onboarding.review.name")}:</strong> {onboardingData.salonInfo?.salonName}</p>
                    <p><strong>{t("onboarding.review.domain")}:</strong> {onboardingData.salonInfo?.subdomain}.stylora.no</p>
                    <p><strong>{t("onboarding.review.address")}:</strong> {onboardingData.salonInfo?.address}, {onboardingData.salonInfo?.city}</p>
                    <p><strong>{t("onboarding.review.phone")}:</strong> {onboardingData.salonInfo?.phone}</p>
                    <p><strong>{t("onboarding.review.email")}:</strong> {onboardingData.salonInfo?.email}</p>
                  </div>
                </div>

                {/* Owner Account Summary */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">{t("onboarding.review.ownerAccount")}</h3>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><strong>{t("onboarding.review.name")}:</strong> {onboardingData.ownerAccount?.ownerName}</p>
                    <p><strong>{t("onboarding.review.email")}:</strong> {onboardingData.ownerAccount?.ownerEmail}</p>
                    <p><strong>{t("onboarding.review.password")}:</strong> ••••••••</p>
                  </div>
                </div>

                {/* Business Hours Summary */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">{t("onboarding.review.businessHours")}</h3>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(3)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-sm">
                    <p>{t("onboarding.review.weekdayHours")}</p>
                    <p>{t("onboarding.review.saturdayHours")}</p>
                    <p>{t("onboarding.review.sundayHours")}</p>
                  </div>
                </div>

                {/* Employees Summary */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">{t("onboarding.review.employees")}</h3>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(4)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm">
                    {onboardingData.employees && onboardingData.employees.length > 0
                      ? t("onboarding.review.employeeCount", { count: onboardingData.employees.length })
                      : t("onboarding.review.noEmployees")}
                  </p>
                </div>

                {/* Services Summary */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">{t("onboarding.review.services")}</h3>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(5)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm">
                    {t("onboarding.review.serviceCount", { count: onboardingData.services?.length || 0 })}
                  </p>
                </div>

                {/* Payment Settings Summary */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">{t("onboarding.review.paymentMethods")}</h3>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(6)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-sm space-y-1">
                    <p>
                      Stripe: {onboardingData.paymentSettings?.stripeEnabled ? "✓ مفعل" : "✗ غير مفعل"}
                    </p>
                    <p>
                      Vipps: {onboardingData.paymentSettings?.vippsEnabled ? "✓ مفعل" : "✗ غير مفعل"}
                    </p>
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => setAcceptedTerms(!!checked)}
                    />
                    <Label htmlFor="terms" className="text-sm leading-relaxed">
                      {t("onboarding.review.termsLabel")}{" "}
                      <a href="/terms" target="_blank" className="text-purple-600 hover:underline">
                        {t("onboarding.review.termsLink")}
                      </a>{" "}
                      و{" "}
                      <a href="/privacy" target="_blank" className="text-purple-600 hover:underline">
                        {t("onboarding.review.privacyLink")}
                      </a>
                    </Label>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || completeOnboarding.isPending}
          >
            {t("onboarding.navigation.previous")}
          </Button>
          <Button
            onClick={handleNext}
            disabled={completeOnboarding.isPending}
            className="bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600"
          >
            {completeOnboarding.isPending && t("onboarding.navigation.creating")}
            {!completeOnboarding.isPending && currentStep === 7 && t("onboarding.navigation.finishRegistration")}
            {!completeOnboarding.isPending && currentStep < 7 && t("onboarding.navigation.next")}
          </Button>
        </div>
      </div>
    </div>
  );
}
