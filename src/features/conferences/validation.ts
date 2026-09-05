import type { ConferenceFormErrors, ConferenceFormValues } from "@/features/conferences/types";

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * تحقق من صحة نموذج إنشاء/تعديل المؤتمر. تُعيد كائن أخطاء بالعربية،
 * كائن فارغ ({}) يعني أن النموذج صالح بالكامل.
 */
export function validateConferenceForm(values: ConferenceFormValues): ConferenceFormErrors {
  const errors: ConferenceFormErrors = {};

  if (!values.title.trim()) {
    errors.title = "اسم المؤتمر مطلوب.";
  }

  if (!values.startDate) {
    errors.startDate = "تاريخ بداية المؤتمر مطلوب.";
  }

  if (!values.endDate) {
    errors.endDate = "تاريخ نهاية المؤتمر مطلوب.";
  } else if (values.startDate && values.endDate < values.startDate) {
    errors.endDate = "تاريخ نهاية المؤتمر لا يمكن أن يكون قبل تاريخ البداية.";
  }

  if (!values.submissionStart) {
    errors.submissionStart = "بداية استقبال الأبحاث مطلوبة.";
  }

  if (!values.submissionEnd) {
    errors.submissionEnd = "نهاية استقبال الأبحاث مطلوبة.";
  } else if (values.submissionStart && values.submissionEnd < values.submissionStart) {
    errors.submissionEnd = "نهاية استقبال الأبحاث لا يمكن أن تكون قبل بدايتها.";
  }

  if (values.contactEmail.trim() && !EMAIL_REGEX.test(values.contactEmail.trim())) {
    errors.contactEmail = "صيغة البريد الإلكتروني غير صحيحة.";
  }

  return errors;
}

export function isConferenceFormValid(errors: ConferenceFormErrors): boolean {
  return Object.keys(errors).length === 0;
}
