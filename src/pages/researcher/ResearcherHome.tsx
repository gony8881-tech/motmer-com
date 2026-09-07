import { ResearcherLayout } from "@/layouts/ResearcherLayout";
import { PageContainer } from "@/components/layout";
import {
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
import { useAuth } from "@/features/auth/context/AuthContext";
import { useMyResearcherDashboard } from "@/features/researchers";
import { PAPER_STATUS_LABELS_AR } from "@/features/workflow";
import { formatDateAr } from "@/utils/date";
import { PapersIcon, SubmitIcon } from "@/components/layout/NavIcons";
import { ROUTES } from "@/constants/routes";
import { Link } from "react-router-dom";

export default function ResearcherHome() {
  const { profile } = useAuth();
  const { papers, loading, error } = useMyResearcherDashboard();

  return (
    <ResearcherLayout>
      <PageContainer>
        {/* Welcome Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              مرحبًا، {profile?.fullName || "باحثنا الكريم"} 👋
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              متابعة أبحاثك العلمية وحالات التحكيم والتقديم
            </p>
          </div>
          <Link to={ROUTES.researcher.submit} className="self-start sm:self-auto">
            <Button size="md" leftIcon={<SubmitIcon className="h-4 w-4" />}>
              تقديم بحث جديد
            </Button>
          </Link>
        </div>

        {/* Stat Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">إجمالي الأبحاث المقدَّمة</p>
              <p className="mt-1 text-2xl font-bold text-primary-800">{papers.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
              <PapersIcon className="h-6 w-6" />
            </div>
          </Card>
        </div>

        {/* Papers Section */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">قائمة أبحاثي</h3>
          {papers.length > 0 && (
            <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
              {papers.length} بحث
            </span>
          )}
        </div>

        {loading && <SkeletonTable rows={3} columns={5} />}

        {!loading && error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {!loading && !error && papers.length === 0 && (
          <EmptyState
            title="لا توجد أبحاث بعد"
            description="يمكنك تصفح المؤتمرات المتاحة والتقديم لبحثك العلمي الآن بسهولة."
          >
            <Link to={ROUTES.researcher.submit} className="mt-4 inline-block">
              <Button>تقديم بحث جديد الآن</Button>
            </Link>
          </EmptyState>
        )}

        {!loading && !error && papers.length > 0 && (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>رقم البحث</TableCell>
                    <TableCell>العنوان</TableCell>
                    <TableCell>المؤتمر</TableCell>
                    <TableCell>تاريخ التقديم</TableCell>
                    <TableCell>الحالة</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {papers.map((paper) => (
                    <TableRow key={paper.id}>
                      <TableCell className="font-mono text-xs font-semibold text-slate-700">
                        {paper.paperNumber}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">{paper.title}</TableCell>
                      <TableCell className="text-slate-600">{paper.conferenceTitle}</TableCell>
                      <TableCell className="text-slate-500">{formatDateAr(paper.submittedAt)}</TableCell>
                      <TableCell>
                        <Badge tone="primary" dot>{PAPER_STATUS_LABELS_AR[paper.status]}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {papers.map((paper) => (
                <Card key={paper.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-primary-800 bg-primary-50 px-2 py-0.5 rounded-md">
                      #{paper.paperNumber}
                    </span>
                    <Badge tone="primary" dot>{PAPER_STATUS_LABELS_AR[paper.status]}</Badge>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{paper.title}</h4>
                  <div className="text-xs space-y-1.5 pt-2 border-t border-slate-100 text-slate-500">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">المؤتمر:</span>
                      <span className="text-slate-700 font-medium truncate max-w-[200px]">
                        {paper.conferenceTitle}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">تاريخ التقديم:</span>
                      <span className="text-slate-700 font-medium">
                        {formatDateAr(paper.submittedAt)}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </PageContainer>
    </ResearcherLayout>
  );
}
