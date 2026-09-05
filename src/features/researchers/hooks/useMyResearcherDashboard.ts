import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import {
  getMyPapers,
  getMyResearcherRecord,
} from "@/features/researchers/services/researcherService";
import type { MyPaperSummary } from "@/features/researchers/types";

interface UseMyResearcherDashboardResult {
  papers: MyPaperSummary[];
  loading: boolean;
  error: string | null;
}

export function useMyResearcherDashboard(): UseMyResearcherDashboardResult {
  const { user } = useAuth();
  const [papers, setPapers] = useState<MyPaperSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getMyResearcherRecord()
      .then((researcher) => {
        if (!researcher) return [] as MyPaperSummary[];
        return getMyPapers(researcher.id);
      })
      .then((data) => {
        if (!cancelled) setPapers(data);
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
  }, [user]);

  return { papers, loading, error };
}
