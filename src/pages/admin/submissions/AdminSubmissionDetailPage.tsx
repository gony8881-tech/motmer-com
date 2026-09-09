import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { PageContainer } from "@/components/layout";
import { Alert, Badge, Button, Card, Input, Loading, Modal } from "@/components/ui";
import {
  useSubmissionDetail,
  getPaperFileSignedUrl,
  updatePaperStatus,
  assignReviewerToPaper,
} from "@/features/submissions";
import { getReviewers } from "@/features/reviewers";
import type { Reviewer } from "@/types";
import { PAPER_STATUS, PAPER_STATUS_LABELS_AR, type PaperStatus } from "@/features/workflow";
import { formatDateAr } from "@/utils/date";
import { ROUTES } from "@/constants/routes";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} بايت`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} كيلوبايت`;
  return `${(kb / 1024).toFixed(1)} ميجابايت`;
}

function getStatusBadgeTone(status: PaperStatus): "primary" | "success" | "danger" | "warning" | "neutral" {
  switch (status) {
    case PAPER_STATUS.ACCEPTED:
      return "success";
    case PAPER_STATUS.REJECTED:
    case PAPER_STATUS.INITIAL_SCREENING_REJECTED:
      return "danger";
    case PAPER_STATUS.UNDER_REVIEW:
    case PAPER_STATUS.REVISION_REQUESTED:
    case PAPER_STATUS.REVISION_SUBMITTED:
      return "warning";
    case PAPER_STATUS.READY_FOR_REVIEW:
    case PAPER_STATUS.INITIAL_SCREENING:
      return "primary";
    default:
      return "neutral";
  }
}

