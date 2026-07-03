-- =====================================================
-- مدرسك — refund_requests_setup.sql
-- نظام طلبات الاسترجاع والتعويض
-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ══════════════════════════════════════════════════════
-- 1) جدول طلبات الاسترجاع (refund_requests)
-- ══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.refund_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name       TEXT NOT NULL,
  email           TEXT,
  phone           TEXT NOT NULL,
  order_ref       TEXT,                 -- رقم الطلب أو رقم الاشتراك
  reason          TEXT NOT NULL,        -- سبب طلب الاسترجاع (تصنيف)
  description     TEXT NOT NULL,        -- وصف تفصيلي للمشكلة
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','compensated','refunded','rejected')),
  admin_notes     TEXT,                 -- ملاحظات الإدارة / سبب الرفض
  compensation    TEXT,                 -- وصف التعويض المقدَّم إن وُجد
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════
-- 2) الفهارس
-- ══════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_refund_status     ON public.refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refund_created    ON public.refund_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_refund_phone      ON public.refund_requests(phone);

-- ══════════════════════════════════════════════════════
-- 3) Trigger تحديث updated_at
-- ══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_refund_updated ON public.refund_requests;
CREATE TRIGGER trg_refund_updated
BEFORE UPDATE ON public.refund_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ══════════════════════════════════════════════════════
-- 4) RLS
-- ══════════════════════════════════════════════════════
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "refund_insert_anon" ON public.refund_requests;
DROP POLICY IF EXISTS "refund_all_auth"    ON public.refund_requests;

-- أي زائر يستطيع إرسال طلب استرجاع (بدون تسجيل دخول)
CREATE POLICY "refund_insert_anon"
ON public.refund_requests FOR INSERT TO anon
WITH CHECK (true);

-- الإدارة فقط تقرأ وتعدّل وتحذف الطلبات
CREATE POLICY "refund_all_auth"
ON public.refund_requests FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- ══════════════════════════════════════════════════════
-- 5) صلاحيات GRANT
-- ══════════════════════════════════════════════════════
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT INSERT                          ON public.refund_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE  ON public.refund_requests TO authenticated;

-- ✅ انتهى — شغّل هذا الملف في Supabase SQL Editor
-- بعد التشغيل:
--   1) افتح refund-request.html للتحقق من عمل النموذج
--   2) ادخل لوحة الإدارة → طلبات الاسترجاع لمتابعة الطلبات
