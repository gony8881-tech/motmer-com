import type { ReviewerFormErrors, ReviewerFormValues } from "./types";

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * التحقق من صحة بيانات نموذج المحكّم.
 * تُعيد كائنًا بالأخطاء المكتشفة بالعربية، أو كائنًا فارغًا ({}) إذا كان النموذج صالحًا.
 */
export function validateReviewerForm(values: ReviewerFormValues): ReviewerFormErrors {
  const errors: ReviewerFormErrors = {};

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

export function isReviewerFormValid(errors: ReviewerFormErrors): boolean {
  return Object.keys(errors).length === 0;
}
