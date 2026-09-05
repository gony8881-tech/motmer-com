import { useMemo } from "react";
import { mockConferences, mockPapers, mockResearchers, mockReviewers } from "@/mock/data";

/**
 * Hook مؤقت لاستهلاك الـ Mock Data أثناء بناء الهيكل.
 * المرحلة القادمة: استبداله بـ hooks حقيقية تتصل بـ services/api.
 */
export function useMockData() {
  return useMemo(
    () => ({
      conferences: mockConferences,
      researchers: mockResearchers,
      reviewers: mockReviewers,
      papers: mockPapers,
    }),
    []
  );
}
