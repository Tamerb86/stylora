# دليل العمل - Stylora

## البيئات

### 1️⃣ بيئة التطوير (Local Development)

- **الرابط:** `http://localhost:3000`
- **قاعدة البيانات:** MySQL محلي أو Supabase
- **الاستخدام:** للتطوير والاختبار
- **ملاحظة:** البيانات هنا **منفصلة تماماً** عن الإنتاج

### 2️⃣ بيئة الإنتاج (Railway Production)

- **الرابط:** `https://www.stylora.no`
- **قاعدة البيانات:** MySQL على Railway
- **الاستخدام:** الموقع المنشور للعملاء
- **ملاحظة:** البيانات الحقيقية للعملاء

### 3️⃣ GitHub (الكود فقط)

- **Repository:** `https://github.com/Tamerb86/stylora`
- **المحتوى:** الكود فقط (لا يحتوي على بيانات)
- **الاستخدام:** مصدر الكود لـ Railway

---

## سير العمل الصحيح

### ✅ الطريقة الصحيحة

1. **التطوير محلياً:**

   ```
   عمل تعديلات → اختبار محلي → commit
   ```

2. **رفع الكود إلى GitHub:**

   ```
   git add . → git commit → git push
   ```

3. **النشر على Railway:**

   ```
   GitHub → Railway Auto-Deploy → Production
   ```

4. **إضافة البيانات:**
   - **محلياً:** أضف بيانات للاختبار من Dashboard
   - **في Railway:** أضف بيانات للإنتاج من Dashboard على Railway

### ❌ الأخطاء الشائعة

1. **❌ إضافة بيانات محلياً وتوقع رؤيتها على Railway**
   - البيانات **لا تنتقل** بين البيئات
   - يجب إضافة البيانات في كل بيئة على حدة

2. **❌ عدم اختبار الكود قبل Push**
   - دائماً اختبر محلياً أولاً
   - ثم Push إلى GitHub

3. **❌ عدم انتظار Railway Deploy**
   - بعد Push، انتظر 2-3 دقائق
   - تحقق من Railway Dashboard أن الـ Deploy انتهى

---

## خطوات العمل اليومية

### 1. عند إضافة ميزة جديدة

```
1. اعمل التعديلات محلياً
2. اختبر في بيئة التطوير
3. commit التغييرات
4. ادفع إلى GitHub (git push)
5. انتظر Railway Auto-Deploy
6. اختبر على Railway Production
```

### 2. عند إضافة بيانات

**محلياً (للاختبار):**

```
افتح: http://localhost:3000/dashboard
أضف: خدمات، موظفين، عملاء
```

**في Railway (للإنتاج):**

```
افتح: https://www.stylora.no/dashboard
أضف: خدمات، موظفين، عملاء
```

### 3. عند حدوث مشكلة

**إذا ضاع شيء:**

```
1. تحقق من آخر commit في GitHub
2. استخدم git revert إذا لزم الأمر
3. أو استخدم Railway Rollback
```

**إذا لم تظهر التحديثات على Railway:**

```
1. تحقق من GitHub: هل الـ commit موجود؟
2. تحقق من Railway Deployments: هل الـ deploy انتهى؟
3. اعمل Redeploy يدوياً من Railway Dashboard
```

---

## قائمة التحقق قبل كل Push

- [ ] ✅ اختبرت الميزة محلياً
- [ ] ✅ تحديث todo.md بالميزات المكتملة
- [ ] ✅ دفعت إلى GitHub
- [ ] ✅ تحققت من Railway Deployment
- [ ] ✅ اختبرت على Railway Production

---

## الملفات المهمة

### للتوثيق:

- `todo.md` - قائمة المهام والميزات
- `WORKFLOW_AR.md` - هذا الملف (دليل العمل)
- `VIPPS_SETUP_GUIDE.md` - دليل إعداد Vipps
- `IZETTLE_SETUP_GUIDE.md` - دليل إعداد iZettle
- `STRIPE_TERMINAL_GUIDE.md` - دليل إعداد Stripe Terminal

### للكود:

- `client/src/pages/` - صفحات الموقع
- `server/routers.ts` - API endpoints
- `drizzle/schema.ts` - قاعدة البيانات

---

## نصائح مهمة

1. **دائماً اختبر محلياً قبل أي تغيير كبير**
2. **لا تحذف البيانات من Railway إلا إذا كنت متأكداً**
3. **اختبر محلياً أولاً قبل النشر على Railway**
4. **احتفظ بنسخة احتياطية من قاعدة البيانات بشكل دوري**

---

## جهات الاتصال

- **GitHub:** https://github.com/Tamerb86/stylora
- **Railway:** https://railway.app
- **الموقع:** https://www.stylora.no

---

**آخر تحديث:** 31 ديسمبر 2024
