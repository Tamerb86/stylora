# Stylora - دليل المشتري الشامل

# Stylora - Complete Buyer's Guide

---

## 📋 نظرة عامة | Overview

**Stylora** هو نظام إدارة صالونات متكامل مصمم خصيصاً للسوق النرويجي. يتضمن جميع الأدوات اللازمة لإدارة صالون حديث: الحجوزات، إدارة العملاء، الموظفين، المدفوعات، التقارير المالية، وأكثر.

**Stylora** is a comprehensive salon management system designed specifically for the Norwegian market. It includes all the tools needed to run a modern salon: bookings, customer management, employees, payments, financial reports, and more.

---

## 🏗️ البنية التقنية | Tech Stack

| Component          | Technology                             |
| ------------------ | -------------------------------------- |
| **Frontend**       | React 19 + TypeScript + Tailwind CSS 4 |
| **Backend**        | Node.js + Express + tRPC               |
| **Database**       | MySQL (via Drizzle ORM)                |
| **Authentication** | Supabase Auth (Email/Password)         |
| **File Storage**   | AWS S3                                 |
| **Payments**       | Stripe (Checkout + Terminal)           |
| **Email**          | AWS SES / Nodemailer                   |
| **Hosting**        | Railway (recommended)                  |

---

## ✨ الميزات الرئيسية | Key Features

### إدارة الصالون | Salon Management

- ✅ لوحة تحكم شاملة مع إحصائيات يومية
- ✅ إدارة الخدمات والأسعار
- ✅ إدارة الموظفين مع الصلاحيات
- ✅ إدارة العملاء مع سجل كامل
- ✅ تقويم تفاعلي للمواعيد (أسبوعي/شهري)
- ✅ سحب وإفلات للمواعيد

### الحجوزات | Bookings

- ✅ صفحة حجز عامة للعملاء
- ✅ اختيار الخدمة والموظف والوقت
- ✅ تأكيد الحجز بالبريد الإلكتروني
- ✅ إشعارات SMS (Twilio)

### المدفوعات | Payments

- ✅ Stripe Checkout للدفع أونلاين
- ✅ Stripe Terminal للدفع في الصالون
- ✅ نظام نقاط البيع (POS)
- ✅ تتبع المدفوعات والفواتير

### التقارير | Reports

- ✅ تقارير مالية شاملة
- ✅ تحليلات الأداء
- ✅ تقارير الموظفين
- ✅ تصدير PDF و CSV

### ميزات إضافية | Additional Features

- ✅ نظام الولاء (نقاط المكافآت)
- ✅ ساعة الحضور للموظفين
- ✅ دعم متعدد اللغات (نرويجي/إنجليزي)
- ✅ تصميم متجاوب للموبايل

---

## 🚀 خطوات الإعداد من الصفر | Setup from Scratch

### الخطوة 1: المتطلبات الأساسية | Prerequisites

قبل البدء، تحتاج إلى إنشاء حسابات في الخدمات التالية:

