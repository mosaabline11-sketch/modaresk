# تقرير التحديثات — نظام الاشتراك
**التاريخ:** يونيو 2026  
**الإصدار:** 7.6.0 → 7.7.0  
**الملفات المُضافة/المُعدَّلة:**
- `join_subscription_setup.sql` ← جديد
- `join.html` ← تحديث شامل
- `admin_subscription_panes.html` ← إضافات لـ admin.html

---

## ما الذي تم بناؤه؟

### 1. صفحة الانضمام (`join.html`)
- **باقات ديناميكية**: الأسعار تُجلب من جدول `package_settings` في Supabase
- **زر "اشترك الآن"** على كل بطاقة باقة
- **نموذج الاشتراك** يظهر عند الضغط على الزر مع:
  - الاسم الكامل (إجباري)
  - رقم الجوال (إجباري)
  - البريد الإلكتروني (اختياري)
  - الباقة المختارة (تُعبأ تلقائياً وقابلة للتغيير)
  - مدة الاشتراك (تُحسب تلقائياً)
  - كود الخصم (اختياري مع زر تحقق فوري)
- **ملخص السعر**: سعر أصلي + خصم + سعر نهائي
- **عند الإرسال**:
  1. يُحفظ الطلب في `subscription_requests`
  2. يُفتح واتساب برسالة جاهزة تحتوي جميع التفاصيل

---

### 2. لوحة الإدارة (`admin.html`) — إضافات

#### تبويب: إعدادات الباقات 📦
- عرض جميع الباقات الحالية مع أسعارها
- تعديل كل باقة (اسم، سعر، مدة، مميزات، لون)
- تفعيل / إخفاء باقة بدون حذفها
- حذف باقة
- إضافة باقة جديدة

#### تبويب: أكواد الخصم 🎫
- إضافة كود جديد (نسبة % أو مبلغ ثابت)
- تحديد حد أقصى للاستخدام أو صلاحية دائمة
- تحديد تاريخ انتهاء الصلاحية
- تفعيل / تعطيل كود
- حذف كود
- عرض عدد مرات الاستخدام لكل كود

#### تبويب: طلبات الاشتراك 📝
- عرض جميع الطلبات الواردة
- فلترة حسب الحالة (قيد المراجعة / تم التفعيل / مرفوض)
- تغيير حالة كل طلب
- زر واتساب للتواصل مباشرة مع المدرس
- عرض السعر الأصلي + الخصم + السعر النهائي

---

## جداول قاعدة البيانات الجديدة

### `package_settings`
| العمود | النوع | الوصف |
|--------|-------|-------|
| plan_key | TEXT UNIQUE | مفتاح الباقة (monthly, quarter…) |
| name | TEXT | اسم الباقة |
| price | NUMERIC | السعر بالجنيه |
| duration_months | INTEGER | مدة الاشتراك بالشهور |
| features | JSONB | قائمة المميزات |
| color | TEXT | لون البطاقة (green/blue/purple) |
| is_active | BOOLEAN | هل تظهر في الصفحة؟ |
| sort_order | INTEGER | ترتيب الظهور |

### `discount_codes`
| العمود | النوع | الوصف |
|--------|-------|-------|
| code | TEXT UNIQUE | الكود (بحروف كبيرة) |
| discount_type | TEXT | percentage أو fixed |
| discount_value | NUMERIC | قيمة الخصم |
| max_uses | INTEGER | الحد الأقصى (NULL=غير محدود) |
| used_count | INTEGER | عدد مرات الاستخدام |
| is_active | BOOLEAN | هل الكود نشط؟ |
| expires_at | TIMESTAMPTZ | تاريخ الانتهاء (NULL=دائم) |

### `subscription_requests`
| العمود | النوع | الوصف |
|--------|-------|-------|
| full_name | TEXT | اسم المدرس |
| phone | TEXT | رقم الجوال |
| email | TEXT | البريد (اختياري) |
| plan_key | TEXT | مفتاح الباقة المختارة |
| plan_name | TEXT | اسم الباقة |
| duration_months | INTEGER | مدة الاشتراك |
| original_price | NUMERIC | السعر الأصلي |
| discount_code | TEXT | الكود المستخدم |
| discount_amount | NUMERIC | قيمة الخصم |
| final_price | NUMERIC | السعر النهائي |
| status | TEXT | pending / active / rejected |

---

## خطوات التطبيق

### الخطوة 1: تشغيل SQL
```
Supabase Dashboard → SQL Editor → New Query
ألصق محتوى: join_subscription_setup.sql
اضغط Run
```

### الخطوة 2: رفع join.html
```
استبدل الملف القديم join.html بالنسخة الجديدة
```

### الخطوة 3: تحديث admin.html
افتح `admin.html` في محرر النصوص وأضف من `admin_subscription_panes.html`:

**①** ابحث عن: `<span class="icon">🏆</span> المكافآت`  
أضف السطور من `SIDEBAR START` إلى `SIDEBAR END` بعدها مباشرة

**②** ابحث عن: `</div>` نهاية `pane-challenges`  
أضف السطور من `PANES START` إلى `PANES END` بعدها

**③** في دالة `showPane()` قبل `return false` أضف:
```javascript
if (paneId === "pane-packages")       loadAdminPackages();
if (paneId === "pane-discount-codes") loadAdminDiscountCodes();
if (paneId === "pane-sub-requests")   loadAdminSubRequests();
```

**④** قبل `</script>` الأول في admin.html، أضف كتلة الـ JavaScript من `admin_subscription_panes.html`

### الخطوة 4: رفع الملفات على GitHub
```
git add join.html admin.html
git commit -m "feat: subscription system with dynamic packages and discount codes"
git push
```

### الخطوة 5: تأكد من رقم الواتساب
في `config.js`:
```javascript
CONTACT_WHATSAPP: "201XXXXXXXXX",  // ← ضع رقمك هنا
```

---

## باقات افتراضية (مُضافة تلقائياً)
| الباقة | السعر | المدة |
|--------|-------|-------|
| باقة الشهر | 40 ج | شهر |
| باقة 3 شهور | 100 ج | 3 شهور |
| باقة 9 شهور | 300 ج | 9 شهور |

**لتغيير الأسعار:** الإدارة → إعدادات الباقات → تعديل

## أكواد خصم افتراضية
| الكود | النوع | القيمة | الحد |
|-------|-------|--------|------|
| EARLY20 | نسبة | 20% | 50 استخدام |
| WELCOME10 | مبلغ ثابت | 10 ج | غير محدود |

---

## ملاحظات تقنية

- الأسعار والباقات **100% من DB** — لا تحتاج تعديل كود
- عند إضافة/تعديل الباقة من الإدارة، تظهر التغييرات فوراً في join.html
- كود الخصم يُتحقق منه مباشرة مع Supabase (لا يمكن التلاعب)
- عداد الاستخدام `used_count` يزيد تلقائياً عند كل استخدام ناجح
- طلبات الاشتراك لا يمكن للزائر قراءتها (RLS: INSERT فقط للـ anon)
- كل الجداول الجديدة تستخدم RLS لحماية البيانات

---

## ترتيب التشغيل المُحدَّث في SETUP_ORDER.md
```
... (الخطوات السابقة كما هي)
10. join_subscription_setup.sql — جداول نظام الاشتراك الجديدة
```
