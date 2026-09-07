import { useState, type PropsWithChildren } from "react";
import {
  Sidebar,
  Topbar,
  BottomNav,
  MobileDrawer,
  DashboardIcon,
  ConferencesIcon,
  PapersIcon,
  ReviewersIcon,
  UsersIcon,
  SettingsIcon,
  AccountIcon,
} from "@/components/layout";
import { UserMenu } from "@/features/auth/components/UserMenu";
import { ROUTES } from "@/constants/routes";

export function AdminLayout({ children }: PropsWithChildren) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const navItems = [
    { label: "لوحة التحكم", href: ROUTES.admin.root, icon: <DashboardIcon /> },
    { label: "المؤتمرات", href: ROUTES.admin.conferences.list, icon: <ConferencesIcon /> },
    { label: "الأبحاث", href: ROUTES.admin.papers, icon: <PapersIcon /> },
    { label: "المحكمون", href: ROUTES.admin.reviewers, icon: <ReviewersIcon /> },
    { label: "المستخدمون", href: ROUTES.admin.users, icon: <UsersIcon /> },
    { label: "الإعدادات", href: ROUTES.admin.settings, icon: <SettingsIcon /> },
  ];

  const bottomNavItems = [
    { label: "الرئيسية", href: ROUTES.admin.root, icon: <DashboardIcon className="h-5 w-5" /> },
    { label: "المؤتمرات", href: ROUTES.admin.conferences.list, icon: <ConferencesIcon className="h-5 w-5" /> },
    { label: "المستخدمون", href: ROUTES.admin.users, icon: <UsersIcon className="h-5 w-5" /> },
    { label: "حسابي", href: ROUTES.account, icon: <AccountIcon className="h-5 w-5" /> },
  ];

  const drawerItems = [
    ...navItems,
    { label: "حسابي والملف الشخصي", href: ROUTES.account, icon: <AccountIcon /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50/70 text-slate-800 overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar
        title="إدارة المؤتمرات"
        subtitle="لوحة تحكم المدير"
        items={navItems}
      />

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="لوحة تحكم المدير"
        items={drawerItems}
        footerSlot={<UserMenu />}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-y-auto min-w-0">
        <Topbar
          title="لوحة تحكم المدير"
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
