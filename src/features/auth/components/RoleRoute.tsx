import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loading } from "@/components/ui";
import { useAuth } from "@/features/auth/context/AuthContext";
import type { Role } from "@/types";

interface RoleRouteProps {
  allow: Role[];
}

export function RoleRoute({ allow, children }: PropsWithChildren<RoleRouteProps>) {
  const { isAuthenticated, loading, role } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loading label="جارٍ التحقق من حالة الدخول..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
  }

  if (!role || !allow.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
