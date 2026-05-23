-- =====================================================
-- مدرسك — new_tables_setup.sql
-- جداول جديدة: plain_password + events + rewards
-- شغّل في Supabase SQL Editor
-- =====================================================

-- 1) إضافة عمود كلمة المرور الظاهرة للأدمن
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS plain_password TEXT;

-- 2) إضافة عمود meta لجدول الإشعارات (لو محتاج مستقبلاً)
-- ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL;

-- 3) جدول الفعاليات والحملات
CREATE TABLE IF NOT EXISTS public.platform_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  description TEXT,
  reward      TEXT,
  image_url   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4) جدول مستويات المكافآت
CREATE TABLE IF NOT EXISTS public.rewards_tiers (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  points_required  INTEGER NOT NULL DEFAULT 100,
  description      TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 5) RLS للجداول الجديدة
ALTER TABLE public.platform_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_tiers   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_all" ON public.platform_events;
DROP POLICY IF EXISTS "rewards_all" ON public.rewards_tiers;

CREATE POLICY "events_all"
ON public.platform_events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "rewards_all"
ON public.rewards_tiers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.platform_events TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.rewards_tiers   TO anon, authenticated;

-- 6) بيانات افتراضية للمكافآت
INSERT INTO public.rewards_tiers (title, points_required, description) VALUES
  ('تجديد مجاني لشهر', 500, 'احصل على تجديد اشتراك مجاني لمدة شهر'),
  ('تجديد مجاني لـ 3 شهور', 1200, 'احصل على تجديد اشتراك مجاني لمدة 3 شهور'),
  ('إضافة إعلان مجاناً', 300, 'احصل على إعلان إضافي مجاني لمدة شهر')
ON CONFLICT DO NOTHING;

-- 7) إصلاح جدول analytics: التأكد من وجود عمود session_id
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS session_id TEXT;
CREATE INDEX IF NOT EXISTS idx_analytics_session ON public.analytics_events(session_id);

-- ✅ انتهى
