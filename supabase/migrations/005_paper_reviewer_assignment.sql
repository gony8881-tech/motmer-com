-- ============================================================================
-- Migration: 005_paper_reviewer_assignment
-- إضافة عمود المحكّم المعيّن assigned_reviewer_id إلى جدول الأبحاث papers
-- لربط البحث بمحكّم من جدول reviewers وتتبع حالة التحكيم.
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. إضافة عمود assigned_reviewer_id لجدول papers مع قيد المفتاح الأجنبي
-- --------------------------------------------------------------------------
alter table public.papers
  add column if not exists assigned_reviewer_id uuid
  constraint papers_assigned_reviewer_id_fkey references public.reviewers (id) on delete set null;

-- --------------------------------------------------------------------------
-- 2. إنشاء فهرس على عمود assigned_reviewer_id لتسريع الاستعلامات والفلترة
-- --------------------------------------------------------------------------
create index if not exists papers_assigned_reviewer_id_idx on public.papers (assigned_reviewer_id);
