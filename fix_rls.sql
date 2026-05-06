-- =====================================================
--  مدرسك - إصلاح RLS ولوحة الإدارة
--  شغّل هذا الملف في Supabase → SQL Editor → New query
-- =====================================================

ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_teachers" ON teachers;
DROP POLICY IF EXISTS "anon_write_teachers" ON teachers;
DROP POLICY IF EXISTS "public_read_teachers" ON teachers;
DROP POLICY IF EXISTS "allow_all_teachers" ON teachers;
DROP POLICY IF EXISTS "anon_read_ads" ON ads;
DROP POLICY IF EXISTS "anon_write_ads" ON ads;
DROP POLICY IF EXISTS "public_read_active_ads" ON ads;
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

-- ✅ انتهى الإصلاح
-- تنبيه: هذا يجعل الموقع يعمل بدون Backend، لكنه ليس أعلى أمان للإدارة.
-- للأمان الحقيقي استخدم Supabase Auth + Edge Function/Backend للعمليات الإدارية.
