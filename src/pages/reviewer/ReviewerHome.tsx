import { Link } from "react-router-dom";
import { ReviewerLayout } from "@/layouts/ReviewerLayout";
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
import { useAuth } from "@/features/auth";
import {
  useReviewerWorkflowDashboard,
  getAssignmentStatusBadge,
  getDeadlineInfo,
  getReviewTypeBadge,
} from "@/features/reviewers";
import { ROUTES } from "@/constants/routes";
import { PapersIcon } from "@/components/layout/NavIcons";

export default function ReviewerHome() {
  const { profile } = useAuth();
  const displayName = profile?.fullName || "المحكّم الفاضل";
  const {
    assignments,
    pendingCount,
    activeCount,
    completedCount,
    loading,
    error,
  } = useReviewerWorkflowDashboard();

  return (
    <ReviewerLayout>
      <PageContainer>
        {/* Hero Welcome Card */}
        <div className="mb-6">
          <Card className="p-6 bg-gradient-to-l from-primary-900 to-primary-800 text-white shadow-md">
            <h2 className="text-xl font-bold">مرحباً بك، {displayName} 👋</h2>
            <p className="mt-1.5 text-sm text-primary-100 leading-relaxed max-w-3xl">
              أهلاً بك في بوابة تحكيم المؤتمرات والمجلات العلمية. من هنا يمكنك إدارة الدعوات ومتابعة الأبحاث المحالة إليك وتقديم التقييمات العلمية الرصينة.
            </p>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">إجمالي التكليفات</p>
              <p className="mt-1 text-2xl font-bold text-primary-900">{assignments.length}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
              <PapersIcon className="h-5 w-5" />
            </div>
          </Card>

          <Card className={`p-4 flex items-center justify-between ${pendingCount > 0 ? "border-amber-300 bg-amber-50/40" : ""}`}>
            <div>
              <p className="text-xs font-medium text-slate-500">بانتظار قبولك</p>
              <p className={`mt-1 text-2xl font-bold ${pendingCount > 0 ? "text-amber-700 font-black" : "text-slate-800"}`}>
                {pendingCount}
              </p>
            </div>
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${pendingCount > 0 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
              <span className="font-bold text-sm">⏳</span>
            </div>
          </Card>

          <Card className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">قيد التحكيم</p>
              <p className="mt-1 text-2xl font-bold text-sky-700">{activeCount}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <span className="inline-flex h-3 w-3 rounded-full bg-sky-500 animate-pulse"></span>
            </div>
          </Card>

          <Card className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">أبحاث مكتملة</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{completedCount}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <span className="font-bold text-sm">✓</span>
            </div>
          </Card>
        </div>

        {/* Pending Invitations Alert Banner */}
        {pendingCount > 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-bold text-sm">
                !
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  لديك {pendingCount} {pendingCount === 1 ? "دعوة تحكيم جديدة" : "دعوات تحكيم جديدة"} بانتظار ردك
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  يرجى مراجعة ملخصات الأبحاث واتخاذ قرار القبول أو الاعتذار في أقرب وقت.
                </p>
              </div>
            </div>
            <Link to={ROUTES.reviewer.assigned}>
              <Button size="sm" variant="primary">
                مراجعة الدعوات الآن
              </Button>
            </Link>
          </div>
        )}

        {/* Assignments Section Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-800">الأبحاث والتكليفات المسندة</h3>
            {assignments.length > 0 && (
              <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full font-medium">
                {assignments.length} بحث
              </span>
            )}
          </div>
          {assignments.length > 0 && (
            <Link to={ROUTES.reviewer.assigned}>
              <Button variant="ghost" size="sm">
                عرض جميع الأبحاث
              </Button>
            </Link>
          )}
        </div>

        {/* Content States */}
        {loading && <SkeletonTable rows={3} columns={6} />}

        {!loading && error && (
          <div className="mb-6">
            <Alert tone="danger">{error}</Alert>
          </div>
        )}

        {!loading && !error && assignments.length === 0 && (
          <EmptyState
            title="لا توجد أبحاث مكلف بها حالياً"
            description="عندما تقوم إدارة المؤتمر بإسناد أبحاث علمية إليك لتحكيمها، ستظهر في هذه الصفحة مباشرة مع كافة التفاصيل والمهل الزمنية."
          />
        )}

        {!loading && !error && assignments.length > 0 && (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>رقم البحث</TableCell>
                    <TableCell>عنوان البحث</TableCell>
                    <TableCell>المؤتمر</TableCell>
                    <TableCell>نوع التحكيم</TableCell>
                    <TableCell>المهلة الزمنية</TableCell>
                    <TableCell>الحالة</TableCell>
                    <TableCell className="text-left">الإجراء</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignments.slice(0, 6).map((item) => {
                    const statusBadge = getAssignmentStatusBadge(item.assignmentStatus);
                    const reviewTypeBadge = getReviewTypeBadge(item.reviewType);
                    const deadline = getDeadlineInfo(item.dueDate);

                    return (
                      <TableRow key={item.assignmentId}>
                        <TableCell className="font-mono text-xs font-semibold text-primary-900">
                          {item.paperNumber}
                        </TableCell>
                        <TableCell className="font-medium text-slate-900 max-w-xs">
                          <div className="truncate font-semibold" title={item.paperTitle}>
                            {item.paperTitle}
                          </div>
                          <span className="text-[11px] text-slate-400">{item.scientificField}</span>
                        </TableCell>
                        <TableCell className="text-slate-600 text-xs">
                          {item.conferenceTitle}
                        </TableCell>
                        <TableCell>
                          <Badge tone={reviewTypeBadge.tone} className="text-[10px]">
                            {reviewTypeBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.assignmentStatus === "COMPLETED" ? (
                            <span className="text-xs text-slate-400">مكتمل</span>
                          ) : (
                            <Badge tone={deadline.tone} className="text-xs">
                              {deadline.label}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge tone={statusBadge.tone} dot>
                            {statusBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-left">
                          <Link to={ROUTES.reviewer.assignmentDetail(item.assignmentId)}>
                            <Button size="sm" variant="outline">
                              {item.assignmentStatus === "PENDING"
                                ? "الرد على الدعوة"
                                : item.assignmentStatus === "ACCEPTED"
                                ? "متابعة التحكيم"
                                : "عرض التفاصيل"}
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-3.5 md:hidden">
              {assignments.slice(0, 6).map((item) => {
                const statusBadge = getAssignmentStatusBadge(item.assignmentStatus);
                const reviewTypeBadge = getReviewTypeBadge(item.reviewType);
                const deadline = getDeadlineInfo(item.dueDate);

                return (
                  <Card key={item.assignmentId} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-primary-900 bg-primary-50 px-2 py-0.5 rounded">
                        {item.paperNumber}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Badge tone={reviewTypeBadge.tone} className="text-[10px]">
                          {reviewTypeBadge.label}
                        </Badge>
                        <Badge tone={statusBadge.tone} dot>
                          {statusBadge.label}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">
                        {item.paperTitle}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">{item.conferenceTitle}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400">المهلة: </span>
                        {item.assignmentStatus === "COMPLETED" ? (
                          <span className="text-slate-500 font-medium">مكتمل</span>
                        ) : (
                          <span className={`font-semibold ${deadline.isOverdue ? "text-red-600" : "text-slate-700"}`}>
                            {deadline.label}
                          </span>
                        )}
                      </div>
                      <Link to={ROUTES.reviewer.assignmentDetail(item.assignmentId)}>
                        <Button size="sm" variant="outline">
                          {item.assignmentStatus === "PENDING"
                            ? "الرد"
                            : item.assignmentStatus === "ACCEPTED"
                            ? "تحكيم"
                            : "تفاصيل"}
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
    </ReviewerLayout>
  );
}
