-- =====================================================
-- مدرسك — add_xp_reward_points.sql
-- إضافة نظام النقاط المزدوج (XP + Reward Points)
--
-- XP (xp)             : نقاط الخبرة — تحدد المستوى، لا تنقص أبداً
-- Reward Points (rp)  : نقاط المكافآت — قابلة للصرف بدون خصم XP
-- points              : legacy = نفس XP (للتوافق مع الكود القديم)
--
-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor
-- =====================================================

-- 1) إضافة الأعمدة الجديدة
ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_points INTEGER NOT NULL DEFAULT 0;

-- 2) مزامنة البيانات الحالية:
--    كل نقطة موجودة في points تصبح XP + RP
UPDATE public.teachers
SET
  xp           = COALESCE(points, 0),
  reward_points = COALESCE(points, 0)
WHERE xp = 0;  -- فقط السجلات التي لم تُهيَّأ بعد

-- 3) فهرس للأداء على XP (لوحة الشرف)
CREATE INDEX IF NOT EXISTS idx_teachers_xp ON public.teachers(xp DESC);
CREATE INDEX IF NOT EXISTS idx_teachers_rp ON public.teachers(reward_points DESC);

-- 4) منح الصلاحيات
GRANT SELECT, UPDATE ON TABLE public.teachers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.teachers TO authenticated;

-- 5) تأكيد
SELECT
  id,
  name,
  points,
  xp,
  reward_points
FROM public.teachers
ORDER BY xp DESC
LIMIT 10;

-- ✅ انتهى
-- بعد التشغيل:
-- • XP يُضاف مع كل تفاعل ولا يُخصم أبداً
-- • reward_points يُضاف مع كل تفاعل ويمكن خصمه عند استرداد مكافأة
-- • المستوى والرتبة تعتمد على XP فقط
