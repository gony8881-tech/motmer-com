import type { ConferenceStatus } from "@/types";

/** قيم نموذج إنشاء/تعديل المؤتمر كما تُدخل من الواجهة (قبل التحقق والتحويل) */
export interface ConferenceFormValues {
  title: string;
  description: string;
  organizerName: string;
  location: string;
  contactEmail: string;
  startDate: string;
  endDate: string;
  submissionStart: string;
  submissionEnd: string;
  scientificFields: string[];
  submissionConditions: string;
}

export const EMPTY_CONFERENCE_FORM: ConferenceFormValues = {
  title: "",
  description: "",
  organizerName: "",
  location: "",
  contactEmail: "",
  startDate: "",
  endDate: "",
  submissionStart: "",
  submissionEnd: "",
  scientificFields: [],
  submissionConditions: "",
};

/** أخطاء التحقق لكل حقل — نص عربي أو undefined إن كان الحقل صحيحًا */
export type ConferenceFormErrors = Partial<Record<keyof ConferenceFormValues, string>>;

export const CONFERENCE_STATUS_LABELS_AR: Record<ConferenceStatus, string> = {
  DRAFT: "مسودة",
  OPEN: "مفتوح لاستقبال الأبحاث",
  CLOSED: "مغلق",
};
