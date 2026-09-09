-- ============================================================================
-- Migration: 006_reviewer_paper_access_rls
-- منح المحكّمين صلاحية قراءة الأبحاث ونسخها والملفات المسندة إليهم عبر RLS
-- ============================================================================

-- 1. السماح للمحكّم بقراءة الأبحاث المسندة إليه في جدول papers
drop policy if exists "reviewer_select_assigned_papers" on public.papers;

create policy "reviewer_select_assigned_papers"
  on public.papers for select
  to authenticated
  using (
    assigned_reviewer_id in (
      select reviewer_id from public.profiles
      where id = auth.uid() and reviewer_id is not null
    )
  );

-- 2. السماح للمحكّم بقراءة نسخ الأبحاث المسندة إليه في جدول paper_versions
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
    )
  );

-- 3. السماح للمحكّم بقراءة ملفات الأبحاث المسندة إليه من storage.objects
drop policy if exists "reviewer_select_assigned_paper_files" on storage.objects;

create policy "reviewer_select_assigned_paper_files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'papers'
    and exists (
      select 1
      from public.paper_versions pv
      join public.papers p on p.id = pv.paper_id
      join public.profiles prof on prof.reviewer_id = p.assigned_reviewer_id
      where prof.id = auth.uid()
        and pv.file_path = storage.objects.name
    )
  );
