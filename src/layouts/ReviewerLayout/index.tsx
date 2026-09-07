import { useState, type PropsWithChildren } from "react";
import {
  Sidebar,
  Topbar,
  BottomNav,
  MobileDrawer,
  DashboardIcon,
  ReviewersIcon,
  AccountIcon,
} from "@/components/layout";
import { UserMenu } from "@/features/auth/components/UserMenu";
import { ROUTES } from "@/constants/routes";

export function ReviewerLayout({ children }: PropsWithChildren) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const navItems = [
    { label: "لوحتي", href: ROUTES.reviewer.root, icon: <DashboardIcon /> },
    { label: "الأبحاث المعيّنة", href: ROUTES.reviewer.assigned, icon: <ReviewersIcon /> },
    { label: "حسابي والملف الشخصي", href: ROUTES.account, icon: <AccountIcon /> },
  ];

  const bottomNavItems = [
    { label: "لوحتي", href: ROUTES.reviewer.root, icon: <DashboardIcon className="h-5 w-5" /> },
    { label: "الأبحاث", href: ROUTES.reviewer.assigned, icon: <ReviewersIcon className="h-5 w-5" /> },
    { label: "حسابي", href: ROUTES.account, icon: <AccountIcon className="h-5 w-5" /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50/70 text-slate-800 overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar
        title="بوابة المحكّمين"
        subtitle="تقييم وتحكيم الأبحاث"
        items={navItems}
      />

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="بوابة المحكّمين"
        items={navItems}
        footerSlot={<UserMenu />}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-y-auto min-w-0">
        <Topbar
          title="لوحة المحكّم"
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
