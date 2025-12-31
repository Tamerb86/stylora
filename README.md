# BarberTime - نظام إدارة صالونات الحلاقة

## 📋 نظرة عامة - Overview

**BarberTime** هو نظام SaaS شامل لإدارة صالونات الحلاقة والتجميل، مبني بتقنيات حديثة ومصمم للنشر على استضافة خارجية.

### المميزات الرئيسية:

- ✅ **نظام حجوزات متكامل** - حجز المواعيد عبر الإنترنت
- ✅ **نظام POS** - نقطة بيع كاملة مع إدارة المخزون
- ✅ **إدارة الموظفين** - تتبع الحضور والأداء
- ✅ **إدارة العملاء** - قاعدة بيانات العملاء ونظام الولاء
- ✅ **تقارير مالية متقدمة** - تحليلات وإحصائيات شاملة
- ✅ **تكامل المدفوعات** - Stripe + Stripe Terminal
- ✅ **تكامل محاسبي** - Fiken و Unimicro (أنظمة نرويجية)
- ✅ **إشعارات SMS و Email**
- ✅ **Multi-tenant** - دعم صالونات متعددة

---

## 🏗️ التقنيات المستخدمة - Tech Stack

### Frontend:
- **React 19** - مكتبة UI
- **TypeScript** - لغة البرمجة
- **Tailwind CSS 4** - تصميم responsive
- **shadcn/ui** - مكونات UI جاهزة
- **tRPC** - Type-safe API calls
- **React Query** - إدارة الحالة
- **Wouter** - Routing
- **Vite** - Build tool

### Backend:
- **Express.js** - Web server
- **tRPC** - Type-safe API
- **Drizzle ORM** - Database ORM
- **MySQL** - قاعدة البيانات
- **JWT** - المصادقة
- **Stripe** - المدفوعات
- **AWS S3** - تخزين الملفات
- **AWS SES** - البريد الإلكتروني

---

## 📦 التثبيت - Installation

### المتطلبات:
- Node.js 22+
- pnpm 10+
- MySQL 8+

### الخطوات:

```bash
# 1. استنساخ المشروع
git clone https://github.com/YOUR_USERNAME/barbertime.git
cd barbertime

# 2. تثبيت المكتبات
pnpm install

# 3. إعداد متغيرات البيئة
cp .env.example .env
# عدّل .env بالقيم الصحيحة

# 4. إعداد قاعدة البيانات
pnpm db:push

# 5. تشغيل التطبيق
pnpm dev
```

التطبيق سيعمل على: `http://localhost:3000`

---

## 🔐 إعداد متغيرات البيئة - Environment Setup

أنشئ ملف `.env` في المجلد الرئيسي:

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/barbertime

# JWT
JWT_SECRET=your-super-secret-key-change-this

# App
VITE_APP_ID=barbertime
VITE_APP_TITLE=BarberTime
NODE_ENV=development
PORT=3000

# Owner
OWNER_OPEN_ID=admin@example.com

# AWS (للتخزين)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket

# Stripe (للمدفوعات)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Email
SES_FROM_EMAIL=noreply@yourdomain.com
```

---

## 🚀 النشر - Deployment

### خيارات النشر:

1. **Railway** (موصى به للمبتدئين) - راجع [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)
2. **Docker** (للتحكم الكامل) - راجع [DOCKER_GUIDE.md](./DOCKER_GUIDE.md)
3. **Vercel + PlanetScale** - راجع [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
4. **DigitalOcean** - راجع [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

### البدء السريع مع Docker:

```bash
# نسخ وتعديل ملف البيئة
cp .env.example .env

# تشغيل التطبيق
docker-compose up -d

# عرض logs
docker-compose logs -f app
```

---

## 📁 هيكل المشروع - Project Structure

```
barbertime-website/
├── client/                 # Frontend React app
│   ├── public/            # Static assets
│   └── src/
│       ├── pages/         # Page components
│       ├── components/    # Reusable components
│       ├── hooks/         # Custom hooks
│       └── lib/           # Utilities
├── server/                # Backend Express app
│   ├── _core/            # Core server logic
│   ├── routers.ts        # tRPC routers
│   └── db.ts             # Database functions
├── shared/               # Shared types & constants
├── drizzle/              # Database schema & migrations
│   ├── schema.ts         # Database schema
│   └── migrations/       # Migration files
└── package.json
```

---

## 🔧 الأوامر المتاحة - Available Scripts

```bash
# التطوير
pnpm dev              # تشغيل dev server

