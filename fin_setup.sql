-- =====================================================
-- مدرسك — fin_setup.sql
-- جداول لوحة الإدارة المالية (financial-dashboard.html)
-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1) اشتراكات المالية ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.fin_subscriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id      UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  teacher_name    TEXT NOT NULL,
  phone           TEXT,
  subject         TEXT,
  grade           TEXT,
  plan_type       TEXT NOT NULL DEFAULT 'monthly',   -- monthly | 3months | 9months | custom
  price           NUMERIC(10,2) NOT NULL DEFAULT 0,
  addons_price    NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_price     NUMERIC(10,2) GENERATED ALWAYS AS (price + addons_price) STORED,
  addons          JSONB NOT NULL DEFAULT '[]'::jsonb,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  client_type     TEXT NOT NULL DEFAULT 'new',        -- new | renewed | potential | overdue
  client_source   TEXT NOT NULL DEFAULT 'other',      -- facebook | whatsapp | referral | ad | mosque | other
  payment_method  TEXT NOT NULL DEFAULT 'cash',       -- vodafone_cash | instapay | bank_transfer | cash | other
  payment_status  TEXT NOT NULL DEFAULT 'paid',       -- paid | pending | overdue
  payment_ref     TEXT,
  ads_allowed     INTEGER NOT NULL DEFAULT 1,
  renewal_count   INTEGER NOT NULL DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2) المصروفات ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fin_expenses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  expense_type  TEXT NOT NULL DEFAULT 'other',       -- domain | hosting | ads | design | whatsapp | tools | other
  amount        NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3) العملاء المحتملون ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.fin_leads (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  phone         TEXT,
  subject       TEXT,
  grade         TEXT,
  source        TEXT NOT NULL DEFAULT 'other',       -- facebook | whatsapp | referral | ad | mosque | other
  status        TEXT NOT NULL DEFAULT 'new',         -- new | contacted | interested | not_interested | subscribed
  last_contact  DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4) التقييم الشهري ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fin_monthly_reviews (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year_month         TEXT UNIQUE NOT NULL,  -- مثال: 2026-05
  rating             INTEGER CHECK (rating BETWEEN 1 AND 5),
  revenue_goal       NUMERIC(10,2) DEFAULT 0,
  revenue_actual     NUMERIC(10,2) DEFAULT 0,
  new_clients_goal   INTEGER DEFAULT 0,
  new_clients_actual INTEGER DEFAULT 0,
  achievements       TEXT,
  challenges         TEXT,
  next_goals         TEXT,
  general_notes      TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ── الفهارس ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_fin_subs_teacher    ON public.fin_subscriptions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_fin_subs_created    ON public.fin_subscriptions(created_at);
CREATE INDEX IF NOT EXISTS idx_fin_subs_end        ON public.fin_subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_fin_subs_pay        ON public.fin_subscriptions(payment_status);
CREATE INDEX IF NOT EXISTS idx_fin_exp_date        ON public.fin_expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_fin_leads_status    ON public.fin_leads(status);
CREATE INDEX IF NOT EXISTS idx_fin_review_month    ON public.fin_monthly_reviews(year_month);

-- ── Triggers updated_at ───────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fin_subs_updated  ON public.fin_subscriptions;
CREATE TRIGGER trg_fin_subs_updated
BEFORE UPDATE ON public.fin_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_fin_leads_updated ON public.fin_leads;
CREATE TRIGGER trg_fin_leads_updated
BEFORE UPDATE ON public.fin_leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_fin_review_updated ON public.fin_monthly_reviews;
CREATE TRIGGER trg_fin_review_updated
BEFORE UPDATE ON public.fin_monthly_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── RLS ───────────────────────────────────────────────
ALTER TABLE public.fin_subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_expenses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_leads          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_monthly_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fin_subs_all"    ON public.fin_subscriptions;
DROP POLICY IF EXISTS "fin_exp_all"     ON public.fin_expenses;
DROP POLICY IF EXISTS "fin_leads_all"   ON public.fin_leads;
DROP POLICY IF EXISTS "fin_review_all"  ON public.fin_monthly_reviews;

CREATE POLICY "fin_subs_all"
ON public.fin_subscriptions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "fin_exp_all"
ON public.fin_expenses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "fin_leads_all"
ON public.fin_leads FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "fin_review_all"
ON public.fin_monthly_reviews FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ── الصلاحيات ─────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.fin_subscriptions  TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.fin_expenses        TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.fin_leads           TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.fin_monthly_reviews TO anon, authenticated;

-- ✅ انتهى — شغّل هذا الملف مرة واحدة في Supabase SQL Editor
