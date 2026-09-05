import { useState } from "react";
import { useParams } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { PageContainer } from "@/components/layout";
import { Alert, Badge, Card, Loading } from "@/components/ui";
import { useSubmissionDetail } from "@/features/submissions";
import { getPaperFileSignedUrl } from "@/features/submissions/services/submissionService";
import { PAPER_STATUS_LABELS_AR, type PaperStatus } from "@/features/workflow";
import { formatDateAr } from "@/utils/date";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} بايت`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} كيلوبايت`;
  return `${(kb / 1024).toFixed(1)} ميجابايت`;
}

export default function AdminSubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { detail, loading, error, notFound } = useSubmissionDetail(id);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function handleDownload(filePath: string, versionId: string) {
    setDownloadError(null);
    setDownloadingId(versionId);
    try {
      const url = await getPaperFileSignedUrl(filePath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "تعذّر إنشاء رابط التنزيل.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <AdminLayout>
      <PageContainer>
        {loading && <Loading label="جارٍ تحميل تفاصيل البحث..." />}

        {!loading && error && (
          <Alert tone="danger">
            حدث خطأ أثناء تحميل تفاصيل البحث. يرجى المحاولة مرة أخرى.
            <div className="mt-1 text-xs text-red-500">{error}</div>
          </Alert>
        )}

        {!loading && !error && (notFound || !detail) && (
          <Alert tone="warning">لم يتم العثور على هذا البحث.</Alert>
        )}

        {!loading && !error && detail && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 dir="ltr" className="text-lg font-semibold text-primary-900">
                {detail.paper.paperNumber}
              </h2>
              <Badge>
                {PAPER_STATUS_LABELS_AR[detail.paper.status as PaperStatus] ?? detail.paper.status}
              </Badge>
            </div>

            <Card className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-primary-800">بيانات البحث</h3>
              <div>
                <p className="text-primary-500">عنوان البحث</p>
                <p className="text-primary-900">{detail.paper.title}</p>
              </div>
              <div>
                <p className="text-primary-500">الملخص</p>
                <p className="whitespace-pre-line text-primary-700">{detail.paper.abstract}</p>
              </div>
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-primary-500">المجال العلمي</dt>
                  <dd>{detail.paper.scientificField}</dd>
                </div>
                <div>
                  <dt className="text-primary-500">الكلمات المفتاحية</dt>
                  <dd>{detail.paper.keywords.length > 0 ? detail.paper.keywords.join("، ") : "—"}</dd>
                </div>
                <div>
                  <dt className="text-primary-500">تاريخ التقديم</dt>
                  <dd>{formatDateAr(detail.paper.submittedAt)}</dd>
                </div>
              </dl>
            </Card>

            <Card className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-primary-800">بيانات الباحث</h3>
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-primary-500">الاسم</dt>
                  <dd>{detail.researcher.full_name}</dd>
                </div>
                <div>
                  <dt className="text-primary-500">البريد</dt>
                  <dd dir="ltr" className="text-right">{detail.researcher.email}</dd>
                </div>
                <div>
                  <dt className="text-primary-500">الهاتف</dt>
                  <dd>{detail.researcher.phone || "—"}</dd>
                </div>
                <div>
                  <dt className="text-primary-500">المؤسسة</dt>
                  <dd>{detail.researcher.organization || "—"}</dd>
                </div>
                <div>
                  <dt className="text-primary-500">الدولة</dt>
                  <dd>{detail.researcher.country || "—"}</dd>
                </div>
                <div>
                  <dt className="text-primary-500">الدرجة العلمية</dt>
                  <dd>{detail.researcher.academic_degree || "—"}</dd>
                </div>
                <div>
                  <dt className="text-primary-500">التخصص</dt>
                  <dd>{detail.researcher.specialization || "—"}</dd>
                </div>
              </dl>
            </Card>

            <Card className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-primary-800">ملف البحث والنسخ</h3>
              {downloadError && <Alert tone="danger">{downloadError}</Alert>}
              <div className="flex flex-col gap-2">
                {detail.versions.map((version) => (
                  <div
                    key={version.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md2 border border-primary-100 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium text-primary-900">
                        النسخة {version.version_number} — {version.file_name}
                      </p>
                      <p className="text-xs text-primary-500">
                        {formatFileSize(version.file_size)} — {formatDateAr(version.uploaded_at)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-sm font-medium text-primary-700 hover:underline disabled:opacity-50"
                      disabled={downloadingId === version.id}
                      onClick={() => handleDownload(version.file_path, version.id)}
                    >
                      {downloadingId === version.id ? "جارٍ التجهيز..." : "تنزيل"}
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </PageContainer>
    </AdminLayout>
  );
}
