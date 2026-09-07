import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/cn";

export interface BottomNavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

interface BottomNavProps {
  items: BottomNavItem[];
}

export function BottomNav({ items }: BottomNavProps) {
  return (
    <nav
      aria-label="التنقل السفلي"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-bottomNav pb-safe"
    >
      <div className="flex items-center justify-around px-2 py-1">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === "/admin" || item.href === "/researcher" || item.href === "/reviewer"}
            className={({ isActive }) =>
              cn(
                "relative flex flex-col items-center justify-center min-h-[52px] flex-1 py-1 px-1 rounded-xl transition-all duration-150 active:scale-95",
                isActive
                  ? "text-primary-700 font-semibold"
                  : "text-slate-400 hover:text-slate-600 font-medium"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                    isActive ? "bg-primary-50 text-primary-700" : "text-slate-400"
                  )}
                >
                  {item.icon}
                </div>
                <span className="text-[11px] tracking-tight mt-0.5 whitespace-nowrap">
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0.5 h-1 w-6 bg-primary-600 rounded-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
