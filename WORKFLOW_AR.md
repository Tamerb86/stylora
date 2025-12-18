# دليل العمل - BarberTime

## البيئات الثلاث

### 1️⃣ بيئة التطوير (Manus Dev Server)
- **الرابط:** `https://3000-xxxxx.manusvm.computer`
- **قاعدة البيانات:** Supabase (من Manus)
- **الاستخدام:** للتطوير والاختبار
- **ملاحظة:** البيانات هنا **منفصلة تماماً** عن Railway

### 2️⃣ بيئة الإنتاج (Railway Production)
- **الرابط:** `https://barbertime-production-5d35.up.railway.app`
- **قاعدة البيانات:** MySQL على Railway
- **الاستخدام:** الموقع المنشور للعملاء
- **ملاحظة:** البيانات هنا **منفصلة تماماً** عن Manus

### 3️⃣ GitHub (الكود فقط)
- **Repository:** `https://github.com/Tamerb86/barbertime`
- **المحتوى:** الكود فقط (لا يحتوي على بيانات)
- **الاستخدام:** مصدر الكود لـ Railway

---

## سير العمل الصحيح

### ✅ الطريقة الصحيحة

1. **التطوير في Manus:**
   ```
   عمل تعديلات → اختبار في Manus Dev → حفظ Checkpoint
   ```

2. **رفع الكود إلى GitHub:**
   ```
   Checkpoint → Git Push → GitHub
   ```

3. **النشر على Railway:**
   ```
   GitHub → Railway Auto-Deploy → Production
   ```

4. **إضافة البيانات:**
   - **في Manus Dev:** أضف بيانات للاختبار من Dashboard
   - **في Railway:** أضف بيانات للإنتاج من Dashboard على Railway

### ❌ الأخطاء الشائعة

1. **❌ إضافة بيانات في Manus وتوقع رؤيتها على Railway**
   - البيانات **لا تنتقل** بين البيئات
   - يجب إضافة البيانات في كل بيئة على حدة

2. **❌ عدم حفظ Checkpoint قبل Push**
   - دائماً احفظ Checkpoint أولاً
   - ثم Push إلى GitHub

3. **❌ عدم انتظار Railway Deploy**
   - بعد Push، انتظر 2-3 دقائق
   - تحقق من Railway Dashboard أن الـ Deploy انتهى

---

## خطوات العمل اليومية

### 1. عند إضافة ميزة جديدة

```
1. اعمل التعديلات في Manus
2. اختبر في Manus Dev Server
3. احفظ Checkpoint (webdev_save_checkpoint)
4. ادفع إلى GitHub (git push)
5. انتظر Railway Auto-Deploy
6. اختبر على Railway Production
```

### 2. عند إضافة بيانات

**في Manus (للاختبار):**
```
افتح: https://3000-xxxxx.manusvm.computer/dashboard
أضف: خدمات، موظفين، عملاء
```

**في Railway (للإنتاج):**
```
افتح: https://barbertime-production-5d35.up.railway.app/dashboard
أضف: خدمات، موظفين، عملاء
```

### 3. عند حدوث مشكلة

**إذا ضاع شيء:**
```
1. تحقق من آخر Checkpoint في Manus
2. تحقق من آخر Commit في GitHub
3. استخدم Rollback إذا لزم الأمر
```

**إذا لم تظهر التحديثات على Railway:**
```
1. تحقق من GitHub: هل الـ commit موجود؟
2. تحقق من Railway Deployments: هل الـ deploy انتهى؟
3. اعمل Redeploy يدوياً من Railway Dashboard
```

---

## قائمة التحقق قبل كل Push

- [ ] ✅ حفظت Checkpoint في Manus
- [ ] ✅ اختبرت الميزة في Manus Dev
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

### للكود:
- `client/src/pages/` - صفحات الموقع
- `server/routers.ts` - API endpoints
- `drizzle/schema.ts` - قاعدة البيانات

---

## نصائح مهمة

1. **دائماً احفظ Checkpoint قبل أي تغيير كبير**
2. **لا تحذف البيانات من Railway إلا إذا كنت متأكداً**
3. **اختبر في Manus أولاً قبل النشر على Railway**
4. **احتفظ بنسخة احتياطية من قاعدة البيانات بشكل دوري**

---

## جهات الاتصال

- **GitHub Token:** (محفوظ بشكل آمن)
- **Railway:** https://railway.app
- **Manus:** https://manus.im

---

**آخر تحديث:** 18 ديسمبر 2024
