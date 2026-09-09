-- ============================================================================
-- Migration: 008_reviewer_workflow_rls
-- سياسات الأمان RLS وحجب هوية المؤلف (Double-Blind) على مستوى قاعدة البيانات
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. تفعيل RLS على الجداول الجديدة
-- --------------------------------------------------------------------------
alter table public.paper_reviewer_assignments enable row level security;
alter table public.review_reports enable row level security;
alter table public.notifications enable row level security;

-- --------------------------------------------------------------------------
-- 2. سياسات جدول تكليفات الأوراق (paper_reviewer_assignments)
-- --------------------------------------------------------------------------
drop policy if exists "admin_all_paper_reviewer_assignments" on public.paper_reviewer_assignments;
create policy "admin_all_paper_reviewer_assignments"
  on public.paper_reviewer_assignments for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "reviewer_select_own_assignments" on public.paper_reviewer_assignments;
create policy "reviewer_select_own_assignments"
  on public.paper_reviewer_assignments for select
  to authenticated
  using (
    reviewer_id in (
      select reviewer_id from public.profiles
      where id = auth.uid() and reviewer_id is not null
    )
  );

drop policy if exists "reviewer_update_own_assignments" on public.paper_reviewer_assignments;
create policy "reviewer_update_own_assignments"
  on public.paper_reviewer_assignments for update
  to authenticated
  using (
    reviewer_id in (
      select reviewer_id from public.profiles
      where id = auth.uid() and reviewer_id is not null
    )
  )
  with check (
    reviewer_id in (
      select reviewer_id from public.profiles
      where id = auth.uid() and reviewer_id is not null
    )
  );

-- --------------------------------------------------------------------------
-- 3. سياسات جدول تقارير التحكيم (review_reports)
-- --------------------------------------------------------------------------
drop policy if exists "admin_all_review_reports" on public.review_reports;
create policy "admin_all_review_reports"
  on public.review_reports for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "reviewer_select_own_reports" on public.review_reports;
create policy "reviewer_select_own_reports"
  on public.review_reports for select
  to authenticated
  using (
    reviewer_id in (
      select reviewer_id from public.profiles
      where id = auth.uid() and reviewer_id is not null
    )
  );

drop policy if exists "reviewer_insert_own_reports" on public.review_reports;
create policy "reviewer_insert_own_reports"
  on public.review_reports for insert
  to authenticated
  with check (
    reviewer_id in (
      select reviewer_id from public.profiles
      where id = auth.uid() and reviewer_id is not null
    )
  );

drop policy if exists "reviewer_update_own_draft_reports" on public.review_reports;
create policy "reviewer_update_own_draft_reports"
  on public.review_reports for update
  to authenticated
  using (
    reviewer_id in (
      select reviewer_id from public.profiles
      where id = auth.uid() and reviewer_id is not null
    )
    and (
      status = 'DRAFT'
      or public.is_admin()
    )
  )
  with check (
    reviewer_id in (
      select reviewer_id from public.profiles
      where id = auth.uid() and reviewer_id is not null
    )
  );

-- --------------------------------------------------------------------------
-- 4. سياسات جدول الإشعارات (notifications)
-- --------------------------------------------------------------------------
drop policy if exists "user_select_own_notifications" on public.notifications;
create policy "user_select_own_notifications"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "user_update_own_notifications" on public.notifications;
create policy "user_update_own_notifications"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "authenticated_insert_notifications" on public.notifications;
create policy "authenticated_insert_notifications"
  on public.notifications for insert
  to authenticated
  with check (true);

-- --------------------------------------------------------------------------
-- 5. تحديث سياسات papers و paper_versions لتشمل التكليفات الجديدة
-- --------------------------------------------------------------------------
drop policy if exists "reviewer_select_assigned_papers" on public.papers;
create policy "reviewer_select_assigned_papers"
  on public.papers for select
  to authenticated
  using (
    assigned_reviewer_id in (
      select reviewer_id from public.profiles
      where id = auth.uid() and reviewer_id is not null
    )
    or id in (
      select pra.paper_id
      from public.paper_reviewer_assignments pra
      join public.profiles prof on prof.reviewer_id = pra.reviewer_id
      where prof.id = auth.uid()
    )
  );

