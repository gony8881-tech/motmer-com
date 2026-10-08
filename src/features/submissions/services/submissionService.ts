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
import type { AssignmentStatus, ReviewReport } from "@/types/reviewerWorkflow";
import type { PaperStatus } from "@/features/workflow";

const PAPERS_BUCKET = "papers";

/** يزيل أي حرف قد يسبب مشاكل في مسار التخزين، ويحافظ على الامتداد، ويدعم الملفات ذات الأسماء العربية بإنتاج اسم آمن ونظيف. */
function sanitizeFileName(fileName: string): string {
  const trimmed = fileName.trim();
  const lastDot = trimmed.lastIndexOf(".");
  const base = lastDot > 0 ? trimmed.slice(0, lastDot) : trimmed;
  const rawExt = lastDot > 0 ? trimmed.slice(lastDot).toLowerCase() : "";
  const allowedExts = [".pdf", ".doc", ".docx"];
  const ext = allowedExts.includes(rawExt) ? rawExt : ".pdf";
  const cleaned = base
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .replace(/-+/g, "-");
  const safeBase = cleaned || `paper-${Date.now()}`;
  return `${safeBase}${ext}`;
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
    : file.type || "application/pdf";

  const { error } = await client.storage.from(PAPERS_BUCKET).upload(storagePath, file, {
    contentType: normalizedContentType,
    upsert: true,
  });

  if (error) {
    console.error("Supabase Storage upload error:", {
      message: error.message,
      name: error.name,
      storagePath,
      error,
    });
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("row-level security") || msg.includes("policy")) {
      throw new Error("فترة استقبال الأبحاث غير مفتوحة حالياً لهذا المؤتمر أو انتهت صلاحية الجلسة.");
    }
    if (msg.includes("payload too large") || msg.includes("413") || msg.includes("entity too large")) {
      throw new Error("حجم الملف يتجاوز الحد الأقصى المسموح به (10 ميجابايت).");
    }
    if (msg.includes("failed to fetch") || msg.includes("network") || msg.includes("timeout") || msg.includes("aborterror")) {
      throw new Error("تعذّر الاتصال بالخادم لرفع الملف. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.");
    }
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
  // استعلام مع join لجلب الباحث والمحكّم المعيّن وتفاصيل تقارير التحكيم إن وُجدت
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (client.from("papers") as any)
    .select("id,paper_number,title,scientific_field,submitted_at,status,assigned_reviewer_id,researchers(full_name),reviewers(full_name),review_reports(status,recommendation)")
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
    review_reports?: { status: string; recommendation: string | null } | { status: string; recommendation: string | null }[] | null;
  }

  return ((data ?? []) as JoinedRow[]).map((row) => {
    const rev = Array.isArray(row.reviewers) ? row.reviewers[0] : row.reviewers;
    const reports = Array.isArray(row.review_reports)
      ? row.review_reports
      : row.review_reports
      ? [row.review_reports]
      : [];
    const latestReport = reports[0];
    return {
      id: row.id,
      paperNumber: row.paper_number,
      title: row.title,
      researcherFullName: row.researchers?.full_name ?? "—",
      assignedReviewerFullName: rev?.full_name ?? null,
      scientificField: row.scientific_field,
      submittedAt: row.submitted_at,
      status: row.status,
      reviewRecommendation: latestReport?.recommendation ?? null,
      reviewReportStatus: latestReport?.status ?? null,
    };
  });
}

export interface SubmissionDetail {
  paper: PaperWithResearcher;
  researcher: ResearcherRow;
  versions: PaperVersionRow[];
  assignedReviewer: Reviewer | null;
  reviewReport: ReviewReport | null;
  assignmentStatus: AssignmentStatus | null;
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

