# دليل إضافة K S Frisør إلى Railway Production

## 🎯 الخطوات بالتفصيل

---

### ✅ الحالة الحالية:

**تم إضافة:**

- ✅ Tenant (ks-frisor-tenant)
- ✅ Services (5 خدمات)

**لم يتم إضافة:**

- ❌ Users (Owner + Employee)
- ❌ Working Hours (أوقات العمل)

---

## 📋 الخطوات المتبقية:

### 1️⃣ إضافة Owner User

**انسخ والصق في Railway SQL Query:**

```sql
INSERT INTO users (tenantId, openId, name, email, phone, role, isActive, createdAt, updatedAt)
VALUES ('ks-frisor-tenant', 'khaled-openid-ks-frisor', 'Khaled', 'khaled@ksfrisor.no', '+47 123 45 678', 'admin', 1, NOW(), NOW());
```

**النتيجة المتوقعة:** ✅ Query executed successfully

---

### 2️⃣ إضافة Employee

**انسخ والصق:**

```sql
INSERT INTO users (tenantId, openId, name, email, phone, role, isActive, createdAt, updatedAt)
VALUES ('ks-frisor-tenant', 'employee-ks-frisor-001', 'Khaled', 'khaled.employee@ksfrisor.no', '+47 123 45 679', 'employee', 1, NOW(), NOW());
```

**النتيجة المتوقعة:** ✅ Query executed successfully

---

### 3️⃣ الحصول على Employee ID

**⚠️ مهم جداً!** نحتاج ID الموظف لإضافة أوقات العمل.

**انسخ والصق:**

```sql
SELECT id, name, email, role FROM users WHERE tenantId = 'ks-frisor-tenant' AND role = 'employee';
```

**النتيجة المتوقعة:**

```
id    | name   | email                        | role
------|--------|------------------------------|----------
12345 | Khaled | khaled.employee@ksfrisor.no  | employee
```

**📝 اكتب رقم الـ ID هنا:** \***\*\_\_\_\*\***

---

### 4️⃣ إضافة أوقات العمل (Monday-Friday 09:00-17:00)

**⚠️ استبدل `{EMPLOYEE_ID}` بالرقم من الخطوة 3!**

**مثال:** إذا كان ID = 12345، استبدل `{EMPLOYEE_ID}` بـ `12345`

---

#### Monday (الاثنين):

```sql
INSERT INTO timesheets (employeeId, tenantId, dayOfWeek, startTime, endTime, isActive, createdAt, updatedAt)
VALUES ({EMPLOYEE_ID}, 'ks-frisor-tenant', 1, '09:00:00', '17:00:00', 1, NOW(), NOW());
```

#### Tuesday (الثلاثاء):

```sql
INSERT INTO timesheets (employeeId, tenantId, dayOfWeek, startTime, endTime, isActive, createdAt, updatedAt)
VALUES ({EMPLOYEE_ID}, 'ks-frisor-tenant', 2, '09:00:00', '17:00:00', 1, NOW(), NOW());
```

#### Wednesday (الأربعاء):

```sql
INSERT INTO timesheets (employeeId, tenantId, dayOfWeek, startTime, endTime, isActive, createdAt, updatedAt)
VALUES ({EMPLOYEE_ID}, 'ks-frisor-tenant', 3, '09:00:00', '17:00:00', 1, NOW(), NOW());
```

#### Thursday (الخميس):

```sql
INSERT INTO timesheets (employeeId, tenantId, dayOfWeek, startTime, endTime, isActive, createdAt, updatedAt)
VALUES ({EMPLOYEE_ID}, 'ks-frisor-tenant', 4, '09:00:00', '17:00:00', 1, NOW(), NOW());
```

#### Friday (الجمعة):

```sql
INSERT INTO timesheets (employeeId, tenantId, dayOfWeek, startTime, endTime, isActive, createdAt, updatedAt)
VALUES ({EMPLOYEE_ID}, 'ks-frisor-tenant', 5, '09:00:00', '17:00:00', 1, NOW(), NOW());
```

---

### 5️⃣ التحقق من النتيجة

**نفذ هذه الـ queries للتحقق:**

#### تحقق من Users:

```sql
SELECT id, name, email, role FROM users WHERE tenantId = 'ks-frisor-tenant';
```

**يجب أن ترى 2 users:**

- admin: khaled@ksfrisor.no
- employee: khaled.employee@ksfrisor.no

#### تحقق من Working Hours:

```sql
SELECT * FROM timesheets WHERE tenantId = 'ks-frisor-tenant';
```

**يجب أن ترى 5 صفوف (Mon-Fri):**

- dayOfWeek: 1, 2, 3, 4, 5
- startTime: 09:00:00
- endTime: 17:00:00

---

### 6️⃣ اختبار صفحة الحجز

**افتح:**

```
https://www.stylora.no/book?tenantId=ks-frisor-tenant
```

**يجب أن ترى:**

- ✅ معلومات K S Frisør في الهيدر
- ✅ 5 خدمات في Step 1
- ✅ موظف واحد (Khaled) في Step 2
- ✅ أوقات متاحة (09:00-17:00) في Step 3

---

## 🎉 تم بنجاح!

الآن K S Frisør جاهز للاستخدام في Production!

---

## 🔧 استكشاف الأخطاء

### خطأ: Duplicate Entry

```
ERROR 1062: Duplicate entry
```

**الحل:** البيانات موجودة مسبقاً. تحقق من البيانات الحالية.

### خطأ: Unknown Column

```
ERROR 1054: Unknown column
```

**الحل:** اسم الحقل خاطئ. تحقق من `DESCRIBE table_name;`

### خطأ: Incorrect Integer Value

```
ERROR 1366: Incorrect integer value
```

**الحل:** استخدم رقم بدلاً من نص في حقل `id` أو احذف `id` من الـ query.

---

## 📞 الدعم

إذا واجهت مشاكل، تواصل معي وأرسل:

1. Screenshot من الخطأ
2. الـ query الذي نفذته
3. نتيجة `DESCRIBE table_name;`

---

**تم إنشاء هذا الدليل:** 2024-12-21
