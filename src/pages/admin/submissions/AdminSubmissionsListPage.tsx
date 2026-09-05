import { Link, useParams } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { PageContainer } from "@/components/layout";
import { Alert, Badge, EmptyState, Loading, Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui";
import { useConference } from "@/features/conferences";
import { useConferenceSubmissions } from "@/features/submissions";
import { PAPER_STATUS_LABELS_AR, type PaperStatus } from "@/features/workflow";
import { formatDateAr } from "@/utils/date";
import { ROUTES } from "@/constants/routes";

export default function AdminSubmissionsListPage() {
  const { id } = useParams<{ id: string }>();
  const { conference, loading: loadingConference } = useConference(id);
  const { submissions, loading, error } = useConferenceSubmissions(id);

  return (
    <AdminLayout>
      <PageContainer>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary-900">
            الأبحاث المقدَّمة{conference ? ` — ${conference.title}` : ""}
          </h2>
        </div>

        {(loading || loadingConference) && <Loading label="جارٍ تحميل الأبحاث المقدَّمة..." />}

        {!loading && error && (
          <Alert tone="danger">
            حدث خطأ أثناء تحميل الأبحاث المقدَّمة. يرجى المحاولة مرة أخرى.
            <div className="mt-1 text-xs text-red-500">{error}</div>
          </Alert>
        )}

        {!loading && !error && submissions.length === 0 && (
          <EmptyState
            title="لا توجد أبحاث مقدَّمة بعد"
            description="ستظهر الأبحاث هنا فور تقديمها من رابط المؤتمر العام."
          />
        )}

        {!loading && !error && submissions.length > 0 && (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>رقم البحث</TableCell>
                <TableCell>عنوان البحث</TableCell>
                <TableCell>اسم الباحث</TableCell>
                <TableCell>المجال</TableCell>
                <TableCell>تاريخ التقديم</TableCell>
                <TableCell>الحالة</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <Link
                      to={ROUTES.admin.submissionDetail(submission.id)}
                      className="font-medium text-primary-700 hover:underline"
                      dir="ltr"
                    >
                      {submission.paperNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{submission.title}</TableCell>
                  <TableCell>{submission.researcherFullName}</TableCell>
                  <TableCell>{submission.scientificField}</TableCell>
                  <TableCell>{formatDateAr(submission.submittedAt)}</TableCell>
                  <TableCell>
                    <Badge>{PAPER_STATUS_LABELS_AR[submission.status as PaperStatus] ?? submission.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </PageContainer>
    </AdminLayout>
  );
}
