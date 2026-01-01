# تحليل إزالة اعتماديات Manus - Stylora

**التاريخ:** 31 ديسمبر 2025  
**المؤلف:** Manus AI  
**الإصدار:** 1.0

---

## ملخص تنفيذي

هذا التقرير يحلل جميع اعتماديات Manus في مشروع Stylora ويصنفها حسب الأولوية لضمان استقلالية المشروع 100% عن منصة Manus قبل الإنتاج.

---

## الفئة الأولى: ضروري قبل الإنتاج 🔴

هذه العناصر **يجب** إصلاحها قبل أي deployment للإنتاج.

| الملف | المشكلة | الحل المطلوب | الأولوية |
|-------|---------|--------------|----------|
| `server/storage.ts` | يعتمد على `BUILT_IN_FORGE_API_URL` و `BUILT_IN_FORGE_API_KEY` | استبدال بـ AWS S3 أو Cloudflare R2 أو Supabase Storage | **عالية جداً** |
| `client/src/components/ManusDialog.tsx` | Dialog يطلب "Login with Manus" | حذف الملف أو استبداله بـ Login Dialog عادي | **عالية** |
| `client/src/_core/hooks/useAuth.ts` | يخزن في `manus-runtime-user-info` | تغيير اسم localStorage key إلى `stylora-user-info` | **متوسطة** |
| `server/_core/env.ts` | يحتوي على `forgeApiUrl` و `forgeApiKey` | إزالة أو استبدال بـ S3 credentials | **عالية** |

### التفاصيل:

#### 1. Storage (التخزين) - الأهم
```typescript
// الوضع الحالي في server/storage.ts
if (!baseUrl || !apiKey) {
  throw new Error(
    "Storage proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
  );
}
```

**الحل:** استبدال بـ AWS S3 SDK أو Supabase Storage:
```typescript
// الحل المقترح
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
```

#### 2. ManusDialog - حذف أو استبدال
الملف `ManusDialog.tsx` يعرض dialog لتسجيل الدخول عبر Manus OAuth. يجب:
- حذف الملف بالكامل
- أو استبداله بـ Login Dialog يستخدم email/password

---

## الفئة الثانية: مهم لكن ممكن لاحقاً 🟡

هذه العناصر مهمة لكن لن تمنع المشروع من العمل.

| الملف | المشكلة | الحل المطلوب | الأولوية |
|-------|---------|--------------|----------|
| `server/_core/llm.ts` | LLM integration معطل بالفعل | إضافة OpenAI/Anthropic integration إذا لزم | **منخفضة** |
| `server/_core/notification.ts` | Notification system معطل | استبدال بـ email notifications (SendGrid/AWS SES) | **متوسطة** |
| `server/_core/types/manusTypes.ts` | Types غير مستخدمة | حذف الملف | **منخفضة** |
| Test files (*.test.ts) | `loginMethod: "manus"` في mock data | تغيير إلى `loginMethod: "email"` | **منخفضة** |

### التفاصيل:

#### 1. LLM Integration
```typescript
// الوضع الحالي - معطل بالفعل ✅
export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  throw new Error("LLM integration disabled. Please configure OpenAI or another LLM provider.");
}
```
**الحالة:** ✅ معطل بالفعل - لا يحتاج تعديل فوري

#### 2. Notification System
```typescript
// الوضع الحالي - معطل بالفعل ✅
export async function notifyOwner(payload: NotificationPayload): Promise<boolean> {
  console.warn("[Notification] Manus notification system disabled.");
  return false;
}
```
**الحالة:** ✅ معطل بالفعل - يمكن إضافة email notifications لاحقاً

---

## الفئة الثالثة: كماليات 🟢

هذه العناصر تجميلية ولا تؤثر على عمل المشروع.

| الملف | المشكلة | الحل المطلوب | الأولوية |
|-------|---------|--------------|----------|
| `server/test-email-template.ts` | URL يحتوي على `stylora.manus.space` | تغيير إلى `stylora.no` | **منخفضة جداً** |
| Comments في الكود | تعليقات تذكر "Manus" | تنظيف التعليقات | **منخفضة جداً** |
| `MANUS_REMOVAL_TODO.md` | ملف توثيق | إبقاء للمرجعية أو حذف | **منخفضة جداً** |

---

## خطة العمل المقترحة

### المرحلة 1: إصلاحات فورية (قبل الإنتاج)

```bash
# 1. إصلاح Storage
# استبدال server/storage.ts بـ S3 implementation

# 2. حذف ManusDialog
rm client/src/components/ManusDialog.tsx

# 3. تحديث useAuth.ts
# تغيير localStorage key
```

### المرحلة 2: تنظيف الكود

```bash
# 1. حذف manusTypes.ts
rm server/_core/types/manusTypes.ts

# 2. تحديث test files
# تغيير loginMethod: "manus" إلى "email"

# 3. تنظيف env.ts
# إزالة forgeApiUrl و forgeApiKey
```

### المرحلة 3: التحقق النهائي

```bash
# البحث عن أي references متبقية
grep -r "manus\|Manus\|MANUS" --include="*.ts" --include="*.tsx" .

# التأكد من عدم وجود imports
grep -r "BUILT_IN_FORGE\|FORGE_API" --include="*.ts" .
```

---

## Environment Variables المطلوبة للاستقلالية

### Variables يجب إزالتها:
- `BUILT_IN_FORGE_API_URL` ❌
- `BUILT_IN_FORGE_API_KEY` ❌
- `VITE_FRONTEND_FORGE_API_KEY` ❌
- `VITE_FRONTEND_FORGE_API_URL` ❌
- `OAUTH_SERVER_URL` ❌
- `VITE_OAUTH_PORTAL_URL` ❌

### Variables يجب إضافتها للبديل:
```env
# AWS S3 للتخزين
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=eu-north-1
AWS_S3_BUCKET=stylora-uploads

# أو Supabase Storage
SUPABASE_URL=xxx
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx
```

---

## ملخص الحالة الحالية

| الفئة | العدد | الحالة |
|-------|-------|--------|
| ضروري قبل الإنتاج | 4 | 🔴 يحتاج عمل |
| مهم لكن ممكن لاحقاً | 4 | 🟡 معظمها معطل |
| كماليات | 3 | 🟢 تجميلي |

### الخلاصة:

المشروع **قريب جداً** من الاستقلالية الكاملة. الإصلاحات الرئيسية المطلوبة:

1. **Storage** - استبدال Manus Storage بـ S3/Supabase (الأهم)
2. **ManusDialog** - حذف أو استبدال
3. **localStorage key** - تغيير اسم بسيط

بعد هذه الإصلاحات، المشروع سيعمل 100% بدون أي اعتماد على Manus.

---

## الملفات المتأثرة

```
client/src/
├── _core/hooks/useAuth.ts          # تغيير localStorage key
├── components/ManusDialog.tsx      # حذف
└── components/BrandingSettingsTab.tsx  # تعليق فقط

server/
├── _core/
│   ├── env.ts                      # إزالة forge variables
│   ├── llm.ts                      # ✅ معطل بالفعل
│   ├── notification.ts             # ✅ معطل بالفعل
│   └── types/manusTypes.ts         # حذف
├── storage.ts                      # استبدال بـ S3
└── *.test.ts                       # تغيير loginMethod
```

---

**ملاحظة:** هذا التقرير يمثل تحليل شامل. يُنصح بتنفيذ الإصلاحات بالترتيب المذكور لضمان استقرار المشروع.
