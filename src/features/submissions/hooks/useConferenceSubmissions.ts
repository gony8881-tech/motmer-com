import { useEffect, useState } from "react";
import {
  getConferenceSubmissionsCount,
  getSubmissionsForConference,
} from "@/features/submissions/services/submissionService";
import type { SubmissionListItem } from "@/features/submissions/types";

interface UseConferenceSubmissionsResult {
  submissions: SubmissionListItem[];
  loading: boolean;
  error: string | null;
}

/** قائمة الأبحاث المقدَّمة لمؤتمر معيّن — لصفحة /admin/conferences/:id/submissions */
export function useConferenceSubmissions(conferenceId: string | undefined): UseConferenceSubmissionsResult {
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conferenceId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getSubmissionsForConference(conferenceId)
      .then((data) => {
        if (!cancelled) setSubmissions(data);
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
  }, [conferenceId]);

  return { submissions, loading, error };
}

interface UseConferenceSubmissionsCountResult {
  count: number | null;
  loading: boolean;
  error: string | null;
}

/** عدد الأبحاث المقدَّمة لمؤتمر معيّن — لعرضه في /admin/conferences/:id */
export function useConferenceSubmissionsCount(
  conferenceId: string | undefined
): UseConferenceSubmissionsCountResult {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conferenceId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getConferenceSubmissionsCount(conferenceId)
      .then((data) => {
        if (!cancelled) setCount(data);
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
  }, [conferenceId]);

  return { count, loading, error };
}
