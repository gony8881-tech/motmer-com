import type { PropsWithChildren } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { UserMenu } from "@/features/auth/components/UserMenu";
import { ROUTES } from "@/constants/routes";

/**
 * لوحة تحكم المدير — Layout بسيط، قابل للتوسع لاحقًا.
 * المرحلة الرابعة: "الأبحاث"/"المحكمون"/"الإعدادات" صفحات placeholder جاهزة
 * للتوسعة في مراحل قادمة (Phase 5+)، و"المستخدمون" لوحة عرض حقيقية للمستخدمين.
 */
export function AdminLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex h-screen">
      <Sidebar
        title="لوحة تحكم المدير"
        items={[
          { label: "لوحة التحكم", href: ROUTES.admin.root },
          { label: "المؤتمرات", href: ROUTES.admin.conferences.list },
          { label: "الأبحاث", href: ROUTES.admin.papers },
          { label: "المحكمون", href: ROUTES.admin.reviewers },
          { label: "المستخدمون", href: ROUTES.admin.users },
          { label: "الإعدادات", href: ROUTES.admin.settings },
        ]}
      />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Topbar title="لوحة تحكم المدير" rightSlot={<UserMenu />} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
