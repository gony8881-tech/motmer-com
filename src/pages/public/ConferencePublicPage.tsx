import { Link, useParams } from "react-router-dom";
import { PageContainer } from "@/components/layout";
import { Alert, Badge, Button, Card, Loading } from "@/components/ui";
import { computeDisplayStatus, useConferenceBySlug } from "@/features/conferences";
import { formatDateAr } from "@/utils/date";
import { ROUTES } from "@/constants/routes";

export default function ConferencePublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const { conference, loading, error, notFound } = useConferenceBySlug(slug);

  if (loading) {
    return (
      <PageContainer>
        <Loading label="جارٍ تحميل بيانات المؤتمر..." />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <Alert tone="danger">
          حدث خطأ أثناء تحميل بيانات المؤتمر. يرجى المحاولة مرة أخرى.
        </Alert>
      </PageContainer>
    );
  }

  if (notFound || !conference) {
    return (
      <PageContainer>
        <Alert tone="warning">لم يتم العثور على هذا المؤتمر.</Alert>
      </PageContainer>
    );
  }

  const displayStatus = computeDisplayStatus(conference.status, conference.submissionEnd);

  if (displayStatus === "DRAFT") {
    return (
      <PageContainer>
        <Card>
          <h1 className="mb-2 text-xl font-semibold text-primary-900">{conference.title}</h1>
          <Alert tone="info">هذا المؤتمر غير متاح حاليًا.</Alert>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-primary-900">{conference.title}</h1>
          {conference.organizerName && (
            <p className="mt-1 text-sm text-primary-600">{conference.organizerName}</p>
          )}
        </div>

        <Card className="flex flex-col gap-4">
          {conference.description && (
            <p className="text-sm text-primary-700">{conference.description}</p>
          )}
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-primary-500">المكان</dt>
              <dd>{conference.location || "—"}</dd>
            </div>
            <div>
              <dt className="text-primary-500">تاريخ المؤتمر</dt>
              <dd>
                {formatDateAr(conference.startDate)} — {formatDateAr(conference.endDate)}
              </dd>
            </div>
            <div>
              <dt className="text-primary-500">فترة استقبال الأبحاث</dt>
              <dd>
                {formatDateAr(conference.submissionStart)} —{" "}
                {formatDateAr(conference.submissionEnd)}
              </dd>
            </div>
          </dl>
          {conference.scientificFields.length > 0 && (
            <div>
              <p className="mb-1.5 text-sm text-primary-500">المجالات العلمية</p>
              <div className="flex flex-wrap gap-2">
                {conference.scientificFields.map((field) => (
                  <Badge key={field}>{field}</Badge>
                ))}
              </div>
            </div>
          )}
          {conference.submissionConditions && (
            <div>
              <p className="mb-1 text-sm text-primary-500">شروط التقديم</p>
              <p className="whitespace-pre-line text-sm text-primary-700">
                {conference.submissionConditions}
              </p>
            </div>
          )}
        </Card>

        <div>
          {displayStatus === "OPEN" ? (
            <Link to={ROUTES.publicConference.submit(conference.slug)}>
              <Button>ابدأ تقديم البحث</Button>
            </Link>
          ) : (
            <div className="flex flex-col gap-2">
              <Button disabled>ابدأ تقديم البحث</Button>
              <Alert tone="warning">انتهت فترة استقبال الأبحاث لهذا المؤتمر.</Alert>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
