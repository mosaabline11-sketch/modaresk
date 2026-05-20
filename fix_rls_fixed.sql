-- =====================================================
-- مدرسك - fix_rls_fixed.sql
-- ملف إصلاح سريع للقاعدة الحالية
-- شغّله داخل Supabase SQL Editor
-- يحل خطأ: only WITH CHECK expression allowed for INSERT
-- ويضيف الأعمدة/الجداول الناقصة: points, grades, grade_section, session_id, notifications
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1) تحديث الجداول الحالية وإضافة الأعمدة الناقصة
-- =====================================================

ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS contact_methods TEXT;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS ads_limit INTEGER DEFAULT 1;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'monthly_40';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS subscription_start DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS subscription_end DATE DEFAULT (CURRENT_DATE + INTERVAL '1 month');
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS allow_basic_stats BOOLEAN DEFAULT FALSE;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS allow_advanced_stats BOOLEAN DEFAULT FALSE;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS allow_unlimited_edits BOOLEAN DEFAULT FALSE;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS allow_fast_support BOOLEAN DEFAULT FALSE;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS custom_features TEXT;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS extra_contact TEXT;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS main_image_url TEXT;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS main_image_position TEXT DEFAULT '50% 50%';
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS video_links JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS edit_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS grades JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS grade_section TEXT;

ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS meta JSONB NOT NULL DEFAULT '{}'::jsonb;

-- تعبئة grades للإعلانات القديمة من grade لو كانت فاضية
UPDATE public.ads
SET grades = to_jsonb(regexp_split_to_array(COALESCE(grade, ''), '\s*[،,]\s*'))
WHERE grade IS NOT NULL
  AND (grades IS NULL OR jsonb_array_length(grades) = 0);

-- =====================================================
-- 2) إنشاء جدول الإشعارات
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target     TEXT NOT NULL DEFAULT 'teachers', -- teachers / students / all
  title      TEXT,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3) إنشاء جدول profiles لو غير موجود
-- ملاحظة: هذا الجدول يستخدمه حساب الإدارة إن كنت تستخدم Supabase Auth
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'user',
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4) إعدادات الموقع والمواد الافتراضية
-- =====================================================

CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.site_settings (key, value)
VALUES ('launch_banner_visible', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.subjects (name) VALUES
('رياضيات'),('لغة عربية'),('لغة إنجليزية'),('علوم'),('دراسات اجتماعية'),
('فيزياء'),('كيمياء'),('أحياء'),('تاريخ'),('جغرافيا'),('فرنسي'),('حاسب آلي'),('أخرى')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 5) الفهارس
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_ads_teacher_id ON public.ads(teacher_id);
CREATE INDEX IF NOT EXISTS idx_ads_status ON public.ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_subject ON public.ads(subject);
CREATE INDEX IF NOT EXISTS idx_ads_grade ON public.ads(grade);
CREATE INDEX IF NOT EXISTS idx_ads_grade_section ON public.ads(grade_section);
CREATE INDEX IF NOT EXISTS idx_teachers_username ON public.teachers(username);
CREATE INDEX IF NOT EXISTS idx_teachers_points ON public.teachers(points);
CREATE INDEX IF NOT EXISTS idx_subjects_name ON public.subjects(name);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_teacher ON public.analytics_events(teacher_id);
CREATE INDEX IF NOT EXISTS idx_analytics_ad ON public.analytics_events(ad_id);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON public.site_settings(key);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at);

-- =====================================================
-- 6) Trigger تحديث updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_teachers_updated ON public.teachers;
CREATE TRIGGER trg_teachers_updated
BEFORE UPDATE ON public.teachers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_ads_updated ON public.ads;
CREATE TRIGGER trg_ads_updated
BEFORE UPDATE ON public.ads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- 7) تفعيل RLS
-- =====================================================

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8) حذف السياسات القديمة حتى لا تتكرر
-- =====================================================

DROP POLICY IF EXISTS "allow_all_teachers" ON public.teachers;
DROP POLICY IF EXISTS "allow_all_ads" ON public.ads;
DROP POLICY IF EXISTS "allow_all_subjects" ON public.subjects;
DROP POLICY IF EXISTS "allow_all_analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "allow_all_site_settings" ON public.site_settings;

DROP POLICY IF EXISTS "notify_select_all" ON public.notifications;
DROP POLICY IF EXISTS "notify_insert_admin" ON public.notifications;
DROP POLICY IF EXISTS "notify_insert_anon" ON public.notifications;
DROP POLICY IF EXISTS "allow_all_notifications" ON public.notifications;

DROP POLICY IF EXISTS "allow_anon_profiles" ON public.profiles;
DROP POLICY IF EXISTS "allow_authenticated_profiles" ON public.profiles;
DROP POLICY IF EXISTS "allow_all_profiles_select" ON public.profiles;

-- =====================================================
-- 9) سياسات RLS للواجهة الحالية
-- مهم: هذه السياسات مناسبة للكود الحالي لأنه يعتمد على anon key في الواجهة.
-- لاحقًا يمكننا تشديدها عند نقل الإدارة إلى Edge Functions أو Supabase Auth كامل.
-- =====================================================

CREATE POLICY "allow_all_teachers"
ON public.teachers
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_all_ads"
ON public.ads
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_all_subjects"
ON public.subjects
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_all_analytics"
ON public.analytics_events
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_all_site_settings"
ON public.site_settings
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_all_notifications"
ON public.notifications
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_all_profiles_select"
ON public.profiles
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "allow_authenticated_profiles"
ON public.profiles
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 10) منح الصلاحيات للأدوار
-- =====================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.teachers TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ads TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.subjects TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.analytics_events TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.site_settings TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notifications TO anon, authenticated;
GRANT SELECT ON TABLE public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;

-- =====================================================
-- 11) Supabase Storage: bucket uploads + policies
-- ملاحظة مهمة:
-- INSERT يستخدم WITH CHECK فقط، بدون USING
-- لأن Postgres لا يسمح بـ USING في INSERT policy
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "public_read_uploads" ON storage.objects;
DROP POLICY IF EXISTS "anon_insert_uploads" ON storage.objects;
DROP POLICY IF EXISTS "anon_update_uploads" ON storage.objects;
DROP POLICY IF EXISTS "anon_delete_uploads" ON storage.objects;

CREATE POLICY "public_read_uploads"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'uploads');

CREATE POLICY "anon_insert_uploads"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "anon_update_uploads"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'uploads')
WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "anon_delete_uploads"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (bucket_id = 'uploads');

-- =====================================================
-- انتهى الإصلاح ✅
-- =====================================================
