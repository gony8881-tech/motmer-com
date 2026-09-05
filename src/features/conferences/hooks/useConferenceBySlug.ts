import { useEffect, useState } from "react";
import { getConferenceBySlug } from "@/features/conferences/services/conferenceService";
import type { PublicConference } from "@/types";

interface UseConferenceBySlugResult {
  conference: PublicConference | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
}

export function useConferenceBySlug(slug: string | undefined): UseConferenceBySlugResult {
  const [conference, setConference] = useState<PublicConference | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotFound(false);

    getConferenceBySlug(slug)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setNotFound(true);
        } else {
          setConference(data);
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
  }, [slug]);

  return { conference, loading, error, notFound };
}
