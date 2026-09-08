/**
 * النوع التطبيقي (Domain Type) للمحكّم — camelCase، مطابق لجدول reviewers في قاعدة البيانات.
 * يُبنى من ReviewerRow عبر reviewerService (mapRowToReviewer).
 */
export interface Reviewer {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  affiliation: string | null;
  specialties: string[];
  isActive: boolean;
  invitedAt: string | null;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

