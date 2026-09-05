import type { ConferenceStatus } from "@/types";

export function computeDisplayStatus(
  storedStatus: ConferenceStatus,
  submissionEnd: string
): ConferenceStatus {
  if (storedStatus === "DRAFT") return "DRAFT";

  const todayIso = new Date().toISOString().slice(0, 10);
  if (submissionEnd < todayIso) return "CLOSED";

  return storedStatus;
}
