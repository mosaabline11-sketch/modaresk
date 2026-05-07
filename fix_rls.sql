-- =====================================================
--  مدرسك - Supabase Database Setup / Update
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
  ads_limit     INTEGER NOT NULL DEFAULT 3,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
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
  gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  video_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','rejected')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE teachers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS contact_methods TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS ads_limit INTEGER DEFAULT 3;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS extra_contact TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS main_image_url TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS video_links JSONB NOT NULL DEFAULT '[]'::jsonb;

INSERT INTO subjects (name) VALUES
('رياضيات'),('لغة عربية'),('لغة إنجليزية'),('علوم'),('دراسات اجتماعية'),('فيزياء'),('كيمياء'),('أحياء'),('تاريخ'),('جغرافيا'),('فرنسي'),('حاسب آلي'),('أخرى')
ON CONFLICT (name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_ads_teacher_id ON ads(teacher_id);
CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_subject ON ads(subject);
CREATE INDEX IF NOT EXISTS idx_ads_grade ON ads(grade);
CREATE INDEX IF NOT EXISTS idx_teachers_username ON teachers(username);
CREATE INDEX IF NOT EXISTS idx_subjects_name ON subjects(name);

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

DROP POLICY IF EXISTS "allow_all_teachers" ON teachers;
DROP POLICY IF EXISTS "allow_all_ads" ON ads;
DROP POLICY IF EXISTS "allow_all_subjects" ON subjects;
CREATE POLICY "allow_all_teachers" ON teachers FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_ads" ON ads FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_subjects" ON subjects FOR ALL TO anon USING (true) WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE teachers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE subjects TO anon;



-- =====================================================
--  Supabase Storage: uploads bucket for ad images
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "public_read_uploads" ON storage.objects;
DROP POLICY IF EXISTS "anon_insert_uploads" ON storage.objects;
DROP POLICY IF EXISTS "anon_update_uploads" ON storage.objects;
DROP POLICY IF EXISTS "anon_delete_uploads" ON storage.objects;

CREATE POLICY "public_read_uploads" ON storage.objects
FOR SELECT TO anon
USING (bucket_id = 'uploads');

CREATE POLICY "anon_insert_uploads" ON storage.objects
FOR INSERT TO anon
WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "anon_update_uploads" ON storage.objects
FOR UPDATE TO anon
USING (bucket_id = 'uploads')
WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "anon_delete_uploads" ON storage.objects
FOR DELETE TO anon
USING (bucket_id = 'uploads');

-- ✅ انتهى الإعداد/التحديث
