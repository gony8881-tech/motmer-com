import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/layout";
import { Alert, Button, Card } from "@/components/ui";
import { useAuth } from "@/features/auth/context/AuthContext";
import { ROLE_LABELS_AR } from "@/features/auth/utils";
import { ROUTES } from "@/constants/routes";

export default function AccountPage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  async function handleLogout() {
    setSigningOut(true);
    try {
      await signOut();
      navigate(ROUTES.login, { replace: true });
    } finally {
      setSigningOut(false);
    }
  }

  if (!profile) {
    return (
      <PageContainer>
        <Alert tone="danger">تعذّر تحميل بيانات الحساب.</Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <h1 className="text-xl font-semibold text-primary-900">حسابي</h1>

        <Card className="flex flex-col gap-3">
          <div>
            <p className="text-sm text-primary-500">الاسم الكامل</p>
            <p className="text-sm font-medium text-primary-900">{profile.fullName || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-primary-500">البريد الإلكتروني</p>
            <p dir="ltr" className="text-sm font-medium text-primary-900">{profile.email}</p>
          </div>
          <div>
            <p className="text-sm text-primary-500">الدور</p>
            <p className="text-sm font-medium text-primary-900">{ROLE_LABELS_AR[profile.role]}</p>
          </div>
          <div>
            <p className="text-sm text-primary-500">حالة الحساب</p>
            <p className="text-sm font-medium text-primary-900">
              {profile.isActive ? "نشط" : "موقوف"}
            </p>
          </div>
        </Card>

        <Button variant="danger" disabled={signingOut} onClick={handleLogout}>
          {signingOut ? "جارٍ تسجيل الخروج..." : "تسجيل الخروج"}
        </Button>
      </div>
    </PageContainer>
  );
}
