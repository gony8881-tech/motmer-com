import { requireSupabase } from "@/lib/supabase/client";
import type { ReviewerRow } from "@/lib/supabase/types";
import type { Reviewer } from "@/types";
import type { ReviewerFormValues } from "../types";

function mapRowToReviewer(row: ReviewerRow): Reviewer {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    affiliation: row.affiliation,
    specialties: row.specialties ?? [],
    isActive: row.is_active,
    invitedAt: row.invited_at ?? null,
    acceptedAt: row.accepted_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** جلب جميع المحكّمين مرتبين من الأحدث إلى الأقدم */
export async function getReviewers(): Promise<Reviewer[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("reviewers")
    .select()
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("حدث خطأ أثناء تحميل قائمة المحكّمين. يرجى المحاولة مرة أخرى.");
  }

  return (data ?? []).map(mapRowToReviewer);
}

/** جلب محكّم محدد بواسطة معرّفه الفريد */
export async function getReviewerById(id: string): Promise<Reviewer | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("reviewers")
    .select()
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("حدث خطأ أثناء تحميل بيانات المحكّم. يرجى المحاولة مرة أخرى.");
  }

  return data ? mapRowToReviewer(data) : null;
}

/** إنشاء محكّم جديد في النظام */
export async function createReviewer(values: ReviewerFormValues): Promise<Reviewer> {
  const client = requireSupabase();

  const { data, error } = await client
    .from("reviewers")
    .insert({
      full_name: values.fullName.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone.trim() || null,
      affiliation: values.affiliation.trim() || null,
      specialties: values.specialties,
      is_active: values.isActive,
    })
    .select()
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      throw new Error("البريد الإلكتروني مسجل بالفعل لمحكّم آخر.");
    }
    throw new Error("حدث خطأ أثناء إضافة المحكّم. يرجى المحاولة مرة أخرى.");
  }

  return mapRowToReviewer(data);
}

export type ReviewerUpdateValues = Partial<ReviewerFormValues>;

/** تحديث بيانات محكّم موجود */
export async function updateReviewer(
  id: string,
  values: ReviewerUpdateValues
): Promise<Reviewer> {
  const client = requireSupabase();

  const updatePayload: Partial<Omit<ReviewerRow, "id" | "created_at" | "updated_at">> = {};
  if (values.fullName !== undefined) updatePayload.full_name = values.fullName.trim();
  if (values.email !== undefined) updatePayload.email = values.email.trim().toLowerCase();
  if (values.phone !== undefined) updatePayload.phone = values.phone.trim() || null;
  if (values.affiliation !== undefined) updatePayload.affiliation = values.affiliation.trim() || null;
  if (values.specialties !== undefined) updatePayload.specialties = values.specialties;
  if (values.isActive !== undefined) updatePayload.is_active = values.isActive;

  const { data, error } = await client
    .from("reviewers")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      throw new Error("البريد الإلكتروني مسجل بالفعل لمحكّم آخر.");
    }
    throw new Error("حدث خطأ أثناء تحديث بيانات المحكّم. يرجى المحاولة مرة أخرى.");
  }

  return mapRowToReviewer(data);
}

/** تفعيل أو تعطيل حساب المحكّم فورًا وبشكل سريع */
export async function toggleReviewerActive(
  id: string,
  currentStatus: boolean
): Promise<Reviewer> {
  return updateReviewer(id, { isActive: !currentStatus });
}

/** إرسال أو إعادة إرسال رابط الدعوة للمحكّم عبر Supabase Auth (Edge Function) */
export async function inviteReviewer(
  reviewerId: string
): Promise<{ success: boolean; message: string }> {
  const client = requireSupabase();
  const redirectTo = `${window.location.origin}/auth/set-password`;

  const { data, error } = await client.functions.invoke("invite-reviewer", {
    body: { reviewerId, redirectTo },
  });

  if (error) {
    let errorMsg = "تعذّر إرسال الدعوة إلى المحكّم.";
    try {
      if (error.context && typeof error.context.json === "function") {
        const json = await error.context.json();
        if (json?.message) errorMsg = json.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
    } catch {
      if (error.message) errorMsg = error.message;
    }
    throw new Error(errorMsg);
  }

  if (data && data.success === false) {
    throw new Error(data.message || "تعذّر إرسال الدعوة إلى المحكّم.");
  }

  return {
    success: true,
    message: data?.message || "تم إرسال رابط الدعوة إلى المحكّم بنجاح.",
  };
}

