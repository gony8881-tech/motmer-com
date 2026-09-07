import { Link } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { PageContainer } from "@/components/layout";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  SkeletonTable,
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
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">المؤتمرات العلمية</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              إدارة المؤتمرات، فترات استقبال الأبحاث، ومتابعة المشاركات
            </p>
          </div>
          <Link to={ROUTES.admin.conferences.new} className="self-start sm:self-auto">
            <Button size="md">+ إنشاء مؤتمر جديد</Button>
          </Link>
        </div>

        {loading && <SkeletonTable rows={4} columns={6} />}

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
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
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
                        <TableCell className="font-medium text-slate-900">
                          {conference.title}
                        </TableCell>
                        <TableCell>
                          {formatDateAr(conference.startDate)} — {formatDateAr(conference.endDate)}
                        </TableCell>
                        <TableCell>
                          {formatDateAr(conference.submissionStart)} —{" "}
                          {formatDateAr(conference.submissionEnd)}
                        </TableCell>
                        <TableCell>
                          <Badge tone={STATUS_TONE[displayStatus]} dot>
                            {CONFERENCE_STATUS_LABELS_AR[displayStatus]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Link
                            to={ROUTES.admin.conferences.submissions(conference.id)}
                            className="font-bold text-primary-700 hover:underline"
                          >
                            <SubmissionsCountCell conferenceId={conference.id} />
                          </Link>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-slate-500" dir="ltr">
                            /conference/{conference.slug}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Link
                            to={ROUTES.admin.conferences.detail(conference.id)}
                            className="text-sm font-medium text-primary-700 hover:text-primary-800 hover:underline"
                          >
                            عرض التفاصيل
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-3.5">
              {conferences.map((conference) => {
                const displayStatus = computeDisplayStatus(
                  conference.status,
                  conference.submissionEnd
                );
                return (
                  <Card key={conference.id} className="p-4 space-y-3 hoverable">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">
                        {conference.title}
                      </h3>
                      <Badge tone={STATUS_TONE[displayStatus]} dot>
                        {CONFERENCE_STATUS_LABELS_AR[displayStatus]}
                      </Badge>
                    </div>

                    <div className="text-xs space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">تاريخ المؤتمر:</span>
                        <span className="text-slate-700 font-medium">
                          {formatDateAr(conference.startDate)} — {formatDateAr(conference.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">فترة استقبال الأبحاث:</span>
                        <span className="text-slate-700 font-medium">
                          {formatDateAr(conference.submissionStart)} — {formatDateAr(conference.submissionEnd)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">الأبحاث المقدَّمة:</span>
                        <Link
                          to={ROUTES.admin.conferences.submissions(conference.id)}
                          className="font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full hover:underline"
                        >
                          <SubmissionsCountCell conferenceId={conference.id} />
                        </Link>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-400 truncate font-mono" dir="ltr">
                        /conference/{conference.slug}
                      </span>
                      <Link to={ROUTES.admin.conferences.detail(conference.id)}>
                        <Button size="sm" variant="secondary">
                          عرض التفاصيل
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </PageContainer>
    </AdminLayout>
  );
}
