-- ============================================================================
-- Migration: 007_reviewer_workflow_schema
-- نظام سير عمل التحكيم المتكامل:
-- 1. إضافة نوع التحكيم (Double-Blind / Single-Blind / Open) إلى المؤتمرات
-- 2. جدول تكليفات الأوراق للمحكّمين (paper_reviewer_assignments)
-- 3. جدول تقارير التحكيم المعيارية (review_reports)
-- 4. جدول الإشعارات (notifications)
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. نوع التحكيم في المؤتمرات (Blind / Double-Blind / Open)
-- --------------------------------------------------------------------------
alter table public.conferences
  add column if not exists review_type text not null default 'DOUBLE_BLIND';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'conferences_review_type_check'
  ) then
    alter table public.conferences
      add constraint conferences_review_type_check
      check (review_type in ('DOUBLE_BLIND', 'SINGLE_BLIND', 'OPEN'));
  end if;
end $$;

-- --------------------------------------------------------------------------
-- 2. جدول تكليفات الأوراق للمحكّمين (paper_reviewer_assignments)
-- --------------------------------------------------------------------------
create table if not exists public.paper_reviewer_assignments (
  id                        uuid primary key default gen_random_uuid(),
  paper_id                  uuid not null references public.papers(id) on delete cascade,
  reviewer_id               uuid not null references public.reviewers(id) on delete cascade,
  status                    text not null default 'PENDING',
  invitation_sent_at        timestamptz not null default now(),
  responded_at              timestamptz,
  decline_reason            text,
  due_date                  timestamptz not null default (now() + interval '14 days'),
  extension_status          text not null default 'NONE',
  extension_requested_days  integer,
  extension_reason          text,
  extension_requested_at    timestamptz,
  extension_responded_at    timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  constraint uq_paper_reviewer unique (paper_id, reviewer_id),
  constraint chk_assignment_status check (status in ('PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED', 'CANCELLED')),
  constraint chk_extension_status check (extension_status in ('NONE', 'PENDING', 'APPROVED', 'REJECTED'))
);

create index if not exists idx_pra_paper_id on public.paper_reviewer_assignments (paper_id);
create index if not exists idx_pra_reviewer_id on public.paper_reviewer_assignments (reviewer_id);
create index if not exists idx_pra_status on public.paper_reviewer_assignments (status);
create index if not exists idx_pra_due_date on public.paper_reviewer_assignments (due_date);

drop trigger if exists trg_paper_reviewer_assignments_updated_at on public.paper_reviewer_assignments;
create trigger trg_paper_reviewer_assignments_updated_at
  before update on public.paper_reviewer_assignments
  for each row
  execute function public.set_updated_at();

-- ترحيل التكليفات السابقة إن وُجدت من papers.assigned_reviewer_id
insert into public.paper_reviewer_assignments (
  paper_id,
  reviewer_id,
  status,
  invitation_sent_at,
  responded_at,
  due_date
)
select 
  id,
  assigned_reviewer_id,
  'ACCEPTED',
  created_at,
  updated_at,
  (now() + interval '14 days')
from public.papers
where assigned_reviewer_id is not null
on conflict (paper_id, reviewer_id) do nothing;

-- --------------------------------------------------------------------------
-- 3. جدول تقارير التحكيم المعيارية (review_reports)
-- --------------------------------------------------------------------------
create table if not exists public.review_reports (
  id                                  uuid primary key default gen_random_uuid(),
  assignment_id                       uuid not null unique references public.paper_reviewer_assignments(id) on delete cascade,
  paper_id                            uuid not null references public.papers(id) on delete cascade,
  reviewer_id                         uuid not null references public.reviewers(id) on delete cascade,
  status                              text not null default 'DRAFT',
  recommendation                      text,
  originality_score                   integer check (originality_score is null or (originality_score between 1 and 5)),
  methodology_score                   integer check (methodology_score is null or (methodology_score between 1 and 5)),
  clarity_score                       integer check (clarity_score is null or (clarity_score between 1 and 5)),
  significance_score                  integer check (significance_score is null or (significance_score between 1 and 5)),
  overall_score                       integer check (overall_score is null or (overall_score between 1 and 5)),
  comments_for_author                 text,
  confidential_comments_for_editor    text,
  attachment_file_path                text,
  attachment_file_name                text,
  submitted_at                        timestamptz,
  created_at                          timestamptz not null default now(),
  updated_at                          timestamptz not null default now(),

  constraint chk_report_status check (status in ('DRAFT', 'SUBMITTED')),
  constraint chk_report_recommendation check (
    recommendation is null or recommendation in ('ACCEPT', 'MINOR_REVISION', 'MAJOR_REVISION', 'REJECT')
  )
);

create index if not exists idx_rr_assignment_id on public.review_reports (assignment_id);
create index if not exists idx_rr_paper_id on public.review_reports (paper_id);
create index if not exists idx_rr_reviewer_id on public.review_reports (reviewer_id);
create index if not exists idx_rr_status on public.review_reports (status);

drop trigger if exists trg_review_reports_updated_at on public.review_reports;
create trigger trg_review_reports_updated_at
  before update on public.review_reports
  for each row
  execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- 4. جدول الإشعارات (notifications)
-- --------------------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  message     text not null,
  type        text not null default 'INFO',
  link        text,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on public.notifications (user_id);
create index if not exists idx_notifications_is_read on public.notifications (is_read);
