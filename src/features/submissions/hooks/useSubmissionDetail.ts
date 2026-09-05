import { useEffect, useState } from "react";
import {
  getSubmissionById,
  type SubmissionDetail,
} from "@/features/submissions/services/submissionService";

interface UseSubmissionDetailResult {
  detail: SubmissionDetail | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
}

export function useSubmissionDetail(paperId: string | undefined): UseSubmissionDetailResult {
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!paperId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotFound(false);

    getSubmissionById(paperId)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setNotFound(true);
        } else {
          setDetail(data);
        }
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
  }, [paperId]);

  return { detail, loading, error, notFound };
}
