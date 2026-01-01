# إضافة K S Frisør إلى Railway Production

هذا الدليل يشرح كيفية إضافة صالون K S Frisør إلى قاعدة بيانات Railway Production.

---

## 📋 الطريقة الأولى: SQL Queries (الأسرع)

### الخطوات:

1. **افتح Railway Dashboard**
   - اذهب إلى: https://railway.app
   - اختر مشروع `App-Stylora`
   - اختر `production` environment

2. **افتح MySQL Service**
   - اضغط على MySQL service
   - اختر تبويب **"Query"**

3. **نفذ SQL Queries**
   - افتح ملف: `railway-add-ks-frisor.sql`
   - انسخ كل الـ queries
   - الصقها في Query tab
   - اضغط **"Execute"**

4. **تحقق من النتيجة**
   - نفذ verification queries في نهاية الملف
   - يجب أن ترى:
     - ✅ 1 tenant
     - ✅ 2 users (owner + employee)
     - ✅ 5 services
     - ✅ 5 working hours

---

## 🚀 الطريقة الثانية: Migration Script (الأفضل)

### المتطلبات:

```bash
# تأكد من تثبيت Railway CLI
npm i -g @railway/cli

# تسجيل الدخول
railway login

# ربط المشروع
railway link
```

### الخطوات:

1. **رفع الملف إلى Railway**
   ```bash
   # من مجلد المشروع
   railway up seed-ks-frisor.mjs
   ```

2. **تشغيل Script**
   ```bash
   railway run node seed-ks-frisor.mjs
   ```

3. **مراقبة النتيجة**
   - سترى output مفصل لكل خطوة
   - إذا نجح، سترى: 🎉 SUCCESS!

---

## ✅ التحقق من النجاح

بعد التنفيذ، جرب:

### 1. الدخول إلى Admin Dashboard
```
URL: https://www.stylora.no
Email: khaled@ksfrisor.no
```

### 2. صفحة الحجز العامة
```
Development: https://www.stylora.no/book?tenantId=ks-frisor-tenant
Production: https://ks-frisor.stylora.no/book (إذا تم ربط subdomain)
```

### 3. التحقق من Database
```sql
-- في Railway MySQL Query tab
SELECT * FROM tenants WHERE id = 'ks-frisor-tenant';
SELECT * FROM services WHERE tenantId = 'ks-frisor-tenant';
SELECT * FROM users WHERE tenantId = 'ks-frisor-tenant';
```

---

## 🔧 استكشاف الأخطاء

### خطأ: Duplicate Entry
```
ERROR 1062 (23000): Duplicate entry '...' for key 'tenants.PRIMARY'
```

**الحل:** K S Frisør موجود مسبقاً! تحقق من البيانات:
```sql
SELECT * FROM tenants WHERE subdomain = 'ks-frisor';
```

### خطأ: Unknown Column
```
ERROR 1054 (42S22): Unknown column 'categoryId' in 'field list'
```

**الحل:** احذف الأسطر المتعلقة بـ `serviceCategories` من SQL file.

### خطأ: DATABASE_URL not set
```
❌ ERROR: DATABASE_URL environment variable is not set!
```

**الحل:** استخدم `railway run` بدلاً من `node` مباشرة:
```bash
railway run node seed-ks-frisor.mjs
```

---

## 📊 البيانات المضافة

### Tenant
- **ID:** `ks-frisor-tenant`
- **Name:** K S Frisør
- **Subdomain:** `ks-frisor`
- **Address:** Storgata 122 C, 3915 Porsgrunn
- **Phone:** +47 123 45 678
- **Email:** khaled@ksfrisor.no

### Users
1. **Owner (Admin)**
   - Email: khaled@ksfrisor.no
   - Role: admin
   
2. **Employee**
   - Name: Khaled
   - Email: khaled.employee@ksfrisor.no
   - Role: employee

### Services
1. **Herreklipp** - 30 min - 450 kr
2. **Dameklipp** - 45 min - 650 kr
3. **Skjeggstell** - 20 min - 300 kr
4. **Hårfarge** - 90 min - 1200 kr
5. **Permanent** - 120 min - 1500 kr

### Working Hours
- **Monday - Friday:** 09:00 - 17:00
- **Saturday - Sunday:** Closed

---

## 🎯 الخطوات التالية

بعد إضافة K S Frisør:

1. ✅ **اختبار صفحة الحجز**
   - افتح: `https://www.stylora.no/book?tenantId=ks-frisor-tenant`
   - تأكد من ظهور الخدمات والموظفين

2. ✅ **تسجيل الدخول كـ Owner**
   - افتح: `https://www.stylora.no`
   - سجل دخول بـ: `khaled@ksfrisor.no`
   - تحقق من Dashboard

3. ✅ **إضافة Payment Methods**
   - من Settings → Payment Providers
   - فعّل Stripe / Vipps / iZettle

4. ✅ **تخصيص Branding**
   - من Settings → General
   - أضف Logo
   - عدّل Colors

5. ✅ **ربط Domain (اختياري)**
   - من Railway Dashboard
   - أضف custom domain: `ks-frisor.stylora.no`
   - أو: `ksfrisor.no`

---

## 📞 الدعم

إذا واجهت مشاكل:
1. تحقق من Railway Logs
2. نفذ verification queries
3. اتصل بالدعم الفني

---

**تم إنشاء هذا الدليل في:** 2024-12-21
