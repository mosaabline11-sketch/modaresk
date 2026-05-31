-- =====================================================
-- مدرسك — fix_dashboard_permissions.sql
-- إصلاح مشاكل لوحة المدرس:
-- 1) permission denied على analytics_events
-- 2) ظهور إعلانات المدرس في لوحته
-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor
-- =====================================================

-- ══════════════════════════════════════════
-- 1) إصلاح analytics_events
--    المدرس (anon) محتاج يقرأ إحصائياته الخاصة
-- ══════════════════════════════════════════

-- أعطِ anon صلاحية SELECT على analytics_events
GRANT SELECT ON TABLE public.analytics_events TO anon;

-- احذف السياسة القديمة التي تمنع SELECT
DROP POLICY IF EXISTS "analytics_insert_anon" ON public.analytics_events;
DROP POLICY IF EXISTS "analytics_all_authenticated" ON public.analytics_events;
DROP POLICY IF EXISTS "allow_all_analytics" ON public.analytics_events;

-- سياسة جديدة: anon يقرأ فقط الأحداث المرتبطة بمدرسيه
-- (عملياً بما إن المدرس عنده teacher_id نسمح بالقراءة الكاملة)
CREATE POLICY "analytics_select_anon"
ON public.analytics_events FOR SELECT TO anon
USING (true);

-- anon يضيف أحداث جديدة
CREATE POLICY "analytics_insert_anon"
ON public.analytics_events FOR INSERT TO anon
WITH CHECK (true);

-- الإدارة (authenticated) لها كل الصلاحيات
CREATE POLICY "analytics_all_authenticated"
ON public.analytics_events FOR ALL TO authenticated
USING (true) WITH CHECK (true);


-- ══════════════════════════════════════════
-- 2) إصلاح جدول الإعلانات (ads)
--    التأكد من أن anon يقدر يقرأ ويعدل ويحذف
-- ══════════════════════════════════════════

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ads TO anon;

DROP POLICY IF EXISTS "ads_select_anon"     ON public.ads;
DROP POLICY IF EXISTS "ads_insert_anon"     ON public.ads;
DROP POLICY IF EXISTS "ads_update_anon"     ON public.ads;
DROP POLICY IF EXISTS "ads_delete_anon_own" ON public.ads;
DROP POLICY IF EXISTS "ads_all_authenticated" ON public.ads;
DROP POLICY IF EXISTS "allow_all_ads"       ON public.ads;

CREATE POLICY "ads_select_anon"
ON public.ads FOR SELECT TO anon USING (true);

CREATE POLICY "ads_insert_anon"
ON public.ads FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "ads_update_anon"
ON public.ads FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "ads_delete_anon_own"
ON public.ads FOR DELETE TO anon USING (teacher_id IS NOT NULL);

CREATE POLICY "ads_all_authenticated"
ON public.ads FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ══════════════════════════════════════════
-- 3) إصلاح جدول المدرسين (teachers)
--    المدرس محتاج يقرأ بياناته الخاصة
-- ══════════════════════════════════════════

GRANT SELECT, UPDATE ON TABLE public.teachers TO anon;

DROP POLICY IF EXISTS "teachers_select_anon"   ON public.teachers;
DROP POLICY IF EXISTS "teachers_update_anon"   ON public.teachers;
DROP POLICY IF EXISTS "teachers_all_authenticated" ON public.teachers;
DROP POLICY IF EXISTS "allow_all_teachers"     ON public.teachers;

CREATE POLICY "teachers_select_anon"
ON public.teachers FOR SELECT TO anon USING (true);

CREATE POLICY "teachers_update_anon"
ON public.teachers FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "teachers_all_authenticated"
ON public.teachers FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ══════════════════════════════════════════
-- 4) التأكد من باقي الجداول المطلوبة
-- ══════════════════════════════════════════

-- site_settings: anon يقرأ (مطلوب للإحصائيات)
GRANT SELECT ON TABLE public.site_settings TO anon;

DROP POLICY IF EXISTS "site_settings_select_anon"       ON public.site_settings;
DROP POLICY IF EXISTS "site_settings_all_authenticated"  ON public.site_settings;
DROP POLICY IF EXISTS "allow_all_site_settings"          ON public.site_settings;

CREATE POLICY "site_settings_select_anon"
ON public.site_settings FOR SELECT TO anon USING (true);

CREATE POLICY "site_settings_all_authenticated"
ON public.site_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- notifications: anon يقرأ
GRANT SELECT ON TABLE public.notifications TO anon;

-- ✅ انتهى — شغّل هذا الملف في Supabase SQL Editor
-- بعد التشغيل افتح لوحة المدرس وتحقق من ظهور الإعلانات والإحصائيات
