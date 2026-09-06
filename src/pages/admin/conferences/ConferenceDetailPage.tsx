import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { PageContainer } from "@/components/layout";
import { Alert, Badge, Button, Card, Loading } from "@/components/ui";
import {
  CONFERENCE_STATUS_LABELS_AR,
  computeDisplayStatus,
  updateConference,
  useConference,
} from "@/features/conferences";
import { useConferenceSubmissionsCount } from "@/features/submissions";
import { formatDateAr } from "@/utils/date";
import { canUseWebShare, copyToClipboard, shareLink } from "@/utils/share";
import { ROUTES } from "@/constants/routes";
import type { Conference, ConferenceStatus } from "@/types";

const STATUS_TONE: Record<ConferenceStatus, "neutral" | "success" | "warning"> = {
  DRAFT: "neutral",
  OPEN: "success",
  CLOSED: "warning",
};

function buildPublicUrl(slug: string): string {
  return `${window.location.origin}/conference/${slug}`;
}

export default function ConferenceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { conference: fetchedConference, loading, error } = useConference(id);
  const { count: submissionsCount, loading: loadingCount } = useConferenceSubmissionsCount(id);
  const [copied, setCopied] = useState(false);
  const [currentConference, setCurrentConference] = useState<Conference | null>(null);
  const [pendingStatus, setPendingStatus] = useState<ConferenceStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentConference(null);
    setStatusError(null);
  }, [id]);

  const conference = currentConference ?? fetchedConference;

  async function handleStatusChange(newStatus: ConferenceStatus) {
    if (!conference || pendingStatus !== null) return;
    setPendingStatus(newStatus);
    setStatusError(null);

    try {
      const updated = await updateConference(conference.id, { status: newStatus });
      setCurrentConference(updated);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تحديث حالة المؤتمر. يرجى المحاولة مرة أخرى.";
      setStatusError(message);
    } finally {
      setPendingStatus(null);
    }
  }

  async function handleCopy(url: string) {
    const ok = await copyToClipboard(url);
    setCopied(ok);
    if (ok) setTimeout(() => setCopied(false), 2500);
  }

  async function handleShare(url: string, title: string) {
    const shared = await shareLink(title, url);
    if (!shared) await handleCopy(url);
  }

  return (
    <AdminLayout>
      <PageContainer>
        {loading && <Loading label="جارٍ تحميل بيانات المؤتمر..." />}

        {!loading && error && (
          <Alert tone="danger">
            حدث خطأ أثناء تحميل بيانات المؤتمر. يرجى المحاولة مرة أخرى.
            <div className="mt-1 text-xs text-red-500">{error}</div>
          </Alert>
        )}

        {!loading && !error && !conference && (
          <Alert tone="warning">لم يتم العثور على هذا المؤتمر.</Alert>
        )}

        {!loading && !error && conference && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary-900">{conference.title}</h2>
              <Badge tone={STATUS_TONE[computeDisplayStatus(conference.status, conference.submissionEnd)]}>
                {CONFERENCE_STATUS_LABELS_AR[computeDisplayStatus(conference.status, conference.submissionEnd)]}
              </Badge>
            </div>

            <Card className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-primary-800">حالة المؤتمر</h3>
                <Badge tone={STATUS_TONE[conference.status]}>
                  {CONFERENCE_STATUS_LABELS_AR[conference.status]}
                </Badge>
              </div>

              {statusError && <Alert tone="danger">{statusError}</Alert>}

              <div className="flex flex-wrap items-center gap-3">
                {conference.status === "DRAFT" && (
                  <Button
                    variant="primary"
                    disabled={pendingStatus !== null}
                    onClick={() => handleStatusChange("OPEN")}
                  >
                    {pendingStatus === "OPEN" ? "جارٍ التحديث..." : "نشر المؤتمر"}
                  </Button>
                )}

                {conference.status === "OPEN" && (
                  <>
                    <Button
                      variant="primary"
                      disabled={pendingStatus !== null}
                      onClick={() => handleStatusChange("CLOSED")}
                    >
                      {pendingStatus === "CLOSED" ? "جارٍ التحديث..." : "إغلاق استقبال الأبحاث"}
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={pendingStatus !== null}
                      onClick={() => handleStatusChange("DRAFT")}
                    >
                      {pendingStatus === "DRAFT" ? "جارٍ التحديث..." : "إرجاع إلى مسودة"}
                    </Button>
                  </>
                )}

                {conference.status === "CLOSED" && (
                  <Button
                    variant="primary"
                    disabled={pendingStatus !== null}
                    onClick={() => handleStatusChange("OPEN")}
                  >
                    {pendingStatus === "OPEN" ? "جارٍ التحديث..." : "إعادة فتح الاستقبال"}
                  </Button>
                )}
              </div>
            </Card>

            <Card className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-primary-800">معلومات المؤتمر</h3>
              {conference.description && (
                <p className="text-sm text-primary-700">{conference.description}</p>
              )}
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-primary-500">الجهة المنظمة</dt>
                  <dd>{conference.organizerName || "—"}</dd>
                </div>
                <div>
                  <dt className="text-primary-500">المكان</dt>
                  <dd>{conference.location || "—"}</dd>
                </div>
                <div>
                  <dt className="text-primary-500">تاريخ المؤتمر</dt>
                  <dd>
                    {formatDateAr(conference.startDate)} — {formatDateAr(conference.endDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-primary-500">فترة استقبال الأبحاث</dt>
                  <dd>
                    {formatDateAr(conference.submissionStart)} —{" "}
                    {formatDateAr(conference.submissionEnd)}
                  </dd>
                </div>
              </dl>
              {conference.scientificFields.length > 0 && (
                <div>
                  <p className="mb-1.5 text-primary-500">المجالات العلمية</p>
                  <div className="flex flex-wrap gap-2">
                    {conference.scientificFields.map((field) => (
                      <Badge key={field}>{field}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {conference.submissionConditions && (
                <div>
                  <p className="mb-1 text-sm text-primary-500">شروط التقديم</p>
                  <p className="whitespace-pre-line text-sm text-primary-700">
                    {conference.submissionConditions}
                  </p>
                </div>
              )}
            </Card>

            <Card className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-primary-800">رابط تقديم الأبحاث</h3>
              <p dir="ltr" className="break-all rounded-md2 bg-primary-50 px-3 py-2 text-sm text-primary-800">
                {buildPublicUrl(conference.slug)}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={() => handleCopy(buildPublicUrl(conference.slug))}
                >
                  نسخ الرابط
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleShare(buildPublicUrl(conference.slug), conference.title)}
                >
                  مشاركة الرابط
                </Button>
                {copied && <span className="text-sm text-emerald-600">تم نسخ الرابط بنجاح</span>}
                {!canUseWebShare() && (
                  <span className="text-xs text-primary-400">
                    المشاركة غير مدعومة على هذا الجهاز — استخدم نسخ الرابط.
                  </span>
                )}
              </div>
            </Card>

            <Card className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-primary-800">الأبحاث المقدَّمة</h3>
              <p className="text-2xl font-semibold text-primary-900">
                {loadingCount ? "…" : `عدد الأبحاث: ${submissionsCount ?? 0}`}
              </p>
              <div>
                <Link to={ROUTES.admin.conferences.submissions(conference.id)}>
                  <Button variant="secondary">عرض الأبحاث المقدَّمة</Button>
                </Link>
              </div>
            </Card>
          </div>
        )}
      </PageContainer>
    </AdminLayout>
  );
}
