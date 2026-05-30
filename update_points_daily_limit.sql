-- =====================================================
-- مدرسك — update_points_daily_limit.sql
-- تحديث حد النقاط اليومي من 30 إلى 100 في قاعدة البيانات
-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor
-- =====================================================

-- تحديث الحد الأقصى اليومي داخل Function upsert_interaction_safe
CREATE OR REPLACE FUNCTION public.upsert_interaction_safe(
  p_session_id   TEXT,
  p_teacher_id   UUID,
  p_ad_id        UUID,
  p_event_type   TEXT,
  p_pts_value    INTEGER DEFAULT 0
) RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_max_per_day  INTEGER;
  v_cooldown_sec INTEGER;
  v_today        DATE    := CURRENT_DATE;
  v_now          TIMESTAMPTZ := NOW();
  v_rec          public.interaction_logs%ROWTYPE;
  v_daily_pts    INTEGER;
BEGIN
  CASE p_event_type
    WHEN 'whatsapp_click'  THEN v_max_per_day := 1;  v_cooldown_sec := 90;
    WHEN 'facebook_click'  THEN v_max_per_day := 1;  v_cooldown_sec := 90;
    WHEN 'phone_click'     THEN v_max_per_day := 1;  v_cooldown_sec := 90;
    WHEN 'ad_detail_view'  THEN v_max_per_day := 3;  v_cooldown_sec := 30;
    WHEN 'ad_card_view'    THEN v_max_per_day := 3;  v_cooldown_sec := 45;
    WHEN 'site_visit'      THEN v_max_per_day := 1;  v_cooldown_sec := 3600;
    ELSE                        v_max_per_day := 5;  v_cooldown_sec := 10;
  END CASE;

  SELECT * INTO v_rec
  FROM public.interaction_logs
  WHERE session_id  = p_session_id
    AND teacher_id  IS NOT DISTINCT FROM p_teacher_id
    AND ad_id       IS NOT DISTINCT FROM p_ad_id
    AND event_type  = p_event_type
    AND event_date  = v_today
  FOR UPDATE;

  IF v_rec.last_event_at IS NOT NULL
     AND EXTRACT(EPOCH FROM (v_now - v_rec.last_event_at)) < v_cooldown_sec THEN
    RETURN 0;
  END IF;

  IF v_rec.event_count IS NOT NULL AND v_rec.event_count >= v_max_per_day THEN
    UPDATE public.interaction_logs
    SET last_event_at = v_now
    WHERE session_id = p_session_id
      AND teacher_id IS NOT DISTINCT FROM p_teacher_id
      AND ad_id      IS NOT DISTINCT FROM p_ad_id
      AND event_type = p_event_type
      AND event_date = v_today;
    RETURN 0;
  END IF;

  -- ── الحد الأقصى اليومي للنقاط: 100 نقطة ──
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

    IF v_daily_pts >= 100 THEN
      RETURN 0; -- وصل للسقف اليومي (100 نقطة)
    END IF;
  END IF;

  INSERT INTO public.interaction_logs
    (session_id, teacher_id, ad_id, event_type, event_date, event_count, last_event_at)
  VALUES
    (p_session_id, p_teacher_id, p_ad_id, p_event_type, v_today, 1, v_now)
  ON CONFLICT (session_id, teacher_id, ad_id, event_type, event_date)
  DO UPDATE SET
    event_count   = public.interaction_logs.event_count + 1,
    last_event_at = v_now;

  RETURN GREATEST(p_pts_value, 0);
END;
$$;

-- ✅ تم تحديث الحد الأقصى اليومي للنقاط إلى 100 نقطة
