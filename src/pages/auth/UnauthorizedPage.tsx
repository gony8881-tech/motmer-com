import { Link } from "react-router-dom";
import { PageContainer } from "@/components/layout";
import { Alert, Button, Card } from "@/components/ui";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getRoleDashboardPath } from "@/features/auth/utils";
import { ROUTES } from "@/constants/routes";

export default function UnauthorizedPage() {
  const { role } = useAuth();

  return (
    <PageContainer>
      <div className="mx-auto max-w-md">
        <Card className="flex flex-col gap-4 text-center">
          <h1 className="text-lg font-semibold text-primary-900">غير مصرَّح بالوصول</h1>
          <Alert tone="danger">ليس لديك صلاحية للوصول إلى هذه الصفحة.</Alert>
          <Link to={role ? getRoleDashboardPath(role) : ROUTES.login}>
            <Button className="w-full">العودة إلى لوحتي</Button>
          </Link>
        </Card>
      </div>
    </PageContainer>
  );
}
