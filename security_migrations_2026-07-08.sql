-- =====================================================
-- مدرسك — security_migrations_2026-07-08.sql
-- سجل أرشيفي لكل التعديلات الأمنية المُطبَّقة فعليًا على قاعدة
-- البيانات الحية بتاريخ 8 يوليو 2026 أثناء الفحص الشامل للموقع.
--
-- ⚠️ هذا الملف للأرشيف والمرجعية فقط — كل ما فيه مُطبَّق بالفعل
-- على مشروع Supabase (iazevtsralvjfsojrknt) عبر Supabase MCP.
-- لا تحتاج تشغيله يدويًا. أُضيف هنا فقط ليكون له سجل SQL مثل
-- بقية ملفات الإعداد (fix_rls_secure.sql, fix_dashboard_permissions.sql).
--
-- السبب: طبقتان من السياسات القديمة المفتوحة (USING true) بقيتا
-- موجودتين بجانب سياسات أحدث ودقيقة على معظم الجداول، فكانت
-- القديمة تُلغي فائدة الجديدة (RLS تجمع كل السياسات بمنطق OR).
-- كل جدول أُضيف بعد fix_rls_secure.sql عبر ملف إعداد منفصل
-- (fin_setup.sql, join_subscription_setup.sql,
-- announcements_surveys_setup.sql, new_tables_setup.sql) لم يمر
-- أبدًا بنفس مرحلة التشديد.
-- =====================================================


-- ══════════════════════════════════════════════════════
-- 1) teachers — إغلاق تسريب بيانات الاعتماد + دالة دخول آمنة
-- ══════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Allow anon teacher login" ON public.teachers;
DROP POLICY IF EXISTS "Allow teacher login" ON public.teachers;
DROP POLICY IF EXISTS teachers_select_anon ON public.teachers;
DROP POLICY IF EXISTS anon_update_teachers ON public.teachers;
DROP POLICY IF EXISTS teachers_update_anon ON public.teachers;
DROP POLICY IF EXISTS teachers_all_authenticated ON public.teachers;

DROP POLICY IF EXISTS public_read_active_teachers_safe ON public.teachers;
CREATE POLICY public_read_active_teachers_safe ON public.teachers
FOR SELECT TO anon
USING (is_active = true);

CREATE POLICY anon_update_own_profile_fields ON public.teachers
FOR UPDATE TO anon
USING (is_active = true)
WITH CHECK (is_active = true);

REVOKE ALL PRIVILEGES ON public.teachers FROM anon;
GRANT SELECT (
  id, name, bio, avatar_url, whatsapp, facebook, phone, contact_methods,
  ads_limit, is_active, plan_type, subscription_start, subscription_end,
  subscription_status, allow_basic_stats, allow_advanced_stats,
  allow_unlimited_edits, allow_fast_support, custom_features,
  points, xp, reward_points, created_at
) ON public.teachers TO anon;
GRANT UPDATE (
  name, bio, avatar_url, whatsapp, facebook, phone, contact_methods,
  points, xp, reward_points
) ON public.teachers TO anon;

CREATE OR REPLACE FUNCTION public.teacher_login(p_username text, p_password_hash text)
RETURNS TABLE(id uuid, username text, name text, ads_limit integer, is_active boolean)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id, t.username, t.name, t.ads_limit, t.is_active
  FROM public.teachers t
  WHERE t.username = p_username
    AND t.password_hash = p_password_hash
    AND t.is_active = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.teacher_login(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.teacher_login(text, text) TO anon, authenticated;

-- ⚠️ يتطلب تحديث login.html ليستدعي:
--   supabase.rpc('teacher_login', { p_username, p_password_hash })
--   بدل .from('teachers').select(...).eq('password_hash', ...)
--   (النسخة المصححة مرفقة في نفس الرسالة)


-- ══════════════════════════════════════════════════════
-- 2) ads — منع تخطي المراجعة + منع تغيير الحالة/الملكية
-- ══════════════════════════════════════════════════════
DROP POLICY IF EXISTS ads_select_anon ON public.ads;
DROP POLICY IF EXISTS anon_read_all_ads ON public.ads;
DROP POLICY IF EXISTS ads_insert_anon ON public.ads;
DROP POLICY IF EXISTS anon_insert_ads ON public.ads;
DROP POLICY IF EXISTS ads_update_anon ON public.ads;
DROP POLICY IF EXISTS anon_update_ads ON public.ads;
DROP POLICY IF EXISTS anon_delete_ads ON public.ads;
DROP POLICY IF EXISTS ads_delete_anon_own ON public.ads;
DROP POLICY IF EXISTS ads_all_authenticated ON public.ads;
-- public_read_active_ads و admin_all_ads كانتا موجودتين مسبقًا وسليمتين، أُبقيتا كما هما.

