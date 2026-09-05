import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/context/AuthContext";
import { ROLE_LABELS_AR } from "@/features/auth/utils";
import { ROUTES } from "@/constants/routes";
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

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md2 px-2 py-1.5 text-sm text-primary-800 hover:bg-primary-50"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
          {profile.fullName.trim().charAt(0) || "؟"}
        </span>
        <span className="hidden sm:inline">{profile.fullName || profile.email}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div
            className={cn(
              "absolute left-0 z-20 mt-2 w-60 rounded-md2 border border-primary-100 bg-white p-3 text-sm shadow-lg"
            )}
          >
            <p className="font-medium text-primary-900">{profile.fullName || "—"}</p>
            <p dir="ltr" className="mt-0.5 text-xs text-primary-500">{profile.email}</p>
            <p className="mt-1 text-xs text-primary-600">{ROLE_LABELS_AR[profile.role]}</p>

            <div className="mt-3 flex flex-col gap-1 border-t border-primary-100 pt-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate(ROUTES.account);
                }}
                className="rounded-md2 px-2 py-1.5 text-right text-primary-700 hover:bg-primary-50"
              >
                الملف الشخصي
              </button>
              <button
                type="button"
                disabled={signingOut}
                onClick={handleLogout}
                className="rounded-md2 px-2 py-1.5 text-right text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {signingOut ? "جارٍ تسجيل الخروج..." : "تسجيل الخروج"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
