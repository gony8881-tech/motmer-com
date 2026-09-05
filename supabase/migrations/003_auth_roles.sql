-- ============================================================================
-- Migration: 003_auth_roles
-- المرحلة الرابعة: Authentication + Roles + Authorization + RLS
-- تعتمد على 001_initial_schema.sql و 002_submission_schema.sql ولا تحذف بياناتهما.
-- ============================================================================

-- --------------------------------------------------------------------------
-- Table: profiles (ملف تعريف كل مستخدم Supabase Auth + دوره في النظام)
-- --------------------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  full_name       text not null default '',
  email           text not null,
  role            text not null default 'RESEARCHER',
  -- مجهّز لمرحلة قادمة (تعدد الجهات/المنظمات) — لا يوجد جدول organizations بعد لذلك بلا FK حاليًا.
  organization_id uuid,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint profiles_role_check check (role in ('ADMIN', 'RESEARCHER', 'REVIEWER'))
);

create index if not exists profiles_role_idx on public.profiles (role);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- إنشاء Profile تلقائيًا عند تسجيل مستخدم جديد في auth.users.
-- الدور دائمًا RESEARCHER افتراضيًا — لا يمكن لأي مستخدم اختيار ADMIN/REVIEWER
-- عبر التسجيل الذاتي؛ الترقية إلى هذين الدورين تتم فقط يدويًا من قبل Admin
-- (عبر SQL Editor في Supabase Dashboard، انظر README لطريقة إنشاء أول Admin).
-- --------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    'RESEARCHER'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user();

-- --------------------------------------------------------------------------
-- Helper functions لاستخدامها داخل RLS — SECURITY DEFINER + search_path ثابت
-- لمنع privilege escalation ولتفادي أي recursion مع سياسات RLS على profiles
-- نفسها (الدالة تتجاوز RLS أثناء قراءتها الداخلية لأنها SECURITY DEFINER
-- ومملوكة لنفس الدور المالك للجدول، دون الحاجة لأي سياسة SELECT إضافية).
-- --------------------------------------------------------------------------
create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.get_my_role() = 'ADMIN', false);
$$;

create or replace function public.is_researcher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.get_my_role() = 'RESEARCHER', false);
$$;

create or replace function public.is_reviewer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.get_my_role() = 'REVIEWER', false);
$$;

grant execute on function public.get_my_role() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_researcher() to anon, authenticated;
grant execute on function public.is_reviewer() to anon, authenticated;

-- --------------------------------------------------------------------------
-- Trigger: منع أي مستخدم غير Admin من تغيير role أو is_active لنفسه، حتى لو
-- كانت سياسة RLS للـ UPDATE تسمح له بتعديل صفّه الشخصي (لتحديث full_name مثلًا).
-- هذا يمنع "User لا يستطيع تغيير Role نفسه" و"لا يستطيع جعل نفسه Admin" حتى
-- عبر استدعاء PATCH مباشر من anon key.
-- --------------------------------------------------------------------------
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.is_active := old.is_active;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_prevent_self_escalation on public.profiles;
create trigger trg_profiles_prevent_self_escalation
  before update on public.profiles
  for each row
  execute function public.prevent_role_self_escalation();

-- --------------------------------------------------------------------------
-- RLS: profiles
-- --------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "select_own_profile_or_admin"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

-- لا سياسة INSERT للعميل عمدًا: الإنشاء الوحيد المسموح هو عبر trigger
-- on_auth_user_created (SECURITY DEFINER) — يمنع إنشاء Profile بأي Role مباشرة.
create policy "update_own_profile_or_admin"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- --------------------------------------------------------------------------
-- Table: researchers — ربط بحساب Auth الحقيقي (Phase 3 → Phase 4)
-- user_id قابل لأن يكون NULL عمدًا للحفاظ على سجلات Phase 3 القديمة (تقديم
-- كان يتم بدون تسجيل دخول). لا تُحذف أو تُخترع بيانات لهذه السجلات القديمة؛
-- ربطها بمستخدم لاحقًا (إن رغب صاحبها) يتم يدويًا من طرف Admin.
-- --------------------------------------------------------------------------
alter table public.researchers
  add column if not exists user_id uuid unique references auth.users (id) on delete set null;

