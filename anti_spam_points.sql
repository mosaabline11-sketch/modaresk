-- =====================================================
-- مدرسك — anti_spam_points.sql
-- حماية النقاط من جهة قاعدة البيانات (طبقة ثانية)
-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor
-- =====================================================

-- ══════════════════════════════════════════════════
-- 1) جدول تتبع التفاعلات اليومية (Rate Limit Table)
--    يحتفظ بعدد التفاعلات لكل (session × teacher × event × ad) يوميًا
-- ══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.interaction_logs (
  id            UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id    TEXT    NOT NULL,
  teacher_id    UUID    REFERENCES public.teachers(id) ON DELETE SET NULL,
  ad_id         UUID    REFERENCES public.ads(id)      ON DELETE SET NULL,
  event_type    TEXT    NOT NULL,
  event_date    DATE    NOT NULL DEFAULT CURRENT_DATE,
  event_count   INTEGER NOT NULL DEFAULT 1,
  last_event_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, teacher_id, ad_id, event_type, event_date)
);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_ilog_session   ON public.interaction_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_ilog_teacher   ON public.interaction_logs(teacher_id);
CREATE INDEX IF NOT EXISTS idx_ilog_date      ON public.interaction_logs(event_date);
CREATE INDEX IF NOT EXISTS idx_ilog_type_date ON public.interaction_logs(event_type, event_date);

-- ══════════════════════════════════════════════════
-- 2) Function: upsert_interaction_safe
--    تُرجع: نقاط منحوحة (0 لو محجوب)
--
--    القواعد المطبّقة:
--    • واتساب/فيسبوك/اتصال → أول ضغطة فقط يوميًا لكل إعلان
--    • مشاهدة كارت/تفاصيل  → أول 3 مرات يوميًا لكل إعلان
--    • Cooldown من جهة الـ DB → 30 ثانية بين أي حدثَين متتاليَين
--    • سقف النقاط اليومي     → مجموع 30 نقطة لكل مدرس يوميًا
-- ══════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.upsert_interaction_safe(
  p_session_id   TEXT,
  p_teacher_id   UUID,
  p_ad_id        UUID,
  p_event_type   TEXT,
  p_pts_value    INTEGER DEFAULT 0   -- القيمة المُرسلة من الكلايِنت
) RETURNS INTEGER    -- يُرجع 0 (محجوب) أو عدد النقاط الممنوحة
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_max_per_day  INTEGER;
  v_cooldown_sec INTEGER;
  v_today        DATE    := CURRENT_DATE;
  v_now          TIMESTAMPTZ := NOW();
  v_rec          public.interaction_logs%ROWTYPE;
  v_daily_pts    INTEGER;
