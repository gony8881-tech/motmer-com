-- ============================================================================
-- Migration: 001_initial_schema
-- المرحلة الثانية: جدول conferences الأساسي + RLS
-- ============================================================================

create extension if not exists "pgcrypto";

-- --------------------------------------------------------------------------
-- Table: conferences
-- --------------------------------------------------------------------------
create table if not exists public.conferences (
  id                    uuid primary key default gen_random_uuid(),
  title                 text not null,
  slug                  text not null unique,
  description           text,
  organizer_name        text,
  location              text,
  start_date            date not null,
  end_date              date not null,
  submission_start      date not null,
  submission_end        date not null,
  status                text not null default 'DRAFT',
  scientific_fields     text[] not null default '{}',
  submission_conditions text,
  contact_email         text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint conferences_status_check
    check (status in ('DRAFT', 'OPEN', 'CLOSED')),
  constraint conferences_end_after_start
    check (end_date >= start_date),
  constraint conferences_submission_end_after_start
    check (submission_end >= submission_start),
  constraint conferences_contact_email_format
    check (contact_email is null or contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

create index if not exists conferences_slug_idx on public.conferences (slug);
create index if not exists conferences_status_idx on public.conferences (status);

-- --------------------------------------------------------------------------
-- updated_at trigger
-- --------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_conferences_updated_at on public.conferences;
create trigger trg_conferences_updated_at
  before update on public.conferences
  for each row
  execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- Row Level Security
-- --------------------------------------------------------------------------
alter table public.conferences enable row level security;

-- سياسة قراءة عامة: القراءة متاحة لكل الصفوف (بما فيها DRAFT) في هذه المرحلة
-- لأن لوحة الإدارة نفسها بلا Authentication بعد وتحتاج رؤية كل الحالات.
-- إخفاء تفاصيل المؤتمرات DRAFT عن الزوّار، وإخفاء عمود contact_email عن الصفحة
-- العامة، يتمّان حاليًا على مستوى طبقة التطبيق (conferenceService) وليس عبر RLS.
-- ⚠️ مؤقت: يجب استبدال هذه السياسة في مرحلة الـ Auth بسياسات مبنية على الأدوار
-- (admin / researcher / reviewer) وربما View منفصلة للعرض العام بدل الاعتماد
-- على فلترة التطبيق فقط.
create policy "temp_dev_select_all_conferences"
  on public.conferences
  for select
  to anon, authenticated
  using (true);

-- ⚠️ مؤقت أيضًا: لا يوجد Authentication بعد، فلوحة الإدارة تستخدم anon key
-- مباشرة للكتابة. يجب استبدال هذه السياسات في مرحلة الـ Auth بسياسات تتحقق
-- من دور المستخدم (admin) عبر auth.uid() / auth.jwt().
create policy "temp_dev_insert_conferences"
  on public.conferences
  for insert
  to anon, authenticated
  with check (true);

create policy "temp_dev_update_conferences"
  on public.conferences
  for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "temp_dev_delete_conferences"
  on public.conferences
  for delete
  to anon, authenticated
  using (true);
