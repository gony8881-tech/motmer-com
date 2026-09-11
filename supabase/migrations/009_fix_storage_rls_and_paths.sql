-- ============================================================================
-- Migration: 009_fix_storage_rls_and_paths
-- توحيد وحماية سياسات RLS لـ storage.objects في bucket 'papers':
-- 1. سياسة INSERT موحدة تحمي من خطأ type-casting على مسار reviews/
--    وتقبل مسارات الأبحاث للمؤتمرات المفتوحة بمرونة كاملة لكافة صيغ المعرفات.
-- 2. سياسات SELECT و DELETE متوافقة وشاملة للمالك والإدارة والمحكمين.
-- ============================================================================

-- 1. إسقاط السياسات السابقة لتجنب أي تعارض
drop policy if exists "authenticated_insert_paper_files" on storage.objects;
drop policy if exists "reviewer_insert_review_files" on storage.objects;
drop policy if exists "authenticated_insert_papers_bucket" on storage.objects;

drop policy if exists "owner_or_admin_select_paper_files" on storage.objects;
drop policy if exists "reviewer_select_review_files" on storage.objects;
drop policy if exists "reviewer_select_assigned_paper_files" on storage.objects;
drop policy if exists "papers_select_policy" on storage.objects;

drop policy if exists "owner_or_admin_delete_paper_files" on storage.objects;
drop policy if exists "papers_delete_policy" on storage.objects;

-- 2. سياسة INSERT الموحدة والآمنة لـ bucket 'papers'
create policy "authenticated_insert_papers_bucket"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'papers'
    and (
      -- المسار أ: مرفقات مراجعات التحكيم (reviews/...)
      (storage.foldername(name))[1] = 'reviews'
      
      -- المسار ب: ملفات تقديم الأبحاث للمؤتمرات المفتوحة حالياً
      or (
        -- التأكد أولاً من أن المجلد الأول UUID صالح قبل أي تحويل
        (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and public.conference_accepts_submissions(((storage.foldername(name))[1])::uuid)
      )
    )
  );

-- 3. سياسة SELECT الموحدة والآمنة لـ bucket 'papers'
create policy "papers_select_policy"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'papers'
    and (
      -- المدير له صلاحية قراءة كل شيء
      public.is_admin()

      -- مالك الملف عبر عمود owner
      or owner = auth.uid()

      -- صاحب الملف (الباحث) عبر مساره auth.uid()
      or (storage.foldername(name))[2] = auth.uid()::text

      -- المحكّم يقرأ مرفقات المراجعة الخاصة به
      or (
        (storage.foldername(name))[1] = 'reviews'
        and (
          owner = auth.uid()
          or (storage.foldername(name))[2] in (
            select pra.id::text
            from public.paper_reviewer_assignments pra
            join public.profiles prof on prof.reviewer_id = pra.reviewer_id
            where prof.id = auth.uid()
          )
        )
      )

      -- المحكّم يقرأ ملفات الأبحاث المسندة إليه للتحكيم
      or exists (
        select 1
        from public.paper_versions pv
        join public.paper_reviewer_assignments pra on pra.paper_id = pv.paper_id
        join public.profiles prof on prof.reviewer_id = pra.reviewer_id
        where prof.id = auth.uid()
          and pv.file_path = storage.objects.name
      )
      or exists (
        select 1
        from public.paper_versions pv
        join public.papers p on p.id = pv.paper_id
        join public.profiles prof on prof.reviewer_id = p.assigned_reviewer_id
        where prof.id = auth.uid()
          and pv.file_path = storage.objects.name
      )
    )
  );

-- 4. سياسة DELETE الموحدة لـ bucket 'papers' (لتنظيف الملفات اليتيمة cleanup)
create policy "papers_delete_policy"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'papers'
    and (
      public.is_admin()
      or owner = auth.uid()
      or (storage.foldername(name))[2] = auth.uid()::text
      or (
        (storage.foldername(name))[1] = 'reviews'
        and (
          owner = auth.uid()
          or (storage.foldername(name))[2] in (
            select pra.id::text
            from public.paper_reviewer_assignments pra
            join public.profiles prof on prof.reviewer_id = pra.reviewer_id
            where prof.id = auth.uid()
          )
        )
      )
    )
  );