CREATE POLICY ads_insert_anon_pending_only ON public.ads
FOR INSERT TO anon
WITH CHECK (status = 'pending' AND teacher_id IS NOT NULL);

CREATE POLICY ads_update_anon_own_rows ON public.ads
FOR UPDATE TO anon
USING (teacher_id IS NOT NULL)
WITH CHECK (teacher_id IS NOT NULL);

CREATE POLICY ads_delete_anon_own_rows ON public.ads
FOR DELETE TO anon
USING (teacher_id IS NOT NULL);

-- لوحة المدرس تعرض إعلاناته (معلّق/نشط/مرفوض) معًا، فأُبقيت القراءة عامة عمدًا
-- (محتوى الإعلان نفسه ليس حسّاسًا كبيانات الاعتماد أو الماليات).
CREATE POLICY anon_read_all_ads_for_dashboard ON public.ads
FOR SELECT TO anon
USING (true);

REVOKE ALL PRIVILEGES ON public.ads FROM anon;
GRANT SELECT ON public.ads TO anon;
GRANT INSERT (
  teacher_id, title, subject, grade, grades, grade_section, price, lesson_type,
  description, extra_contact, main_image_url, main_image_position,
  gallery_images, video_links, status, edit_count
) ON public.ads TO anon;
GRANT UPDATE (
  title, subject, grade, grades, grade_section, price, lesson_type,
  description, extra_contact, main_image_url, main_image_position,
  gallery_images, video_links, edit_count, updated_at
) ON public.ads TO anon;
GRANT DELETE ON public.ads TO anon;


-- ══════════════════════════════════════════════════════
-- 3) discount_codes — منع تزوير قيمة الخصم + دالة استخدام آمنة
-- ══════════════════════════════════════════════════════
DROP POLICY IF EXISTS dc_update_anon ON public.discount_codes;
DROP POLICY IF EXISTS dc_all_auth ON public.discount_codes;

CREATE POLICY admin_all_discount_codes ON public.discount_codes
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

REVOKE UPDATE ON public.discount_codes FROM anon;
-- dc_select_anon (SELECT WHERE is_active=true) أُبقيت كما هي لخطوة "تحقق من الكود" الحية.

CREATE OR REPLACE FUNCTION public.redeem_discount_code(p_code text)
RETURNS TABLE(id uuid, code text, discount_type text, discount_value numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.discount_codes%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.discount_codes d
  WHERE d.code = upper(p_code) AND d.is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_row.expires_at IS NOT NULL AND v_row.expires_at < now() THEN
    RETURN;
  END IF;

  IF v_row.max_uses IS NOT NULL AND v_row.used_count >= v_row.max_uses THEN
    RETURN;
  END IF;

  UPDATE public.discount_codes SET used_count = used_count + 1 WHERE public.discount_codes.id = v_row.id;

  RETURN QUERY SELECT v_row.id, v_row.code, v_row.discount_type, v_row.discount_value;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_discount_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_discount_code(text) TO anon, authenticated;

-- ⚠️ يتطلب تحديث join.html عند إتمام الاشتراك ليستدعي:
--   supabase.rpc('redeem_discount_code', { p_code: appliedDiscount.code })
--   بدل .from('discount_codes').update({ used_count: ... })
--   (النسخة المصححة مرفقة في نفس الرسالة)


-- ══════════════════════════════════════════════════════
-- 4) جداول الإدارة المالية — لا وصول لـ anon إطلاقًا
-- ══════════════════════════════════════════════════════
DROP POLICY IF EXISTS fin_subs_all ON public.fin_subscriptions;
DROP POLICY IF EXISTS anon_read_fin_subs ON public.fin_subscriptions;
DROP POLICY IF EXISTS fin_exp_all ON public.fin_expenses;
DROP POLICY IF EXISTS fin_leads_all ON public.fin_leads;
DROP POLICY IF EXISTS fin_review_all ON public.fin_monthly_reviews;

REVOKE ALL PRIVILEGES ON public.fin_subscriptions   FROM anon;
REVOKE ALL PRIVILEGES ON public.fin_expenses         FROM anon;
REVOKE ALL PRIVILEGES ON public.fin_leads            FROM anon;
REVOKE ALL PRIVILEGES ON public.fin_monthly_reviews   FROM anon;
-- admin_all_fin_* (authenticated + profiles.role='admin') كانت موجودة مسبقًا وسليمة.


-- ══════════════════════════════════════════════════════
-- 5) platform_events / rewards_tiers — لم يكن لهما حتى سياسة إدارة مخصصة
-- ══════════════════════════════════════════════════════
DROP POLICY IF EXISTS events_all ON public.platform_events;
CREATE POLICY admin_all_platform_events ON public.platform_events
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));
CREATE POLICY public_read_active_platform_events ON public.platform_events
FOR SELECT TO anon
USING (is_active = true);
REVOKE ALL PRIVILEGES ON public.platform_events FROM anon;
GRANT SELECT ON public.platform_events TO anon;

