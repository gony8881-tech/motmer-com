import type { Role } from "@/types/role";

/**
 * النوع التطبيقي (Domain Type) لملف تعريف المستخدم — camelCase، مطابق لجدول profiles.
 * يُبنى من ProfileRow عبر authService (mapRowToProfile).
 */
export interface Profile {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  organizationId: string | null;
  reviewerId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
