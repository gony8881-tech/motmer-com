import { Link, useParams } from "react-router-dom";
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
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              الأبحاث المقدَّمة{conference ? ` — ${conference.title}` : ""}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              استعراض وفرز الأبحاث المقدمة للمؤتمر العلمي ومتابعة مراحل التقييم
            </p>
          </div>
          {conference && (
            <Link to={ROUTES.admin.conferences.detail(conference.id)}>
              <Button variant="outline" size="sm">
                العودة للمؤتمر
              </Button>
            </Link>
          )}
        </div>

        {(loading || loadingConference) && <SkeletonTable rows={4} columns={7} />}

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
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>رقم البحث</TableCell>
                    <TableCell>عنوان البحث</TableCell>
                    <TableCell>اسم الباحث</TableCell>
                    <TableCell>المحكّم المعيّن</TableCell>
                    <TableCell>المجال</TableCell>
                    <TableCell>تاريخ التقديم</TableCell>
                    <TableCell>الحالة</TableCell>
                    <TableCell>إجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <span className="font-mono text-xs font-semibold text-slate-700" dir="ltr">
                          {submission.paperNumber}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">{submission.title}</TableCell>
                      <TableCell className="text-slate-600">{submission.researcherFullName}</TableCell>
                      <TableCell>
                        {submission.assignedReviewerFullName ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                            <span className="text-sm font-medium text-slate-800">
                              {submission.assignedReviewerFullName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-normal">لم يُعيَّن بعد</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-500">{submission.scientificField}</TableCell>
                      <TableCell className="text-slate-500">{formatDateAr(submission.submittedAt)}</TableCell>
                      <TableCell>
                        <Badge tone="primary" dot>
                          {PAPER_STATUS_LABELS_AR[submission.status as PaperStatus] ?? submission.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link
                          to={ROUTES.admin.submissionDetail(submission.id)}
                          className="text-sm font-medium text-primary-700 hover:text-primary-800 hover:underline"
                        >
                          عرض وتفاصيل
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {submissions.map((submission) => (
                <Card key={submission.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-primary-800 bg-primary-50 px-2 py-0.5 rounded-md">
                      #{submission.paperNumber}
                    </span>
                    <Badge tone="primary" dot>
                      {PAPER_STATUS_LABELS_AR[submission.status as PaperStatus] ?? submission.status}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {submission.title}
                  </h4>
                  <div className="text-xs space-y-1.5 pt-2 border-t border-slate-100 text-slate-500">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">الباحث:</span>
                      <span className="text-slate-700 font-medium">
                        {submission.researcherFullName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">المحكّم المعيّن:</span>
                      <span className="text-slate-700 font-medium">
                        {submission.assignedReviewerFullName || "لم يُعيَّن بعد"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">المجال العلمي:</span>
                      <span className="text-slate-700 font-medium">
                        {submission.scientificField}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">تاريخ التقديم:</span>
                      <span className="text-slate-700 font-medium">
                        {formatDateAr(submission.submittedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <Link to={ROUTES.admin.submissionDetail(submission.id)} className="w-full">
                      <Button size="sm" variant="secondary" className="w-full">
                        عرض وتفاصيل البحث
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </PageContainer>
    </AdminLayout>
  );
}
