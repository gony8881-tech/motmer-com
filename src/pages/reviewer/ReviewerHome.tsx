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
import { useReviewerAssignedPapers } from "@/features/reviewers";
import { PAPER_STATUS_LABELS_AR } from "@/features/workflow";
import { formatDateAr } from "@/utils/date";
import { ROUTES } from "@/constants/routes";
import { PapersIcon } from "@/components/layout/NavIcons";

function getStatusBadgeTone(status: string): "neutral" | "success" | "warning" | "danger" | "info" | "primary" {
  switch (status) {
    case "ACCEPTED":
      return "success";
    case "REJECTED":
    case "INITIAL_SCREENING_REJECTED":
      return "danger";
    case "UNDER_REVIEW":
    case "READY_FOR_REVIEW":
      return "info";
    case "REVISION_REQUESTED":
      return "warning";
    default:
      return "neutral";
  }
}

export default function ReviewerHome() {
  const { profile } = useAuth();
  const displayName = profile?.fullName || "المحكّم الفاضل";
  const { papers, loading, error } = useReviewerAssignedPapers();

  const underReviewCount = papers.filter((p) => p.status === "UNDER_REVIEW").length;

  return (
    <ReviewerLayout>
      <PageContainer>
        {/* Hero Welcome Card */}
        <div className="mb-6">
          <Card className="p-6 bg-gradient-to-l from-primary-900 to-primary-800 text-white shadow-md">
            <h2 className="text-xl font-bold">مرحباً بك، {displayName} 👋</h2>
            <p className="mt-1.5 text-sm text-primary-100 leading-relaxed max-w-3xl">
              أهلاً بك في بوابة تحكيم المؤتمرات العلمية. من هنا يمكنك متابعة الأبحاث المحالة إليك ومراجعتها وتقديم التقييمات العلمية.
            </p>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Card className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">إجمالي الأبحاث المسندة</p>
              <p className="mt-1 text-2xl font-bold text-primary-800">{papers.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
              <PapersIcon className="h-6 w-6" />
            </div>
          </Card>

          <Card className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">أبحاث قيد التحكيم حالياً</p>
              <p className="mt-1 text-2xl font-bold text-sky-700">{underReviewCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <span className="inline-flex h-3 w-3 rounded-full bg-sky-500 animate-pulse"></span>
            </div>
          </Card>
        </div>

        {/* Papers Section Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-800">الأبحاث المسندة للتحكيم</h3>
            {papers.length > 0 && (
              <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full font-medium">
                {papers.length} بحث
              </span>
            )}
          </div>
          {papers.length > 0 && (
            <Link to={ROUTES.reviewer.assigned}>
              <Button variant="ghost" size="sm">
                عرض جميع الأبحاث
              </Button>
            </Link>
          )}
        </div>

        {/* Content States */}
        {loading && <SkeletonTable rows={3} columns={5} />}

        {!loading && error && (
          <div className="mb-6">
            <Alert tone="danger">{error}</Alert>
          </div>
        )}

        {!loading && !error && papers.length === 0 && (
          <EmptyState
            title="لا توجد أبحاث مكلف بها حالياً"
            description="عندما تقوم إدارة المؤتمر بإسناد أبحاث علمية إليك لتحكيمها، ستظهر في هذه الصفحة مباشرة."
          />
        )}

        {!loading && !error && papers.length > 0 && (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>رقم البحث</TableCell>
                    <TableCell>عنوان البحث</TableCell>
                    <TableCell>المؤتمر</TableCell>
                    <TableCell>المجال العلمي</TableCell>
                    <TableCell>تاريخ الإحالة</TableCell>
                    <TableCell>الحالة</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {papers.map((paper) => (
                    <TableRow key={paper.id}>
                      <TableCell className="font-mono text-xs font-semibold text-primary-900">
                        {paper.paperNumber}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900 max-w-md">
                        <div className="truncate" title={paper.title}>
                          {paper.title}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm">
                        {paper.conferenceTitle}
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm">
                        {paper.scientificField}
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs">
                        {formatDateAr(paper.submittedAt)}
                      </TableCell>
                      <TableCell>
                        <Badge tone={getStatusBadgeTone(paper.status)} dot>
                          {PAPER_STATUS_LABELS_AR[paper.status as keyof typeof PAPER_STATUS_LABELS_AR] || paper.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-3 md:hidden">
              {papers.map((paper) => (
                <Card key={paper.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-primary-900 bg-primary-50 px-2 py-0.5 rounded">
                      {paper.paperNumber}
                    </span>
                    <Badge tone={getStatusBadgeTone(paper.status)} dot>
                      {PAPER_STATUS_LABELS_AR[paper.status as keyof typeof PAPER_STATUS_LABELS_AR] || paper.status}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm leading-snug">
                      {paper.title}
                    </h4>
                    {paper.abstract && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {paper.abstract}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex flex-col gap-1 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">المؤتمر:</span>
                      <span className="font-medium text-slate-700 truncate max-w-[200px]">
                        {paper.conferenceTitle}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">المجال:</span>
                      <span className="font-medium text-slate-700">{paper.scientificField}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">تاريخ الإحالة:</span>
                      <span className="text-slate-500">{formatDateAr(paper.submittedAt)}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </PageContainer>
    </ReviewerLayout>
  );
}
