import type { PropsWithChildren } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { UserMenu } from "@/features/auth/components/UserMenu";
import { ROUTES } from "@/constants/routes";

export function ResearcherLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex h-screen">
      <Sidebar
        title="لوحة الباحث"
        items={[
          { label: "لوحتي", href: ROUTES.researcher.root },
          { label: "أبحاثي", href: ROUTES.researcher.root },
          { label: "تقديم بحث", href: ROUTES.researcher.submit },
          { label: "حسابي", href: ROUTES.account },
        ]}
      />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Topbar title="لوحة الباحث" rightSlot={<UserMenu />} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