export default function AdminSubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { detail, loading, error, notFound, reload, setDetail } = useSubmissionDetail(id);

  // File viewing / downloading states
  const [fileActionError, setFileActionError] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Status & Decision states
  const [statusUpdating, setStatusUpdating] = useState<PaperStatus | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    type: "success" | "danger";
    message: string;
  } | null>(null);

  // Reviewer assignment Modal states
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [activeReviewers, setActiveReviewers] = useState<Reviewer[]>([]);
  const [loadingReviewers, setLoadingReviewers] = useState(false);
  const [reviewerError, setReviewerError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [assigningReviewerId, setAssigningReviewerId] = useState<string | null>(null);

  // Open modal and fetch active reviewers
  function handleOpenAssignModal() {
    setIsAssignModalOpen(true);
    setSearchQuery("");
    setReviewerError(null);
    setLoadingReviewers(true);

    getReviewers()
      .then((reviewers) => {
        // فلترة المحكّمين النشطين فقط
        setActiveReviewers(reviewers.filter((r) => r.isActive));
      })
      .catch((err) => {
        setReviewerError(err instanceof Error ? err.message : "تعذّر جلب قائمة المحكّمين.");
      })
      .finally(() => {
        setLoadingReviewers(false);
      });
  }

  // Handle viewing file in new tab (inline)
  async function handleViewFile(filePath: string, versionId: string) {
    setFileActionError(null);
    setViewingId(versionId);
    try {
      const url = await getPaperFileSignedUrl(filePath, false);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setFileActionError(err instanceof Error ? err.message : "تعذّر فتح ملف البحث للمعاينة.");
    } finally {
      setViewingId(null);
    }
  }

  // Handle downloading file (attachment)
  async function handleDownloadFile(filePath: string, versionId: string, fileName: string) {
    setFileActionError(null);
    setDownloadingId(versionId);
    try {
      const url = await getPaperFileSignedUrl(filePath, fileName || true);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setFileActionError(err instanceof Error ? err.message : "تعذّر تنزيل ملف البحث.");
    } finally {
      setDownloadingId(null);
    }
  }

  // Handle status update (accept, reject, ready for review)
  async function handleUpdateStatus(newStatus: PaperStatus) {
    if (!detail) return;

    const statusLabels: Record<string, string> = {
      ACCEPTED: "قبول هذا البحث نهائياً",
      REJECTED: "رفض هذا البحث",
      READY_FOR_REVIEW: "اعتماد البحث وجعله جاهزاً للتحكيم",
    };

    const confirmMsg = `هل أنت متأكد من رغبتك في ${statusLabels[newStatus] || "تحديث حالة البحث"}؟`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setStatusUpdating(newStatus);
    setActionFeedback(null);
    try {
      await updatePaperStatus(detail.paper.id, newStatus);
      setDetail((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          paper: {
            ...prev.paper,
            status: newStatus,
          },
        };
      });
      reload();
      setActionFeedback({
        type: "success",
        message: `تم تحديث حالة البحث إلى "${PAPER_STATUS_LABELS_AR[newStatus] ?? newStatus}" بنجاح.`,
      });
    } catch (err) {
      setActionFeedback({
        type: "danger",
        message: err instanceof Error ? err.message : "تعذّر تحديث حالة البحث.",
      });
    } finally {
      setStatusUpdating(null);
    }
  }

  // Handle assigning a reviewer to the paper
  async function handleAssignReviewer(reviewer: Reviewer) {
    if (!detail) return;
    setAssigningReviewerId(reviewer.id);
    setActionFeedback(null);

    try {
      await assignReviewerToPaper(detail.paper.id, reviewer.id);

      // تحديث فوري للحالة والبيانات محلياً
      setDetail((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          paper: {
            ...prev.paper,
            status: PAPER_STATUS.UNDER_REVIEW,
            assignedReviewerId: reviewer.id,
            assignedReviewerFullName: reviewer.fullName,
          },
          assignedReviewer: reviewer,
        };
      });

      setIsAssignModalOpen(false);
      reload();
      setActionFeedback({
        type: "success",
        message: `تم تعيين المحكّم د. ${reviewer.fullName} للبحث بنجاح، وتحديث الحالة إلى "${PAPER_STATUS_LABELS_AR.UNDER_REVIEW}".`,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "تعذّر تعيين المحكّم للبحث.");
    } finally {
      setAssigningReviewerId(null);
    }
  }

  const currentStatus = detail?.paper.status as PaperStatus;
  const isRejected =
    currentStatus === PAPER_STATUS.REJECTED ||
    currentStatus === PAPER_STATUS.INITIAL_SCREENING_REJECTED ||
    currentStatus === PAPER_STATUS.WITHDRAWN;

  const isAccepted = currentStatus === PAPER_STATUS.ACCEPTED;

  // هل البحث مؤهل لتعيين محكّم (READY_FOR_REVIEW أو أعلى ولم يُرفض)
  const canAssignReviewer =
    !isRejected &&
    (currentStatus === PAPER_STATUS.READY_FOR_REVIEW ||
      currentStatus === PAPER_STATUS.UNDER_REVIEW ||
      currentStatus === PAPER_STATUS.REVISION_REQUESTED ||
      currentStatus === PAPER_STATUS.REVISION_SUBMITTED ||
      currentStatus === PAPER_STATUS.ACCEPTED);

  // فلترة المحكّمين النشطين في الـ Modal حسب البحث
  const filteredReviewers = activeReviewers.filter((rev) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const nameMatch = rev.fullName.toLowerCase().includes(q);
    const affiliationMatch = rev.affiliation?.toLowerCase().includes(q) ?? false;
    const specialtyMatch = rev.specialties.some((s) => s.toLowerCase().includes(q));
    return nameMatch || affiliationMatch || specialtyMatch;
  });

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
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Link
                  to={ROUTES.admin.conferences.submissions(detail.paper.conferenceId)}
                  className="text-xs font-semibold text-primary-700 hover:text-primary-800 hover:underline"
                >
                  <Button variant="outline" size="sm">
                    ← العودة لقائمة الأبحاث
                  </Button>
                </Link>
                <div>
                  <h2 dir="ltr" className="text-xl font-bold text-slate-900">
                    {detail.paper.paperNumber}
                  </h2>
                </div>
              </div>
              <Badge tone={getStatusBadgeTone(currentStatus)} dot>
                {PAPER_STATUS_LABELS_AR[currentStatus] ?? currentStatus}
              </Badge>
            </div>

            {/* Action Feedback Alert */}
            {actionFeedback && (
              <Alert tone={actionFeedback.type}>{actionFeedback.message}</Alert>
            )}

            {/* Workflow & Reviewer Actions Card */}
            <Card className="p-5 space-y-5 border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    حالة التحكيم والقرار الإداري
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    إدارة تكليف المحكّمين واعتماد مرحلة التقييم أو اتخاذ القرار النهائي
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">الحالة الراهنة:</span>
                  <Badge tone={getStatusBadgeTone(currentStatus)} dot>
                    {PAPER_STATUS_LABELS_AR[currentStatus] ?? currentStatus}
                  </Badge>
                </div>
              </div>

              {/* Reviewer Assignment State */}
              <div className="space-y-3">
                {detail.assignedReviewer ? (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">المحكّم المعيّن:</span>
                        <span className="text-sm font-bold text-slate-900">
                          {detail.assignedReviewer.fullName}
                        </span>
                        <Badge tone="success" dot>مُعيَّن للبحث</Badge>
                      </div>
                      <p dir="ltr" className="text-xs text-slate-500 font-mono text-right">
                        {detail.assignedReviewer.email}
                      </p>
                      {detail.assignedReviewer.affiliation && (
                        <p className="text-xs text-slate-600 font-medium">
                          {detail.assignedReviewer.affiliation}
                        </p>
                      )}
                      {detail.assignedReviewer.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {detail.assignedReviewer.specialties.map((s) => (
                            <Badge key={s} tone="neutral">{s}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {!isRejected && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleOpenAssignModal}
                      >
                        تغيير المحكّم
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    {canAssignReviewer ? (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-amber-50/70 rounded-xl border border-amber-200">
                        <div>
                          <p className="text-sm font-semibold text-amber-900">
                            لم يُعيَّن محكّم لهذا البحث بعد
                          </p>
                          <p className="text-xs text-amber-700 mt-0.5">
                            البحث جاهز للتحكيم. يمكنك اختيار وتكليف أحد المحكّمين المعتمدين في المنصة.
                          </p>
                        </div>
                        <Button size="sm" onClick={handleOpenAssignModal}>
                          تعيين محكّم للبحث
                        </Button>
                      </div>
                    ) : currentStatus === PAPER_STATUS.SUBMITTED || currentStatus === PAPER_STATUS.INITIAL_SCREENING ? (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            البحث بانتظار الفرز الأولي
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            يمكنك اعتماد البحث ليكون جاهزاً للتحكيم، أو إسناد محكّم له مباشرة.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            isLoading={statusUpdating === PAPER_STATUS.READY_FOR_REVIEW}
                            onClick={() => handleUpdateStatus(PAPER_STATUS.READY_FOR_REVIEW)}
                          >
                            اعتماد وجاهز للتحكيم
                          </Button>
                          <Button size="sm" onClick={handleOpenAssignModal}>
                            تعيين محكّم مباشرة
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800">
                        البحث في حالة مرفوضة، ولا يمكن تعيين محكّم له.
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Administrative Decision Buttons (Accept / Reject) */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-500 font-medium">
                  القرارات الإدارية للمؤتمر:
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!isAccepted && (
                    <Button
                      size="sm"
                      variant="primary"
                      className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white"
                      isLoading={statusUpdating === PAPER_STATUS.ACCEPTED}
                      onClick={() => handleUpdateStatus(PAPER_STATUS.ACCEPTED)}
                    >
                      قبول البحث
                    </Button>
                  )}
                  {!isRejected && (
                    <Button
                      size="sm"
                      variant="danger"
                      isLoading={statusUpdating === PAPER_STATUS.REJECTED}
                      onClick={() => handleUpdateStatus(PAPER_STATUS.REJECTED)}
                    >
                      رفض البحث
                    </Button>
                  )}
                  {isRejected && (
                    <Button
                      size="sm"
                      variant="outline"
                      isLoading={statusUpdating === PAPER_STATUS.READY_FOR_REVIEW}
                      onClick={() => handleUpdateStatus(PAPER_STATUS.READY_FOR_REVIEW)}
                    >
                      إعادة فتح وجعله جاهزاً للتحكيم
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Paper Details Card */}
            <Card className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-primary-800">بيانات البحث</h3>
              <div>
                <p className="text-primary-500 text-xs">عنوان البحث</p>
                <p className="text-base font-bold text-slate-900 mt-0.5">{detail.paper.title}</p>
              </div>
              <div>
                <p className="text-primary-500 text-xs">الملخص</p>
                <p className="whitespace-pre-line text-sm text-slate-700 leading-relaxed mt-1">
                  {detail.paper.abstract}
                </p>
              </div>
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 pt-2 border-t border-slate-100">
                <div>
                  <dt className="text-primary-500 text-xs">المجال العلمي</dt>
                  <dd className="font-medium text-slate-800 mt-0.5">{detail.paper.scientificField}</dd>
                </div>
                <div>
                  <dt className="text-primary-500 text-xs">الكلمات المفتاحية</dt>
                  <dd className="font-medium text-slate-800 mt-0.5">
                    {detail.paper.keywords.length > 0 ? detail.paper.keywords.join("، ") : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-primary-500 text-xs">تاريخ التقديم</dt>
                  <dd className="font-medium text-slate-800 mt-0.5">
                    {formatDateAr(detail.paper.submittedAt)}
                  </dd>
                </div>
              </dl>
            </Card>

            {/* Researcher Info Card */}
            <Card className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-primary-800">بيانات الباحث</h3>
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-primary-500 text-xs">الاسم</dt>
                  <dd className="font-medium text-slate-800">{detail.researcher.full_name}</dd>
                </div>
                <div>
                  <dt className="text-primary-500 text-xs">البريد</dt>
                  <dd dir="ltr" className="text-right font-mono text-xs text-slate-700 font-medium">
                    {detail.researcher.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-primary-500 text-xs">الهاتف</dt>
                  <dd dir="ltr" className="text-right text-slate-700">
                    {detail.researcher.phone || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-primary-500 text-xs">المؤسسة / جهة العمل</dt>
                  <dd className="text-slate-800">{detail.researcher.organization || "—"}</dd>
                </div>
                <div>
                  <dt className="text-primary-500 text-xs">الدولة</dt>
                  <dd className="text-slate-800">{detail.researcher.country || "—"}</dd>
                </div>
                <div>
                  <dt className="text-primary-500 text-xs">الدرجة العلمية</dt>
                  <dd className="text-slate-800">{detail.researcher.academic_degree || "—"}</dd>
                </div>
                <div>
                  <dt className="text-primary-500 text-xs">التخصص</dt>
                  <dd className="text-slate-800">{detail.researcher.specialization || "—"}</dd>
                </div>
              </dl>
            </Card>

            {/* Paper Files & Versions Card */}
            <Card className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-primary-800">ملف البحث والنسخ المرفوعة</h3>
              {fileActionError && <Alert tone="danger">{fileActionError}</Alert>}
              <div className="flex flex-col gap-2.5">
                {detail.versions.map((version) => (
                  <div
                    key={version.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5"
                  >
                    <div className="space-y-0.5">
                      <p className="font-semibold text-slate-900 text-sm">
                        النسخة {version.version_number} — {version.file_name}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        {formatFileSize(version.file_size)} — {formatDateAr(version.uploaded_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={viewingId === version.id || downloadingId === version.id}
                        isLoading={viewingId === version.id}
                        onClick={() => handleViewFile(version.file_path, version.id)}
                      >
                        معاينة الملف
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={downloadingId === version.id || viewingId === version.id}
                        isLoading={downloadingId === version.id}
                        onClick={() =>
                          handleDownloadFile(version.file_path, version.id, version.file_name)
                        }
                      >
                        تنزيل
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Modal: تعيين أو تغيير المحكّم */}
        <Modal
          open={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title={detail?.assignedReviewer ? "تغيير المحكّم المعيّن للبحث" : "تعيين محكّم للبحث"}
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-800">
                البحث: <span className="font-normal text-slate-700">{detail?.paper.title}</span>
              </p>
              <p className="font-bold text-slate-800">
                المجال العلمي:{" "}
                <span className="font-normal text-slate-700">{detail?.paper.scientificField}</span>
              </p>
            </div>

            {/* Search filter input */}
            <div>
              <Input
                placeholder="ابحث بالاسم أو التخصص أو المؤسسة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Reviewers List */}
            {loadingReviewers && <Loading label="جارٍ جلب المحكّمين النشطين..." />}

            {!loadingReviewers && reviewerError && (
              <Alert tone="danger">{reviewerError}</Alert>
            )}

            {!loadingReviewers && !reviewerError && activeReviewers.length === 0 && (
              <Alert tone="warning">
                لا يوجد محكّمون نشطون في المنصة حالياً. يرجى تفعيل أو إضافة محكّمين من دليل المحكّمين أولاً.
              </Alert>
            )}

            {!loadingReviewers && !reviewerError && activeReviewers.length > 0 && (
              <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
                {filteredReviewers.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-4">
                    لا يوجد محكّم يطابق كلمة البحث.
                  </p>
                ) : (
                  filteredReviewers.map((reviewer) => {
                    const isCurrentlyAssigned = detail?.paper.assignedReviewerId === reviewer.id;
                    const isAssigningThis = assigningReviewerId === reviewer.id;

                    return (
                      <div
                        key={reviewer.id}
                        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 p-3 rounded-xl border transition-colors ${
                          isCurrentlyAssigned
                            ? "border-emerald-300 bg-emerald-50/50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 truncate">
                              {reviewer.fullName}
                            </span>
                            {isCurrentlyAssigned && (
                              <Badge tone="success" dot>المعيّن حالياً</Badge>
                            )}
                          </div>
                          {reviewer.affiliation && (
                            <p className="text-xs text-slate-500 truncate">
                              {reviewer.affiliation}
                            </p>
                          )}
                          {reviewer.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {reviewer.specialties.map((s) => (
                                <Badge key={s} tone="neutral" className="text-[10px] px-1.5 py-0.5">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant={isCurrentlyAssigned ? "outline" : "primary"}
                          disabled={assigningReviewerId !== null}
                          isLoading={isAssigningThis}
                          onClick={() => handleAssignReviewer(reviewer)}
                          className="shrink-0 self-end sm:self-auto"
                        >
                          {isCurrentlyAssigned ? "إعادة التعيين" : "اختيار وتعيين"}
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAssignModalOpen(false)}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </Modal>
      </PageContainer>
    </AdminLayout>
  );
}
