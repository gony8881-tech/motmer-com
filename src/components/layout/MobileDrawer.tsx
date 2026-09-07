import type { ReactNode } from "react";
import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/cn";
import { PlatformLogo, CloseIcon } from "./NavIcons";

export interface MobileDrawerItem {
  label: string;
  href: string;
  icon?: ReactNode;
}

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: MobileDrawerItem[];
  footerSlot?: ReactNode;
}

export function MobileDrawer({
  isOpen,
  onClose,
  title,
  items,
  footerSlot,
}: MobileDrawerProps) {
  // Prevent scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        aria-label="القائمة الجانبية للهاتف"
        className="relative z-10 w-72 max-w-[85vw] h-full bg-white shadow-drawer flex flex-col animate-slide-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <PlatformLogo className="h-7 w-7 text-primary-700" />
            <span className="font-bold text-sm text-slate-800">{title}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق القائمة"
            className="flex items-center justify-center h-9 w-9 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/admin" || item.href === "/researcher" || item.href === "/reviewer"}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3.5 py-3 rounded-xl2 text-sm font-medium transition-all duration-150 active:scale-98",
                  isActive
                    ? "bg-primary-700 text-white shadow-sm font-semibold"
                    : "text-slate-600 hover:bg-primary-50 hover:text-primary-800"
                )
              }
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              <span className="flex-1">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        {footerSlot && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/60 pb-safe">
            {footerSlot}
          </div>
        )}
      </aside>
    </div>
  );
}
