import type { Role } from "@/types/role";

export interface Notification {
  id: string;
  recipientId: string;
  recipientRole: Role;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
