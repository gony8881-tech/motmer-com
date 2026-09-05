import type { Role } from "@/types/role";

export interface Reviewer {
  id: string;
  fullName: string;
  email: string;
  specialties: string[];
  isActive: boolean;
  role: Extract<Role, "REVIEWER">;
  createdAt: string;
}
