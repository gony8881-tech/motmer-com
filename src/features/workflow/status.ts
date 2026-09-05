/**
 * حالات دورة حياة البحث (Paper Lifecycle Status).
 * هذه المرحلة تُعرّف الحالات فقط — منطق الانتقال بين الحالات (State Machine / Transition Rules)
 * سيُبنى في مرحلة قادمة داخل هذا الملف أو ملفات مجاورة (transitions.ts, rules.ts).
 */
export const PAPER_STATUS = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  INITIAL_SCREENING: "INITIAL_SCREENING",
  INITIAL_SCREENING_REJECTED: "INITIAL_SCREENING_REJECTED",
  READY_FOR_REVIEW: "READY_FOR_REVIEW",
  UNDER_REVIEW: "UNDER_REVIEW",
  REVISION_REQUESTED: "REVISION_REQUESTED",
  REVISION_SUBMITTED: "REVISION_SUBMITTED",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  WITHDRAWN: "WITHDRAWN",
} as const;

export type PaperStatus = (typeof PAPER_STATUS)[keyof typeof PAPER_STATUS];

export const PAPER_STATUS_LABELS_AR: Record<PaperStatus, string> = {
  DRAFT: "مسودة",
  SUBMITTED: "تم الإرسال",
  INITIAL_SCREENING: "الفرز الأولي",
  INITIAL_SCREENING_REJECTED: "مرفوض في الفرز الأولي",
  READY_FOR_REVIEW: "جاهز للتحكيم",
  UNDER_REVIEW: "قيد التحكيم",
  REVISION_REQUESTED: "مطلوب تعديل",
  REVISION_SUBMITTED: "تم إرسال التعديل",
  ACCEPTED: "مقبول",
  REJECTED: "مرفوض",
  WITHDRAWN: "مسحوب",
};
