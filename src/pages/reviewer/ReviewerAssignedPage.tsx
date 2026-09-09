import { useState, useMemo } from "react";
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
import { useReviewerAssignedPapers } from "@/features/reviewers";
import { PAPER_STATUS_LABELS_AR } from "@/features/workflow";
import { formatDateAr } from "@/utils/date";

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

export default function ReviewerAssignedPage() {
  const { papers, loading, error, reload } = useReviewerAssignedPapers();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPapers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return papers;
    return papers.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.paperNumber.toLowerCase().includes(q) ||
        p.conferenceTitle.toLowerCase().includes(q) ||
        p.scientificField.toLowerCase().includes(q)
    );
  }, [papers, searchQuery]);

  return (
    <ReviewerLayout>
      <PageContainer>
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900">الأبحاث المعيّنة للتحكيم</h2>
              {papers.length > 0 && (
                <span className="text-xs text-primary-800 bg-primary-50 border border-primary-200 px-2.5 py-0.5 rounded-full font-bold">
                  {papers.length} بحث
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              قائمة الأبحاث العلمية المحالة إليك من إدارة المؤتمرات لإجراء التقييم العلمي
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

        {/* Search Bar */}
        {papers.length > 0 && (
          <div className="mb-6 max-w-md">
            <Input
              placeholder="ابحث برقم البحث أو العنوان أو المؤتمر..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-sm"
            />
          </div>
        )}

        {/* Loading / Error States */}
        {loading && <SkeletonTable rows={4} columns={6} />}

        {!loading && error && (
          <div className="mb-6">
            <Alert tone="danger">{error}</Alert>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && papers.length === 0 && (
          <EmptyState
            title="لا توجد أبحاث معيّنة بعد"
            description="عندما تقوم إدارة المؤتمر بإسناد أبحاث علمية إليك لتحكيمها، ستظهر في هذه الصفحة مباشرة مع كافة التفاصيل والملفات."
          />
        )}

        {/* Filter Empty */}
        {!loading && !error && papers.length > 0 && filteredPapers.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <p className="text-sm text-slate-500">لا توجد أبحاث مطابقة لكلمة البحث "{searchQuery}".</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="mt-2 text-primary-700"
            >
              إلغاء التصفية
            </Button>
          </div>
        )}

        {/* Data Views */}
        {!loading && !error && filteredPapers.length > 0 && (
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
                  {filteredPapers.map((paper) => (
                    <TableRow key={paper.id}>
                      <TableCell className="font-mono text-xs font-semibold text-primary-900">
                        {paper.paperNumber}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900 max-w-sm">
                        <div className="font-semibold text-slate-900 mb-0.5">{paper.title}</div>
                        {paper.abstract && (
                          <div className="text-xs text-slate-500 line-clamp-1" title={paper.abstract}>
                            {paper.abstract}
                          </div>
                        )}
                        {paper.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {paper.keywords.slice(0, 3).map((kw) => (
                              <span
                                key={kw}
                                className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        )}
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
            <div className="space-y-3.5 md:hidden">
              {filteredPapers.map((paper) => (
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

                  {paper.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {paper.keywords.map((kw) => (
                        <span
                          key={kw}
                          className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-2.5 border-t border-slate-100 flex flex-col gap-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">المؤتمر:</span>
                      <span className="font-medium text-slate-700 truncate max-w-[200px]">
                        {paper.conferenceTitle}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">المجال العلمي:</span>
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
