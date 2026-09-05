import { Link } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { PageContainer } from "@/components/layout";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Loading,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import {
  CONFERENCE_STATUS_LABELS_AR,
  computeDisplayStatus,
  useConferences,
} from "@/features/conferences";
import { useConferenceSubmissionsCount } from "@/features/submissions";
import { formatDateAr } from "@/utils/date";
import type { ConferenceStatus } from "@/types";

const STATUS_TONE: Record<ConferenceStatus, "neutral" | "success" | "warning"> = {
  DRAFT: "neutral",
  OPEN: "success",
  CLOSED: "warning",
};

/** عدد الأبحاث المقدَّمة لمؤتمر — مكوّن صغير منفصل لأن كل صف يحتاج استدعاء hook خاص به. */
function SubmissionsCountCell({ conferenceId }: { conferenceId: string }) {
  const { count, loading } = useConferenceSubmissionsCount(conferenceId);
  return <>{loading ? "…" : count ?? 0}</>;
}

export default function ConferenceListPage() {
  const { conferences, loading, error } = useConferences();

  return (
    <AdminLayout>
      <PageContainer>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary-900">المؤتمرات</h2>
          <Link to={ROUTES.admin.conferences.new}>
            <Button>+ إنشاء مؤتمر جديد</Button>
          </Link>
        </div>

        {loading && <Loading label="جارٍ تحميل المؤتمرات..." />}

        {!loading && error && (
          <Alert tone="danger">
            حدث خطأ أثناء تحميل بيانات المؤتمرات. يرجى المحاولة مرة أخرى.
            <div className="mt-1 text-xs text-red-500">{error}</div>
          </Alert>
        )}

        {!loading && !error && conferences.length === 0 && (
          <EmptyState title="لا توجد مؤتمرات حاليًا" description="ابدأ بإنشاء أول مؤتمر.">
            <Link to={ROUTES.admin.conferences.new} className="mt-4 inline-block">
              <Button>+ إنشاء مؤتمر جديد</Button>
            </Link>
          </EmptyState>
        )}

        {!loading && !error && conferences.length > 0 && (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>اسم المؤتمر</TableCell>
                <TableCell>تاريخ المؤتمر</TableCell>
                <TableCell>فترة استقبال الأبحاث</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell>عدد الأبحاث</TableCell>
                <TableCell>رابط التقديم</TableCell>
                <TableCell>إجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {conferences.map((conference) => {
                const displayStatus = computeDisplayStatus(
                  conference.status,
                  conference.submissionEnd
                );
                return (
                  <TableRow key={conference.id}>
                    <TableCell>{conference.title}</TableCell>
                    <TableCell>
                      {formatDateAr(conference.startDate)} — {formatDateAr(conference.endDate)}
                    </TableCell>
                    <TableCell>
                      {formatDateAr(conference.submissionStart)} —{" "}
                      {formatDateAr(conference.submissionEnd)}
                    </TableCell>
                    <TableCell>
                      <Badge tone={STATUS_TONE[displayStatus]}>
                        {CONFERENCE_STATUS_LABELS_AR[displayStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        to={ROUTES.admin.conferences.submissions(conference.id)}
                        className="text-primary-700 hover:underline"
                      >
                        <SubmissionsCountCell conferenceId={conference.id} />
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-primary-500" dir="ltr">
                        /conference/{conference.slug}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link
                        to={ROUTES.admin.conferences.detail(conference.id)}
                        className="text-sm font-medium text-primary-700 hover:underline"
                      >
                        عرض التفاصيل
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </PageContainer>
    </AdminLayout>
  );
}
