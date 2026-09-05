import { Link } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { PageContainer } from "@/components/layout";
import { Button, EmptyState } from "@/components/ui";
import { ROUTES } from "@/constants/routes";

/**
 * لا توجد بعد صفحة أبحاث عامة تجمع كل المؤتمرات (خارج نطاق هذه المرحلة).
 * القائمة الحالية للأبحاث موجودة لكل مؤتمر على حدة عبر /admin/conferences/:id/submissions.
 */
export default function AdminPapersPage() {
  return (
    <AdminLayout>
      <PageContainer>
        <h2 className="mb-6 text-lg font-semibold text-primary-900">الأبحاث</h2>
        <EmptyState
          title="اختر مؤتمرًا لعرض أبحاثه"
          description="قائمة الأبحاث متاحة حاليًا من صفحة كل مؤتمر على حدة."
        />
        <Link to={ROUTES.admin.conferences.list} className="mt-4 inline-block">
          <Button variant="secondary">الذهاب إلى المؤتمرات</Button>
        </Link>
      </PageContainer>
    </AdminLayout>
  );
}