| Service      | Purpose                 | Cost        | Link                                     |
| ------------ | ----------------------- | ----------- | ---------------------------------------- |
| **GitHub**   | استضافة الكود           | مجاني       | [github.com](https://github.com)         |
| **Railway**  | استضافة التطبيق + MySQL | $5-25/شهر   | [railway.app](https://railway.app)       |
| **Supabase** | المصادقة (Auth)         | مجاني       | [supabase.com](https://supabase.com)     |
| **Stripe**   | المدفوعات               | 2.9% + رسوم | [stripe.com](https://stripe.com)         |
| **AWS**      | تخزين الملفات + البريد  | $1-10/شهر   | [aws.amazon.com](https://aws.amazon.com) |

---

### الخطوة 2: إعداد Supabase | Setup Supabase

1. **إنشاء مشروع جديد:**
   - اذهب إلى [supabase.com](https://supabase.com)
   - أنشئ مشروع جديد باسم `stylora`
   - اختر المنطقة: `eu-west-1` (أوروبا)
   - احفظ كلمة السر لقاعدة البيانات

2. **تفعيل Email Authentication:**
   - اذهب إلى **Authentication** → **Providers**
   - فعّل **Email**
   - اضبط **Site URL**: `https://your-domain.com`

3. **الحصول على المفاتيح:**
   - اذهب إلى **Settings** → **API**
   - انسخ:
     - `Project URL` → `SUPABASE_URL`
     - `anon public` → `SUPABASE_ANON_KEY`
     - `service_role` → `SUPABASE_SERVICE_KEY`

---

### الخطوة 3: إعداد Stripe | Setup Stripe

1. **إنشاء حساب Stripe:**
   - اذهب إلى [stripe.com](https://stripe.com)
   - أكمل عملية التحقق من الهوية

2. **الحصول على المفاتيح:**
   - اذهب إلى **Developers** → **API keys**
   - انسخ:
     - `Publishable key` → `VITE_STRIPE_PUBLISHABLE_KEY`
     - `Secret key` → `STRIPE_SECRET_KEY`

3. **إعداد Webhook:**
   - اذهب إلى **Developers** → **Webhooks**
   - أضف endpoint: `https://your-domain.com/api/stripe/webhook`
   - اختر الأحداث:
     - `payment_intent.succeeded`
     - `checkout.session.completed`
   - انسخ `Signing secret` → `STRIPE_WEBHOOK_SECRET`

---

### الخطوة 4: إعداد AWS | Setup AWS

#### S3 للتخزين:

1. أنشئ bucket جديد باسم `stylora-uploads`
2. اضبط CORS policy:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["https://your-domain.com"],
    "ExposeHeaders": []
  }
]
```

3. أنشئ IAM user مع صلاحيات S3
4. احفظ:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_S3_BUCKET`
   - `AWS_REGION`

#### SES للبريد الإلكتروني:

1. تحقق من domain في SES
2. اخرج من sandbox mode (للإنتاج)
3. احفظ: `AWS_SES_FROM_EMAIL`

---

### الخطوة 5: رفع الكود على GitHub | Upload to GitHub

```bash
# 1. استنساخ المشروع
git clone https://github.com/YOUR_USERNAME/stylora.git
cd stylora

# 2. تثبيت التبعيات
pnpm install

# 3. اختبار محلياً
cp .env.example .env
# عدّل .env بالقيم الصحيحة
pnpm dev

# 4. رفع التغييرات
git add .
git commit -m "Initial setup"
git push origin main
```

---

### الخطوة 6: النشر على Railway | Deploy to Railway

1. **إنشاء مشروع:**
   - اذهب إلى [railway.app](https://railway.app)
   - اضغط **New Project** → **Deploy from GitHub repo**
   - اختر repository `stylora`

2. **إضافة MySQL:**
   - اضغط **+ New** → **Database** → **MySQL**
   - Railway سينشئ `DATABASE_URL` تلقائياً

3. **إضافة متغيرات البيئة:**

```env
# Database (تلقائي من MySQL)
DATABASE_URL=${{MySQL.DATABASE_URL}}

# App
NODE_ENV=production
PORT=3000
VITE_APP_ID=stylora
VITE_APP_TITLE=Stylora

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-characters

# Owner (بريدك الإلكتروني للوصول كمدير)
OWNER_OPEN_ID=admin@yourdomain.com

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# AWS S3
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-west-1
AWS_S3_BUCKET=stylora-uploads

# AWS SES
AWS_SES_FROM_EMAIL=noreply@yourdomain.com
```

4. **تشغيل Migrations:**

```bash
# تثبيت Railway CLI
npm install -g @railway/cli

# تسجيل الدخول
railway login

# ربط المشروع
railway link

# تشغيل migrations
railway run pnpm db:push
```

5. **إعداد Domain:**
   - اذهب إلى **Settings** → **Domains**
   - أضف custom domain أو استخدم Railway domain

---

### الخطوة 7: إعداد أول مستخدم | First User Setup

1. **تسجيل الدخول كمدير:**
   - افتح `https://your-domain.com`
   - اضغط **Logg inn**
   - سجّل بالبريد الإلكتروني المحدد في `OWNER_OPEN_ID`

2. **إعداد الصالون:**
   - اذهب إلى **Innstillinger** (الإعدادات)
   - أدخل معلومات الصالون:
     - اسم الصالون
     - العنوان
     - رقم الهاتف
     - ساعات العمل

3. **إضافة الخدمات:**
   - اذهب إلى **Tjenester** (الخدمات)
   - أضف خدماتك مع الأسعار والمدة

4. **إضافة الموظفين:**
   - اذهب إلى **Ansatte** (الموظفين)
   - أضف الموظفين مع أدوارهم

---

## 📁 هيكل المشروع | Project Structure

```
stylora/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities
│   │   └── contexts/      # React contexts
│   └── public/            # Static assets
├── server/                 # Backend Node.js
│   ├── _core/             # Core server setup
│   ├── routers/           # tRPC routers
│   ├── services/          # Business logic
│   └── helpers/           # Database helpers
├── drizzle/               # Database schema
│   └── schema.ts          # Table definitions
├── shared/                # Shared types
└── docs/                  # Documentation
```

---

## 🔧 الصيانة والتحديثات | Maintenance

### تحديث التبعيات | Update Dependencies

```bash
# تحديث جميع الحزم
pnpm update

# تحديث حزمة محددة
pnpm update package-name
```

### النسخ الاحتياطي | Backups

يُنصح بإعداد نسخ احتياطية تلقائية لقاعدة البيانات:

1. استخدم Railway's built-in backups
2. أو أعد script للنسخ الاحتياطي إلى S3

### المراقبة | Monitoring

للإنتاج، يُنصح بإضافة:

- **Sentry** لتتبع الأخطاء
- **LogRocket** لتسجيل الجلسات
- **UptimeRobot** لمراقبة التوفر

---

## 💰 التكلفة الشهرية المتوقعة | Expected Monthly Costs

| Service      | Free Tier  | Production  |
| ------------ | ---------- | ----------- |
| **Railway**  | $5 credit  | $10-25      |
| **Supabase** | 50K MAU    | $25+        |
| **Stripe**   | -          | 2.9% + fees |
| **AWS S3**   | 5GB        | $1-5        |
| **AWS SES**  | 62K emails | $0.10/1K    |
| **Domain**   | -          | $10-15/year |

**المجموع التقديري**: $15-60/شهر (حسب الاستخدام)

---

## 🔒 الأمان | Security

### أفضل الممارسات | Best Practices

1. **لا تشارك** المفاتيح السرية أبداً
2. **استخدم** HTTPS دائماً
3. **فعّل** 2FA على جميع الحسابات
4. **حدّث** التبعيات بانتظام
5. **راجع** سجلات الوصول دورياً

### المفاتيح الحساسة | Sensitive Keys

هذه المفاتيح يجب أن تبقى سرية:

- `SUPABASE_SERVICE_KEY`
- `STRIPE_SECRET_KEY`
- `JWT_SECRET`
- `AWS_SECRET_ACCESS_KEY`

---

## 🆘 استكشاف الأخطاء | Troubleshooting

### مشاكل شائعة | Common Issues

| المشكلة                   | الحل                    |
| ------------------------- | ----------------------- |
| Build failed              | تحقق من logs في Railway |
| Database connection error | تأكد من DATABASE_URL    |
| Auth not working          | تحقق من Supabase keys   |
| Payments failing          | تحقق من Stripe webhook  |
| Images not uploading      | تحقق من AWS S3 CORS     |

### الحصول على المساعدة | Getting Help

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Stripe Docs**: [stripe.com/docs](https://stripe.com/docs)

---

## 📝 قائمة التحقق قبل الإطلاق | Pre-Launch Checklist

- [ ] تم إعداد جميع متغيرات البيئة
- [ ] تم اختبار التسجيل وتسجيل الدخول
- [ ] تم اختبار إنشاء الحجوزات
- [ ] تم اختبار المدفوعات (test mode)
- [ ] تم إعداد Stripe webhooks
- [ ] تم إعداد custom domain
- [ ] تم اختبار رفع الصور
- [ ] تم إعداد النسخ الاحتياطية
- [ ] تم اختبار إرسال البريد الإلكتروني
- [ ] تم مراجعة الأمان

---

## 📞 الدعم | Support

للحصول على دعم تقني أو استفسارات:

- **Email**: support@stylora.no
- **Website**: https://www.stylora.no

---

**تم إنشاء هذا الدليل بواسطة Stylora Team**  
**آخر تحديث**: 31 ديسمبر 2024
