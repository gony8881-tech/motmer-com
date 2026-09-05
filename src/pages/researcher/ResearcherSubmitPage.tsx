import { Link } from "react-router-dom";
import { ResearcherLayout } from "@/layouts/ResearcherLayout";
import { PageContainer } from "@/components/layout";
import { Button, Card, EmptyState, Loading } from "@/components/ui";
import { useOpenConferences } from "@/features/conferences";
import { ROUTES } from "@/constants/routes";

export default function ResearcherSubmitPage() {
  const { conferences, loading, error } = useOpenConferences();

  return (
    <ResearcherLayout>
      <PageContainer>
        <h2 className="mb-1 text-lg font-semibold text-primary-900">تقديم بحث</h2>
        <p className="mb-6 text-sm text-primary-500">
          اختر مؤتمرًا مفتوحًا لاستقبال الأبحاث حاليًا للبدء بتقديم بحثك.
        </p>

        {loading && <Loading label="جارٍ تحميل المؤتمرات المفتوحة..." />}

        {!loading && error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && conferences.length === 0 && (
          <EmptyState
            title="لا توجد مؤتمرات مفتوحة للتقديم حاليًا"
            description="يرجى التحقق لاحقًا عند فتح باب التقديم لمؤتمر جديد."
          />
        )}

        {!loading && !error && conferences.length > 0 && (
          <div className="flex flex-col gap-3">
            {conferences.map((conference) => (
              <Card key={conference.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-primary-900">{conference.title}</p>
                  <p className="text-xs text-primary-500">
                    التقديم متاح حتى {conference.submissionEnd}
                  </p>
                </div>
                <Link to={ROUTES.publicConference.submit(conference.slug)}>
                  <Button variant="secondary">ابدأ تقديم البحث</Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </PageContainer>
    </ResearcherLayout>
  );
}
