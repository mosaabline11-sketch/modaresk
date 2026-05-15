-- =====================================================
--  مدرسك V6.3 - Plans, Subscriptions, Analytics, Media Position, Site Settings
--  شغّل هذا الملف في Supabase SQL Editor
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS teachers (
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
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ads (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id    UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  title         TEXT,
  subject       TEXT NOT NULL,
  grade         TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  ad_id UUID REFERENCES ads(id) ON DELETE SET NULL,
  page TEXT,
  user_agent TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


ALTER TABLE teachers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS contact_methods TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS ads_limit INTEGER DEFAULT 1;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'monthly_40';
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS subscription_start DATE DEFAULT CURRENT_DATE;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS subscription_end DATE DEFAULT (CURRENT_DATE + INTERVAL '1 month');
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS allow_basic_stats BOOLEAN DEFAULT FALSE;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS allow_advanced_stats BOOLEAN DEFAULT FALSE;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS allow_unlimited_edits BOOLEAN DEFAULT FALSE;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS allow_fast_support BOOLEAN DEFAULT FALSE;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS custom_features TEXT;

ALTER TABLE ads ADD COLUMN IF NOT EXISTS extra_contact TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS main_image_url TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS main_image_position TEXT DEFAULT '50% 50%';
ALTER TABLE ads ADD COLUMN IF NOT EXISTS gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS video_links JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS edit_count INTEGER NOT NULL DEFAULT 0;

INSERT INTO site_settings (key, value) VALUES ('launch_banner_visible', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO subjects (name) VALUES
('رياضيات'),('لغة عربية'),('لغة إنجليزية'),('علوم'),('دراسات اجتماعية'),('فيزياء'),('كيمياء'),('أحياء'),('تاريخ'),('جغرافيا'),('فرنسي'),('حاسب آلي'),('أخرى')
ON CONFLICT (name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_ads_teacher_id ON ads(teacher_id);
CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_subject ON ads(subject);
CREATE INDEX IF NOT EXISTS idx_ads_grade ON ads(grade);
CREATE INDEX IF NOT EXISTS idx_teachers_username ON teachers(username);
CREATE INDEX IF NOT EXISTS idx_subjects_name ON subjects(name);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_teacher ON analytics_events(teacher_id);
CREATE INDEX IF NOT EXISTS idx_analytics_ad ON analytics_events(ad_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_teachers_updated ON teachers;
CREATE TRIGGER trg_teachers_updated BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_ads_updated ON ads;
CREATE TRIGGER trg_ads_updated BEFORE UPDATE ON ads FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_teachers" ON teachers;
DROP POLICY IF EXISTS "allow_all_ads" ON ads;
DROP POLICY IF EXISTS "allow_all_subjects" ON subjects;
DROP POLICY IF EXISTS "allow_all_analytics" ON analytics_events;
DROP POLICY IF EXISTS "allow_all_site_settings" ON site_settings;
CREATE POLICY "allow_all_teachers" ON teachers FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_ads" ON ads FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_subjects" ON subjects FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_analytics" ON analytics_events FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_site_settings" ON site_settings FOR ALL TO anon USING (true) WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE teachers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE subjects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE analytics_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE site_settings TO anon;

-- Supabase Storage: uploads bucket for ad images
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "public_read_uploads" ON storage.objects;
DROP POLICY IF EXISTS "anon_insert_uploads" ON storage.objects;
DROP POLICY IF EXISTS "anon_update_uploads" ON storage.objects;
DROP POLICY IF EXISTS "anon_delete_uploads" ON storage.objects;

CREATE POLICY "public_read_uploads" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'uploads');
CREATE POLICY "anon_insert_uploads" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'uploads');
CREATE POLICY "anon_update_uploads" ON storage.objects FOR UPDATE TO anon USING (bucket_id = 'uploads') WITH CHECK (bucket_id = 'uploads');
CREATE POLICY "anon_delete_uploads" ON storage.objects FOR DELETE TO anon USING (bucket_id = 'uploads');

-- ✅ انتهى الإعداد/التحديث



-- ===================================================
-- Multi-grade ads update - v7.0
-- Allows one ad to target multiple grades from one section only
-- ===================================================
alter table public.ads add column if not exists grades jsonb default '[]'::jsonb;
alter table public.ads add column if not exists grade_section text;

create or replace function public.modaresk_grade_section(g text)
returns text
language sql
immutable
as $$
  select case
    when g is null or trim(g) = '' then null
    when g like '%ابتدائي%' then 'primary'
    when g like '%إعدادي%' or g like '%اعدادي%' then 'prep'
    when g like '%ثانوي%' then 'secondary'
    else null
  end
$$;

update public.ads
set
  grades = case
    when grades is null or jsonb_array_length(grades) = 0 then to_jsonb(array[grade])
    else grades
  end,
  grade_section = coalesce(grade_section, public.modaresk_grade_section(grade))
where grade is not null;

create index if not exists ads_grades_gin_idx on public.ads using gin (grades);
create index if not exists ads_grade_section_idx on public.ads (grade_section);
