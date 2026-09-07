import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/layout";
import { Alert, Badge, Button, Card } from "@/components/ui";
import { useAuth } from "@/features/auth/context/AuthContext";
import { ROLE_LABELS_AR, getRoleDashboardPath } from "@/features/auth/utils";
import { ROUTES } from "@/constants/routes";
import { formatDateAr } from "@/utils/date";
import { DashboardIcon, LogoutIcon } from "@/components/layout/NavIcons";

export default function AccountPage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  async function handleLogout() {
    setSigningOut(true);
    try {
      await signOut();
      navigate(ROUTES.login, { replace: true });
    } finally {
      setSigningOut(false);
    }
  }

  function handleCopyId() {
    if (!profile?.id) return;
    navigator.clipboard.writeText(profile.id).then(() => {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    });
  }

  if (!profile) {
    return (
      <PageContainer maxWidth="narrow">
        <Alert tone="danger">تعذّر تحميل بيانات الحساب.</Alert>
      </PageContainer>
    );
  }

  const userInitial =
    profile.fullName?.trim().charAt(0) || profile.email?.charAt(0).toUpperCase() || "؟";
  const dashboardPath = getRoleDashboardPath(profile.role);

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 pt-4 md:py-8">
      <PageContainer maxWidth="narrow">
        {/* Navigation / Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">الملف الشخصي والحساب</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              إدارة بياناتك الشخصية وحالة حسابك في المنصة
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(dashboardPath)}
            className="self-start sm:self-auto"
            leftIcon={<DashboardIcon className="h-4 w-4" />}
          >
            العودة للوحة التحكم
          </Button>
        </div>

        <div className="space-y-6">
          {/* User Hero Identity Card */}
          <Card className="relative overflow-hidden p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-right">
              {/* Avatar with status indicator */}
              <div className="relative shrink-0">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-700 to-primary-900 text-2xl font-bold text-white shadow-md ring-4 ring-primary-100">
                  {userInitial}
                </div>
                <span
                  title={profile.isActive ? "الحساب نشط" : "الحساب موقوف"}
                  className={`absolute -bottom-1 -left-1 h-5 w-5 rounded-full border-2 border-white ${
                    profile.isActive ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                />
              </div>

              {/* Basic Info */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{profile.fullName || "—"}</h2>
                  <Badge tone="primary" dot>
                    {ROLE_LABELS_AR[profile.role]}
                  </Badge>
                  <Badge tone={profile.isActive ? "success" : "danger"}>
                    {profile.isActive ? "نشط" : "موقوف"}
                  </Badge>
                </div>
                <p dir="ltr" className="text-sm font-medium text-slate-500">
                  {profile.email}
                </p>
                {profile.createdAt && (
                  <p className="text-xs text-slate-400">
                    عضو في المنصة منذ: {formatDateAr(profile.createdAt)}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Account Details Grid */}
          <Card className="p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
              بيانات الحساب التفصيلية
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-1 rounded-xl bg-slate-50/80 p-3.5 border border-slate-100">
                <span className="text-xs text-slate-400 font-medium">الاسم الكامل</span>
                <p className="text-sm font-semibold text-slate-800">{profile.fullName || "—"}</p>
              </div>

              {/* Email */}
              <div className="space-y-1 rounded-xl bg-slate-50/80 p-3.5 border border-slate-100">
                <span className="text-xs text-slate-400 font-medium">البريد الإلكتروني</span>
                <p dir="ltr" className="text-sm font-semibold text-slate-800 text-right">
                  {profile.email}
                </p>
              </div>

              {/* Role */}
              <div className="space-y-1 rounded-xl bg-slate-50/80 p-3.5 border border-slate-100">
                <span className="text-xs text-slate-400 font-medium">نوع الصلاحية / الدور</span>
                <div className="pt-0.5">
                  <Badge tone="primary">{ROLE_LABELS_AR[profile.role]}</Badge>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1 rounded-xl bg-slate-50/80 p-3.5 border border-slate-100">
                <span className="text-xs text-slate-400 font-medium">حالة الحساب</span>
                <p className="text-sm font-semibold text-slate-800">
                  {profile.isActive ? "نشط وجاهز للعمل" : "موقوف مؤقتًا"}
                </p>
              </div>

              {/* User ID */}
              <div className="sm:col-span-2 space-y-1 rounded-xl bg-slate-50/80 p-3.5 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">معرّف الحساب الفريد (UUID)</span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="text-xs text-primary-700 hover:text-primary-800 font-medium transition-colors"
                  >
                    {copiedId ? "تم النسخ بنجاح ✓" : "نسخ المعرّف"}
                  </button>
                </div>
                <p dir="ltr" className="text-xs font-mono text-slate-600 truncate text-right">
                  {profile.id}
                </p>
              </div>
            </div>
          </Card>

          {/* Actions & Security */}
          <Card className="p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-2">تسجيل الخروج والأمان</h3>
            <p className="text-xs text-slate-500 mb-5">
              يمكنك إنهاء جلستك الحالية على هذا المتصفح بأمان في أي وقت.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                variant="danger"
                isLoading={signingOut}
                onClick={handleLogout}
                leftIcon={<LogoutIcon className="h-4 w-4" />}
                className="w-full sm:w-auto"
              >
                {signingOut ? "جارٍ تسجيل الخروج..." : "تسجيل الخروج من الحساب"}
              </Button>
            </div>
          </Card>
        </div>
      </PageContainer>
    </div>
  );
}
