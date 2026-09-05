import { ReviewerLayout } from "@/layouts/ReviewerLayout";
import { PageContainer } from "@/components/layout";
import { EmptyState } from "@/components/ui";

export default function ReviewerAssignedPage() {
  return (
    <ReviewerLayout>
      <PageContainer>
        <h2 className="mb-6 text-lg font-semibold text-primary-900">الأبحاث المعيّنة</h2>
        <EmptyState
          title="لا توجد أبحاث معيّنة بعد"
          description="سيتم بناء نظام تعيين الأبحاث للمحكّمين والتحكيم في مرحلة قادمة (Phase 5)."
        />
      </PageContainer>
    </ReviewerLayout>
  );
}
