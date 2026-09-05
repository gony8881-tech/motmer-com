import type { ConferenceStatus } from "@/lib/supabase/types";

export type { ConferenceStatus };

/**
 * النوع التطبيقي (Domain Type) للمؤتمر — camelCase، مصدر الحقيقة الوحيد
 * المستخدم داخل مكونات الواجهة والـ hooks. يُبنى من ConferenceRow عبر
 * conferenceService (mapRowToConference) ولا يُستخدم الصف الخام مباشرة في UI.
 */
export interface Conference {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  organizerName: string | null;
  location: string | null;
  startDate: string;
  endDate: string;
  submissionStart: string;
  submissionEnd: string;
  status: ConferenceStatus;
  scientificFields: string[];
  submissionConditions: string | null;
  contactEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

/** نسخة عامة من المؤتمر بدون الحقول الإدارية الحساسة (لصفحة /conference/:slug) */
export type PublicConference = Omit<Conference, "contactEmail">;
