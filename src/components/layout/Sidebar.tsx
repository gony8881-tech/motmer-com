import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/cn";
import { PlatformLogo } from "./NavIcons";

export interface SidebarItem {
  label: string;
  href: string;
  icon?: ReactNode;
  badge?: string | number;
}

interface SidebarProps {
  title: string;
  subtitle?: string;
  items: SidebarItem[];
  footerSlot?: ReactNode;
}

export function Sidebar({ title, subtitle, items, footerSlot }: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col h-full w-64 shrink-0 border-l border-slate-200/80 bg-white select-none">
      {/* Platform / Role Header */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary-50 text-primary-700 shrink-0">
          <PlatformLogo className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-slate-800 truncate leading-tight">{title}</h2>
          <p className="text-xs text-slate-400 truncate mt-0.5">{subtitle || "المنصة العلمية"}</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === "/admin" || item.href === "/researcher" || item.href === "/reviewer"}
            className={({ isActive }) =>
              cn(
                "group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 active:scale-98",
                isActive
                  ? "bg-primary-700 text-white shadow-sm font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3 min-w-0">
                  {item.icon && (
                    <span
                      className={cn(
                        "shrink-0 transition-colors",
                        isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700"
                      )}
                    >
                      {item.icon}
                    </span>
                  )}
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer / Account slot */}
      {footerSlot && (
        <div className="p-3 border-t border-slate-100 bg-slate-50/40">
          {footerSlot}
        </div>
      )}
    </aside>
  );
}
