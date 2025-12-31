import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { tenants, users, services, serviceCategories, settings } from "../../drizzle/schema";
import { hash } from "bcryptjs";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { sendWelcomeEmail } from "../services/welcomeEmail";

const onboardingSchema = z.object({
  salonInfo: z.object({
    salonName: z.string().min(2),
    subdomain: z.string().min(3).regex(/^[a-z0-9-]+$/),
    address: z.string().min(5),
    city: z.string().min(2),
    phone: z.string().min(8),
    email: z.string().email(),
  }),
  ownerAccount: z.object({
    ownerName: z.string().min(2),
    ownerEmail: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
  }),
  businessHours: z.object({
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
  }),
  employees: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      phone: z.string().optional(),
      role: z.enum(["employee", "manager", "admin"]),
      permissions: z.object({
        viewAppointments: z.boolean(),
        manageCustomers: z.boolean(),
        accessReports: z.boolean(),
      }),
    })
  ).optional(),
  services: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      category: z.string(),
      duration: z.number(),
      price: z.number(),
      description: z.string().optional(),
      color: z.string(),
    })
  ).optional(),
  paymentSettings: z.object({
    stripeEnabled: z.boolean().optional(),
    vippsEnabled: z.boolean().optional(),
  }).optional(),
});

export const onboardingRouter = router({
  /**
   * Check if subdomain is available
   */
  checkSubdomain: publicProcedure
    .input(z.object({ subdomain: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const existing = await db
        .select()
        .from(tenants)
        .where(eq(tenants.subdomain, input.subdomain))
        .limit(1);

      return {
        available: existing.length === 0,
      };
    }),

  /**
   * Complete onboarding process
   */
  complete: publicProcedure
    .input(onboardingSchema)
    .mutation(async ({ input }) => {
      const { salonInfo, ownerAccount, businessHours, employees: initialEmployees, services: initialServices } = input;

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // 2. Check subdomain availability
      const existingTenant = await db
        .select()
        .from(tenants)
        .where(eq(tenants.subdomain, salonInfo.subdomain))
        .limit(1);

      if (existingTenant.length > 0) {
        throw new Error("النطاق الفرعي غير متاح");
      }

      // 2. Create tenant
      const tenantId = nanoid();
      await db.insert(tenants).values({
        id: tenantId,
        name: salonInfo.salonName,
        subdomain: salonInfo.subdomain,
        address: salonInfo.address,
        city: salonInfo.city,
        phone: salonInfo.phone,
        email: salonInfo.email,
        subscriptionStatus: "trial",
        subscriptionPlan: "professional",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 3. Create owner user account
      const hashedPassword = await hash(ownerAccount.password, 10);
      const userId = nanoid();
      
      await db.insert(users).values({
        tenantId,
        openId: `owner-${userId}`,
        name: ownerAccount.ownerName,
        email: ownerAccount.ownerEmail,
        passwordHash: hashedPassword,
        role: "owner",
        isActive: true,
        deactivatedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      });

      // 4. Create settings with business hours
      const businessHoursJson = {
        monday: businessHours.sundayClosed && false ? null : { open: businessHours.mondayOpen, close: businessHours.mondayClose },
        tuesday: businessHours.sundayClosed && false ? null : { open: businessHours.tuesdayOpen, close: businessHours.tuesdayClose },
        wednesday: businessHours.sundayClosed && false ? null : { open: businessHours.wednesdayOpen, close: businessHours.wednesdayClose },
        thursday: businessHours.sundayClosed && false ? null : { open: businessHours.thursdayOpen, close: businessHours.thursdayClose },
        friday: businessHours.sundayClosed && false ? null : { open: businessHours.fridayOpen, close: businessHours.fridayClose },
        saturday: businessHours.sundayClosed && false ? null : { open: businessHours.saturdayOpen, close: businessHours.saturdayClose },
        sunday: businessHours.sundayClosed ? null : { open: "10:00", close: "16:00" },
      };

      await db.insert(settings).values({
        id: nanoid(),
        tenantId,
        key: "business_hours",
        value: JSON.stringify(businessHoursJson),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 5. Create default settings
      const defaultSettings = [
        { key: "booking_enabled", value: "true" },
        { key: "booking_advance_days", value: "30" },
        { key: "booking_min_notice_hours", value: "2" },
        { key: "sms_enabled", value: "false" },
        { key: "email_enabled", value: "true" },
        { key: "currency", value: "NOK" },
        { key: "timezone", value: "Europe/Oslo" },
        { key: "language", value: "no" },
      ];

      for (const setting of defaultSettings) {
        await db.insert(settings).values({
          id: nanoid(),
          tenantId,
          key: setting.key,
          value: setting.value,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // 6. Create initial employees (if provided)
      if (initialEmployees && initialEmployees.length > 0) {
        for (const emp of initialEmployees) {
          const empId = nanoid();
          const pin = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit PIN
          
          // Generate QR code for employee
          const qrCodeData = JSON.stringify({
            employeeId: empId,
            tenantId,
            type: "checkin",
          });
          const qrCodeUrl = await QRCode.toDataURL(qrCodeData);

          await db.insert(users).values({
            tenantId,
            openId: `employee-${empId}`,
            name: emp.name,
            email: emp.email || null,
            phone: emp.phone || null,
            role: emp.role || "employee",
            pin,
            isActive: true,
            deactivatedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastSignedIn: new Date(),
          });
        }
      }

      // 7. Create service categories and services
      const categoryMap = new Map<string, string>();
      
      if (initialServices && initialServices.length > 0) {
        // Extract unique categories from services
        const uniqueCategories = [...new Set(initialServices.map(s => s.category))];
        
        // Create categories
        for (let i = 0; i < uniqueCategories.length; i++) {
          const catId = nanoid();
          await db.insert(serviceCategories).values({
            id: catId,
            tenantId,
            name: uniqueCategories[i],
            displayOrder: i + 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          categoryMap.set(uniqueCategories[i], catId);
        }
        
        // Create services
        for (const svc of initialServices) {
          const categoryId = categoryMap.get(svc.category)!;
          await db.insert(services).values({
            id: nanoid(),
            tenantId,
            categoryId,
            name: svc.name,
            duration: svc.duration,
            price: svc.price,
            description: svc.description || null,
            color: svc.color || "#667eea",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      } else {
        // Create default category
        const categoryId = nanoid();
        await db.insert(serviceCategories).values({
          id: categoryId,
          tenantId,
          name: "خدمات عامة",
          displayOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        // Create default services
        const defaultServices = [
          { name: "قص شعر رجالي", duration: 30, price: 250 },
          { name: "حلاقة ذقن", duration: 20, price: 150 },
          { name: "قص شعر + حلاقة", duration: 45, price: 350 },
        ];

        for (const svc of defaultServices) {
          await db.insert(services).values({
            id: nanoid(),
            tenantId,
            categoryId,
            name: svc.name,
            duration: svc.duration,
            price: svc.price,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }

      // 9. Store payment settings (if provided)
      if (paymentSettings) {
        if (paymentSettings.stripeEnabled) {
          await db.insert(settings).values({
            id: nanoid(),
            tenantId,
            key: "stripe_enabled",
            value: "true",
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        if (paymentSettings.vippsEnabled) {
          await db.insert(settings).values({
            id: nanoid(),
            tenantId,
            key: "vipps_enabled",
            value: "true",
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }

      // 10. Send welcome email
      try {
        await sendWelcomeEmail({
          salonName: salonInfo.salonName,
          ownerName: ownerAccount.ownerName,
          ownerEmail: ownerAccount.ownerEmail,
          subdomain: salonInfo.subdomain,
          loginUrl: `https://${salonInfo.subdomain}.barbertime.no/login`,
          trialDays: 14,
        });
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't fail onboarding if email fails
      }

      return {
        success: true,
        tenantId,
        subdomain: salonInfo.subdomain,
        email: ownerAccount.ownerEmail,
        message: "تم إنشاء حسابك بنجاح! تحقق من بريدك الإلكتروني للحصول على تعليمات تسجيل الدخول.",
      };
    }),

  /**
   * Generate QR code for employee check-in
   */
  generateEmployeeQR: publicProcedure
    .input(z.object({ employeeId: z.string(), tenantId: z.string() }))
    .mutation(async ({ input }) => {
      const qrCodeData = JSON.stringify({
        employeeId: input.employeeId,
        tenantId: input.tenantId,
        type: "checkin",
      });

      const qrCodeUrl = await QRCode.toDataURL(qrCodeData);

      return {
        qrCode: qrCodeUrl,
      };
    }),
});
