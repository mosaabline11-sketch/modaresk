-- =====================================================
--  مدرسك - FIX RLS Policies
--  شغّل هذا في Supabase → SQL Editor
--  يحل مشكلة: لوحة الإدارة لا تعمل
-- =====================================================

-- حذف جميع السياسات القديمة
DROP POLICY IF EXISTS "anon_read_teachers"     ON teachers;
DROP POLICY IF EXISTS "anon_write_teachers"    ON teachers;
DROP POLICY IF EXISTS "public_read_teachers"   ON teachers;
DROP POLICY IF EXISTS "anon_read_ads"          ON ads;
DROP POLICY IF EXISTS "anon_write_ads"         ON ads;
DROP POLICY IF EXISTS "public_read_active_ads" ON ads;

-- ✅ السماح لـ anon بقراءة وكتابة كل شيء
-- (المصادقة تتم في JavaScript)

CREATE POLICY "allow_all_teachers" ON teachers
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_all_ads" ON ads
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- ✅ تم! الآن لوحة الإدارة ستعمل بشكل صحيح
-- =====================================================
