import type { PaperStatus } from "@/features/workflow";

/**
 * النوع التطبيقي (Domain Type) للبحث — camelCase، مطابق لجدول papers.
 * يُبنى من PaperRow عبر submissionService (mapRowToPaper).
 */
export interface Paper {
  id: string;
  paperNumber: string;
  conferenceId: string;
  researcherId: string;
  assignedReviewerId: string | null;
  title: string;
  abstract: string;
  scientificField: string;
  keywords: string[];
  status: PaperStatus;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

/** بحث مع بيانات الباحث المرتبط به (تُستخدم في لوحة الإدارة) */
export interface PaperWithResearcher extends Paper {
  researcherFullName: string;
  researcherEmail: string;
  assignedReviewerFullName?: string | null;
}
