import { requireSupabase } from "@/lib/supabase/client";
import type {
  PaperRow,
  PaperStatusRow,
  PaperVersionRow,
  ResearcherRow,
  ReviewerRow,
  SubmitPaperPayload,
} from "@/lib/supabase/types";
import type { PaperFormValues, ResearcherFormValues, SubmissionListItem } from "@/features/submissions/types";
import type { Paper, PaperWithResearcher, Reviewer } from "@/types";
import type { PaperStatus } from "@/features/workflow";

const PAPERS_BUCKET = "papers";

/** يزيل أي حرف قد يسبب مشاكل في مسار التخزين، ويحافظ على الامتداد. */
function sanitizeFileName(fileName: string): string {
  const trimmed = fileName.trim();
  const lastDot = trimmed.lastIndexOf(".");
  const base = lastDot > 0 ? trimmed.slice(0, lastDot) : trimmed;
  const ext = lastDot > 0 ? trimmed.slice(lastDot) : "";
  const safeBase = base.replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/-+/g, "-") || "paper";
  return `${safeBase}${ext.toLowerCase()}`;
}

/**
 * يرفع ملف البحث إلى Supabase Storage قبل استدعاء submit_paper.
 * المسار: {conferenceId}/{userId}/{مُعرّف مؤقت}/v1/{filename} داخل bucket "papers"
 * عند فشل submit_paper لاحقًا، يجب استدعاء deleteUploadedPaperFile بنفس المسار المُعاد هنا (cleanup).
 */
export async function uploadPaperFile(
  conferenceId: string,
  file: File,
  userId?: string
): Promise<{ storagePath: string }> {
  const client = requireSupabase();

  let resolvedUserId = userId;
  if (!resolvedUserId) {
    const { data } = await client.auth.getUser();
    resolvedUserId = data.user?.id;
  }

  const tempId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  // المسار القياسي المدعوم بسياسات RLS الجديدة:
  // {conferenceId}/{userId}/{tempId}/v1/{filename}
  const storagePath = resolvedUserId
    ? `${conferenceId}/${resolvedUserId}/${tempId}/v1/${sanitizeFileName(file.name)}`
    : `${conferenceId}/${tempId}/v1/${sanitizeFileName(file.name)}`;

  const lowerExt = file.name.toLowerCase();
  const normalizedContentType = lowerExt.endsWith(".pdf")
    ? "application/pdf"
    : lowerExt.endsWith(".docx")
    ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    : lowerExt.endsWith(".doc")
    ? "application/msword"
    : file.type || undefined;

  const { error } = await client.storage.from(PAPERS_BUCKET).upload(storagePath, file, {
    contentType: normalizedContentType,
    upsert: false,
  });

  if (error) {
    console.error("Supabase Storage upload error:", {
      message: error.message,
      name: error.name,
      storagePath,
      error,
    });
    throw new Error(error.message || "تعذّر رفع ملف البحث. يرجى المحاولة مرة أخرى.");
  }

  return { storagePath };
}

/** حذف ملف مرفوع سابقًا — يُستخدم كـ cleanup عند فشل إنشاء البحث بعد نجاح الرفع. */
export async function deleteUploadedPaperFile(storagePath: string): Promise<void> {
  const client = requireSupabase();
  // لا نرمي خطأ هنا عمدًا: فشل الـ cleanup لا يجب أن يمنع عرض رسالة الخطأ
  // الأساسية للمستخدم؛ يبقى الملف يتيمًا (orphan) في هذه الحالة النادرة فقط.
  await client.storage.from(PAPERS_BUCKET).remove([storagePath]);
}

interface SubmitPaperInput {
  conferenceId: string;
  researcher: ResearcherFormValues;
  paper: PaperFormValues;
  file: {
    storagePath: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  };
}

