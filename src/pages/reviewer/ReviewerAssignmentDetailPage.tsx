import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ReviewerLayout } from "@/layouts/ReviewerLayout";
import { PageContainer } from "@/components/layout";
import {
  Alert,
  Badge,
  Button,
  Card,
  Input,
  Loading,
  Modal,
} from "@/components/ui";
import {
  useAssignmentDetail,
  getAssignmentStatusBadge,
  getDeadlineInfo,
  getRecommendationBadge,
  getReviewTypeBadge,
} from "@/features/reviewers";
import { getPaperFileSignedUrl } from "@/features/submissions";
import { formatDateAr } from "@/utils/date";
import { ROUTES } from "@/constants/routes";

export default function ReviewerAssignmentDetailPage() {
  const { id: assignmentId } = useParams<{ id: string }>();
  const {
    assignment,
    report,
    loading,
    error,
    respond,
    requestExtension,
  } = useAssignmentDetail(assignmentId || "");

  // State for Decline Modal
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [isDeclining, setIsDeclining] = useState(false);

  // State for Extension Modal
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [extensionDays, setExtensionDays] = useState("7");
  const [extensionReason, setExtensionReason] = useState("");
  const [isSubmittingExtension, setIsSubmittingExtension] = useState(false);

  // Action feedback
  const [feedback, setFeedback] = useState<{ type: "success" | "danger"; msg: string } | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (loading) {
    return (
      <ReviewerLayout>
        <PageContainer>
          <div className="flex h-64 items-center justify-center">
            <Loading />
          </div>
        </PageContainer>
      </ReviewerLayout>
    );
  }

  if (error || !assignment) {
    return (
      <ReviewerLayout>
        <PageContainer>
          <div className="mb-6">
            <Alert tone="danger">{error || "التكليف غير موجود."}</Alert>
          </div>
          <Link to={ROUTES.reviewer.assigned}>
            <Button variant="outline">العودة لقائمة التكليفات</Button>
          </Link>
        </PageContainer>
      </ReviewerLayout>
    );
  }

  const statusBadge = getAssignmentStatusBadge(assignment.assignmentStatus);
  const reviewTypeBadge = getReviewTypeBadge(assignment.reviewType);
  const deadlineInfo = getDeadlineInfo(assignment.dueDate);

  async function handleAccept() {
    setIsAccepting(true);
    setFeedback(null);
    try {
      await respond(true);
      setFeedback({ type: "success", msg: "تم قبول التكليف بنجاح. يمكنك الآن البدء في مراجعة البحث." });
    } catch (err) {
      setFeedback({ type: "danger", msg: err instanceof Error ? err.message : "تعذّر قبول التكليف." });
    } finally {
      setIsAccepting(false);
    }
  }

  async function handleConfirmDecline() {
    setIsDeclining(true);
    setFeedback(null);
    try {
      await respond(false, declineReason);
      setIsDeclineModalOpen(false);
      setFeedback({ type: "success", msg: "تم تسجيل اعتذارك عن تحكيم البحث." });
    } catch (err) {
      setFeedback({ type: "danger", msg: err instanceof Error ? err.message : "تعذّر تسجيل الاعتذار." });
    } finally {
      setIsDeclining(false);
    }
  }

  async function handleConfirmExtension() {
    const days = parseInt(extensionDays, 10);
    if (isNaN(days) || days <= 0) {
      alert("يرجى إدخال عدد أيام صحيح.");
      return;
    }
    if (!extensionReason.trim()) {
      alert("يرجى توضيح سبب طلب التمديد.");
      return;
    }

    setIsSubmittingExtension(true);
    setFeedback(null);
    try {
      await requestExtension(days, extensionReason);
      setIsExtensionModalOpen(false);
      setFeedback({ type: "success", msg: "تم إرسال طلب تمديد المهلة إلى إدارة المؤتمر بنجاح." });
    } catch (err) {
      setFeedback({ type: "danger", msg: err instanceof Error ? err.message : "تعذّر إرسال طلب التمديد." });
    } finally {
      setIsSubmittingExtension(false);
    }
  }

  async function handleDownloadFile() {
    if (!assignment?.latestFilePath) {
      alert("لا يوجد ملف مرفق لهذا البحث.");
      return;
    }
    setIsDownloading(true);
    try {
      const url = await getPaperFileSignedUrl(assignment.latestFilePath, assignment.latestFileName || "paper.pdf");
      window.open(url, "_blank");
    } catch (err) {
      alert(err instanceof Error ? err.message : "تعذّر تنزيل ملف البحث.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <ReviewerLayout>
      <PageContainer>
        {/* Back Link & Title */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              to={ROUTES.reviewer.assigned}
              className="text-xs text-primary-700 hover:text-primary-800 font-medium inline-flex items-center gap-1 mb-2"
            >
              ← العودة إلى الأبحاث المعيّنة
            </Link>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900">{assignment.paperTitle}</h2>
              <Badge tone={statusBadge.tone} dot>{statusBadge.label}</Badge>
              <Badge tone={reviewTypeBadge.tone}>{reviewTypeBadge.label}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              المؤتمر: <span className="font-medium text-slate-700">{assignment.conferenceTitle}</span> • رقم البحث:{" "}
              <span className="font-mono font-bold text-primary-900">{assignment.paperNumber}</span>
            </p>
          </div>

          {assignment.latestFilePath && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadFile}
              isLoading={isDownloading}
              className="self-start sm:self-auto shrink-0"
            >
              📄 معاينة / تنزيل البحث
            </Button>
          )}
        </div>

        {feedback && (
          <div className="mb-6">
            <Alert tone={feedback.type}>{feedback.msg}</Alert>
          </div>
        )}

        {/* Double-Blind / Author Banner */}
        {assignment.reviewType === "DOUBLE_BLIND" ? (
          <div className="mb-6 bg-primary-50/70 border border-primary-200/80 rounded-2xl p-4 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white font-bold text-sm">
              🛡️
            </div>
            <div className="text-xs leading-relaxed text-primary-950">
              <p className="font-bold text-sm text-primary-900 mb-0.5">تحكيم مزدوج التعمية (Double-Blind Review)</p>
              تم حجب بيانات وهوية الباحث والمؤسسة تماماً على مستوى قاعدة البيانات والنظام، لضمان النزاهة العلمية والموضوعية التامة أثناء التقييم.
            </div>
          </div>
        ) : (
          <Card className="mb-6 p-4">
            <h4 className="text-xs font-bold text-slate-500 mb-2">بيانات الباحث (مراجعة غير محجوبة):</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400">الاسم:</span>{" "}
                <span className="font-semibold text-slate-800">{assignment.researcherFullName || "غير محدد"}</span>
              </div>
              <div>
                <span className="text-slate-400">البريد:</span>{" "}
                <span className="text-slate-700">{assignment.researcherEmail || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400">الجهة:</span>{" "}
                <span className="text-slate-700">{assignment.researcherOrganization || "—"}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Workflow Action Bar */}
        {assignment.assignmentStatus === "PENDING" && (
          <Card className="mb-6 p-6 border-amber-200 bg-amber-50/50 space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber-500 animate-pulse"></span>
              <h3 className="font-bold text-slate-900 text-base">دعوة تحكيم جديدة بانتظار قرارك</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              تم ترشيحك من قبل إدارة المؤتمر لتحكيم هذا البحث العلمي. المهلة المحددة للتحكيم هي{" "}
              <strong className="text-slate-900">{formatDateAr(assignment.dueDate)}</strong>.
              يرجى الاطلاع على الملخص أدناه وقبول التكليف للبدء أو الاعتذار لإتاحة الفرصة لمحكّم آخر.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                variant="primary"
                onClick={handleAccept}
                isLoading={isAccepting}
              >
                قبول التكليف وبدء التحكيم
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDeclineModalOpen(true)}
                disabled={isAccepting}
              >
                الاعتذار عن التحكيم
              </Button>
            </div>
          </Card>
        )}

        {assignment.assignmentStatus === "ACCEPTED" && (
          <Card className="mb-6 p-6 border-sky-200 bg-sky-50/40 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">حالة التحكيم: قيد الإجراء</h3>
                  <Badge tone={deadlineInfo.tone}>{deadlineInfo.label}</Badge>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  الموعد النهائي لتسليم التقرير: <strong className="text-slate-900">{formatDateAr(assignment.dueDate)}</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Link to={ROUTES.reviewer.reviewForm(assignment.assignmentId)}>
                  <Button variant="primary">
                    ✍️ {report ? "متابعة كتابة التقرير" : "البدء في تعبئة استمارة التحكيم"}
                  </Button>
                </Link>
                {assignment.extensionStatus === "NONE" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsExtensionModalOpen(true)}
                  >
                    طلب تمديد المهلة
                  </Button>
                )}
              </div>
            </div>

            {assignment.extensionStatus === "PENDING" && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                ⏳ لقد طلبت تمديد المهلة بمقدار {assignment.extensionRequestedDays} أيام. الطلب قيد المراجعة من قبل إدارة المؤتمر.
              </div>
            )}
            {assignment.extensionStatus === "APPROVED" && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                ✓ تمت الموافقة على تمديد المهلة. الموعد النهائي الجديد هو {formatDateAr(assignment.dueDate)}.
              </div>
            )}
            {assignment.extensionStatus === "REJECTED" && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                ⚠️ تم رفض طلب تمديد المهلة. يرجى الالتزام بالموعد المحدد ({formatDateAr(assignment.dueDate)}).
              </div>
            )}
          </Card>
        )}

        {assignment.assignmentStatus === "COMPLETED" && (
          <Card className="mb-6 p-6 border-emerald-200 bg-emerald-50/40 space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 rounded-full bg-emerald-600 text-white items-center justify-center text-xs">✓</span>
              <h3 className="font-bold text-slate-900 text-base">تم تسليم تقرير التحكيم بنجاح</h3>
              {report?.recommendation && (
                <Badge tone={getRecommendationBadge(report.recommendation).tone}>
                  {getRecommendationBadge(report.recommendation).label}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-600">
              تم تقديم تقريرك النهائي بتاريخ {formatDateAr(assignment.reportSubmittedAt || assignment.invitationSentAt)}. شكراً لمساهمتك العلمية القيّمة.
            </p>
          </Card>
        )}

        {/* Paper Core Details Card */}
        <Card className="p-6 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">ملخص البحث (Abstract)</h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/60 p-4 rounded-xl border border-slate-100">
              {assignment.paperAbstract || "لا يوجد ملخص متوفر لهذا البحث."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div>
              <h4 className="text-xs font-bold text-slate-400 mb-1.5">المجال العلمي</h4>
              <Badge tone="neutral" className="text-xs font-medium">
                {assignment.scientificField}
              </Badge>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 mb-1.5">الكلمات المفتاحية</h4>
              {assignment.keywords.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {assignment.keywords.map((kw) => (
                    <span key={kw} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                      #{kw}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-400">—</span>
              )}
            </div>
          </div>
        </Card>

        {/* Submitted Report Summary (if completed) */}
        {report && assignment.assignmentStatus === "COMPLETED" && (
          <Card className="mt-6 p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              تقرير التحكيم المعتمد
            </h3>

            {/* Scores Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[11px] text-slate-500 mb-1">الأصالة والابتكار</p>
                <p className="text-lg font-bold text-slate-800">{report.originalityScore} / 5</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[11px] text-slate-500 mb-1">المنهجية العلمية</p>
                <p className="text-lg font-bold text-slate-800">{report.methodologyScore} / 5</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[11px] text-slate-500 mb-1">الوضوح والتنظيم</p>
                <p className="text-lg font-bold text-slate-800">{report.clarityScore} / 5</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[11px] text-slate-500 mb-1">الأهمية العلمية</p>
                <p className="text-lg font-bold text-slate-800">{report.significanceScore} / 5</p>
              </div>
              <div className="p-3 bg-primary-50 rounded-xl border border-primary-100 col-span-2 sm:col-span-1">
                <p className="text-[11px] text-primary-700 font-medium mb-1">التقييم العام</p>
                <p className="text-lg font-bold text-primary-900">{report.overallScore} / 5</p>
              </div>
            </div>

            {/* Author Comments */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 mb-1.5">ملاحظاتك الموجهة للمؤلف:</h4>
              <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl whitespace-pre-line leading-relaxed border border-slate-100">
                {report.commentsForAuthor || "لا توجد ملاحظات."}
              </p>
            </div>

            {/* Confidential Comments */}
            {report.confidentialCommentsForEditor && (
              <div>
                <h4 className="text-xs font-bold text-amber-700 mb-1.5 flex items-center gap-1">
                  🔒 ملاحظاتك السرية لرئيس التحرير:
                </h4>
                <p className="text-xs text-slate-700 bg-amber-50/40 p-3.5 rounded-xl whitespace-pre-line leading-relaxed border border-amber-200">
                  {report.confidentialCommentsForEditor}
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Decline Modal */}
        <Modal
          open={isDeclineModalOpen}
          onClose={() => !isDeclining && setIsDeclineModalOpen(false)}
          title="الاعتذار عن تحكيم البحث"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              يرجى توضيح سبب الاعتذار لمساعدة إدارة المؤتمر في تحسين عملية التكليف وتعيين محكّم بديل في أسرع وقت.
            </p>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">سبب الاعتذار (اختياري):</label>
              <textarea
                rows={3}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="مثال: ضيق الوقت الحالي، تعارض مصالح، خارج التخصص الدقيق..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDeclineModalOpen(false)}
                disabled={isDeclining}
              >
                إلغاء
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDecline}
                isLoading={isDeclining}
              >
                تأكيد الاعتذار
              </Button>
            </div>
          </div>
        </Modal>

        {/* Extension Request Modal */}
        <Modal
          open={isExtensionModalOpen}
          onClose={() => !isSubmittingExtension && setIsExtensionModalOpen(false)}
          title="طلب تمديد مهلة التحكيم"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              سيتم إرسال هذا الطلب إلى إدارة المؤتمر للموافقة عليه وتعديل الموعد النهائي للتحكيم.
            </p>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">عدد الأيام المطلوبة للتمديد:</label>
              <Input
                type="number"
                min="1"
                max="30"
                value={extensionDays}
                onChange={(e) => setExtensionDays(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">سبب طلب التمديد:</label>
              <textarea
                rows={3}
                value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)}
                placeholder="يرجى ذكر المبررات العلمية أو الشخصية لطلب تمديد المهلة..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExtensionModalOpen(false)}
                disabled={isSubmittingExtension}
              >
                إلغاء
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmExtension}
                isLoading={isSubmittingExtension}
              >
                إرسال طلب التمديد
              </Button>
            </div>
          </div>
        </Modal>
      </PageContainer>
    </ReviewerLayout>
  );
}
