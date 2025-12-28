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
import { CheckCircle2, Building2, User, Clock, Users, Scissors, CreditCard, FileCheck } from "lucide-react";
import { useLocation } from "wouter";

// Step 1: Salon Information
const salonInfoSchema = z.object({
  salonName: z.string().min(2, "اسم الصالون مطلوب"),
  subdomain: z.string().min(3, "النطاق الفرعي مطلوب").regex(/^[a-z0-9-]+$/, "حروف صغيرة وأرقام فقط"),
  address: z.string().min(5, "العنوان مطلوب"),
  city: z.string().min(2, "المدينة مطلوبة"),
  phone: z.string().min(8, "رقم الهاتف مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
});

// Step 2: Owner Account
const ownerAccountSchema = z.object({
  ownerName: z.string().min(2, "الاسم مطلوب"),
  ownerEmail: z.string().email("بريد إلكتروني غير صالح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

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

type OnboardingData = {
  salonInfo: z.infer<typeof salonInfoSchema>;
  ownerAccount: z.infer<typeof ownerAccountSchema>;
  businessHours: z.infer<typeof businessHoursSchema>;
  employees: Array<{ name: string; email: string; phone: string }>;
  services: Array<{ name: string; duration: number; price: number }>;
  paymentSettings: { stripeEnabled: boolean; vippsEnabled: boolean };
};

const steps = [
  { id: 1, name: "معلومات الصالون", icon: Building2 },
  { id: 2, name: "حساب المالك", icon: User },
  { id: 3, name: "ساعات العمل", icon: Clock },
  { id: 4, name: "الموظفين", icon: Users },
  { id: 5, name: "الخدمات", icon: Scissors },
  { id: 6, name: "إعدادات الدفع", icon: CreditCard },
  { id: 7, name: "المراجعة", icon: FileCheck },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<Partial<OnboardingData>>({
    employees: [],
    services: [],
  });
  const [, setLocation] = useLocation();

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
      toast.success("تم إنشاء حسابك بنجاح! 🎉");
      toast.info("تم إرسال بريد إلكتروني ترحيبي إلى " + data.email);
      setTimeout(() => {
        setLocation("/login");
      }, 2000);
    },
    onError: (error) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

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
    } else if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      completeOnboarding.mutate(onboardingData as OnboardingData);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent mb-2">
            مرحباً في BarberTime
          </h1>
          <p className="text-gray-600">دعنا نساعدك في إعداد صالونك في دقائق</p>
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
                <div key={step.id} className="flex flex-col items-center">
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
              {currentStep === 1 && "أدخل معلومات الصالون الأساسية"}
              {currentStep === 2 && "أنشئ حساب المالك/المدير"}
              {currentStep === 3 && "حدد ساعات عمل الصالون"}
              {currentStep === 4 && "أضف الموظفين الأوليين (اختياري)"}
              {currentStep === 5 && "أضف الخدمات الأساسية"}
              {currentStep === 6 && "قم بإعداد طرق الدفع (اختياري)"}
              {currentStep === 7 && "راجع المعلومات وأكمل التسجيل"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Salon Information */}
            {currentStep === 1 && (
              <form className="space-y-4">
                <div>
                  <Label htmlFor="salonName">اسم الصالون *</Label>
                  <Input
                    id="salonName"
                    {...salonInfoForm.register("salonName")}
                    placeholder="صالون الجمال الملكي"
                  />
                  {salonInfoForm.formState.errors.salonName && (
                    <p className="text-sm text-red-500 mt-1">
                      {salonInfoForm.formState.errors.salonName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="subdomain">النطاق الفرعي *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="subdomain"
                      {...salonInfoForm.register("subdomain")}
                      placeholder="royal-salon"
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-500">.barbertime.no</span>
                  </div>
                  {salonInfoForm.formState.errors.subdomain && (
                    <p className="text-sm text-red-500 mt-1">
                      {salonInfoForm.formState.errors.subdomain.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    سيكون رابط صالونك: royal-salon.barbertime.no
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="address">العنوان *</Label>
                    <Input
                      id="address"
                      {...salonInfoForm.register("address")}
                      placeholder="شارع الملك فهد"
                    />
                    {salonInfoForm.formState.errors.address && (
                      <p className="text-sm text-red-500 mt-1">
                        {salonInfoForm.formState.errors.address.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="city">المدينة *</Label>
                    <Input
                      id="city"
                      {...salonInfoForm.register("city")}
                      placeholder="أوسلو"
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
                    <Label htmlFor="phone">رقم الهاتف *</Label>
                    <Input
                      id="phone"
                      {...salonInfoForm.register("phone")}
                      placeholder="+47 123 45 678"
                    />
                    {salonInfoForm.formState.errors.phone && (
                      <p className="text-sm text-red-500 mt-1">
                        {salonInfoForm.formState.errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">البريد الإلكتروني *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...salonInfoForm.register("email")}
                      placeholder="info@salon.no"
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
                  <Label htmlFor="ownerName">الاسم الكامل *</Label>
                  <Input
                    id="ownerName"
                    {...ownerAccountForm.register("ownerName")}
                    placeholder="أحمد محمد"
                  />
                  {ownerAccountForm.formState.errors.ownerName && (
                    <p className="text-sm text-red-500 mt-1">
                      {ownerAccountForm.formState.errors.ownerName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="ownerEmail">البريد الإلكتروني *</Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    {...ownerAccountForm.register("ownerEmail")}
                    placeholder="ahmed@example.com"
                  />
                  {ownerAccountForm.formState.errors.ownerEmail && (
                    <p className="text-sm text-red-500 mt-1">
                      {ownerAccountForm.formState.errors.ownerEmail.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password">كلمة المرور *</Label>
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
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور *</Label>
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
                  حدد ساعات عمل الصالون لكل يوم من أيام الأسبوع
                </p>

                {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map((day) => {
                  const dayNames: Record<string, string> = {
                    monday: "الاثنين",
                    tuesday: "الثلاثاء",
                    wednesday: "الأربعاء",
                    thursday: "الخميس",
                    friday: "الجمعة",
                    saturday: "السبت",
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
                  <Label htmlFor="sundayClosed">الأحد مغلق</Label>
                </div>
              </form>
            )}

            {/* Steps 4-7 will be implemented next */}
            {currentStep > 3 && (
              <div className="text-center py-8">
                <p className="text-gray-600">هذه الخطوة قيد التطوير...</p>
                <p className="text-sm text-gray-500 mt-2">
                  يمكنك المتابعة للخطوة التالية أو العودة للخطوات السابقة
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            السابق
          </Button>
          <Button
            onClick={handleNext}
            disabled={completeOnboarding.isPending}
            className="bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600"
          >
            {currentStep === 7 ? "إنهاء التسجيل" : "التالي"}
          </Button>
        </div>
      </div>
    </div>
  );
}