create index if not exists researchers_user_id_idx on public.researchers (user_id);

-- --------------------------------------------------------------------------
-- RLS: conferences — إغلاق السياسات المؤقتة من 001_initial_schema.sql
-- --------------------------------------------------------------------------
drop policy if exists "temp_dev_select_all_conferences" on public.conferences;
drop policy if exists "temp_dev_insert_conferences" on public.conferences;
drop policy if exists "temp_dev_update_conferences" on public.conferences;
drop policy if exists "temp_dev_delete_conferences" on public.conferences;

-- القراءة العامة: أي زائر (مسجل أو لا) يرى المؤتمرات غير الـ DRAFT فقط.
-- Admin يرى كل شيء بما فيها DRAFT (للإدارة).
create policy "select_conferences_public_or_admin"
  on public.conferences for select
  to anon, authenticated
  using (status <> 'DRAFT' or public.is_admin());

create policy "admin_insert_conferences"
  on public.conferences for insert
  to authenticated
  with check (public.is_admin());

create policy "admin_update_conferences"
  on public.conferences for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admin_delete_conferences"
  on public.conferences for delete
  to authenticated
  using (public.is_admin());

-- --------------------------------------------------------------------------
-- RLS: researchers — إغلاق السياسات المؤقتة من 002_submission_schema.sql
-- --------------------------------------------------------------------------
drop policy if exists "temp_dev_select_researchers" on public.researchers;

create policy "select_own_researcher_or_admin"
  on public.researchers for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- الباحث يستطيع تحديث بيانات ملفه الشخصي فقط، ولا يستطيع تغيير ملكية السجل
-- (with check يمنع تغيير user_id إلى مستخدم آخر). الإنشاء يبقى فقط عبر
-- public.submit_paper (SECURITY DEFINER) لضمان عدم تكرار سجل الباحث بالبريد.
create policy "update_own_researcher_or_admin"
  on public.researchers for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "admin_delete_researchers"
  on public.researchers for delete
  to authenticated
  using (public.is_admin());

-- --------------------------------------------------------------------------
-- RLS: papers — إغلاق السياسات المؤقتة من 002_submission_schema.sql
-- --------------------------------------------------------------------------
drop policy if exists "temp_dev_select_papers" on public.papers;

-- الباحث يرى فقط الأبحاث المرتبطة بسجل الباحث الخاص به (عبر user_id).
-- Reviewer لا يحصل على أي وصول عام في هذه المرحلة (سيُضاف في Phase 5 عند
-- بناء علاقة reviewer ↔ paper الفعلية). Admin يرى كل شيء.
create policy "select_own_papers_or_admin"
  on public.papers for select
  to authenticated
  using (
    public.is_admin()
    or researcher_id in (select id from public.researchers where user_id = auth.uid())
  );

-- لا سياسة INSERT/UPDATE للباحث عمدًا: لا يستطيع الباحث تغيير status أو
-- researcher_id أو أي بيانات عبر تحديث مباشر. الإنشاء فقط عبر submit_paper.
create policy "admin_update_papers"
  on public.papers for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admin_delete_papers"
  on public.papers for delete
  to authenticated
  using (public.is_admin());

-- --------------------------------------------------------------------------
-- RLS: paper_versions — إغلاق السياسات المؤقتة من 002_submission_schema.sql
-- --------------------------------------------------------------------------
drop policy if exists "temp_dev_select_paper_versions" on public.paper_versions;

create policy "select_own_paper_versions_or_admin"
  on public.paper_versions for select
  to authenticated
  using (
    public.is_admin()
    or paper_id in (
      select p.id
      from public.papers p
      join public.researchers r on r.id = p.researcher_id
      where r.user_id = auth.uid()
    )
  );

create policy "admin_delete_paper_versions"
  on public.paper_versions for delete
  to authenticated
  using (public.is_admin());

