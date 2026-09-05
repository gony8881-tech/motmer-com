export type ReviewDecision =
  | "ACCEPT"
  | "MINOR_REVISION"
  | "MAJOR_REVISION"
  | "REJECT";

export interface Review {
  id: string;
  paperId: string;
  reviewerId: string;
  decision?: ReviewDecision;
  comments?: string;
  reviewedAt?: string;
  createdAt: string;
}
