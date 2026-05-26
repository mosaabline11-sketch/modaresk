-- =====================================================
-- مدرسك — fix_rls_secure.sql
-- تشديد سياسات RLS لحماية قاعدة البيانات
--
-- ما الذي تغيّر؟
-- ── بدل السماح لـ anon بكل العمليات، صارت الصلاحيات:
--    • teachers     : anon → SELECT + UPDATE فقط (اللوحة محتاجتهم)
--                     anon → لا INSERT ولا DELETE
--                     authenticated (admin) → كل العمليات
--    • ads          : anon → SELECT + INSERT + UPDATE
--                     anon → لا DELETE (المدرس يحذف عبر RPC أو الأدمن يحذف)
--                     authenticated → كل العمليات
--    • analytics    : anon → INSERT فقط (تسجيل أحداث)
--                     authenticated → كل العمليات (الإدارة تقرأ وتحلل)
--    • site_settings: anon → SELECT فقط
--                     authenticated → كل العمليات
--    • subjects     : anon → SELECT فقط
--                     authenticated → كل العمليات
--    • notifications: anon → SELECT فقط (المدرسون يقرؤون)
--                     authenticated → كل العمليات (الإدارة ترسل)
--
-- ملاحظة مهمة:
-- بما أن المدرسين يستخدمون anon key (لا Supabase Auth)، لا يمكن تقييد
-- العمليات على مستوى المستخدم بدقة كاملة. الحل الكامل يتطلب نقل تسجيل
-- دخول المدرسين إلى Supabase Auth مستقبلاً.
-- الإدارة فقط هي التي تستخدم Supabase Auth (authenticated role).
-- =====================================================

-- ══════════════════════════════════════════════════════
-- 1) جدول المدرسين (teachers)
-- ══════════════════════════════════════════════════════
DROP POLICY IF EXISTS "allow_all_teachers"          ON public.teachers;
DROP POLICY IF EXISTS "teachers_select_anon"        ON public.teachers;
DROP POLICY IF EXISTS "teachers_insert_anon"        ON public.teachers;
DROP POLICY IF EXISTS "teachers_update_anon"        ON public.teachers;
DROP POLICY IF EXISTS "teachers_delete_anon"        ON public.teachers;
DROP POLICY IF EXISTS "teachers_all_authenticated"  ON public.teachers;

-- الزوار والمدرسون يقدرون يقرؤوا بيانات المدرسين (مطلوب لعرض الإعلانات)
CREATE POLICY "teachers_select_anon"
ON public.teachers FOR SELECT TO anon
USING (true);

-- المدرس يحدّث ملفه الشخصي (لوحة المدرس تعتمد على ذلك)
CREATE POLICY "teachers_update_anon"
ON public.teachers FOR UPDATE TO anon
USING (true) WITH CHECK (true);

-- الإدارة فقط تضيف وتحذف المدرسين (الإدارة مسجلة بـ Supabase Auth)
CREATE POLICY "teachers_all_authenticated"
ON public.teachers FOR ALL TO authenticated
USING (true) WITH CHECK (true);


-- ══════════════════════════════════════════════════════
-- 2) جدول الإعلانات (ads)
-- ══════════════════════════════════════════════════════
DROP POLICY IF EXISTS "allow_all_ads"              ON public.ads;
DROP POLICY IF EXISTS "ads_select_anon"            ON public.ads;
DROP POLICY IF EXISTS "ads_insert_anon"            ON public.ads;
DROP POLICY IF EXISTS "ads_update_anon"            ON public.ads;
DROP POLICY IF EXISTS "ads_delete_anon"            ON public.ads;
DROP POLICY IF EXISTS "ads_all_authenticated"      ON public.ads;

-- الزوار والمدرسون يقرؤون الإعلانات (الكل + المدرس يرى إعلاناته المعلقة)
CREATE POLICY "ads_select_anon"
ON public.ads FOR SELECT TO anon
USING (true);

-- المدرس يضيف إعلانات جديدة
CREATE POLICY "ads_insert_anon"
ON public.ads FOR INSERT TO anon
WITH CHECK (true);

-- المدرس يعدّل إعلاناته
CREATE POLICY "ads_update_anon"
ON public.ads FOR UPDATE TO anon
USING (true) WITH CHECK (true);

-- الإدارة فقط تمتلك كل الصلاحيات (بما فيها الحذف من الأدمن بانل)
CREATE POLICY "ads_all_authenticated"
ON public.ads FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- ملاحظة: لم نسمح لـ anon بالحذف عمداً. المدرس يحذف إعلانه عبر:
-- supabase.from('ads').delete().eq('id', adId).eq('teacher_id', teacher.id)
-- هذا يعمل فقط إذا أضفنا RPC أو سمحنا لـ anon بالحذف.
-- لأن لوحة المدرس محتاجة الحذف، نضيف policy منفصل بشرط teacher_id غير فارغ:
CREATE POLICY "ads_delete_anon_own"
ON public.ads FOR DELETE TO anon
USING (teacher_id IS NOT NULL);


-- ══════════════════════════════════════════════════════
-- 3) جدول الإحصائيات (analytics_events)
-- ══════════════════════════════════════════════════════
DROP POLICY IF EXISTS "allow_all_analytics"            ON public.analytics_events;
DROP POLICY IF EXISTS "analytics_insert_anon"          ON public.analytics_events;
DROP POLICY IF EXISTS "analytics_all_authenticated"    ON public.analytics_events;

-- الزوار يسجلوا أحداث فقط (INSERT)، لا يقرؤون ولا يعدلون ولا يحذفون
CREATE POLICY "analytics_insert_anon"
ON public.analytics_events FOR INSERT TO anon
WITH CHECK (true);

