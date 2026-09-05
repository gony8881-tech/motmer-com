import type { PropsWithChildren } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { UserMenu } from "@/features/auth/components/UserMenu";
import { ROUTES } from "@/constants/routes";

export function ReviewerLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex h-screen">
      <Sidebar
        title="لوحة المحكّم"
        items={[
          { label: "لوحتي", href: ROUTES.reviewer.root },
          { label: "الأبحاث المعيّنة", href: ROUTES.reviewer.assigned },
          { label: "حسابي", href: ROUTES.account },
        ]}
      />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Topbar title="لوحة المحكّم" rightSlot={<UserMenu />} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
