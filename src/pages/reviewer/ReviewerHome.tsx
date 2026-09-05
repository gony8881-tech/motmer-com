import { ReviewerLayout } from "@/layouts/ReviewerLayout";
import { PageContainer } from "@/components/layout";
import { EmptyState } from "@/components/ui";

export default function ReviewerHome() {
  return (
    <ReviewerLayout>
      <PageContainer>
        <h2 className="mb-4 text-lg font-semibold text-primary-900">لوحة المحكّم</h2>
        <EmptyState
          title="لا توجد أبحاث مكلف بها بعد"
          description="سيتم بناء نظام التكليف والتحكيم في مرحلة قادمة."
        />
      </PageContainer>
    </ReviewerLayout>
  );
}