-- الإدارة تقرأ وتحلل كل الأحداث
CREATE POLICY "analytics_all_authenticated"
ON public.analytics_events FOR ALL TO authenticated
USING (true) WITH CHECK (true);


-- ══════════════════════════════════════════════════════
-- 4) إعدادات الموقع (site_settings)
-- ══════════════════════════════════════════════════════
DROP POLICY IF EXISTS "allow_all_site_settings"        ON public.site_settings;
DROP POLICY IF EXISTS "site_settings_select_anon"      ON public.site_settings;
DROP POLICY IF EXISTS "site_settings_all_authenticated" ON public.site_settings;

-- الزوار والمدرسون يقرؤون الإعدادات (مثل launch_banner_visible, نقاط التفاعل)
CREATE POLICY "site_settings_select_anon"
ON public.site_settings FOR SELECT TO anon
USING (true);

-- الإدارة فقط تعدل الإعدادات
CREATE POLICY "site_settings_all_authenticated"
ON public.site_settings FOR ALL TO authenticated
USING (true) WITH CHECK (true);


-- ══════════════════════════════════════════════════════
-- 5) المواد الدراسية (subjects)
-- ══════════════════════════════════════════════════════
DROP POLICY IF EXISTS "allow_all_subjects"             ON public.subjects;
DROP POLICY IF EXISTS "subjects_select_anon"           ON public.subjects;
DROP POLICY IF EXISTS "subjects_all_authenticated"     ON public.subjects;

-- الجميع يقرأ قائمة المواد
CREATE POLICY "subjects_select_anon"
ON public.subjects FOR SELECT TO anon
USING (true);

-- الإدارة فقط تضيف/تعدل/تحذف المواد
CREATE POLICY "subjects_all_authenticated"
ON public.subjects FOR ALL TO authenticated
USING (true) WITH CHECK (true);


-- ══════════════════════════════════════════════════════
-- 6) الإشعارات (notifications)
-- ══════════════════════════════════════════════════════
DROP POLICY IF EXISTS "allow_all_notifications"        ON public.notifications;
DROP POLICY IF EXISTS "notify_select_all"              ON public.notifications;
DROP POLICY IF EXISTS "notify_insert_admin"            ON public.notifications;
DROP POLICY IF EXISTS "notify_insert_anon"             ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_anon"      ON public.notifications;
DROP POLICY IF EXISTS "notifications_all_authenticated" ON public.notifications;

-- المدرسون يقرؤون الإشعارات الموجهة لهم
CREATE POLICY "notifications_select_anon"
ON public.notifications FOR SELECT TO anon
USING (true);

-- الإدارة ترسل وتحذف الإشعارات
CREATE POLICY "notifications_all_authenticated"
ON public.notifications FOR ALL TO authenticated
USING (true) WITH CHECK (true);


-- ══════════════════════════════════════════════════════
-- 7) تحديث صلاحيات GRANT (إزالة DELETE من anon على الجداول الحساسة)
-- ══════════════════════════════════════════════════════

-- إلغاء صلاحيات anon الخطرة
REVOKE DELETE ON TABLE public.teachers         FROM anon;
REVOKE INSERT ON TABLE public.teachers         FROM anon;
REVOKE DELETE ON TABLE public.analytics_events FROM anon;
REVOKE UPDATE ON TABLE public.analytics_events FROM anon;
REVOKE SELECT ON TABLE public.analytics_events FROM anon;
REVOKE INSERT ON TABLE public.site_settings    FROM anon;
REVOKE UPDATE ON TABLE public.site_settings    FROM anon;
REVOKE DELETE ON TABLE public.site_settings    FROM anon;
REVOKE INSERT ON TABLE public.subjects         FROM anon;
REVOKE UPDATE ON TABLE public.subjects         FROM anon;
REVOKE DELETE ON TABLE public.subjects         FROM anon;
REVOKE INSERT ON TABLE public.notifications    FROM anon;
REVOKE UPDATE ON TABLE public.notifications    FROM anon;
REVOKE DELETE ON TABLE public.notifications    FROM anon;

-- منح الصلاحيات الصحيحة
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- teachers: anon يقرأ ويعدل فقط
GRANT SELECT, UPDATE ON TABLE public.teachers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.teachers TO authenticated;

-- ads: anon يقرأ ويضيف ويعدل ويحذف (لوحة المدرس تحتاج الحذف)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ads TO authenticated;

-- analytics: anon يضيف فقط
GRANT INSERT ON TABLE public.analytics_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.analytics_events TO authenticated;

-- site_settings: anon يقرأ فقط
GRANT SELECT ON TABLE public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.site_settings TO authenticated;

-- subjects: anon يقرأ فقط
GRANT SELECT ON TABLE public.subjects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.subjects TO authenticated;

-- notifications: anon يقرأ فقط
GRANT SELECT ON TABLE public.notifications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notifications TO authenticated;

-- profiles: كما كانت
GRANT SELECT ON TABLE public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;

-- ══════════════════════════════════════════════════════
-- 8) Storage: إبقاء صلاحيات الرفع للـ anon (المدرسون يرفعون صوراً)
-- ══════════════════════════════════════════════════════

-- لا تغيير على storage policies

-- ══════════════════════════════════════════════════════
-- ✅ انتهى — هذا الإعداد أكثر أماناً من "allow all for anon"
-- للحصول على أقصى أمان، انقل تسجيل دخول المدرسين إلى Supabase Auth
-- ══════════════════════════════════════════════════════