-- --------------------------------------------------------------------------
-- RPC: submit_paper — تحديث لإلزام تسجيل الدخول وربط الباحث بـ auth.uid()
-- بدل الاعتماد على البريد الإلكتروني القادم من العميل فقط (Phase 3 كانت تسمح
-- بتقديم مجهول). البريد الإلكتروني المخزَّن للباحث يُؤخذ من حساب Auth الحقيقي
-- (auth.users) وليس من الحمولة القادمة من العميل، لمنع انتحال هوية باحث آخر.
-- --------------------------------------------------------------------------
create or replace function public.submit_paper(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conference          public.conferences%rowtype;
  v_uid                  uuid := auth.uid();
  v_auth_email           text;
  v_researcher_id        uuid;
  v_paper_id             uuid;
  v_paper_number         text;
  v_seq                  bigint;
  v_full_name            text := btrim(coalesce(payload->>'full_name', ''));
  v_phone                text := nullif(btrim(coalesce(payload->>'phone', '')), '');
  v_organization         text := nullif(btrim(coalesce(payload->>'organization', '')), '');
  v_country              text := nullif(btrim(coalesce(payload->>'country', '')), '');
  v_academic_degree      text := nullif(btrim(coalesce(payload->>'academic_degree', '')), '');
  v_specialization       text := nullif(btrim(coalesce(payload->>'specialization', '')), '');
  v_title                text := btrim(coalesce(payload->>'title', ''));
  v_abstract             text := btrim(coalesce(payload->>'abstract', ''));
  v_scientific_field     text := btrim(coalesce(payload->>'scientific_field', ''));
  v_keywords             text[];
  v_file_path            text := btrim(coalesce(payload->>'file_path', ''));
  v_file_name            text := btrim(coalesce(payload->>'file_name', ''));
  v_file_type            text := btrim(coalesce(payload->>'file_type', ''));
  v_file_size            bigint := coalesce((payload->>'file_size')::bigint, 0);
  v_conference_id        uuid;
begin
  -- 0) يجب تسجيل الدخول لتقديم بحث (Phase 4) ----------------------------------
  if v_uid is null then
    raise exception 'يجب تسجيل الدخول لتقديم البحث.';
  end if;

  select email into v_auth_email from auth.users where id = v_uid;
  if v_auth_email is null then
    raise exception 'تعذّر التحقق من حساب المستخدم.';
  end if;

  -- 1) المؤتمر موجود ويسمح بالتقديم -----------------------------------------
  begin
    v_conference_id := (payload->>'conference_id')::uuid;
  exception when others then
    raise exception 'بيانات المؤتمر غير صالحة.';
  end;

  select * into v_conference from public.conferences where id = v_conference_id;
  if not found then
    raise exception 'المؤتمر غير موجود.';
  end if;

  if v_conference.status = 'DRAFT' then
    raise exception 'هذا المؤتمر غير متاح للتقديم حاليًا.';
  end if;

  if current_date < v_conference.submission_start then
    raise exception 'لم يبدأ استقبال الأبحاث بعد.';
  end if;

  if current_date > v_conference.submission_end or v_conference.status = 'CLOSED' then
    raise exception 'انتهت فترة استقبال الأبحاث.';
  end if;

  -- 2) بيانات الباحث ----------------------------------------------------------
  if v_full_name = '' then
    raise exception 'بيانات الباحث غير مكتملة.';
  end if;

  -- 3) بيانات البحث ------------------------------------------------------------
  if v_title = '' or v_abstract = '' or v_scientific_field = '' then
    raise exception 'بيانات البحث غير مكتملة.';
  end if;

  if not (v_scientific_field = any (v_conference.scientific_fields)) then
    raise exception 'المجال العلمي غير صالح لهذا المؤتمر.';
  end if;

  select coalesce(array_agg(value order by ordinality), '{}')
    into v_keywords
    from jsonb_array_elements_text(coalesce(payload->'keywords', '[]'::jsonb)) with ordinality as t(value, ordinality);

  -- 4) بيانات الملف --------------------------------------------------------
  if v_file_path = '' or v_file_name = '' or v_file_type = '' or v_file_size <= 0 then
    raise exception 'ملف البحث مطلوب.';
  end if;

  if v_file_size > 10485760 then
    raise exception 'حجم الملف أكبر من الحد المسموح (10 ميجابايت).';
  end if;

  if lower(v_file_name) !~ '\.(pdf|doc|docx)$' then
    raise exception 'نوع الملف غير مدعوم. يرجى رفع ملف PDF أو Word.';
  end if;

  -- 5) العثور على سجل الباحث المرتبط بهذا المستخدم أو إنشاؤه ------------------
  -- الربط عبر user_id فقط (وليس البريد) لمنع أي التباس مع سجلات Phase 3
  -- المجهولة القديمة التي قد تحمل نفس البريد لشخص مختلف.
  select id into v_researcher_id from public.researchers where user_id = v_uid;

  if v_researcher_id is null then
    insert into public.researchers (
      full_name, email, phone, organization, country, academic_degree, specialization, user_id
    ) values (
      v_full_name, v_auth_email, v_phone, v_organization, v_country, v_academic_degree, v_specialization, v_uid
    )
    returning id into v_researcher_id;
  else
    update public.researchers
    set
      full_name = v_full_name,
      phone = coalesce(v_phone, phone),
      organization = coalesce(v_organization, organization),
      country = coalesce(v_country, country),
      academic_degree = coalesce(v_academic_degree, academic_degree),
      specialization = coalesce(v_specialization, specialization)
    where id = v_researcher_id;
  end if;

  -- 6) توليد رقم البحث (Paper Number) بشكل ذرّي -------------------------------
  v_seq := nextval('public.paper_number_seq');
  v_paper_number := 'PAPER-' || to_char(now(), 'YYYY') || '-' || lpad(v_seq::text, 5, '0');

  -- 7) إنشاء البحث -------------------------------------------------------------
  insert into public.papers (
    paper_number, conference_id, researcher_id, title, abstract, scientific_field, keywords, status
  ) values (
    v_paper_number, v_conference_id, v_researcher_id, v_title, v_abstract, v_scientific_field, v_keywords, 'SUBMITTED'
  )
  returning id into v_paper_id;

  -- 8) إنشاء أول نسخة من ملف البحث (Version 1) --------------------------------
  insert into public.paper_versions (
    paper_id, version_number, file_path, file_name, file_type, file_size, uploaded_by
  ) values (
    v_paper_id, 1, v_file_path, v_file_name, v_file_type, v_file_size, v_researcher_id
  );

  return jsonb_build_object(
    'paper_id', v_paper_id,
    'paper_number', v_paper_number
  );
end;
$$;

grant execute on function public.submit_paper(jsonb) to authenticated;
revoke execute on function public.submit_paper(jsonb) from anon;

-- --------------------------------------------------------------------------
-- Storage: bucket "papers" — إغلاق السياسات المؤقتة من 002_submission_schema.sql
-- Supabase Storage يضع تلقائيًا owner = auth.uid() لأي ملف يُرفع بواسطة عميل
-- مسجّل دخول (authenticated)، لذلك نعتمد عليه كمصدر حقيقة للملكية بدل الحاجة
-- لضم (join) مع paper_versions في كل عملية قراءة/حذف.
-- --------------------------------------------------------------------------
drop policy if exists "temp_dev_insert_paper_files" on storage.objects;
drop policy if exists "temp_dev_select_paper_files" on storage.objects;
drop policy if exists "temp_dev_delete_paper_files" on storage.objects;

create policy "authenticated_insert_paper_files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'papers'
    and public.conference_accepts_submissions(
      nullif((storage.foldername(name))[1], '')::uuid
    )
  );

create policy "owner_or_admin_select_paper_files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'papers' and (owner = auth.uid() or public.is_admin()));

create policy "owner_or_admin_delete_paper_files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'papers' and (owner = auth.uid() or public.is_admin()));