/** يستدعي RPC الآمن public.submit_paper الذي يُنشئ الباحث/البحث/النسخة الأولى بشكل ذرّي. */
export async function submitPaper(
  input: SubmitPaperInput
): Promise<{ paperId: string; paperNumber: string }> {
  const client = requireSupabase();

  const payload: SubmitPaperPayload = {
    conference_id: input.conferenceId,
    full_name: input.researcher.fullName.trim(),
    email: input.researcher.email.trim(),
    phone: input.researcher.phone.trim() || null,
    organization: input.researcher.organization.trim() || null,
    country: input.researcher.country.trim() || null,
    academic_degree: input.researcher.academicDegree.trim() || null,
    specialization: input.researcher.specialization.trim() || null,
    title: input.paper.title.trim(),
    abstract: input.paper.abstract.trim(),
    scientific_field: input.paper.scientificField.trim(),
    keywords: input.paper.keywords,
    file_path: input.file.storagePath,
    file_name: input.file.fileName,
    file_type: input.file.fileType,
    file_size: input.file.fileSize,
  };

  const { data, error } = await client.rpc("submit_paper", { payload });

  if (error || !data) {
    // رسالة RPC (RAISE EXCEPTION) تصل عادة عبر error.message بالعربية جاهزة للعرض.
    throw new Error(error?.message || "حدث خطأ أثناء إرسال البحث. يرجى المحاولة مرة أخرى.");
  }

  return { paperId: data.paper_id, paperNumber: data.paper_number };
}

/** عدد كل الأبحاث في النظام عبر كل المؤتمرات — لبطاقة إحصائية في لوحة المدير. */
export async function getAllPapersCount(): Promise<number> {
  const client = requireSupabase();
  const { count, error } = await client.from("papers").select("id", { count: "exact", head: true });

  if (error) {
    throw new Error("تعذّر تحميل عدد الأبحاث.");
  }

  return count ?? 0;
}
export async function getConferenceSubmissionsCount(conferenceId: string): Promise<number> {
  const client = requireSupabase();
  const { count, error } = await client
    .from("papers")
    .select("id", { count: "exact", head: true })
    .eq("conference_id", conferenceId);

  if (error) {
    throw new Error("تعذّر تحميل عدد الأبحاث المقدَّمة.");
  }

  return count ?? 0;
}

/** قائمة الأبحاث المقدَّمة لمؤتمر معيّن — لعرضها في /admin/conferences/:id/submissions */
export async function getSubmissionsForConference(
  conferenceId: string
): Promise<SubmissionListItem[]> {
  const client = requireSupabase();
  // استعلام مع join لجلب الباحث والمحكّم المعيّن إن وُجد
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (client.from("papers") as any)
    .select("id,paper_number,title,scientific_field,submitted_at,status,assigned_reviewer_id,researchers(full_name),reviewers(full_name)")
    .eq("conference_id", conferenceId)
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new Error("تعذّر تحميل قائمة الأبحاث المقدَّمة.");
  }

  interface JoinedRow {
    id: string;
    paper_number: string;
    title: string;
    scientific_field: string;
    submitted_at: string;
    status: string;
    assigned_reviewer_id: string | null;
    researchers: Pick<ResearcherRow, "full_name"> | null;
    reviewers: { full_name: string } | { full_name: string }[] | null;
  }

  return ((data ?? []) as JoinedRow[]).map((row) => {
    const rev = Array.isArray(row.reviewers) ? row.reviewers[0] : row.reviewers;
    return {
      id: row.id,
      paperNumber: row.paper_number,
      title: row.title,
      researcherFullName: row.researchers?.full_name ?? "—",
      assignedReviewerFullName: rev?.full_name ?? null,
      scientificField: row.scientific_field,
      submittedAt: row.submitted_at,
      status: row.status,
    };
  });
}

export interface SubmissionDetail {
  paper: PaperWithResearcher;
  researcher: ResearcherRow;
  versions: PaperVersionRow[];
  assignedReviewer: Reviewer | null;
}

