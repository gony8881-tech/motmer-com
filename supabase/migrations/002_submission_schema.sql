-- ============================================================================
-- Migration: 002_submission_schema
-- المرحلة الثالثة: نظام تقديم البحث العلمي (researchers, papers, paper_versions)
-- + Supabase Storage (bucket: papers) + RPC آمن للتقديم العام (submit_paper)
-- لا تُعدّل هذه الملف Migration المرحلة الثانية (001_initial_schema.sql).
-- ============================================================================

-- --------------------------------------------------------------------------
-- Table: researchers
-- --------------------------------------------------------------------------
create table if not exists public.researchers (
  id                uuid primary key default gen_random_uuid(),
  full_name         text not null,
  email             text not null,
  phone             text,
  organization      text,
  country           text,
  academic_degree   text,
  specialization    text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint researchers_full_name_not_blank check (btrim(full_name) <> ''),
  constraint researchers_email_format
    check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

create index if not exists researchers_email_idx on public.researchers (lower(email));

drop trigger if exists trg_researchers_updated_at on public.researchers;
create trigger trg_researchers_updated_at
  before update on public.researchers
  for each row
  execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- Table: papers
-- --------------------------------------------------------------------------
create table if not exists public.papers (
  id                uuid primary key default gen_random_uuid(),
  paper_number      text not null unique,
  conference_id     uuid not null references public.conferences (id) on delete restrict,
  researcher_id     uuid not null references public.researchers (id) on delete restrict,
  title             text not null,
  abstract          text not null,
  scientific_field  text not null,
  keywords          text[] not null default '{}',
  status            text not null default 'SUBMITTED',
  submitted_at      timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint papers_title_not_blank check (btrim(title) <> ''),
  constraint papers_abstract_not_blank check (btrim(abstract) <> ''),
  constraint papers_status_check check (status in (
    'SUBMITTED',
    'INITIAL_SCREENING',
    'INITIAL_SCREENING_REJECTED',
    'READY_FOR_REVIEW',
    'UNDER_REVIEW',
    'REVISION_REQUESTED',
    'REVISION_SUBMITTED',
    'ACCEPTED',
    'REJECTED',
    'WITHDRAWN'
  ))
);

create index if not exists papers_conference_id_idx on public.papers (conference_id);
create index if not exists papers_researcher_id_idx on public.papers (researcher_id);
create index if not exists papers_status_idx on public.papers (status);
create index if not exists papers_paper_number_idx on public.papers (paper_number);

drop trigger if exists trg_papers_updated_at on public.papers;
create trigger trg_papers_updated_at
  before update on public.papers
  for each row
  execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- Table: paper_versions
-- --------------------------------------------------------------------------
create table if not exists public.paper_versions (
  id                uuid primary key default gen_random_uuid(),
  paper_id          uuid not null references public.papers (id) on delete cascade,
  version_number    integer not null,
  file_path         text not null,
  file_name         text not null,
  file_type         text not null,
  file_size         bigint not null,
  uploaded_at       timestamptz not null default now(),
  uploaded_by       uuid references public.researchers (id) on delete set null,
  created_at        timestamptz not null default now(),

  constraint paper_versions_version_number_positive check (version_number > 0),
  -- حد أقصى 10 ميجابايت لهذه المرحلة (يجب أن يطابق MAX_FILE_SIZE_BYTES في الواجهة)
  constraint paper_versions_file_size_limit check (file_size > 0 and file_size <= 10485760),
  constraint paper_versions_unique_version unique (paper_id, version_number)
);

create index if not exists paper_versions_paper_id_idx on public.paper_versions (paper_id);

-- --------------------------------------------------------------------------
-- Paper Number: تسلسل عام يُستخدم لتوليد أرقام الأبحاث بشكل ذرّي (atomic)
-- الصيغة: PAPER-{السنة}-{رقم مكوّن من 5 خانات}
-- --------------------------------------------------------------------------
create sequence if not exists public.paper_number_seq start 1;

-- --------------------------------------------------------------------------
-- Helper: هل يقبل المؤتمر تقديم أبحاث الآن؟ (يُستخدم في RPC وفي سياسات Storage)
-- --------------------------------------------------------------------------
create or replace function public.conference_accepts_submissions(p_conference_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conferences c
    where c.id = p_conference_id
      and c.status = 'OPEN'
      and current_date between c.submission_start and c.submission_end
  );
$$;

grant execute on function public.conference_accepts_submissions(uuid) to anon, authenticated;

-- --------------------------------------------------------------------------
-- RPC: submit_paper
-- نقطة التقديم الوحيدة والآمنة لإنشاء/العثور على الباحث + إنشاء البحث +
-- إنشاء Paper Version 1، بشكل ذرّي (Transaction واحدة ضمن الدالة نفسها).
-- SECURITY DEFINER يجعل الدالة تتجاوز RLS على الجداول الثلاثة أثناء الكتابة،
-- بينما تبقى سياسات RLS العامة على هذه الجداول تمنع الكتابة المباشرة من العميل.
-- ملف الرفع (Storage) يجب أن يكون قد رُفع مسبقًا قبل استدعاء هذه الدالة؛
-- الدالة تتعامل فقط مع قاعدة البيانات.
-- --------------------------------------------------------------------------
create or replace function public.submit_paper(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conference          public.conferences%rowtype;
  v_researcher_id        uuid;
  v_paper_id             uuid;
  v_paper_number         text;
  v_seq                  bigint;
  v_full_name            text := btrim(coalesce(payload->>'full_name', ''));
  v_email                text := btrim(coalesce(payload->>'email', ''));
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
  if v_full_name = '' or v_email = '' then
    raise exception 'بيانات الباحث غير مكتملة.';
  end if;

  if v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'صيغة البريد الإلكتروني غير صحيحة.';
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

  -- 5) العثور على الباحث أو إنشاؤه (حسب البريد الإلكتروني) -------------------
  select id into v_researcher_id
    from public.researchers
    where lower(email) = lower(v_email)
    limit 1;

  if v_researcher_id is null then
    insert into public.researchers (
      full_name, email, phone, organization, country, academic_degree, specialization
    ) values (
      v_full_name, v_email, v_phone, v_organization, v_country, v_academic_degree, v_specialization
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

grant execute on function public.submit_paper(jsonb) to anon, authenticated;

-- --------------------------------------------------------------------------
-- Row Level Security
-- --------------------------------------------------------------------------
alter table public.researchers enable row level security;
alter table public.papers enable row level security;
alter table public.paper_versions enable row level security;

-- ⚠️ لا توجد سياسات INSERT/UPDATE/DELETE للعميل (anon/authenticated) على هذه
-- الجداول الثلاثة عن قصد. الكتابة الوحيدة المسموحة تتم عبر public.submit_paper
-- (SECURITY DEFINER) التي تتحقق من كل قواعد العمل قبل الكتابة. هذا أكثر أمانًا
-- من فتح Insert مباشرة للباحث المجهول (غير المسجل دخول).
--
-- سياسات القراءة (SELECT) مفتوحة مؤقتًا فقط لأن لوحة الإدارة نفسها بلا
-- Authentication بعد (نفس نمط 001_initial_schema.sql لجدول conferences).
-- ⚠️ مؤقت: يجب استبدالها في مرحلة الـ Auth بسياسات مبنية على الأدوار
-- (admin يرى كل شيء، الباحث يرى أبحاثه فقط عبر auth.uid()).
create policy "temp_dev_select_researchers"
  on public.researchers for select to anon, authenticated using (true);

create policy "temp_dev_select_papers"
  on public.papers for select to anon, authenticated using (true);

create policy "temp_dev_select_paper_versions"
  on public.paper_versions for select to anon, authenticated using (true);

-- --------------------------------------------------------------------------
-- Storage: bucket "papers" (خاص — لا يُقرأ عبر رابط عام مباشر بدون سياسة)
-- --------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('papers', 'papers', false)
on conflict (id) do nothing;

-- الرفع: مسموح فقط داخل مسار مؤتمر يقبل التقديم فعليًا الآن.
-- بنية المسار المستخدمة في التطبيق: {conference_id}/{paper_temp_id}/v1/{filename}
-- (أي المسار الكامل المعروض للمستخدم هو papers/{conference_id}/{paper_temp_id}/v1/{filename}
-- عند احتساب اسم الـ bucket كجزء من المسار كما ورد في وصف المتطلبات).
create policy "temp_dev_insert_paper_files"
  on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'papers'
    and public.conference_accepts_submissions(
      nullif((storage.foldername(name))[1], '')::uuid
    )
  );

-- ⚠️ مؤقت: القراءة والحذف مفتوحتان لأن لوحة الإدارة (لعرض/تنزيل الملفات) وآلية
-- تنظيف الرفع الفاشل من طرف العميل (Cleanup عند فشل submit_paper) تعملان
-- بدون Authentication بعد. يجب استبدالهما في مرحلة الـ Auth بـ Edge Function
-- أو بسياسات مبنية على الأدوار.
create policy "temp_dev_select_paper_files"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'papers');

create policy "temp_dev_delete_paper_files"
  on storage.objects for delete to anon, authenticated
  using (bucket_id = 'papers');
