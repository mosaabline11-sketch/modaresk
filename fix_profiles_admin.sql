-- =====================================================
--  مدرسك — إصلاح: إنشاء جدول profiles وربط حساب الإدارة
--  شغّل هذا الملف مرة واحدة في Supabase SQL Editor
-- =====================================================

-- 1) إنشاء جدول profiles
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'user',
  teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) تفعيل RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3) صلاحيات الوصول
DROP POLICY IF EXISTS "allow_anon_profiles"          ON profiles;
DROP POLICY IF EXISTS "allow_authenticated_profiles" ON profiles;

-- السماح لأي زائر بالقراءة (مطلوب للتحقق من الدور أثناء تسجيل الدخول)
CREATE POLICY "allow_anon_profiles"
  ON profiles FOR SELECT TO anon USING (true);

-- السماح للمستخدم المسجل بقراءة وتعديل ملفه الشخصي فقط
CREATE POLICY "allow_authenticated_profiles"
  ON profiles FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- منح الإذن
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE profiles TO authenticated;

-- 4) ربط حساب الإدارة الحالي
--    (UID مأخوذ من لقطة الشاشة التي أرسلتها)
INSERT INTO profiles (user_id, role)
VALUES ('d6ac4e67-26c9-4d80-bfb7-1914006922bc', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin', updated_at = NOW();

-- ✅ انتهى — جرّب تسجيل الدخول الآن من login.html?role=admin
