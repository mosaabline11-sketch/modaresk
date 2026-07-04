-- =====================================================
-- مدرسك — announcements_surveys_setup.sql
-- نظام الرسائل الهامة (Announcements) + الاستطلاعات (Surveys)
-- ✅ تم تطبيق هذا الملف بالفعل على قاعدة البيانات الحالية عبر Supabase MCP
-- محفوظ هنا للمرجعية وإعادة الإنشاء في بيئة جديدة عند الحاجة
-- =====================================================

-- ══════════════════════════════════════════════════
-- 1) جدول الرسائل الهامة (announcements)
-- ══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.announcements (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title          TEXT NOT NULL,
  message        TEXT NOT NULL,
  type           TEXT NOT NULL DEFAULT 'normal' CHECK (type IN ('normal','urgent')), -- normal=بانر, urgent=popup
  is_active      BOOLEAN NOT NULL DEFAULT true,
  start_date     TIMESTAMPTZ DEFAULT NOW(),
  end_date       TIMESTAMPTZ,                 -- NULL = بدون تاريخ انتهاء
  max_views      INTEGER,                     -- عدد مرات الظهور المسموحة لكل مدرس. NULL = غير محدود
  target         TEXT NOT NULL DEFAULT 'all' CHECK (target IN ('all','teachers')),
  link_url       TEXT,
  link_label     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_dates   ON public.announcements(start_date, end_date);

CREATE TABLE IF NOT EXISTS public.announcement_views (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_id  UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  teacher_id       UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  view_count       INTEGER NOT NULL DEFAULT 0,
  dismissed        BOOLEAN NOT NULL DEFAULT false,
  last_viewed_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (announcement_id, teacher_id)
);

CREATE INDEX IF NOT EXISTS idx_ann_views_teacher ON public.announcement_views(teacher_id);

-- ══════════════════════════════════════════════════
-- 2) جدول الاستطلاعات (surveys)
-- ══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.surveys (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title               TEXT NOT NULL,
  description         TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  show_star_rating    BOOLEAN NOT NULL DEFAULT true,
  trigger_days_after_subscription INTEGER NOT NULL DEFAULT 7,
  questions           JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{id, text, type: 'choice'|'text', options:[...]}]
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_surveys_active ON public.surveys(is_active);

CREATE TABLE IF NOT EXISTS public.survey_responses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id     UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  teacher_id    UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  star_rating   INTEGER CHECK (star_rating BETWEEN 1 AND 5),
  answers       JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{question_id, answer}]
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (survey_id, teacher_id)
);

CREATE INDEX IF NOT EXISTS idx_survey_resp_survey  ON public.survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_resp_teacher ON public.survey_responses(teacher_id);

CREATE TABLE IF NOT EXISTS public.survey_dismissals (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id     UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  teacher_id    UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  dismissed_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (survey_id, teacher_id)
);

-- ══════════════════════════════════════════════════
-- 3) Triggers updated_at
-- ══════════════════════════════════════════════════
DROP TRIGGER IF EXISTS trg_announcements_updated ON public.announcements;
CREATE TRIGGER trg_announcements_updated
BEFORE UPDATE ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_surveys_updated ON public.surveys;
CREATE TRIGGER trg_surveys_updated
BEFORE UPDATE ON public.surveys
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ══════════════════════════════════════════════════
-- 4) RLS
-- ══════════════════════════════════════════════════
ALTER TABLE public.announcements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_views  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveys             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_dismissals   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ann_select_anon" ON public.announcements;
DROP POLICY IF EXISTS "ann_all_auth"    ON public.announcements;
CREATE POLICY "ann_select_anon" ON public.announcements FOR SELECT TO anon USING (true);
CREATE POLICY "ann_all_auth"    ON public.announcements FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "ann_views_select_anon" ON public.announcement_views;
DROP POLICY IF EXISTS "ann_views_insert_anon" ON public.announcement_views;
DROP POLICY IF EXISTS "ann_views_update_anon" ON public.announcement_views;
DROP POLICY IF EXISTS "ann_views_all_auth"    ON public.announcement_views;
CREATE POLICY "ann_views_select_anon" ON public.announcement_views FOR SELECT TO anon USING (true);
CREATE POLICY "ann_views_insert_anon" ON public.announcement_views FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "ann_views_update_anon" ON public.announcement_views FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "ann_views_all_auth"    ON public.announcement_views FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "surveys_select_anon" ON public.surveys;
DROP POLICY IF EXISTS "surveys_all_auth"    ON public.surveys;
CREATE POLICY "surveys_select_anon" ON public.surveys FOR SELECT TO anon USING (true);
CREATE POLICY "surveys_all_auth"    ON public.surveys FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "survey_resp_insert_anon" ON public.survey_responses;
DROP POLICY IF EXISTS "survey_resp_select_anon" ON public.survey_responses;
DROP POLICY IF EXISTS "survey_resp_all_auth"    ON public.survey_responses;
CREATE POLICY "survey_resp_insert_anon" ON public.survey_responses FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "survey_resp_select_anon" ON public.survey_responses FOR SELECT TO anon USING (true);
CREATE POLICY "survey_resp_all_auth"    ON public.survey_responses FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "survey_dism_select_anon" ON public.survey_dismissals;
DROP POLICY IF EXISTS "survey_dism_insert_anon" ON public.survey_dismissals;
DROP POLICY IF EXISTS "survey_dism_all_auth"    ON public.survey_dismissals;
CREATE POLICY "survey_dism_select_anon" ON public.survey_dismissals FOR SELECT TO anon USING (true);
CREATE POLICY "survey_dism_insert_anon" ON public.survey_dismissals FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "survey_dism_all_auth"    ON public.survey_dismissals FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ══════════════════════════════════════════════════
-- 5) GRANT
-- ══════════════════════════════════════════════════
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT                          ON public.announcements       TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE  ON public.announcements       TO authenticated;

GRANT SELECT, INSERT, UPDATE          ON public.announcement_views  TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE  ON public.announcement_views  TO authenticated;

GRANT SELECT                          ON public.surveys             TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE  ON public.surveys             TO authenticated;

GRANT SELECT, INSERT                  ON public.survey_responses    TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE  ON public.survey_responses    TO authenticated;

GRANT SELECT, INSERT                  ON public.survey_dismissals   TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE  ON public.survey_dismissals   TO authenticated;

-- ✅ انتهى
