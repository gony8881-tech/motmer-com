import { ReviewerLayout } from "@/layouts/ReviewerLayout";
import { PageContainer } from "@/components/layout";
import { Card, EmptyState } from "@/components/ui";
import { useAuth } from "@/features/auth";

export default function ReviewerHome() {
  const { profile } = useAuth();
  const displayName = profile?.fullName || "المحكّم الفاضل";

  return (
    <ReviewerLayout>
      <PageContainer>
        <div className="mb-6">
          <Card className="p-6 bg-gradient-to-l from-primary-900 to-primary-800 text-white">
            <h2 className="text-xl font-bold">مرحباً بك، {displayName}</h2>
            <p className="mt-1.5 text-sm text-primary-100 leading-relaxed">
              أهلاً بك في بوابة تحكيم المؤتمرات العلمية. من هنا يمكنك متابعة الأبحاث المحالة إليك ومراجعتها وتقديم التقييمات العلمية.
            </p>
          </Card>
        </div>

        <h3 className="mb-4 text-base font-semibold text-slate-900">الأبحاث المسندة للتحكيم</h3>
        <EmptyState
          title="لا توجد أبحاث مكلف بها حالياً"
          description="عندما تقوم إدارة المؤتمر بإسناد أبحاث علمية إليك لتحكيمها، ستظهر في هذه الصفحة مباشرة."
        />
      </PageContainer>
    </ReviewerLayout>
  );
}
