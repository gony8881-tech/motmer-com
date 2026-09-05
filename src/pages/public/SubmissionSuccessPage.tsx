import { Link, useLocation, useParams } from "react-router-dom";
import { PageContainer } from "@/components/layout";
import { Alert, Button, Card } from "@/components/ui";
import { ROUTES } from "@/constants/routes";

interface SubmissionSuccessState {
  paperNumber?: string;
}

export default function SubmissionSuccessPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const state = (location.state as SubmissionSuccessState | null) ?? null;

  return (
    <PageContainer>
      <Card className="flex flex-col items-center gap-4 py-10 text-center">
        <h1 className="text-xl font-semibold text-emerald-700">تم تقديم البحث بنجاح</h1>
        <p className="text-sm text-primary-700">شكرًا لك على تقديم بحثك.</p>

        {state?.paperNumber ? (
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-primary-500">رقم البحث</span>
            <span dir="ltr" className="rounded-md2 bg-primary-50 px-4 py-2 text-lg font-semibold text-primary-900">
              {state.paperNumber}
            </span>
          </div>
        ) : (
          <Alert tone="info">
            تم تقديم البحث، لكن تعذّر عرض رقم البحث هنا (على سبيل المثال بعد إعادة تحميل الصفحة).
          </Alert>
        )}

        <p className="text-sm text-primary-600">
          سيتم التعامل مع البحث وفق إجراءات المؤتمر العلمي.
        </p>

        {slug && (
          <Link to={ROUTES.publicConference.detail(slug)}>
            <Button variant="secondary">العودة إلى صفحة المؤتمر</Button>
          </Link>
        )}
      </Card>
    </PageContainer>
  );
}
