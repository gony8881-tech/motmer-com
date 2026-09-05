import { requireSupabase } from "@/lib/supabase/client";
import type { ResearcherRow } from "@/lib/supabase/types";
import type { MyPaperSummary } from "@/features/researchers/types";
import type { Paper } from "@/types";

/**
 * سجل الباحث المرتبط بالمستخدم الحالي (user_id = auth.uid()، مضمون عبر RLS).
 * يُعيد null إذا لم يُقدّم المستخدم أي بحث بعد (لا يوجد سجل researchers له حتى الآن).
 */
export async function getMyResearcherRecord(): Promise<ResearcherRow | null> {
  const client = requireSupabase();
  const { data, error } = await client.from("researchers").select("*").maybeSingle();

  if (error) {
    throw new Error("تعذّر تحميل بيانات الباحث الخاصة بك.");
  }

  return data ?? null;
}

/** كل الأبحاث المرتبطة بسجل باحث معيّن (تُستخدم لعرض "أبحاثي" في لوحة الباحث). */
export async function getMyPapers(researcherId: string): Promise<MyPaperSummary[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("papers")
    .select("id,paper_number,title,scientific_field,status,submitted_at,conferences(title)")
    .eq("researcher_id", researcherId)
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new Error("تعذّر تحميل قائمة أبحاثك.");
  }

  return (data ?? []).map((row) => {
    const conference = row.conferences as unknown as { title: string } | null;
    return {
      id: row.id,
      paperNumber: row.paper_number,
      title: row.title,
      scientificField: row.scientific_field,
      status: row.status as Paper["status"],
      submittedAt: row.submitted_at,
      conferenceTitle: conference?.title ?? "—",
    };
  });
}
