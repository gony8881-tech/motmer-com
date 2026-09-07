import { useCallback, useEffect, useState } from "react";
import { getReviewers } from "../services/reviewerService";
import type { Reviewer } from "@/types";

interface UseReviewersResult {
  reviewers: Reviewer[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useReviewers(): UseReviewersResult {
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getReviewers()
      .then((data) => {
        if (!cancelled) setReviewers(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { reviewers, loading, error, reload };
}
