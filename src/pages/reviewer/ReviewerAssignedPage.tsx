import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ReviewerLayout } from "@/layouts/ReviewerLayout";
import { PageContainer } from "@/components/layout";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  SkeletonTable,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui";
import {
  useReviewerWorkflowDashboard,
  getAssignmentStatusBadge,
  getDeadlineInfo,
  getReviewTypeBadge,
} from "@/features/reviewers";
import { ROUTES } from "@/constants/routes";

type TabFilter = "all" | "pending" | "active" | "completed";

export default function ReviewerAssignedPage() {
  const {
    assignments,
    pendingCount,
    activeCount,
    completedCount,
    loading,
    error,
    reload,
  } = useReviewerWorkflowDashboard();

  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAssignments = useMemo(() => {
    let list = assignments;

    if (activeTab === "pending") {
      list = list.filter((a) => a.assignmentStatus === "PENDING");
    } else if (activeTab === "active") {
      list = list.filter((a) => a.assignmentStatus === "ACCEPTED");
    } else if (activeTab === "completed") {
      list = list.filter((a) => a.assignmentStatus === "COMPLETED");
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          a.paperTitle.toLowerCase().includes(q) ||
          a.paperNumber.toLowerCase().includes(q) ||
          a.conferenceTitle.toLowerCase().includes(q) ||
          a.scientificField.toLowerCase().includes(q)
      );
    }

    return list;
  }, [assignments, activeTab, searchQuery]);

  return (
    <ReviewerLayout>
      <PageContainer>
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900">الأبحاث والتكليفات العلمية</h2>
              {assignments.length > 0 && (
                <span className="text-xs text-primary-800 bg-primary-50 border border-primary-200 px-2.5 py-0.5 rounded-full font-bold">
                  {assignments.length} بحث
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              متابعة الأوراق البحثية المحالة إليك للتحكيم، إدارة المواعيد النهائية، وتقديم التقارير
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => reload()}
            isLoading={loading}
            className="self-start sm:self-auto"
          >
            تحديث القائمة
          </Button>
        </div>

        {/* Tabs & Search Filter */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200 text-xs self-start overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === "all"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              الكل ({assignments.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("pending")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "pending"
                  ? "bg-white text-amber-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              بانتظار الرد ({pendingCount})
              {pendingCount > 0 && <span className="h-2 w-2 rounded-full bg-amber-500"></span>}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("active")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === "active"
                  ? "bg-white text-sky-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              قيد التحكيم ({activeCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("completed")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === "completed"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              مكتملة ({completedCount})
            </button>
          </div>

          {/* Search */}
          <div className="w-full sm:w-72">
            <Input
              placeholder="ابحث برقم البحث أو العنوان أو المؤتمر..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>

        {/* Content States */}
        {loading && <SkeletonTable rows={4} columns={6} />}

        {!loading && error && (
          <div className="mb-6">
            <Alert tone="danger">{error}</Alert>
          </div>
        )}

        {!loading && !error && assignments.length === 0 && (
          <EmptyState
            title="لا توجد أبحاث معيّنة بعد"
            description="عندما تقوم إدارة المؤتمر بإسناد أبحاث علمية إليك لتحكيمها، ستظهر في هذه الصفحة مباشرة مع كافة التفاصيل والملفات."
          />
        )}

        {!loading && !error && assignments.length > 0 && filteredAssignments.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <p className="text-xs text-slate-500">لا توجد نتائج مطابقة للتصفية أو البحث المحدد.</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActiveTab("all");
                setSearchQuery("");
              }}
              className="mt-2 text-primary-700 text-xs"
            >
              إعادة تعيين الفلترة
            </Button>
          </div>
        )}

        {!loading && !error && filteredAssignments.length > 0 && (
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
                  {filteredAssignments.map((item) => {
                    const statusBadge = getAssignmentStatusBadge(item.assignmentStatus);
                    const reviewTypeBadge = getReviewTypeBadge(item.reviewType);
                    const deadline = getDeadlineInfo(item.dueDate);

                    return (
                      <TableRow key={item.assignmentId}>
                        <TableCell className="font-mono text-xs font-semibold text-primary-900">
                          {item.paperNumber}
                        </TableCell>
                        <TableCell className="font-medium text-slate-900 max-w-sm">
                          <div className="font-bold text-slate-900 truncate" title={item.paperTitle}>
                            {item.paperTitle}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {item.scientificField}
                          </div>
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
                            <span className="text-xs text-slate-400 font-medium">مكتمل</span>
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
                            <Button size="sm" variant={item.assignmentStatus === "PENDING" ? "primary" : "outline"}>
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
              {filteredAssignments.map((item) => {
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
                        <Button size="sm" variant={item.assignmentStatus === "PENDING" ? "primary" : "outline"}>
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
