import type { Conference, Paper, Researcher, Reviewer } from "@/types";
import { PAPER_STATUS } from "@/features/workflow";

/**
 * بيانات تجريبية بسيطة جدًا — للتأكد من أن الهيكل العام يعمل فقط.
 * المرحلة القادمة: استبدالها ببيانات حقيقية قادمة من services/api.
 * ملاحظة (المرحلة الثالثة): تم تحديث الحقول هنا فقط لتطابق الأنواع الحالية
 * في @/types بعد تحديثها لمطابقة Supabase schema — لا علاقة لذلك بمنطق
 * تقديم البحث نفسه.
 */
export const mockConferences: Conference[] = [
  {
    id: "conf-1",
    title: "المؤتمر العلمي الدولي الأول للبحوث التمريضية",
    slug: "nursing-research-2026",
    description: "مؤتمر تجريبي لأغراض بناء الهيكل",
    organizerName: null,
    location: null,
    startDate: "2026-11-01",
    endDate: "2026-11-03",
    submissionStart: "2026-09-01",
    submissionEnd: "2026-10-15",
    status: "OPEN",
    scientificFields: [],
    submissionConditions: null,
    contactEmail: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
  },
];

export const mockResearchers: Researcher[] = [
  {
    id: "researcher-1",
    fullName: "باحث تجريبي",
    email: "researcher@example.com",
    phone: null,
    organization: "جامعة تجريبية",
    country: null,
    academicDegree: null,
    specialization: null,
    userId: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
  },
];

export const mockReviewers: Reviewer[] = [
  {
    id: "reviewer-1",
    fullName: "محكّم تجريبي",
    email: "reviewer@example.com",
    phone: null,
    affiliation: "جامعة الملك سعود",
    specialties: ["تمريض", "صحة عامة"],
    isActive: true,
    invitedAt: null,
    acceptedAt: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
  },
];


export const mockPapers: Paper[] = [
  {
    id: "paper-1",
    paperNumber: "PAPER-2026-00001",
    title: "بحث تجريبي للتأكد من عمل الهيكل",
    abstract: "ملخص تجريبي",
    conferenceId: "conf-1",
    researcherId: "researcher-1",
    scientificField: "تمريض",
    keywords: [],
    status: PAPER_STATUS.SUBMITTED,
    submittedAt: "2026-08-05T00:00:00.000Z",
    createdAt: "2026-08-05T00:00:00.000Z",
    updatedAt: "2026-08-05T00:00:00.000Z",
  },
];
