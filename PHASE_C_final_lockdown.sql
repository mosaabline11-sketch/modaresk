-- ═══════════════════════════════════════════════════════════════════════════
--  مرحلة C — الإغلاق الأمني النهائي لمنصة مدرسك
-- ═══════════════════════════════════════════════════════════════════════════
--  ⚠️  تحذير مهم: لا تُنفّذ هذا الملف إلا بعد رفع كل ملفات الفرونت الجديدة على
--      Hostinger والتأكد من أن الموقع يعمل (تسجيل دخول، حفظ الملف الشخصي،
--      إضافة/تعديل/حذف إعلان، صفحة المكافآت).
--
--      السبب: هذه الأوامر تزيل مسارات الكتابة/القراءة المباشرة القديمة التي
--      يعتمد عليها الفرونت *القديم*. تنفيذها قبل رفع الفرونت الجديد سيؤدي إلى
--      تعطّل حفظ الملف الشخصي وإدارة الإعلانات لكل المدرّسين على الموقع الحيّ.
--
--  ملاحظة: المدرّسون الذين سجّلوا دخولهم قبل رفع الفرونت الجديد لن يكون لديهم
--          رمز جلسة (token)، فتظهر لهم رسالة "انتهت الجلسة" ويُطلب منهم تسجيل
--          الدخول مرة واحدة. هذا سلوك مقصود ومعالَج بلطف في الفرونت.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── (W1) تعديل بيانات المدرّس ──────────────────────────────────────────────
-- إزالة سياسة تسمح لأي anon بتعديل بيانات أي مدرّس نشِط.
-- البديل المُفعّل: update_teacher_profile(token, ...) — يشتق هوية المدرّس من الجلسة.
DROP POLICY IF EXISTS anon_update_own_profile_fields ON public.teachers;

-- ── (S1) إدراج/تعديل/حذف الإعلانات ─────────────────────────────────────────
-- إزالة سياسات تسمح لأي anon بالكتابة على أي إعلان.
-- البديل المُفعّل: create_ad / update_ad / delete_ad (token, ...) — مقيّدة بالملكية.
DROP POLICY IF EXISTS ads_insert_anon_pending_only ON public.ads;
DROP POLICY IF EXISTS ads_update_anon_own_rows     ON public.ads;
DROP POLICY IF EXISTS ads_delete_anon_own_rows     ON public.ads;

-- ── (S3) قراءة كل الإعلانات (تسريب المعلّقة/المرفوضة للغير) ─────────────────
-- البديل المُفعّل: get_my_ads(token) للوحة التحكم، و get_ad_owned(token, ad_id) للمعاينة.
-- تبقى القراءة العامة للإعلانات النشطة عبر public_read_active_ads (سليمة).
DROP POLICY IF EXISTS anon_read_all_ads_for_dashboard ON public.ads;

-- ── (S7) قراءة كل مطالبات المكافآت ─────────────────────────────────────────
-- البديل المُفعّل: get_my_reward_claims(token).
DROP POLICY IF EXISTS trc_select_anon ON public.teacher_reward_claims;

-- ── (S2) إبطال الدوال القديمة التي تأخذ teacher_id من العميل (IDOR) ────────
-- نُبقي صلاحية service_role (للاستخدام الخادمي/Edge Functions إن وُجد)،
-- ونمنع anon/authenticated/public من ندائها مباشرة.
-- البدائل المُفعّلة: claim_teacher_reward_secure(token,...)، والبونص مدمج داخل
-- create_ad، ودفع الإضافات عبر Edge Function (create-addon-payment-intention).
GRANT EXECUTE ON FUNCTION public.create_addon_payment_request(uuid, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.claim_teacher_reward(uuid, text)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.claim_first_ad_bonus(uuid, integer, boolean, integer)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_addon_payment_request(uuid, text)
  FROM PUBLIC, anon, authenticated;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
--  للتحقق بعد التنفيذ (شغّلها منفصلة):
--    SELECT tablename, policyname, cmd FROM pg_policies
--    WHERE schemaname='public' AND tablename IN ('teachers','ads','teacher_reward_claims')
--    ORDER BY tablename, cmd;
--  المفروض تختفي السياسات المذكورة أعلاه وتبقى فقط:
--    teachers: admin_all_teachers, public_read_active_teachers_safe
--    ads:      admin_all_ads, public_read_active_ads
--    teacher_reward_claims: admin_all_teacher_reward_claims
-- ═══════════════════════════════════════════════════════════════════════════
