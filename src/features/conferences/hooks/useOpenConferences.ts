import { useEffect, useState } from "react";
import { getOpenConferencesForSubmission } from "@/features/conferences/services/conferenceService";
import type { PublicConference } from "@/types";

interface UseOpenConferencesResult {
  conferences: PublicConference[];
  loading: boolean;
  error: string | null;
}

/** المؤتمرات المفتوحة حاليًا لاستقبال الأبحاث — لصفحة "تقديم بحث" في لوحة الباحث. */
export function useOpenConferences(): UseOpenConferencesResult {
  const [conferences, setConferences] = useState<PublicConference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getOpenConferencesForSubmission()
      .then((data) => {
        if (!cancelled) setConferences(data);
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
  }, []);

  return { conferences, loading, error };
}
