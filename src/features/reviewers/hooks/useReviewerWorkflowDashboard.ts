import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/features/auth";
import { getReviewerWorkflowAssignments } from "../services/reviewerWorkflowService";
import type { ReviewerPaperAssignmentView } from "@/types/reviewerWorkflow";

export interface UseReviewerWorkflowDashboardResult {
  assignments: ReviewerPaperAssignmentView[];
  pendingAssignments: ReviewerPaperAssignmentView[];
  activeAssignments: ReviewerPaperAssignmentView[];
  completedAssignments: ReviewerPaperAssignmentView[];
  pendingCount: number;
  activeCount: number;
  completedCount: number;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useReviewerWorkflowDashboard(): UseReviewerWorkflowDashboardResult {
  const { profile, loading: authLoading } = useAuth();
  const [assignments, setAssignments] = useState<ReviewerPaperAssignmentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    if (authLoading) return;

    if (!profile?.reviewerId) {
      setAssignments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getReviewerWorkflowAssignments(profile.reviewerId);
      setAssignments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر تحميل قائمة التكليفات.");
    } finally {
      setLoading(false);
    }
  }, [profile?.reviewerId, authLoading]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const pendingAssignments = useMemo(
    () => assignments.filter((a) => a.assignmentStatus === "PENDING"),
    [assignments]
  );

  const activeAssignments = useMemo(
    () => assignments.filter((a) => a.assignmentStatus === "ACCEPTED"),
    [assignments]
  );

  const completedAssignments = useMemo(
    () => assignments.filter((a) => a.assignmentStatus === "COMPLETED"),
    [assignments]
  );

  return {
    assignments,
    pendingAssignments,
    activeAssignments,
    completedAssignments,
    pendingCount: pendingAssignments.length,
    activeCount: activeAssignments.length,
    completedCount: completedAssignments.length,
    loading: loading || authLoading,
    error,
    reload: fetchAssignments,
  };
}
