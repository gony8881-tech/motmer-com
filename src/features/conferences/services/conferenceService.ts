import { requireSupabase } from "@/lib/supabase/client";
import type { ConferenceRow, PublicConferenceRow } from "@/lib/supabase/types";
import type { Conference, ConferenceStatus, PublicConference } from "@/types";
import type { ConferenceFormValues } from "@/features/conferences/types";
import { slugify } from "@/utils/slugify";

/** الأعمدة العامة الآمنة فقط — بدون contact_email (طبقة تطبيق، انظر تعليق RLS في migration) */
const PUBLIC_COLUMNS =
  "id,title,slug,description,organizer_name,location,start_date,end_date,submission_start,submission_end,status,scientific_fields,submission_conditions,created_at,updated_at";

function mapRowToConference(row: ConferenceRow): Conference {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    organizerName: row.organizer_name,
    location: row.location,
    startDate: row.start_date,
    endDate: row.end_date,
    submissionStart: row.submission_start,
    submissionEnd: row.submission_end,
    status: row.status,
    scientificFields: row.scientific_fields,
    submissionConditions: row.submission_conditions,
    contactEmail: row.contact_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPublicRowToConference(row: PublicConferenceRow): PublicConference {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    organizerName: row.organizer_name,
    location: row.location,
    startDate: row.start_date,
    endDate: row.end_date,
    submissionStart: row.submission_start,
    submissionEnd: row.submission_end,
    status: row.status,
    scientificFields: row.scientific_fields,
    submissionConditions: row.submission_conditions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * يولّد slug فريدًا من عنوان المؤتمر. إذا كان الـ slug الأساسي مستخدمًا بالفعل
 * يضيف لاحقة رقمية متزايدة (‑2, ‑3, ...) حتى يجد قيمة غير مكررة.
 */
export async function generateUniqueSlug(title: string): Promise<string> {
  const client = requireSupabase();
  const base = slugify(title) || "conference";

  const { data, error } = await client
    .from("conferences")
    .select("slug")
    .like("slug", `${base}%`);

  if (error) {
    throw new Error("تعذّر التحقق من تفرد رابط المؤتمر. حاول مرة أخرى.");
  }

  const existingSlugs = new Set((data ?? []).map((row) => row.slug));
  if (!existingSlugs.has(base)) return base;

  let counter = 2;
  while (existingSlugs.has(`${base}-${counter}`)) {
    counter += 1;
  }
  return `${base}-${counter}`;
}

export async function createConference(values: ConferenceFormValues): Promise<Conference> {
  const client = requireSupabase();
  const slug = await generateUniqueSlug(values.title);

  const { data, error } = await client
    .from("conferences")
    .insert({
      title: values.title.trim(),
      slug,
      description: values.description.trim() || null,
      organizer_name: values.organizerName.trim() || null,
      location: values.location.trim() || null,
      contact_email: values.contactEmail.trim() || null,
      start_date: values.startDate,
      end_date: values.endDate,
      submission_start: values.submissionStart,
      submission_end: values.submissionEnd,
      status: "DRAFT",
      scientific_fields: values.scientificFields,
      submission_conditions: values.submissionConditions.trim() || null,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error("حدث خطأ أثناء حفظ المؤتمر. يرجى المحاولة مرة أخرى.");
  }

  return mapRowToConference(data);
}

export async function getConferences(): Promise<Conference[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("conferences")
    .select()
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("حدث خطأ أثناء تحميل بيانات المؤتمرات. يرجى المحاولة مرة أخرى.");
  }

  return (data ?? []).map(mapRowToConference);
}

export async function getConferenceById(id: string): Promise<Conference | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("conferences")
    .select()
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("حدث خطأ أثناء تحميل بيانات المؤتمر. يرجى المحاولة مرة أخرى.");
  }

  return data ? mapRowToConference(data) : null;
}

/** جلب عام للمؤتمر عبر الـ slug — لا يعيد contact_email (لصفحة /conference/:slug) */
export async function getConferenceBySlug(slug: string): Promise<PublicConference | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("conferences")
    .select(PUBLIC_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error("حدث خطأ أثناء تحميل بيانات المؤتمر. يرجى المحاولة مرة أخرى.");
  }

  return data ? mapPublicRowToConference(data as PublicConferenceRow) : null;
}

/** المؤتمرات المفتوحة حاليًا لاستقبال الأبحاث — لصفحة "تقديم بحث" في لوحة الباحث. */
export async function getOpenConferencesForSubmission(): Promise<PublicConference[]> {
  const client = requireSupabase();
  const todayIso = new Date().toISOString().slice(0, 10);

  const { data, error } = await client
    .from("conferences")
    .select(PUBLIC_COLUMNS)
    .eq("status", "OPEN")
    .lte("submission_start", todayIso)
    .gte("submission_end", todayIso)
    .order("submission_end", { ascending: true });

  if (error) {
    throw new Error("حدث خطأ أثناء تحميل قائمة المؤتمرات المفتوحة للتقديم.");
  }

  return (data ?? []).map((row) => mapPublicRowToConference(row as PublicConferenceRow));
}

export type ConferenceUpdateValues = Partial<ConferenceFormValues> & {
  status?: ConferenceStatus;
};

export async function updateConference(
  id: string,
  values: ConferenceUpdateValues
): Promise<Conference> {
  const client = requireSupabase();

  const { data, error } = await client
    .from("conferences")
    .update({
      ...(values.title !== undefined && { title: values.title.trim() }),
      ...(values.description !== undefined && { description: values.description.trim() || null }),
      ...(values.organizerName !== undefined && {
        organizer_name: values.organizerName.trim() || null,
      }),
      ...(values.location !== undefined && { location: values.location.trim() || null }),
      ...(values.contactEmail !== undefined && {
        contact_email: values.contactEmail.trim() || null,
      }),
      ...(values.startDate !== undefined && { start_date: values.startDate }),
      ...(values.endDate !== undefined && { end_date: values.endDate }),
      ...(values.submissionStart !== undefined && { submission_start: values.submissionStart }),
      ...(values.submissionEnd !== undefined && { submission_end: values.submissionEnd }),
      ...(values.status !== undefined && { status: values.status }),
      ...(values.scientificFields !== undefined && { scientific_fields: values.scientificFields }),
      ...(values.submissionConditions !== undefined && {
        submission_conditions: values.submissionConditions.trim() || null,
      }),
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    throw new Error("حدث خطأ أثناء تحديث المؤتمر. يرجى المحاولة مرة أخرى.");
  }

  return mapRowToConference(data);
}
