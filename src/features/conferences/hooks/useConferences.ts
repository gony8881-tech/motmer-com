import { useCallback, useEffect, useState } from "react";
import { getConferences } from "@/features/conferences/services/conferenceService";
import type { Conference } from "@/types";

interface UseConferencesResult {
  conferences: Conference[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useConferences(): UseConferencesResult {
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getConferences()
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
  }, [reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { conferences, loading, error, reload };
}
