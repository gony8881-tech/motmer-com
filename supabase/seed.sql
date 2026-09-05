-- ============================================================================
-- Seed Data (اختياري) — بيانات تجريبية فقط، لا تُشغَّل تلقائيًا مع الـ migrations
-- شغّلها يدويًا فقط في بيئة تطوير: supabase db execute -f supabase/seed.sql
-- ============================================================================
insert into public.conferences (
  title, slug, description, organizer_name, location,
  start_date, end_date, submission_start, submission_end,
  status, scientific_fields, submission_conditions, contact_email
) values (
  '[TEST DATA] المؤتمر السوداني للذكاء الاصطناعي 2026',
  'sudan-ai-conference-2026-test',
  'مؤتمر تجريبي لأغراض الاختبار فقط أثناء التطوير.',
  'جمعية الذكاء الاصطناعي السودانية',
  'الخرطوم، السودان',
  '2026-11-01', '2026-11-03',
  '2026-09-01', '2026-10-15',
  'OPEN',
  array['الذكاء الاصطناعي', 'علوم الحاسوب', 'أمن المعلومات'],
  'يجب أن يكون البحث أصيلًا وغير منشور سابقًا.',
  'contact@example.com'
)
on conflict (slug) do nothing;
