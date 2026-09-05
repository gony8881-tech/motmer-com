export type Role = "ADMIN" | "RESEARCHER" | "REVIEWER";

export const ROLES: Record<Role, Role> = {
  ADMIN: "ADMIN",
  RESEARCHER: "RESEARCHER",
  REVIEWER: "REVIEWER",
};
