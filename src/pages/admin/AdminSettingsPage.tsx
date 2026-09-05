import { AdminLayout } from "@/layouts/AdminLayout";
import { PageContainer } from "@/components/layout";
import { EmptyState } from "@/components/ui";

export default function AdminSettingsPage() {
  return (
    <AdminLayout>
      <PageContainer>
        <h2 className="mb-6 text-lg font-semibold text-primary-900">الإعدادات</h2>
        <EmptyState
          title="لا توجد إعدادات بعد"
          description="ستُضاف إعدادات النظام العامة في مرحلة قادمة."
        />
      </PageContainer>
    </AdminLayout>
  );
}
