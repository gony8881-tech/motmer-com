import { ResearcherLayout } from "@/layouts/ResearcherLayout";
import { PageContainer } from "@/components/layout";
import { Badge, Card, EmptyState, Loading, Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useMyResearcherDashboard } from "@/features/researchers";
import { PAPER_STATUS_LABELS_AR } from "@/features/workflow";
import { formatDateAr } from "@/utils/date";

export default function ResearcherHome() {
  const { profile } = useAuth();
  const { papers, loading, error } = useMyResearcherDashboard();

  return (
    <ResearcherLayout>
      <PageContainer>
        <h2 className="mb-1 text-lg font-semibold text-primary-900">
          مرحبًا، {profile?.fullName || "باحث"}
        </h2>
        <p className="mb-6 text-sm text-primary-500">لوحة الباحث</p>

        <Card className="mb-6">
          <p className="text-sm text-primary-500">عدد الأبحاث المقدَّمة</p>
          <p className="mt-1 text-2xl font-semibold text-primary-900">{papers.length}</p>
        </Card>

        <h3 className="mb-3 text-sm font-semibold text-primary-800">أبحاثي</h3>

        {loading && <Loading label="جارٍ تحميل أبحاثك..." />}

        {!loading && error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && papers.length === 0 && (
          <EmptyState
            title="لا توجد أبحاث بعد"
            description="ابحث عن مؤتمر مفتوح من صفحة (تقديم بحث) وقدّم بحثك الأول."
          />
        )}

        {!loading && !error && papers.length > 0 && (
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
                  <TableCell>{paper.paperNumber}</TableCell>
                  <TableCell>{paper.title}</TableCell>
                  <TableCell>{paper.conferenceTitle}</TableCell>
                  <TableCell>{formatDateAr(paper.submittedAt)}</TableCell>
                  <TableCell>
                    <Badge>{PAPER_STATUS_LABELS_AR[paper.status]}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </PageContainer>
    </ResearcherLayout>
  );
}
