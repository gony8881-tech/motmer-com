/** قيم نموذج إضافة/تعديل المحكّم من الواجهة */
export interface ReviewerFormValues {
  fullName: string;
  email: string;
  phone: string;
  affiliation: string;
  specialties: string[];
  isActive: boolean;
}

export const EMPTY_REVIEWER_FORM: ReviewerFormValues = {
  fullName: "",
  email: "",
  phone: "",
  affiliation: "",
  specialties: [],
  isActive: true,
};

/** أخطاء التحقق لكل حقل في نموذج المحكّم — نص عربي أو undefined إن كان الحقل صحيحًا */
export type ReviewerFormErrors = Partial<Record<keyof ReviewerFormValues, string>>;

/** ملخص البحث المعيّن للمحكّم لعرضه في لوحة المحكّم */
export interface ReviewerAssignedPaper {
  id: string;
  paperNumber: string;
  conferenceId: string;
  conferenceTitle: string;
  title: string;
  abstract: string;
  scientificField: string;
  keywords: string[];
  status: string;
  submittedAt: string;
}

