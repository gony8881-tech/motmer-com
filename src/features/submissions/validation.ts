import type {
  PaperFormErrors,
  PaperFormValues,
  ResearcherFormErrors,
  ResearcherFormValues,
} from "@/features/submissions/types";
import {
  ALLOWED_FILE_EXTENSIONS,
  ALLOWED_FILE_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "@/features/submissions/types";

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** تحقق من صحة بيانات الباحث (الخطوة 1). كائن فارغ ({}) يعني أن النموذج صالح. */
export function validateResearcherForm(values: ResearcherFormValues): ResearcherFormErrors {
  const errors: ResearcherFormErrors = {};

  if (!values.fullName.trim()) {
    errors.fullName = "الاسم الكامل مطلوب.";
  }

  if (!values.email.trim()) {
    errors.email = "البريد الإلكتروني مطلوب.";
  } else if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = "صيغة البريد الإلكتروني غير صحيحة.";
  }

  return errors;
}

export function isResearcherFormValid(errors: ResearcherFormErrors): boolean {
  return Object.keys(errors).length === 0;
}

/** تحقق من صحة بيانات البحث (الخطوة 2). كائن فارغ ({}) يعني أن النموذج صالح. */
export function validatePaperForm(values: PaperFormValues): PaperFormErrors {
  const errors: PaperFormErrors = {};

  if (!values.title.trim()) {
    errors.title = "عنوان البحث مطلوب.";
  }

  if (!values.abstract.trim()) {
    errors.abstract = "ملخص البحث مطلوب.";
  }

  if (!values.scientificField.trim()) {
    errors.scientificField = "المجال العلمي مطلوب.";
  }

  return errors;
}

export function isPaperFormValid(errors: PaperFormErrors): boolean {
  return Object.keys(errors).length === 0;
}

/** تحقق من صحة الملف المختار قبل رفعه (نوع الملف والحجم). null يعني أن الملف صالح. */
export function validateSubmissionFile(file: File): string | null {
  const lowerName = file.name.toLowerCase();
  const hasAllowedExtension = ALLOWED_FILE_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

  // على الهواتف الذكية ومتصفحات المحمول، قد يُرسل الملف بدون نوع محدد أو بنوع عام كـ application/octet-stream
  const hasAllowedMime =
    file.type === "" ||
    (ALLOWED_FILE_MIME_TYPES as readonly string[]).includes(file.type) ||
    file.type === "application/octet-stream";

  if (!hasAllowedExtension) {
    return "صيغة الملف غير مدعومة. يرجى رفع ملف بصيغة PDF أو Word (.pdf, .doc, .docx).";
  }

  if (!hasAllowedMime) {
    return "نوع الملف غير مدعوم. يرجى التأكد من اختيار مستند PDF أو Word صالح.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "حجم الملف أكبر من الحد المسموح (10 ميجابايت). يرجى اختيار ملف أصغر.";
  }

  if (file.size <= 0) {
    return "الملف فارغ أو غير صالح.";
  }

  return null;
}