# البناء
pnpm build            # بناء للإنتاج
pnpm start            # تشغيل production build

# قاعدة البيانات
pnpm db:push          # تشغيل migrations

# الاختبار
pnpm test             # تشغيل tests
pnpm check            # فحص TypeScript

# التنسيق
pnpm format           # تنسيق الكود
```

---

## 🎨 الميزات التفصيلية - Detailed Features

### 1. نظام الحجوزات
- حجز المواعيد عبر الإنترنت
- تقويم تفاعلي
- إشعارات تلقائية (SMS + Email)
- إدارة قوائم الانتظار
- سياسات الإلغاء

### 2. نظام POS
- واجهة نقطة بيع سريعة
- إدارة المنتجات والخدمات
- تتبع المخزون
- طباعة الفواتير
- تكامل Stripe Terminal

### 3. إدارة الموظفين
- تتبع الحضور والانصراف
- جداول العمل
- حساب العمولات
- تقارير الأداء

### 4. إدارة العملاء
- قاعدة بيانات العملاء
- سجل الزيارات
- نظام الولاء والنقاط
- ملاحظات خاصة

### 5. التقارير المالية
- تقارير المبيعات اليومية/الشهرية/السنوية
- تحليل الإيرادات
- تقارير الموظفين
- تصدير Excel/PDF

### 6. التكاملات
- **Stripe**: مدفوعات + Terminal
- **Fiken**: محاسبة (النرويج)
- **Unimicro**: محاسبة (النرويج)
- **AWS S3**: تخزين الصور
- **AWS SES**: البريد الإلكتروني
- **Twilio**: SMS (اختياري)

---

## ⚠️ ملاحظات أمنية - Security Notes

### نظام المصادقة:

المشروع يدعم نظامين للمصادقة:

1. **Supabase Auth** (موصى به للإنتاج):
   - تشفير كلمات المرور مع bcrypt
   - Email verification
   - Password reset
   - OAuth providers (Google, GitHub, etc.)
   - استخدم `registerSupabaseAuthRoutes` في `server/_core/index.ts`

2. **Simple JWT Auth** (للتطوير فقط):
   - نظام بسيط للاختبار السريع
   - استخدم `registerAuthRoutes` في `server/_core/index.ts`

راجع [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) و [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) للتفاصيل.

---

## 🐛 استكشاف الأخطاء - Troubleshooting

### خطأ: "Missing STRIPE_SECRET_KEY"
```bash
# أضف في .env:
STRIPE_SECRET_KEY=sk_test_your_key
```

### خطأ: "Database connection failed"
```bash
# تأكد من تشغيل MySQL وصحة DATABASE_URL
mysql -u root -p
CREATE DATABASE barbertime;
```

### خطأ: "Port 3000 already in use"
```bash
# غيّر PORT في .env
PORT=3001
```

---

## 📊 قاعدة البيانات - Database Schema

### الجداول الرئيسية:

- `tenants` - الصالونات
- `users` - المستخدمون (موظفون + عملاء)
- `appointments` - الحجوزات
- `services` - الخدمات
- `products` - المنتجات
- `orders` - الطلبات/الفواتير
- `payments` - المدفوعات
- `attendance` - الحضور والانصراف
- `loyalty_points` - نقاط الولاء

راجع `drizzle/schema.ts` للتفاصيل الكاملة.

---

## 🧪 الاختبار - Testing

```bash
# تشغيل جميع الاختبارات
pnpm test

# تشغيل اختبارات محددة
pnpm test appointments

# تشغيل مع coverage
pnpm test --coverage
```

---

## 📝 الترخيص - License

MIT License

---

## 🤝 المساهمة - Contributing

المساهمات مرحب بها! يرجى:

1. Fork المشروع
2. إنشاء branch للميزة (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push للـ branch (`git push origin feature/AmazingFeature`)
5. فتح Pull Request

---

## 📧 التواصل - Contact

للأسئلة والدعم: support@barbertime.com

---

## 🙏 شكر وتقدير - Acknowledgments

- [React](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [tRPC](https://trpc.io)
- [Drizzle ORM](https://orm.drizzle.team)
- [Stripe](https://stripe.com)

---

**تم التطوير بواسطة Stylora Team** 🤖  
**آخر تحديث**: 14 ديسمبر 2024

< Force rebuild: 1765751280 -->
