import { requireSupabase } from "@/lib/supabase/client";
import type { ProfileRow } from "@/lib/supabase/types";
import type { Profile } from "@/types";
import { translateAuthError } from "@/features/auth/validation";

function mapRowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    organizationId: row.organization_id,
    reviewerId: row.reviewer_id ?? null,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** تسجيل حساب جديد — الدور دائمًا RESEARCHER تلقائيًا (يُنشأ عبر trigger على auth.users). */
export async function signUp(fullName: string, email: string, password: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { full_name: fullName.trim() },
    },
  });

  if (error) {
    throw new Error(translateAuthError(error.message));
  }
}

export async function signIn(email: string, password: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw new Error(translateAuthError(error.message));
  }
}

export async function signOut(): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();
  if (error) {
    throw new Error("حدث خطأ أثناء تسجيل الخروج.");
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    throw new Error("تعذّر إرسال رابط استعادة كلمة المرور. يرجى المحاولة مرة أخرى.");
  }
}

export async function updatePassword(newPassword: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.auth.updateUser({ password: newPassword });

  if (error) {
    throw new Error("تعذّر تحديث كلمة المرور. يرجى إعادة فتح رابط الاستعادة والمحاولة مرة أخرى.");
  }
}

/** يجلب Profile مستخدم معيّن — يُستخدم عند بدء التطبيق وعند تغيّر حالة تسجيل الدخول. */
export async function getProfile(userId: string): Promise<Profile | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("تعذّر تحميل بيانات الحساب.");
  }

  return data ? mapRowToProfile(data) : null;
}

/** كل المستخدمين — للوحة إدارة المستخدمين البسيطة (Admin فقط بحسب RLS). */
export async function getAllProfiles(): Promise<Profile[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("تعذّر تحميل قائمة المستخدمين.");
  }

  return (data ?? []).map(mapRowToProfile);
}
