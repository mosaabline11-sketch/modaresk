-- =====================================================
-- مدرسك - supabase_setup_fixed.sql
-- ملف إعداد كامل لمشروع Supabase من البداية
-- شغّله في مشروع جديد أو لو تريد إعادة التأكد من كل الجداول والسياسات
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1) الجداول الأساسية
-- =====================================================

CREATE TABLE IF NOT EXISTS public.teachers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  bio           TEXT,
  avatar_url    TEXT,
  whatsapp      TEXT,
  facebook      TEXT,
  phone         TEXT,
  contact_methods TEXT,
  ads_limit     INTEGER NOT NULL DEFAULT 1,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  plan_type     TEXT NOT NULL DEFAULT 'monthly_40',
  subscription_start DATE DEFAULT CURRENT_DATE,
  subscription_end DATE DEFAULT (CURRENT_DATE + INTERVAL '1 month'),
  subscription_status TEXT NOT NULL DEFAULT 'active',
  allow_basic_stats BOOLEAN NOT NULL DEFAULT FALSE,
  allow_advanced_stats BOOLEAN NOT NULL DEFAULT FALSE,
  allow_unlimited_edits BOOLEAN NOT NULL DEFAULT FALSE,
  allow_fast_support BOOLEAN NOT NULL DEFAULT FALSE,
  custom_features TEXT,
  points        INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ads (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id    UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  title         TEXT,
  subject       TEXT NOT NULL,
  grade         TEXT NOT NULL,
  grades        JSONB NOT NULL DEFAULT '[]'::jsonb,
  grade_section TEXT,
  price         NUMERIC(10,2) NOT NULL CHECK (price > 0),
  lesson_type   TEXT NOT NULL CHECK (lesson_type IN ('online','inperson','both')),
  description   TEXT,
  extra_contact TEXT,
  main_image_url TEXT,
  main_image_position TEXT DEFAULT '50% 50%',
  gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  video_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  edit_count INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','rejected')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  ad_id UUID REFERENCES public.ads(id) ON DELETE SET NULL,
  page TEXT,
  user_agent TEXT,
  session_id TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target     TEXT NOT NULL DEFAULT 'teachers', -- teachers / students / all
  title      TEXT,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'user',
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2) بيانات افتراضية
-- =====================================================

INSERT INTO public.site_settings (key, value)
VALUES ('launch_banner_visible', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.subjects (name) VALUES
('رياضيات'),('لغة عربية'),('لغة إنجليزية'),('علوم'),('دراسات اجتماعية'),
('فيزياء'),('كيمياء'),('أحياء'),('تاريخ'),('جغرافيا'),('فرنسي'),('حاسب آلي'),('أخرى')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 3) تحديثات احتياطية لو الجداول كانت موجودة بالفعل
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
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS grades JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS grade_section TEXT;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS extra_contact TEXT;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS main_image_url TEXT;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS main_image_position TEXT DEFAULT '50% 50%';
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS video_links JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS edit_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS meta JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.ads
SET grades = to_jsonb(regexp_split_to_array(COALESCE(grade, ''), '\s*[،,]\s*'))
WHERE grade IS NOT NULL
  AND (grades IS NULL OR jsonb_array_length(grades) = 0);

-- =====================================================
-- 4) الفهارس
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
-- 5) Trigger تحديث updated_at
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
-- 6) RLS + Policies
-- =====================================================

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_teachers" ON public.teachers;
DROP POLICY IF EXISTS "allow_all_ads" ON public.ads;
DROP POLICY IF EXISTS "allow_all_subjects" ON public.subjects;
DROP POLICY IF EXISTS "allow_all_analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "allow_all_site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "allow_all_notifications" ON public.notifications;
DROP POLICY IF EXISTS "notify_select_all" ON public.notifications;
DROP POLICY IF EXISTS "notify_insert_admin" ON public.notifications;
DROP POLICY IF EXISTS "notify_insert_anon" ON public.notifications;
DROP POLICY IF EXISTS "allow_all_profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "allow_anon_profiles" ON public.profiles;
DROP POLICY IF EXISTS "allow_authenticated_profiles" ON public.profiles;

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
-- 7) Supabase Storage: uploads
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
-- انتهى الإعداد ✅
-- =====================================================
