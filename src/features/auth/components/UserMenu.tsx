import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/context/AuthContext";
import { ROLE_LABELS_AR } from "@/features/auth/utils";
import { ROUTES } from "@/constants/routes";
import { Badge } from "@/components/ui/Badge";
import { AccountIcon, LogoutIcon } from "@/components/layout/NavIcons";
import { cn } from "@/lib/cn";

export function UserMenu() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  if (!profile) return null;

  async function handleLogout() {
    setSigningOut(true);
    try {
      await signOut();
      navigate(ROUTES.login, { replace: true });
    } finally {
      setSigningOut(false);
    }
  }

  const userInitial = profile.fullName?.trim().charAt(0) || profile.email?.charAt(0).toUpperCase() || "؟";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="قائمة المستخدم"
        className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-2.5 py-1.5 text-sm text-slate-700 shadow-subtle hover:bg-slate-50 hover:border-slate-300 active:scale-98 transition-all"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-xs font-bold text-primary-800 shadow-inner shrink-0">
          {userInitial}
        </span>
        <span className="hidden sm:inline font-medium text-slate-800 max-w-[140px] truncate">
          {profile.fullName || profile.email}
        </span>
        <svg
          className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", open && "rotate-180")}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            className={cn(
              "absolute left-0 z-50 mt-2 w-64 rounded-2xl border border-slate-200/90 bg-white p-3 text-sm shadow-elevated animate-scale-in"
            )}
          >
            {/* User Info Header */}
            <div className="p-2 bg-slate-50/80 rounded-xl mb-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-700 text-sm font-bold text-white shadow-sm shrink-0">
                  {userInitial}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 truncate leading-tight">
                    {profile.fullName || "مستخدم"}
                  </p>
                  <p dir="ltr" className="text-xs text-slate-500 truncate mt-0.5 text-right">
                    {profile.email}
                  </p>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">نوع الحساب:</span>
                <Badge tone="primary" dot>
                  {ROLE_LABELS_AR[profile.role]}
                </Badge>
              </div>
            </div>

            {/* Menu Actions */}
            <div className="flex flex-col gap-1 pt-1">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate(ROUTES.account);
                }}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-right text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors font-medium"
              >
                <AccountIcon className="h-4 w-4 text-slate-400" />
                <span>الملف الشخصي والحساب</span>
              </button>

              <button
                type="button"
                disabled={signingOut}
                onClick={handleLogout}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-right text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-colors font-medium"
              >
                <LogoutIcon className="h-4 w-4 text-rose-500" />
                <span>{signingOut ? "جارٍ تسجيل الخروج..." : "تسجيل الخروج"}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
