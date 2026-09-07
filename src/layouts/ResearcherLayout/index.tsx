import { useState, type PropsWithChildren } from "react";
import {
  Sidebar,
  Topbar,
  BottomNav,
  MobileDrawer,
  PapersIcon,
  SubmitIcon,
  AccountIcon,
} from "@/components/layout";
import { UserMenu } from "@/features/auth/components/UserMenu";
import { ROUTES } from "@/constants/routes";

export function ResearcherLayout({ children }: PropsWithChildren) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const navItems = [
    { label: "أبحاثي", href: ROUTES.researcher.root, icon: <PapersIcon /> },
    { label: "تقديم بحث جديد", href: ROUTES.researcher.submit, icon: <SubmitIcon /> },
    { label: "حسابي والملف الشخصي", href: ROUTES.account, icon: <AccountIcon /> },
  ];

  const bottomNavItems = [
    { label: "أبحاثي", href: ROUTES.researcher.root, icon: <PapersIcon className="h-5 w-5" /> },
    { label: "تقديم بحث", href: ROUTES.researcher.submit, icon: <SubmitIcon className="h-5 w-5" /> },
    { label: "حسابي", href: ROUTES.account, icon: <AccountIcon className="h-5 w-5" /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50/70 text-slate-800 overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar
        title="بوابة الباحثين"
        subtitle="إدارة وتقديم الأبحاث"
        items={navItems}
      />

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="بوابة الباحثين"
        items={navItems}
        footerSlot={<UserMenu />}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-y-auto min-w-0">
        <Topbar
          title="لوحة الباحث"
          rightSlot={<UserMenu />}
          onMenuClick={() => setIsDrawerOpen(true)}
        />
        <main className="flex-1 pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav items={bottomNavItems} />
    </div>
  );
}
