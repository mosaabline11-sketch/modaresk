-- =====================================================
--  مدرسك - Supabase Database Setup
--  قم بتشغيل هذا الملف في Supabase SQL Editor
--  https://app.supabase.com → SQL Editor → New query
-- =====================================================

-- ── 1. Enable UUID extension ──
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 2. Teachers Table ──
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
  ads_limit     INTEGER NOT NULL DEFAULT 3,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Ads Table ──
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
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','rejected')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. Indexes ──
CREATE INDEX IF NOT EXISTS idx_ads_teacher_id ON ads(teacher_id);
CREATE INDEX IF NOT EXISTS idx_ads_status     ON ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_subject    ON ads(subject);
CREATE INDEX IF NOT EXISTS idx_ads_grade      ON ads(grade);
CREATE INDEX IF NOT EXISTS idx_teachers_username ON teachers(username);

-- ── 5. Updated_at Trigger ──
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_teachers_updated ON teachers;
CREATE TRIGGER trg_teachers_updated
  BEFORE UPDATE ON teachers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_ads_updated ON ads;
CREATE TRIGGER trg_ads_updated
  BEFORE UPDATE ON ads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 6. Row Level Security (RLS) ──
-- ملاحظة مهمة: هذا الإصدار مصمم ليعمل على موقع Frontend فقط بدون Backend.
-- لذلك السياسات التالية تسمح للـ anon بالقراءة/الكتابة حتى تعمل لوحة الإدارة ولوحة المدرس.
-- للأمان الحقيقي: انقل عمليات الإدارة إلى Backend/Edge Function واستخدم Service Role هناك فقط.
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_teachers" ON teachers;
DROP POLICY IF EXISTS "anon_read_teachers" ON teachers;
DROP POLICY IF EXISTS "anon_write_teachers" ON teachers;
DROP POLICY IF EXISTS "allow_all_teachers" ON teachers;
DROP POLICY IF EXISTS "public_read_active_ads" ON ads;
DROP POLICY IF EXISTS "anon_read_ads" ON ads;
DROP POLICY IF EXISTS "anon_write_ads" ON ads;
DROP POLICY IF EXISTS "allow_all_ads" ON ads;

CREATE POLICY "allow_all_teachers" ON teachers
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_all_ads" ON ads
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE teachers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ads TO anon;

-- ── 7. Sample Data (Optional - remove in production) ──
-- Uncomment to add demo data:

/*
-- Demo teacher (password: demo1234)
-- SHA-256 of "demo1234" = "9fca4c8a3ea8e49bb7ac71e2ef2fc00e8d36ac87785b0e95427d2a8d6f62b1c9"
INSERT INTO teachers (username, password_hash, name, bio, whatsapp, ads_limit, is_active)
VALUES (
  'teacher_demo',
  '9fca4c8a3ea8e49bb7ac71e2ef2fc00e8d36ac87785b0e95427d2a8d6f62b1c9',
  'أحمد محمد',
  'مدرس رياضيات وفيزياء بخبرة 8 سنوات في التدريس الخصوصي. خريج كلية الهندسة. أتميز بأسلوب تدريس مبسّط وفعّال.',
  '966501234567',
  5,
  TRUE
);

-- Demo ad
INSERT INTO ads (teacher_id, title, subject, grade, price, lesson_type, description, status)
SELECT
  id,
  'دروس رياضيات للمرحلة الثانوية',
  'رياضيات',
  'الصف الثاني عشر',
  80,
  'both',
  'دروس خصوصية مكثفة في الرياضيات للمرحلة الثانوية مع شرح مفصل للمناهج وحل نماذج الاختبارات السابقة.',
  'active'
FROM teachers
WHERE username = 'teacher_demo'
LIMIT 1;
*/

-- =====================================================
--  ✅ Database setup complete!
--  Next steps:
--  1. Go to your Supabase project Settings → API
--  2. Copy your Project URL and anon key
--  3. Paste them in js/config.js
-- =====================================================
