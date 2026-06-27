# ترتيب تطبيق ملفات SQL في Supabase

شغّل الملفات بالترتيب التالي في Supabase SQL Editor:

## المرحلة الأولى: الإعداد الأساسي
1. `supabase_setup_fixed.sql` — الجداول الأساسية والإعدادات

## المرحلة الثانية: الجداول الإضافية
2. `new_tables_setup.sql` — جداول platform_events, rewards_tiers
3. `add_xp_reward_points.sql` — أعمدة xp و reward_points
4. `anti_spam_points.sql` — نظام مكافحة الاحتيال interaction_logs
5. `update_points_daily_limit.sql` — تحديث الحد اليومي للنقاط إلى 100
6. `fin_setup.sql` — جداول الإدارة المالية

## المرحلة الثالثة: الأمان والصلاحيات (مهم: الترتيب مهم)
7. `fix_rls_secure.sql` — تشديد سياسات RLS
8. `fix_dashboard_permissions.sql` — **يجب بعد رقم 7 مباشرة** لإضافة SELECT للـ anon على analytics
9. `fix_profiles_admin.sql` — ربط حساب الإدارة (غيّر UUID فيه لـ UUID حسابك)

## ملاحظات مهمة
- ⚠️ رقم 8 يجب دائماً بعد رقم 7 وإلا لوحة المدرس لن ترى الإحصائيات
- ⚠️ رقم 9 يحتاج تعديل UUID حساب الأدمن قبل التشغيل
- ✅ يمكن إعادة تشغيل أي ملف بأمان (كلها تستخدم IF NOT EXISTS / ON CONFLICT DO NOTHING)
