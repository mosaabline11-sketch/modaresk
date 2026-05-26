# تقرير التحديثات — مدرسك

**التاريخ:** مايو 2026  
**الإصدار:** 7.5.1 → 7.5.2

---

## 1. تشديد سياسات RLS — `fix_rls_secure.sql` (جديد)

### المشكلة
كانت سياسات RLS تمنح صلاحيات كاملة (`SELECT, INSERT, UPDATE, DELETE`) لـ `anon` على جداول حساسة مثل `teachers`, `site_settings`, `subjects`, `notifications`, مما يعني أن أي شخص يعرف الـ anon key يمكنه تعديل إعدادات الموقع أو حذف المدرسين.

### الحل المُطبَّق
| الجدول | anon (قبل) | anon (بعد) | authenticated (الإدارة) |
|--------|-----------|-----------|-------------------------|
| `teachers` | كل العمليات | SELECT + UPDATE فقط | كل العمليات |
| `ads` | كل العمليات | SELECT + INSERT + UPDATE + DELETE | كل العمليات |
| `analytics_events` | كل العمليات | INSERT فقط | كل العمليات |
| `site_settings` | كل العمليات | SELECT فقط | كل العمليات |
| `subjects` | كل العمليات | SELECT فقط | كل العمليات |
| `notifications` | كل العمليات | SELECT فقط | كل العمليات |

### ملاحظة مهمة
بما أن المدرسين يستخدمون الـ `anon key` (لا Supabase Auth)، يصعب تمييزهم عن الزوار العاديين على مستوى قاعدة البيانات. **للحصول على أقصى أمان مستقبلاً**: نقل تسجيل دخول المدرسين إلى Supabase Auth.

### كيفية التطبيق
```sql
-- شغّل هذا الملف في Supabase SQL Editor
-- fix_rls_secure.sql
```

---

## 2. إصلاح قسم الفعاليات والمكافآت في لوحة المدرس — `dashboard.html`

### المشكلة
تبويب "🎁 فعاليات ومكافآت" كان لا يُفعَّل عند الضغط عليه، فلا تظهر الفعاليات ولا مستويات المكافآت.

### السبب الجذري
دالة `switchTab()` كانت تحتوي على مصفوفة `tabs` تفتقد لعنصر `'events'`:
```javascript
// قبل (خطأ)
const tabs = ['ads','stats','features','profile','leaderboard','notifications'];

// بعد (صحيح)
const tabs = ['ads','stats','features','profile','leaderboard','notifications','events'];
```
بدون وجوده في المصفوفة، لا يُضاف الكلاس `active` لا للزر ولا للـ `div#tab-events`.

---

## 3. إصلاح عرض الإشعارات — `admin.html` و `dashboard.html`

### المشكلة
- **يختفي جزء من الإشعارات**: بسبب `overflow: hidden` على `.panel` و `.admin-content`
- **يخرج النص خارج الشاشة**: بسبب غياب `word-break` و `overflow-wrap` على عناصر الإشعارات

### الإصلاحات في `admin.html`
1. تغيير `.admin-content` من `overflow: hidden` إلى `overflow-x: hidden` حتى لا تُقطع العناصر عمودياً
2. تغيير `.panel` من `overflow: hidden` إلى `overflow: visible` لإظهار المحتوى الكامل
3. إضافة `overflow-x:hidden; overflow-wrap:anywhere; word-break:break-word; max-height:500px; overflow-y:auto` على `#notifications-list`
4. إضافة `overflow-wrap:anywhere; word-break:break-word` على عناصر الإشعارات المُولَّدة

### الإصلاحات في `dashboard.html`
1. إضافة `overflow-x:hidden; overflow-wrap:anywhere; word-break:break-word` على `#notifications-content` و `.profile-form-card`
2. إضافة نفس الخصائص على عناصر الإشعارات المُولَّدة

---

## الملفات المُعدَّلة

| الملف | نوع التغيير |
|-------|------------|
| `fix_rls_secure.sql` | **جديد** — سياسات RLS المشددة |
| `dashboard.html` | تعديل — إصلاح switchTab + عرض الإشعارات |
| `admin.html` | تعديل — إصلاح overflow + عرض الإشعارات |
| `update_report.md` | **جديد** — هذا التقرير |

---

## خطوات التطبيق

1. **رفع الملفات** `dashboard.html` و `admin.html` على GitHub/Netlify
2. **تشغيل** `fix_rls_secure.sql` في Supabase SQL Editor
3. الضغط على `Ctrl + Shift + R` في المتصفح لتحديث الكاش

---

## مشاكل محتملة بعد تطبيق RLS الجديد

- لو ظهر خطأ `permission denied` في لوحة المدرس عند **إضافة مادة جديدة**: هذا متوقع، لأن إضافة المواد صارت من صلاحيات الإدارة فقط (الإدارة تعمل ذلك من لوحة الإدارة)
- لو ظهر خطأ عند **قراءة إحصائياتك** كمدرس: يجب على الإدارة أن تشغّل `fix_rls_secure.sql` ثم تتحقق من أن الإدارة مسجلة دخول كـ `authenticated` في Supabase
