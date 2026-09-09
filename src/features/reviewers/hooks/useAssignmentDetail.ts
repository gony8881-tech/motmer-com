import { useState, useEffect, useCallback } from "react";
import {
  getReviewerAssignmentDetail,
  getReviewReport,
  respondToReviewerInvitation,
  requestAssignmentExtension,
} from "../services/reviewerWorkflowService";
import type {
  ReviewerPaperAssignmentView,
  ReviewReport,
} from "@/types/reviewerWorkflow";

export interface UseAssignmentDetailResult {
  assignment: ReviewerPaperAssignmentView | null;
  report: ReviewReport | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  respond: (accept: boolean, declineReason?: string) => Promise<void>;
  requestExtension: (days: number, reason: string) => Promise<void>;
}

export function useAssignmentDetail(assignmentId: string): UseAssignmentDetailResult {
  const [assignment, setAssignment] = useState<ReviewerPaperAssignmentView | null>(null);
  const [report, setReport] = useState<ReviewReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!assignmentId) return;

    setLoading(true);
    setError(null);
    try {
      const [assignmentData, reportData] = await Promise.all([
        getReviewerAssignmentDetail(assignmentId),
        getReviewReport(assignmentId),
      ]);
      setAssignment(assignmentData);
      setReport(reportData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر تحميل تفاصيل التكليف.");
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const respond = useCallback(
    async (accept: boolean, declineReason?: string) => {
      await respondToReviewerInvitation(assignmentId, accept, declineReason);
      await loadData();
    },
    [assignmentId, loadData]
  );

  const requestExtension = useCallback(
    async (days: number, reason: string) => {
      await requestAssignmentExtension(assignmentId, days, reason);
      await loadData();
    },
    [assignmentId, loadData]
  );

  return {
    assignment,
    report,
    loading,
    error,
    reload: loadData,
    respond,
    requestExtension,
  };
}
