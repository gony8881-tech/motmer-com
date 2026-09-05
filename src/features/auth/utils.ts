import { ROUTES } from "@/constants/routes";
import type { Role } from "@/types";

export const ROLE_LABELS_AR: Record<Role, string> = {
  ADMIN: "مدير النظام",
  RESEARCHER: "باحث",
  REVIEWER: "محكّم",
};

/** المسار الافتراضي للوحة كل دور — يُستخدم بعد تسجيل الدخول وعند إعادة التوجيه من "/" أو "/login". */
export function getRoleDashboardPath(role: Role): string {
  switch (role) {
    case "ADMIN":
      return ROUTES.admin.root;
    case "RESEARCHER":
      return ROUTES.researcher.root;
    case "REVIEWER":
      return ROUTES.reviewer.root;
    default:
      return ROUTES.home;
  }
}
