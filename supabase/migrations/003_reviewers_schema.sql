-- ============================================================================
-- Migration: 003_reviewers_schema
-- إدارة قائمة المحكّمين (Reviewer Directory) من لوحة الإدارة.
-- تمهيد لاستخدامهم لاحقًا في تعيين تحكيم الأبحاث (Phase 5).
-- ============================================================================

-- --------------------------------------------------------------------------
-- Table: reviewers
-- --------------------------------------------------------------------------
create table if not exists public.reviewers (
  id              uuid primary key default gen_random_uuid(),
  full_name       text not null,
  email           text not null,
  phone           text,
  affiliation     text,
  specialties     text[] not null default '{}',
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint reviewers_email_key unique (email)
);

-- Indexes
create index if not exists reviewers_is_active_idx on public.reviewers (is_active);
create index if not exists reviewers_specialties_idx on public.reviewers using gin (specialties);

-- Trigger for updated_at
drop trigger if exists trg_reviewers_updated_at on public.reviewers;
create trigger trg_reviewers_updated_at
  before update on public.reviewers
  for each row
  execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- Row Level Security (RLS)
-- --------------------------------------------------------------------------
alter table public.reviewers enable row level security;

-- ⚠️ سياسات مؤقتة (temp_dev_*) لمرحلة التطوير الأولى مطابقة لنمط migration المؤتمرات
-- (001_initial_schema.sql)، لأن لوحة الإدارة تستخدم anon key مباشرة في مرحلة التطوير
-- الحالية. ستُستبدل بسياسات مبنية على الأدوار والتحقق من public.is_admin() لاحقًا.
create policy "temp_dev_select_all_reviewers"
  on public.reviewers
  for select
  to anon, authenticated
  using (true);

create policy "temp_dev_insert_reviewers"
  on public.reviewers
  for insert
  to anon, authenticated
  with check (true);

create policy "temp_dev_update_reviewers"
  on public.reviewers
  for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "temp_dev_delete_reviewers"
  on public.reviewers
  for delete
  to anon, authenticated
  using (true);
