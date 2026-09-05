/**
 * النوع التطبيقي (Domain Type) للباحث — camelCase، مطابق لجدول researchers.
 * يُبنى من ResearcherRow عبر submissionService (mapRowToResearcher).
 * ملاحظة: هذه المرحلة لا تشمل حساب/تسجيل دخول للباحث — هذا سجل بيانات فقط
 * يُنشأ تلقائيًا عند تقديم بحث من الرابط العام للمؤتمر (بدون Auth).
 */
export interface Researcher {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  organization: string | null;
  country: string | null;
  academicDegree: string | null;
  specialization: string | null;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}
