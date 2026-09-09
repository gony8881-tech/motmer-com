import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
  getSubmissionById,
  type SubmissionDetail,
} from "@/features/submissions/services/submissionService";

interface UseSubmissionDetailResult {
  detail: SubmissionDetail | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
  reload: () => void;
  setDetail: Dispatch<SetStateAction<SubmissionDetail | null>>;
}

export function useSubmissionDetail(paperId: string | undefined): UseSubmissionDetailResult {
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const reload = useCallback(() => {
    setReloadTrigger((prev) => prev + 1);
  }, []);

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
  }, [paperId, reloadTrigger]);

  return { detail, loading, error, notFound, reload, setDetail };
}