/** تفاصيل بحث واحد + الباحث + كل نسخه + المحكّم المعيّن — لصفحة /admin/submissions/:id */
export async function getSubmissionById(paperId: string): Promise<SubmissionDetail | null> {
  const client = requireSupabase();
  interface JoinedDetailRow extends PaperRow {
    researchers: ResearcherRow | null;
    paper_versions: PaperVersionRow[] | null;
    reviewers: ReviewerRow | ReviewerRow[] | null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (client.from("papers") as any)
    .select("*,researchers(*),paper_versions(*),reviewers(*)")
    .eq("id", paperId)
    .maybeSingle();

  if (error) {
    throw new Error("تعذّر تحميل تفاصيل البحث.");
  }

  if (!data) return null;

  const row = data as JoinedDetailRow;
  const researcher = row.researchers as ResearcherRow;
  const versions = row.paper_versions ?? [];

  let assignedReviewer: Reviewer | null = null;
  const reviewerRow = Array.isArray(row.reviewers) ? row.reviewers[0] : row.reviewers;

  if (reviewerRow) {
    assignedReviewer = {
      id: reviewerRow.id,
      fullName: reviewerRow.full_name,
      email: reviewerRow.email,
      phone: reviewerRow.phone,
      affiliation: reviewerRow.affiliation,
      specialties: reviewerRow.specialties ?? [],
      isActive: reviewerRow.is_active,
      invitedAt: reviewerRow.invited_at ?? null,
      acceptedAt: reviewerRow.accepted_at ?? null,
      createdAt: reviewerRow.created_at,
      updatedAt: reviewerRow.updated_at,
    };
  } else if (row.assigned_reviewer_id) {
    const { data: revData } = await client
      .from("reviewers")
      .select("*")
      .eq("id", row.assigned_reviewer_id)
      .maybeSingle();
    if (revData) {
      assignedReviewer = {
        id: revData.id,
        fullName: revData.full_name,
        email: revData.email,
        phone: revData.phone,
        affiliation: revData.affiliation,
        specialties: revData.specialties ?? [],
        isActive: revData.is_active,
        invitedAt: revData.invited_at ?? null,
        acceptedAt: revData.accepted_at ?? null,
        createdAt: revData.created_at,
        updatedAt: revData.updated_at,
      };
    }
  }

  const paper: PaperWithResearcher = {
    id: row.id,
    paperNumber: row.paper_number,
    conferenceId: row.conference_id,
    researcherId: row.researcher_id,
    assignedReviewerId: row.assigned_reviewer_id ?? null,
    title: row.title,
    abstract: row.abstract,
    scientificField: row.scientific_field,
    keywords: row.keywords,
    status: row.status as Paper["status"],
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    researcherFullName: researcher?.full_name ?? "—",
    researcherEmail: researcher?.email ?? "—",
    assignedReviewerFullName: assignedReviewer?.fullName ?? null,
  };

  return {
    paper,
    researcher,
    versions: versions.sort((a, b) => a.version_number - b.version_number),
    assignedReviewer,
  };
}

/** رابط مؤقت (Signed URL) لمعاينة أو تنزيل نسخة من ملف البحث — الـ bucket خاص (private). */
export async function getPaperFileSignedUrl(
  storagePath: string,
  download?: boolean | string
): Promise<string> {
  const client = requireSupabase();
  const options = download ? { download } : undefined;
  const { data, error } = await client.storage
    .from(PAPERS_BUCKET)
    .createSignedUrl(storagePath, 60 * 5, options);

  if (error || !data) {
    throw new Error("تعذّر إنشاء رابط الملف.");
  }

  return data.signedUrl;
}

/** تحديث حالة البحث (قبول / رفض / اعتماد للتحكيم ...) */
export async function updatePaperStatus(
  paperId: string,
  status: PaperStatus
): Promise<void> {
  const client = requireSupabase();
  const { error } = await client
    .from("papers")
    .update({ status: status as PaperStatusRow })
    .eq("id", paperId);

  if (error) {
    throw new Error("حدث خطأ أثناء تحديث حالة البحث. يرجى المحاولة مرة أخرى.");
  }
}

/** إسناد محكّم للبحث وتحديث حالته تلقائيًا إلى UNDER_REVIEW */
export async function assignReviewerToPaper(
  paperId: string,
  reviewerId: string
): Promise<void> {
  const client = requireSupabase();
  const { error } = await client
    .from("papers")
    .update({
      assigned_reviewer_id: reviewerId,
      status: "UNDER_REVIEW",
    })
    .eq("id", paperId);

  if (error) {
    throw new Error("حدث خطأ أثناء تعيين المحكّم للبحث. يرجى المحاولة مرة أخرى.");
  }
}