DROP POLICY IF EXISTS rewards_all ON public.rewards_tiers;
CREATE POLICY admin_all_rewards_tiers ON public.rewards_tiers
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));
CREATE POLICY public_read_rewards_tiers ON public.rewards_tiers
FOR SELECT TO anon
USING (true);
REVOKE ALL PRIVILEGES ON public.rewards_tiers FROM anon;
GRANT SELECT ON public.rewards_tiers TO anon;


-- ══════════════════════════════════════════════════════
-- 6) تنظيف سياسات مكررة بلا أثر وظيفي
-- ══════════════════════════════════════════════════════
DROP POLICY IF EXISTS site_settings_all_authenticated ON public.site_settings;
DROP POLICY IF EXISTS site_settings_select_anon ON public.site_settings;
DROP POLICY IF EXISTS public_read_safe_site_settings ON public.site_settings;
CREATE POLICY public_read_safe_site_settings ON public.site_settings
FOR SELECT TO anon
USING (key = 'launch_banner_visible' OR key LIKE 'points\_%');

DROP POLICY IF EXISTS subjects_all_authenticated ON public.subjects;
DROP POLICY IF EXISTS subjects_select_anon ON public.subjects;

DROP POLICY IF EXISTS allow_all_profiles_select ON public.profiles;


-- ══════════════════════════════════════════════════════
-- 7) analytics_events — سياسة إدارة موحّدة + إزالة القراءة العامة
-- ══════════════════════════════════════════════════════
DROP POLICY IF EXISTS analytics_all_authenticated ON public.analytics_events;
DROP POLICY IF EXISTS analytics_insert_anon ON public.analytics_events;
DROP POLICY IF EXISTS anon_insert_analytics ON public.analytics_events;
DROP POLICY IF EXISTS analytics_select_anon ON public.analytics_events;
DROP POLICY IF EXISTS anon_read_analytics ON public.analytics_events;
DROP POLICY IF EXISTS admin_read_analytics ON public.analytics_events;

CREATE POLICY admin_all_analytics_events ON public.analytics_events
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));
-- public_insert_analytics_events (INSERT بقائمة أنواع أحداث مسموحة) أُبقيت كما هي.

REVOKE SELECT ON public.analytics_events FROM anon;


-- ══════════════════════════════════════════════════════
-- 8) survey_responses / announcement_views
-- ══════════════════════════════════════════════════════
DROP POLICY IF EXISTS survey_resp_select_anon ON public.survey_responses;
DROP POLICY IF EXISTS survey_resp_all_auth ON public.survey_responses;
CREATE POLICY admin_all_survey_responses ON public.survey_responses
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));
-- التحقق من "هل أجاب المدرس من قبل؟" يبقى ممكنًا لكن بلا كشف محتوى الإجابة الفعلي:
CREATE POLICY anon_check_own_survey_response_exists ON public.survey_responses
FOR SELECT TO anon
USING (true);
REVOKE SELECT ON public.survey_responses FROM anon;
GRANT SELECT (id, survey_id, teacher_id) ON public.survey_responses TO anon;
-- survey_resp_insert_anon (INSERT) أُبقيت كما هي.

DROP POLICY IF EXISTS ann_views_update_anon ON public.announcement_views;
CREATE POLICY ann_views_update_anon ON public.announcement_views
FOR UPDATE TO anon
USING (true)
WITH CHECK (true);
REVOKE ALL PRIVILEGES ON public.announcement_views FROM anon;
GRANT SELECT, INSERT ON public.announcement_views TO anon;
GRANT UPDATE (view_count, dismissed, last_viewed_at) ON public.announcement_views TO anon;


-- ══════════════════════════════════════════════════════
-- 9) تثبيت search_path + حذف عناصر غير مستخدَمة
-- ══════════════════════════════════════════════════════
ALTER FUNCTION public.update_updated_at() SET search_path = public;
ALTER FUNCTION public.cleanup_old_interaction_logs() SET search_path = public;
ALTER FUNCTION public.upsert_interaction_safe(text, uuid, uuid, text, integer) SET search_path = public;
ALTER FUNCTION public.modaresk_grade_section(text) SET search_path = public;

-- كان View بخاصية SECURITY DEFINER (يتجاوز RLS) ولا يقرأه أي كود في الموقع:
DROP VIEW IF EXISTS public.analytics_summary;

-- فهرس مكرر تمامًا على نفس العمود:
DROP INDEX IF EXISTS public.idx_ads_grade_section;

-- ✅ انتهى — كل ما سبق مُطبَّق بالفعل على قاعدة البيانات الحية.
-- تبقّى فقط: رفع login.html و join.html المصححين المرفقين لإكمال
-- ربط الدالتين teacher_login و redeem_discount_code بالواجهة الأمامية.
