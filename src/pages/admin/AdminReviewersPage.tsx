import { AdminLayout } from "@/layouts/AdminLayout";
import { PageContainer } from "@/components/layout";
import { EmptyState } from "@/components/ui";

export default function AdminReviewersPage() {
  return (
    <AdminLayout>
      <PageContainer>
        <h2 className="mb-6 text-lg font-semibold text-primary-900">المحكّمون</h2>
        <EmptyState
          title="سيتم تنفيذ إدارة المحكّمين لاحقًا"
          description="دعوة المحكّمين وتفعيلهم وتعيينهم للأبحاث ستُبنى في مرحلة قادمة (Phase 5)."
        />
      </PageContainer>
    </AdminLayout>
  );
}
