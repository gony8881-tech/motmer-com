import { useCallback, useEffect, useState } from "react";
import { getReviewerById } from "../services/reviewerService";
import type { Reviewer } from "@/types";

interface UseReviewerResult {
  reviewer: Reviewer | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useReviewer(id: string | undefined): UseReviewerResult {
  const [reviewer, setReviewer] = useState<Reviewer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getReviewerById(id)
      .then((data) => {
        if (!cancelled) setReviewer(data);
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
  }, [id, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { reviewer, loading, error, reload };
}