BEGIN
  -- ── تعريف الحدود حسب نوع الحدث ──
  CASE p_event_type
    WHEN 'whatsapp_click'  THEN v_max_per_day := 1;  v_cooldown_sec := 90;
    WHEN 'facebook_click'  THEN v_max_per_day := 1;  v_cooldown_sec := 90;
    WHEN 'phone_click'     THEN v_max_per_day := 1;  v_cooldown_sec := 90;
    WHEN 'ad_detail_view'  THEN v_max_per_day := 3;  v_cooldown_sec := 30;
    WHEN 'ad_card_view'    THEN v_max_per_day := 3;  v_cooldown_sec := 45;
    WHEN 'site_visit'      THEN v_max_per_day := 1;  v_cooldown_sec := 3600;
    ELSE                        v_max_per_day := 5;  v_cooldown_sec := 10;
  END CASE;

  -- ── جلب السجل الحالي ──
  SELECT * INTO v_rec
  FROM public.interaction_logs
  WHERE session_id  = p_session_id
    AND teacher_id  IS NOT DISTINCT FROM p_teacher_id
    AND ad_id       IS NOT DISTINCT FROM p_ad_id
    AND event_type  = p_event_type
    AND event_date  = v_today
  FOR UPDATE;

  -- ── Cooldown: تجاوز أسرع من اللازم؟ ──
  IF v_rec.last_event_at IS NOT NULL
     AND EXTRACT(EPOCH FROM (v_now - v_rec.last_event_at)) < v_cooldown_sec THEN
    RETURN 0; -- محجوب
  END IF;

  -- ── تجاوز الحد اليومي لهذا النوع؟ ──
  IF v_rec.event_count IS NOT NULL AND v_rec.event_count >= v_max_per_day THEN
    -- حدّث الوقت فقط (بدون نقاط)
    UPDATE public.interaction_logs
    SET last_event_at = v_now
    WHERE session_id = p_session_id
      AND teacher_id IS NOT DISTINCT FROM p_teacher_id
      AND ad_id      IS NOT DISTINCT FROM p_ad_id
      AND event_type = p_event_type
      AND event_date = v_today;
    RETURN 0;
  END IF;

  -- ── فحص السقف اليومي للنقاط (30 نقطة لكل مدرس) ──
  IF p_teacher_id IS NOT NULL THEN
    SELECT COALESCE(SUM(
      CASE event_type
        WHEN 'whatsapp_click'  THEN 4 * event_count
        WHEN 'facebook_click'  THEN 3 * event_count
        WHEN 'phone_click'     THEN 5 * event_count
        WHEN 'ad_detail_view'  THEN 2 * event_count
        WHEN 'ad_card_view'    THEN 1 * event_count
        ELSE 0
      END
    ), 0)
    INTO v_daily_pts
    FROM public.interaction_logs
    WHERE teacher_id = p_teacher_id
      AND event_date = v_today;

    IF v_daily_pts >= 30 THEN
      RETURN 0; -- وصل للسقف اليومي
    END IF;
  END IF;

  -- ── كل الفحوصات اجتازها → سجّل وامنح النقاط ──
  INSERT INTO public.interaction_logs
    (session_id, teacher_id, ad_id, event_type, event_date, event_count, last_event_at)
  VALUES
    (p_session_id, p_teacher_id, p_ad_id, p_event_type, v_today, 1, v_now)
  ON CONFLICT (session_id, teacher_id, ad_id, event_type, event_date)
  DO UPDATE SET
    event_count   = public.interaction_logs.event_count + 1,
    last_event_at = v_now;

  RETURN GREATEST(p_pts_value, 0); -- أعد النقاط المطلوبة

END;
$$;

-- ══════════════════════════════════════════════════
-- 3) Function: تنظيف السجلات القديمة (تشغيل يومي)
-- ══════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.cleanup_old_interaction_logs()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM public.interaction_logs
  WHERE event_date < CURRENT_DATE - INTERVAL '7 days';
END;
$$;

-- ══════════════════════════════════════════════════
-- 4) RLS على الجدول الجديد
-- ══════════════════════════════════════════════════
ALTER TABLE public.interaction_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ilog_insert_anon"  ON public.interaction_logs;
DROP POLICY IF EXISTS "ilog_select_auth"  ON public.interaction_logs;
DROP POLICY IF EXISTS "ilog_all_auth"     ON public.interaction_logs;

-- anon يستطيع INSERT فقط (عبر trackEvent)
CREATE POLICY "ilog_insert_anon"
ON public.interaction_logs FOR INSERT TO anon
WITH CHECK (true);

-- authenticated (الإدارة) كل الصلاحيات
CREATE POLICY "ilog_all_auth"
ON public.interaction_logs FOR ALL TO authenticated
USING (true) WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT ON TABLE public.interaction_logs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.interaction_logs TO authenticated;

-- الإذن بتشغيل الـ function
GRANT EXECUTE ON FUNCTION public.upsert_interaction_safe TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_interaction_logs TO authenticated;

-- ══════════════════════════════════════════════════
-- 5) بيانات تجريبية للاختبار (اختياري — احذفها بعد التحقق)
-- ══════════════════════════════════════════════════
-- SELECT public.upsert_interaction_safe('test-session', NULL, NULL, 'site_visit', 0);

-- ✅ انتهى — شغّل هذا الملف مرة واحدة في Supabase SQL Editor