drop policy if exists "reviewer_select_assigned_paper_versions" on public.paper_versions;
create policy "reviewer_select_assigned_paper_versions"
  on public.paper_versions for select
  to authenticated
  using (
    paper_id in (
      select id from public.papers
      where assigned_reviewer_id in (
        select reviewer_id from public.profiles
        where id = auth.uid() and reviewer_id is not null
      )
      or id in (
        select pra.paper_id
        from public.paper_reviewer_assignments pra
        join public.profiles prof on prof.reviewer_id = pra.reviewer_id
        where prof.id = auth.uid()
      )
    )
  );

-- --------------------------------------------------------------------------
-- 6. سياسات التخزين لملفات مراجعات التحكيم في bucket 'papers'
-- --------------------------------------------------------------------------
drop policy if exists "reviewer_insert_review_files" on storage.objects;
create policy "reviewer_insert_review_files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'papers'
    and (storage.foldername(name))[1] = 'reviews'
  );

drop policy if exists "reviewer_select_review_files" on storage.objects;
create policy "reviewer_select_review_files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'papers'
    and (storage.foldername(name))[1] = 'reviews'
    and (owner = auth.uid() or public.is_admin())
  );

-- --------------------------------------------------------------------------
-- 7. Secure View: reviewer_paper_assignments_view
-- يضمن حجب بيانات المؤلف برمجياً وعلى مستوى قاعدة البيانات (Double-Blind)
-- --------------------------------------------------------------------------
create or replace view public.reviewer_paper_assignments_view as
select
  pra.id as assignment_id,
  pra.paper_id,
  pra.reviewer_id,
  pra.status as assignment_status,
  pra.invitation_sent_at,
  pra.responded_at,
  pra.decline_reason,
  pra.due_date,
  pra.extension_status,
  pra.extension_requested_days,
  pra.extension_reason,
  pra.extension_requested_at,
  pra.extension_responded_at,
  pra.created_at as assignment_created_at,
  p.paper_number,
  p.title as paper_title,
  p.abstract as paper_abstract,
  p.scientific_field,
  p.keywords,
  p.status as paper_status,
  p.submitted_at as paper_submitted_at,
  c.id as conference_id,
  c.title as conference_title,
  c.review_type,
  -- حجب هوية المؤلف تماماً إذا كان المؤتمر DOUBLE_BLIND
  case 
    when c.review_type = 'DOUBLE_BLIND' then null
    else r.id
  end as researcher_id,
  case 
    when c.review_type = 'DOUBLE_BLIND' then null
    else r.full_name
  end as researcher_full_name,
  case 
    when c.review_type = 'DOUBLE_BLIND' then null
    else r.email
  end as researcher_email,
  case 
    when c.review_type = 'DOUBLE_BLIND' then null
    else r.organization
  end as researcher_organization,
  pv.file_path as latest_file_path,
  pv.file_name as latest_file_name,
  rr.id as report_id,
  rr.status as report_status,
  rr.recommendation as report_recommendation,
  rr.submitted_at as report_submitted_at
from public.paper_reviewer_assignments pra
join public.papers p on p.id = pra.paper_id
join public.conferences c on c.id = p.conference_id
left join public.researchers r on r.id = p.researcher_id
left join lateral (
  select file_path, file_name
  from public.paper_versions
  where paper_id = p.id
  order by version_number desc
  limit 1
) pv on true
left join public.review_reports rr on rr.assignment_id = pra.id
where (
  current_user in ('postgres', 'supabase_admin')
  or auth.role() = 'service_role'
  or public.is_admin()
  or pra.reviewer_id in (
    select reviewer_id from public.profiles
    where id = auth.uid() and reviewer_id is not null
  )
);

grant select on public.reviewer_paper_assignments_view to authenticated;