  // جلب تقرير التحكيم التابع للبحث إن وُجد
  let reviewReport: ReviewReport | null = null;
  const { data: reportData } = await client
    .from("review_reports")
    .select("*")
    .eq("paper_id", paperId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (reportData) {
    reviewReport = {
      id: reportData.id,
      assignmentId: reportData.assignment_id,
      paperId: reportData.paper_id,
      reviewerId: reportData.reviewer_id,
      status: reportData.status as "DRAFT" | "SUBMITTED",
      recommendation: (reportData.recommendation as ReviewReport["recommendation"]) ?? null,
      originalityScore: reportData.originality_score,
      methodologyScore: reportData.methodology_score,
      clarityScore: reportData.clarity_score,
      significanceScore: reportData.significance_score,
      overallScore: reportData.overall_score,
      commentsForAuthor: reportData.comments_for_author ?? "",
      confidentialCommentsForEditor: reportData.confidential_comments_for_editor ?? "",
      attachmentFilePath: reportData.attachment_file_path,
      attachmentFileName: reportData.attachment_file_name,
      submittedAt: reportData.submitted_at,
      createdAt: reportData.created_at,
      updatedAt: reportData.updated_at,
    };
  }

  // جلب حالة تكليف التحكيم من paper_reviewer_assignments
  let assignmentStatus: AssignmentStatus | null = null;
  const { data: assignData } = await client
    .from("paper_reviewer_assignments")
    .select("status")
    .eq("paper_id", paperId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (assignData) {
    assignmentStatus = assignData.status as AssignmentStatus;
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
    reviewReport,
    assignmentStatus,
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

/** إسناد محكّم للبحث وتحديث حالته تلقائيًا إلى UNDER_REVIEW وتحديث سجل التكليف في paper_reviewer_assignments */
export async function assignReviewerToPaper(
  paperId: string,
  reviewerId: string
): Promise<void> {
  const client = requireSupabase();

  // 1. تحديث جدول الأبحاث papers
  const { error: paperError } = await client
    .from("papers")
    .update({
      assigned_reviewer_id: reviewerId,
      status: "UNDER_REVIEW",
    })
    .eq("id", paperId);

  if (paperError) {
    throw new Error("حدث خطأ أثناء تعيين المحكّم للبحث. يرجى المحاولة مرة أخرى.");
  }

  // 2. إلغاء أي تكليف سابق لم يُحسم بعد لنفس الورقة لمحكم آخر
  try {
    await client
      .from("paper_reviewer_assignments")
      .update({ status: "CANCELLED" })
      .eq("paper_id", paperId)
      .neq("reviewer_id", reviewerId)
      .in("status", ["PENDING", "ACCEPTED"]);
  } catch (err) {
    console.warn("Could not cancel previous assignments:", err);
  }

  // 3. إدراج أو تحديث سجل التكليف للمحكّم في paper_reviewer_assignments بحالة ACCEPTED
  const now = new Date().toISOString();
  const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const { error: assignError } = await client
    .from("paper_reviewer_assignments")
    .upsert(
      {
        paper_id: paperId,
        reviewer_id: reviewerId,
        status: "ACCEPTED",
        invitation_sent_at: now,
        responded_at: now,
        due_date: dueDate,
        updated_at: now,
      },
      { onConflict: "paper_id,reviewer_id" }
    );

  if (assignError) {
    console.error("Error upserting paper_reviewer_assignments:", assignError);
  }

  // 4. إنشاء إشعار للمحكّم في جدول notifications
  try {
    const { data: revProfile } = await client
      .from("profiles")
      .select("id")
      .eq("reviewer_id", reviewerId)
      .maybeSingle();

    if (revProfile?.id) {
      await client.from("notifications").insert({
        user_id: revProfile.id,
        title: "تكليف بحث جديد للتحكيم",
        message: "تم إسناد بحث علمي جديد إليك لتحكيمه من قِبل إدارة المؤتمر.",
        type: "INFO",
        link: "/reviewer/assigned",
      });
    }
  } catch (err) {
    console.warn("Error creating reviewer notification:", err);
  }
}
