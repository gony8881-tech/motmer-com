import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/features/auth";
import { getAssignedPapersForReviewer } from "../services/reviewerService";
import type { ReviewerAssignedPaper } from "../types";

export interface UseReviewerAssignedPapersResult {
  papers: ReviewerAssignedPaper[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useReviewerAssignedPapers(): UseReviewerAssignedPapersResult {
  const { profile, loading: authLoading } = useAuth();
  const [papers, setPapers] = useState<ReviewerAssignedPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPapers = useCallback(async () => {
    if (authLoading) return;

    if (!profile?.reviewerId) {
      setPapers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getAssignedPapersForReviewer(profile.reviewerId);
      setPapers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر تحميل الأبحاث المسندة إليك.");
    } finally {
      setLoading(false);
    }
  }, [profile?.reviewerId, authLoading]);

  useEffect(() => {
    fetchPapers();
  }, [fetchPapers]);

  return { papers, loading: loading || authLoading, error, reload: fetchPapers };
}
