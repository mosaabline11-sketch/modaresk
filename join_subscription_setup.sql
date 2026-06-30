-- =====================================================
-- مدرسك — join_subscription_setup.sql
-- نظام الاشتراك: باقات + أكواد خصم + طلبات الاشتراك
-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ══════════════════════════════════════════════════════
-- 1) جدول إعدادات الباقات (package_settings)
--    تحكم في الأسعار والمدد من لوحة الإدارة
-- ══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.package_settings (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_key       TEXT UNIQUE NOT NULL,
  name           TEXT NOT NULL,
  price          NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_months INTEGER NOT NULL DEFAULT 1,
  features       JSONB NOT NULL DEFAULT '[]'::jsonb,
  color          TEXT NOT NULL DEFAULT 'blue',
  is_active      BOOLEAN NOT NULL DEFAULT true,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════
-- 2) جدول أكواد الخصم (discount_codes)
-- ══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.discount_codes (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code           TEXT UNIQUE NOT NULL,
  discount_type  TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage','fixed')),
  discount_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_uses       INTEGER DEFAULT NULL,
  used_count     INTEGER NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  expires_at     TIMESTAMPTZ DEFAULT NULL,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════
-- 3) جدول طلبات الاشتراك (subscription_requests)
-- ══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.subscription_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name       TEXT NOT NULL,
  phone           TEXT NOT NULL,
  email           TEXT,
  plan_key        TEXT NOT NULL,
  plan_name       TEXT NOT NULL,
  duration_months INTEGER NOT NULL DEFAULT 1,
  original_price  NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_code   TEXT,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  final_price     NUMERIC(10,2) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','rejected')),
  admin_notes     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════
-- 4) الفهارس
-- ══════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_pkg_sort        ON public.package_settings(sort_order);
CREATE INDEX IF NOT EXISTS idx_pkg_key         ON public.package_settings(plan_key);
CREATE INDEX IF NOT EXISTS idx_dc_code         ON public.discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_dc_active       ON public.discount_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_sr_status       ON public.subscription_requests(status);
CREATE INDEX IF NOT EXISTS idx_sr_created      ON public.subscription_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_sr_phone        ON public.subscription_requests(phone);

-- ══════════════════════════════════════════════════════
-- 5) Triggers updated_at
-- ══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pkg_updated ON public.package_settings;
CREATE TRIGGER trg_pkg_updated
BEFORE UPDATE ON public.package_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_sr_updated ON public.subscription_requests;
CREATE TRIGGER trg_sr_updated
BEFORE UPDATE ON public.subscription_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ══════════════════════════════════════════════════════
-- 6) بيانات افتراضية للباقات
-- ══════════════════════════════════════════════════════
INSERT INTO public.package_settings (plan_key, name, price, duration_months, features, color, sort_order) VALUES
  ('monthly',     'باقة الشهر',    40,  1, '["إعلان واحد","3 تعديلات لكل إعلان","ظهور في نتائج البحث","تواصل مباشر مع الطلاب"]'::jsonb, 'green',  1),
  ('quarter',     'باقة 3 شهور', 100,  3, '["إعلان واحد","تعديل غير محدود","إحصائيات بسيطة","ظهور مميز في البحث","تواصل مباشر مع الطلاب"]'::jsonb, 'blue',   2),
  ('nine_months', 'باقة 9 شهور', 300,  9, '["إعلان واحد","تعديل غير محدود","إحصائيات متقدمة","دعم أسرع","ظهور مميز في البحث","تواصل مباشر مع الطلاب"]'::jsonb, 'purple', 3)
ON CONFLICT (plan_key) DO NOTHING;

-- ══════════════════════════════════════════════════════
-- 7) كود خصم تجريبي
-- ══════════════════════════════════════════════════════
INSERT INTO public.discount_codes (code, discount_type, discount_value, max_uses, notes, is_active) VALUES
  ('EARLY20', 'percentage', 20, 50, 'خصم 20% للمدرسين الأوائل', true),
  ('WELCOME10', 'fixed', 10, NULL, 'خصم 10 جنيه ترحيبي', true)
ON CONFLICT (code) DO NOTHING;

-- ══════════════════════════════════════════════════════
-- 8) RLS
-- ══════════════════════════════════════════════════════
ALTER TABLE public.package_settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_codes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_requests  ENABLE ROW LEVEL SECURITY;

-- Package Settings
DROP POLICY IF EXISTS "pkg_select_anon"  ON public.package_settings;
DROP POLICY IF EXISTS "pkg_all_auth"     ON public.package_settings;
CREATE POLICY "pkg_select_anon"  ON public.package_settings FOR SELECT TO anon USING (true);
CREATE POLICY "pkg_all_auth"     ON public.package_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Discount Codes: anon يقرأ الأكواد النشطة فقط للتحقق
DROP POLICY IF EXISTS "dc_select_anon"   ON public.discount_codes;
DROP POLICY IF EXISTS "dc_update_anon"   ON public.discount_codes;
DROP POLICY IF EXISTS "dc_all_auth"      ON public.discount_codes;
CREATE POLICY "dc_select_anon"   ON public.discount_codes FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "dc_update_anon"   ON public.discount_codes FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "dc_all_auth"      ON public.discount_codes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Subscription Requests: anon يضيف فقط
DROP POLICY IF EXISTS "sr_insert_anon"   ON public.subscription_requests;
DROP POLICY IF EXISTS "sr_all_auth"      ON public.subscription_requests;
CREATE POLICY "sr_insert_anon"   ON public.subscription_requests FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "sr_all_auth"      ON public.subscription_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ══════════════════════════════════════════════════════
-- 9) صلاحيات GRANT
-- ══════════════════════════════════════════════════════
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT                             ON public.package_settings       TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE     ON public.package_settings       TO authenticated;

GRANT SELECT, UPDATE                     ON public.discount_codes         TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE     ON public.discount_codes         TO authenticated;

GRANT INSERT                             ON public.subscription_requests  TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE     ON public.subscription_requests  TO authenticated;

-- ✅ انتهى — شغّل هذا الملف في Supabase SQL Editor
-- بعد التشغيل:
--   1) افتح join.html للتحقق من ظهور الباقات
--   2) ادخل لوحة الإدارة → إعدادات الباقات لتعديل الأسعار
--   3) أضف أكواد خصم من لوحة الإدارة → أكواد الخصم
