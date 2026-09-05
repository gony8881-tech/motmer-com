import { useEffect, useState } from "react";
import { getConferenceById } from "@/features/conferences/services/conferenceService";
import type { Conference } from "@/types";

interface UseConferenceResult {
  conference: Conference | null;
  loading: boolean;
  error: string | null;
}

export function useConference(id: string | undefined): UseConferenceResult {
  const [conference, setConference] = useState<Conference | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getConferenceById(id)
      .then((data) => {
        if (!cancelled) setConference(data);
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
  }, [id]);

  return { conference, loading, error };
}
