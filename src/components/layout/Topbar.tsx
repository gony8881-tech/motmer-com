import type { ReactNode } from "react";
import { MenuIcon } from "./NavIcons";

interface TopbarProps {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  onMenuClick?: () => void;
}

export function Topbar({ title, subtitle, rightSlot, onMenuClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-6">
      <div className="flex items-center gap-3 min-w-0">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="فتح القائمة الرئيسية"
            className="md:hidden flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 bg-slate-50/80 text-slate-700 hover:bg-slate-100 active:scale-95 transition-all shrink-0"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-400 truncate mt-0.5 hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {rightSlot}
      </div>
    </header>
  );
}
