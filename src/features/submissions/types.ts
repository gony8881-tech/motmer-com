/** الحد الأقصى لحجم ملف البحث بالبايت (10 ميجابايت) — يجب أن يطابق القيد في 002_submission_schema.sql */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** امتدادات ملف البحث المسموحة */
export const ALLOWED_FILE_EXTENSIONS = [".pdf", ".doc", ".docx"] as const;

/** أنواع MIME المقابلة المسموحة (تحقق إضافي إلى جانب الامتداد مع دعم كامل للأجهزة المحمولة) */
export const ALLOWED_FILE_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-word",
  "application/x-msword",
  "application/octet-stream",
  "application/zip",
  "application/x-zip-compressed",
] as const;

/** سمة accept لعناصر رفع الملفات لضمان التوافق التام مع متصفحات الهواتف المحمولة والكمبيوتر */
export const FILE_INPUT_ACCEPT = [
  ...ALLOWED_FILE_EXTENSIONS,
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/octet-stream",
].join(",");

export type SubmissionStep = 1 | 2 | 3 | 4;

export const SUBMISSION_STEPS: { step: SubmissionStep; label: string }[] = [
  { step: 1, label: "البيانات الشخصية" },
  { step: 2, label: "بيانات البحث" },
  { step: 3, label: "رفع الملف" },
  { step: 4, label: "المراجعة والإرسال" },
];

/** بيانات الباحث (الخطوة 1) */
export interface ResearcherFormValues {
  fullName: string;
  email: string;
  phone: string;
  organization: string;
  country: string;
  academicDegree: string;
  specialization: string;
}

export const EMPTY_RESEARCHER_FORM: ResearcherFormValues = {
  fullName: "",
  email: "",
  phone: "",
  organization: "",
  country: "",
  academicDegree: "",
  specialization: "",
};

export type ResearcherFormErrors = Partial<Record<keyof ResearcherFormValues, string>>;

/** بيانات البحث (الخطوة 2) */
export interface PaperFormValues {
  title: string;
  abstract: string;
  scientificField: string;
  keywords: string[];
}

export const EMPTY_PAPER_FORM: PaperFormValues = {
  title: "",
  abstract: "",
  scientificField: "",
  keywords: [],
};

export type PaperFormErrors = Partial<Record<keyof PaperFormValues, string>>;

/** حالة رفع الملف (الخطوة 3) */
export type FileUploadStatus = "idle" | "uploading" | "uploaded" | "error";

export interface SelectedFileState {
  file: File | null;
  status: FileUploadStatus;
  /** المسار داخل bucket "papers" بعد الرفع الناجح */
  storagePath: string | null;
  errorMessage: string | null;
}

export const EMPTY_FILE_STATE: SelectedFileState = {
  file: null,
  status: "idle",
  storagePath: null,
  errorMessage: null,
};

/** الحالة الكاملة لمعالج التقديم عبر خطواته الأربع */
export interface SubmissionWizardState {
  step: SubmissionStep;
  researcher: ResearcherFormValues;
  paper: PaperFormValues;
  file: SelectedFileState;
  agreedToAccuracy: boolean;
}

export const EMPTY_WIZARD_STATE: SubmissionWizardState = {
  step: 1,
  researcher: EMPTY_RESEARCHER_FORM,
  paper: EMPTY_PAPER_FORM,
  file: EMPTY_FILE_STATE,
  agreedToAccuracy: false,
};

/** نتيجة تقديم ناجح — تُستخدم في صفحة النجاح */
export interface SubmissionResult {
  paperId: string;
  paperNumber: string;
}

/** صف مختصر لعرض الأبحاث في لوحة إدارة المؤتمر (/admin/conferences/:id/submissions) */
export interface SubmissionListItem {
  id: string;
  paperNumber: string;
  title: string;
  researcherFullName: string;
  assignedReviewerFullName?: string | null;
  scientificField: string;
  submittedAt: string;
  status: string;
}
