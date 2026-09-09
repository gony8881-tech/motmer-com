export type AssignmentStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "COMPLETED"
  | "CANCELLED";

export type ExtensionStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

export type ReviewRecommendation =
  | "ACCEPT"
  | "MINOR_REVISION"
  | "MAJOR_REVISION"
  | "REJECT";

export type ReviewType = "DOUBLE_BLIND" | "SINGLE_BLIND" | "OPEN";

export const ASSIGNMENT_STATUS_LABELS_AR: Record<AssignmentStatus, string> = {
  PENDING: "بانتظار قبول الدعوة",
  ACCEPTED: "قيد التحكيم",
  DECLINED: "تم الاعتذار",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغى",
};

export const REVIEW_RECOMMENDATION_LABELS_AR: Record<ReviewRecommendation, string> = {
  ACCEPT: "قبول البحث دون تعديلات",
  MINOR_REVISION: "قبول مع تعديلات طفيفة",
  MAJOR_REVISION: "تعديلات جوهرية وإعادة تحكيم",
  REJECT: "رفض البحث",
};

export const REVIEW_TYPE_LABELS_AR: Record<ReviewType, string> = {
  DOUBLE_BLIND: "مراجعة مزدوجة التعمية (Double-Blind)",
  SINGLE_BLIND: "مراجعة أحادية التعمية (Single-Blind)",
  OPEN: "مراجعة مفتوحة (Open Review)",
};

/** صف مسترجع من reviewer_paper_assignments_view */
export interface ReviewerPaperAssignmentView {
  assignmentId: string;
  paperId: string;
  reviewerId: string;
  assignmentStatus: AssignmentStatus;
  invitationSentAt: string;
  respondedAt: string | null;
  declineReason: string | null;
  dueDate: string;
  extensionStatus: ExtensionStatus;
  extensionRequestedDays: number | null;
  extensionReason: string | null;
  extensionRequestedAt: string | null;
  extensionRespondedAt: string | null;
  assignmentCreatedAt: string;
  paperNumber: string;
  paperTitle: string;
  paperAbstract: string;
  scientificField: string;
  keywords: string[];
  paperStatus: string;
  paperSubmittedAt: string;
  conferenceId: string;
  conferenceTitle: string;
  reviewType: ReviewType;
  researcherId: string | null;
  researcherFullName: string | null;
  researcherEmail: string | null;
  researcherOrganization: string | null;
  latestFilePath: string | null;
  latestFileName: string | null;
  reportId: string | null;
  reportStatus: "DRAFT" | "SUBMITTED" | null;
  reportRecommendation: ReviewRecommendation | null;
  reportSubmittedAt: string | null;
}

export interface ReviewReport {
  id: string;
  assignmentId: string;
  paperId: string;
  reviewerId: string;
  status: "DRAFT" | "SUBMITTED";
  recommendation: ReviewRecommendation | null;
  originalityScore: number | null;
  methodologyScore: number | null;
  clarityScore: number | null;
  significanceScore: number | null;
  overallScore: number | null;
  commentsForAuthor: string;
  confidentialCommentsForEditor: string;
  attachmentFilePath: string | null;
  attachmentFileName: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewReportPayload {
  recommendation: ReviewRecommendation;
  originalityScore: number;
  methodologyScore: number;
  clarityScore: number;
  significanceScore: number;
  overallScore: number;
  commentsForAuthor: string;
  confidentialCommentsForEditor: string;
  attachmentFilePath?: string | null;
  attachmentFileName?: string | null;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}
