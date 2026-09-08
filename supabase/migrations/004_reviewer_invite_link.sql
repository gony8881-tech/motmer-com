-- ============================================================================
-- Migration: 004_reviewer_invite_link
-- ربط حسابات المحكّمين وتتبع الدعوات عبر Supabase Auth.
-- يتيح إسناد دور REVIEWER تلقائيًا للمحكّم المدعو عند قبوله الدعوة وتعيين كلمة المرور.
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. إضافة عمود reviewer_id لجدول profiles لربط المستخدم بسجله في reviewers
-- --------------------------------------------------------------------------
alter table public.profiles
  add column if not exists reviewer_id uuid references public.reviewers (id) on delete set null;

create index if not exists profiles_reviewer_id_idx on public.profiles (reviewer_id);

-- --------------------------------------------------------------------------
-- 2. إضافة عمودي تتبع الدعوة لجدول reviewers (تاريخ الدعوة وتاريخ القبول)
-- --------------------------------------------------------------------------
alter table public.reviewers
  add column if not exists invited_at timestamptz,
  add column if not exists accepted_at timestamptz;

-- --------------------------------------------------------------------------
-- 3. تحديث دالة handle_new_auth_user (trigger على auth.users)
-- ⚠️ ملاحظة أمنية: هذا التعديل يخص فقط تحديد الدور الابتدائي عند إنشاء الحساب لأول مرة
-- (Initial Role Assignment). دالة prevent_role_self_escalation وسياسات RLS تبقى كما هي
-- تمامًا لحماية أي محاولات ترقية ذاتية لاحقة من العميل.
-- --------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reviewer    public.reviewers%rowtype;
  v_role        text := 'RESEARCHER';
  v_reviewer_id uuid := null;
  v_full_name   text;
begin
  -- 1) البحث عن المحكّم في جدول reviewers بالبريد وبشرط أن يكون حسابه نشطًا
  select * into v_reviewer
  from public.reviewers
  where lower(email) = lower(new.email)
    and is_active = true
  order by created_at desc
  limit 1;

  if found then
    v_role := 'REVIEWER';
    v_reviewer_id := v_reviewer.id;
    -- استخدام اسم المحكّم المسجل إذا لم يكن محددًا في user_meta_data
    v_full_name := coalesce(nullif(btrim(new.raw_user_meta_data->>'full_name'), ''), v_reviewer.full_name);

    -- تحديث تاريخ قبول الدعوة للمحكّم
    update public.reviewers
    set accepted_at = coalesce(accepted_at, now())
    where id = v_reviewer.id;
  else
    v_full_name := coalesce(btrim(new.raw_user_meta_data->>'full_name'), '');
  end if;

  -- 2) إدراج صف البروفايل بالدور المحدد وربط معرّف المحكّم
  insert into public.profiles (id, full_name, email, role, reviewer_id)
  values (
    new.id,
    v_full_name,
    new.email,
    v_role,
    v_reviewer_id
  )
  on conflict (id) do update
  set
    role = case
      when public.profiles.role = 'RESEARCHER' and v_role = 'REVIEWER' then 'REVIEWER'
      else public.profiles.role
    end,
    reviewer_id = coalesce(public.profiles.reviewer_id, v_reviewer_id);

  return new;
end;
$$;
