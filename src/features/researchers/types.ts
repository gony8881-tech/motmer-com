import type { PaperStatus } from "@/features/workflow";

/** بحث واحد ضمن لوحة "أبحاثي" الخاصة بالباحث الحالي (Phase 4). */
export interface MyPaperSummary {
  id: string;
  paperNumber: string;
  title: string;
  scientificField: string;
  status: PaperStatus;
  submittedAt: string;
  conferenceTitle: string;
}
