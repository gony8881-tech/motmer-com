import { requireSupabase } from "@/lib/supabase/client";
import type {
  ReviewerPaperAssignmentView,
  ReviewReport,
  ReviewReportPayload,
  NotificationItem,
} from "@/types/reviewerWorkflow";

function sanitizeFileName(fileName: string): string {
  const trimmed = fileName.trim();
  const lastDot = trimmed.lastIndexOf(".");
  const base = lastDot > 0 ? trimmed.slice(0, lastDot) : trimmed;
  const ext = lastDot > 0 ? trimmed.slice(lastDot) : "";
  const safeBase = base.replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/-+/g, "-") || "attachment";
  return `${safeBase}${ext.toLowerCase()}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToAssignmentView(row: any): ReviewerPaperAssignmentView {
  return {
    assignmentId: row.assignment_id,
    paperId: row.paper_id,
    reviewerId: row.reviewer_id,
    assignmentStatus: row.assignment_status,
    invitationSentAt: row.invitation_sent_at,
    respondedAt: row.responded_at,
    declineReason: row.decline_reason,
    dueDate: row.due_date,
    extensionStatus: row.extension_status,
    extensionRequestedDays: row.extension_requested_days,
    extensionReason: row.extension_reason,
    extensionRequestedAt: row.extension_requested_at,
    extensionRespondedAt: row.extension_responded_at,
    assignmentCreatedAt: row.assignment_created_at,
    paperNumber: row.paper_number,
    paperTitle: row.paper_title,
    paperAbstract: row.paper_abstract,
    scientificField: row.scientific_field,
    keywords: row.keywords ?? [],
    paperStatus: row.paper_status,
    paperSubmittedAt: row.paper_submitted_at,
    conferenceId: row.conference_id,
    conferenceTitle: row.conference_title,
    reviewType: row.review_type,
    researcherId: row.researcher_id,
    researcherFullName: row.researcher_full_name,
    researcherEmail: row.researcher_email,
    researcherOrganization: row.researcher_organization,
    latestFilePath: row.latest_file_path,
    latestFileName: row.latest_file_name,
    reportId: row.report_id,
    reportStatus: row.report_status,
    reportRecommendation: row.report_recommendation,
    reportSubmittedAt: row.report_submitted_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToReport(row: any): ReviewReport {
  return {
    id: row.id,
    assignmentId: row.assignment_id,
    paperId: row.paper_id,
    reviewerId: row.reviewer_id,
    status: row.status,
    recommendation: row.recommendation,
    originalityScore: row.originality_score,
    methodologyScore: row.methodology_score,
    clarityScore: row.clarity_score,
    significanceScore: row.significance_score,
    overallScore: row.overall_score,
    commentsForAuthor: row.comments_for_author ?? "",
    confidentialCommentsForEditor: row.confidential_comments_for_editor ?? "",
    attachmentFilePath: row.attachment_file_path,
    attachmentFileName: row.attachment_file_name,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** جلب جميع تكليفات المحكّم عبر الـ View الآمن الذي يضمن حجب بيانات الباحث في Double-Blind */
export async function getReviewerWorkflowAssignments(
  reviewerId: string
): Promise<ReviewerPaperAssignmentView[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("reviewer_paper_assignments_view")
    .select("*")
    .eq("reviewer_id", reviewerId)
    .order("invitation_sent_at", { ascending: false });

  if (error) {
    throw new Error("حدث خطأ أثناء تحميل تكليفات التحكيم.");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => mapRowToAssignmentView(row));
}

/** جلب تفاصيل تكليف محدد للمحكّم */
export async function getReviewerAssignmentDetail(
  assignmentId: string
): Promise<ReviewerPaperAssignmentView | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("reviewer_paper_assignments_view")
    .select("*")
    .eq("assignment_id", assignmentId)
    .maybeSingle();

  if (error) {
    throw new Error("حدث خطأ أثناء تحميل تفاصيل التكليف.");
  }

  return data ? mapRowToAssignmentView(data) : null;
}

/** الرد على دعوة التحكيم بالقبول أو الاعتذار */
export async function respondToReviewerInvitation(
  assignmentId: string,
  accept: boolean,
  declineReason?: string
): Promise<void> {
  const client = requireSupabase();
  const updates = accept
    ? {
        status: "ACCEPTED",
        responded_at: new Date().toISOString(),
        decline_reason: null,
      }
    : {
        status: "DECLINED",
        responded_at: new Date().toISOString(),
        decline_reason: declineReason?.trim() || "اعتذار عن التحكيم",
      };

  const { error } = await client
    .from("paper_reviewer_assignments")
    .update(updates)
    .eq("id", assignmentId);

  if (error) {
    throw new Error("تعذّر حفظ ردك على الدعوة. يرجى المحاولة مرة أخرى.");
  }
}

/** طلب تمديد مهلة التحكيم مع ذكر الأيام والسبب */
export async function requestAssignmentExtension(
  assignmentId: string,
  requestedDays: number,
  reason: string
): Promise<void> {
  const client = requireSupabase();
  const { error } = await client
    .from("paper_reviewer_assignments")
    .update({
      extension_status: "PENDING",
      extension_requested_days: requestedDays,
      extension_reason: reason.trim(),
      extension_requested_at: new Date().toISOString(),
    })
    .eq("id", assignmentId);

  if (error) {
    throw new Error("تعذّر إرسال طلب تمديد المهلة. يرجى المحاولة مرة أخرى.");
  }
}

/** جلب تقرير التحكيم لتكليف معين إن وُجد */
export async function getReviewReport(
  assignmentId: string
): Promise<ReviewReport | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("review_reports")
    .select("*")
    .eq("assignment_id", assignmentId)
    .maybeSingle();

  if (error) {
    throw new Error("تعذّر تحميل تقرير التحكيم.");
  }

  return data ? mapRowToReport(data) : null;
}

/** حفظ تقرير التحكيم كمسودة أو إرساله نهائياً */
export async function saveReviewReport(
  assignmentId: string,
  paperId: string,
  reviewerId: string,
  payload: ReviewReportPayload,
  isSubmit: boolean
): Promise<ReviewReport> {
  const client = requireSupabase();
  const now = new Date().toISOString();

  const reportData = {
    assignment_id: assignmentId,
    paper_id: paperId,
    reviewer_id: reviewerId,
    status: isSubmit ? "SUBMITTED" : "DRAFT",
    recommendation: payload.recommendation,
    originality_score: payload.originalityScore,
    methodology_score: payload.methodologyScore,
    clarity_score: payload.clarityScore,
    significance_score: payload.significanceScore,
    overall_score: payload.overallScore,
    comments_for_author: payload.commentsForAuthor,
    confidential_comments_for_editor: payload.confidentialCommentsForEditor,
    attachment_file_path: payload.attachmentFilePath ?? null,
    attachment_file_name: payload.attachmentFileName ?? null,
    submitted_at: isSubmit ? now : null,
  };

  const { data, error } = await client
    .from("review_reports")
    .upsert(reportData, { onConflict: "assignment_id" })
    .select()
    .single();

  if (error) {
    throw new Error("تعذّر حفظ تقرير التحكيم. يرجى المحاولة مرة أخرى.");
  }

  // في حال الإرسال النهائي، نحدّث حالة التكليف إلى COMPLETED
  if (isSubmit) {
    await client
      .from("paper_reviewer_assignments")
      .update({ status: "COMPLETED" })
      .eq("id", assignmentId);
  }

  return mapRowToReport(data);
}

/** رفع ملف مرفق مع تقرير التحكيم (نسخة معلّق عليها PDF) */
export async function uploadReviewAttachment(
  assignmentId: string,
  file: File
): Promise<{ filePath: string; fileName: string }> {
  const client = requireSupabase();
  const safeName = sanitizeFileName(file.name);
  const path = `reviews/${assignmentId}/${Date.now()}-${safeName}`;

  const lowerExt = file.name.toLowerCase();
  const normalizedContentType = lowerExt.endsWith(".pdf")
    ? "application/pdf"
    : lowerExt.endsWith(".docx")
    ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    : lowerExt.endsWith(".doc")
    ? "application/msword"
    : file.type || undefined;

  const { error } = await client.storage
    .from("papers")
    .upload(path, file, { contentType: normalizedContentType, upsert: true });

  if (error) {
    throw new Error("تعذّر رفع الملف المرفق. يرجى التأكد من صلاحية الملف والمحاولة مرة أخرى.");
  }

  return { filePath: path, fileName: file.name };
}

/** جلب إشعارات المستخدم */
export async function getUserNotifications(userId: string): Promise<NotificationItem[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    type: row.type,
    link: row.link,
    isRead: row.is_read,
    createdAt: row.created_at,
  }));
}

/** تعليم الإشعار كمقروء */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const client = requireSupabase();
  await client
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);
}
