import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ReviewerLayout } from "@/layouts/ReviewerLayout";
import { PageContainer } from "@/components/layout";
import {
  Alert,
  Badge,
  Button,
  Card,
  Loading,
  Modal,
} from "@/components/ui";
import {
  useAssignmentDetail,
  useReviewReportForm,
  getDeadlineInfo,
  getReviewTypeBadge,
} from "@/features/reviewers";
import type { ReviewRecommendation } from "@/types/reviewerWorkflow";
import { ROUTES } from "@/constants/routes";

interface ScoreSliderProps {
  label: string;
  description: string;
  value: number;
  onChange: (val: number) => void;
}

function ScoreSlider({ label, description, value, onChange }: ScoreSliderProps) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900">{label}</h4>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-800 font-bold text-sm">
          {value}
        </span>
      </div>

      <div className="flex items-center gap-2 pt-1">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              value === score
                ? "border-primary-600 bg-primary-600 text-white shadow-sm"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ReviewFormPage() {
  const { id: assignmentId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    assignment,
    loading: loadingAssignment,
    error: assignmentError,
  } = useAssignmentDetail(assignmentId || "");

  const {
    values,
    handleFieldChange,
    handleFileUpload,
    saveDraft,
    submitFinal,
    saving,
    uploading,
    error: formError,
    existingReport,
  } = useReviewReportForm(
    assignmentId || "",
    assignment?.paperId || "",
    assignment?.reviewerId || ""
  );

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (loadingAssignment) {
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

  if (assignmentError || !assignment) {
    return (
      <ReviewerLayout>
        <PageContainer>
          <div className="mb-6">
            <Alert tone="danger">{assignmentError || "التكليف غير موجود."}</Alert>
          </div>
          <Link to={ROUTES.reviewer.assigned}>
            <Button variant="outline">العودة للأبحاث المعيّنة</Button>
          </Link>
        </PageContainer>
      </ReviewerLayout>
    );
  }

  // إذا تم إرسال التقرير مسبقاً، نمنع إعادة التعديل
  const isAlreadySubmitted = existingReport?.status === "SUBMITTED";

  const deadlineInfo = getDeadlineInfo(assignment.dueDate);
  const reviewTypeBadge = getReviewTypeBadge(assignment.reviewType);

  const recommendationOptions: {
    id: ReviewRecommendation;
    title: string;
    description: string;
    tone: "success" | "info" | "warning" | "danger";
  }[] = [
    {
      id: "ACCEPT",
      title: "قبول البحث دون تعديلات",
      description: "البحث مستوفٍ لكافة المعايير الأكاديمية وجاهز للنشر المباشر.",
      tone: "success",
    },
    {
      id: "MINOR_REVISION",
      title: "قبول مع تعديلات طفيفة",
      description: "يحتاج البحث لبعض التوضيحات البسيطة أو المراجعة اللغوية والتنسيقية.",
      tone: "info",
    },
    {
      id: "MAJOR_REVISION",
      title: "تعديلات جوهرية وإعادة تقديم",
      description: "يحتاج البحث لإعادة صياغة، تدقيق منهجي، أو استكمال بيانات قبل البت فيه.",
      tone: "warning",
    },
    {
      id: "REJECT",
      title: "رفض البحث",
      description: "البحث غير مؤهل علمياً أو لا يتوافق مع أهداف ومحاور المؤتمر.",
      tone: "danger",
    },
  ];

  async function handleSaveDraft() {
    setSuccessMessage(null);
    try {
      await saveDraft();
      setSuccessMessage("تم حفظ مسودة التقرير بنجاح. يمكنك العودة واستكمالها في أي وقت.");
    } catch {
      // Form error is handled by hook
    }
  }

  async function handleConfirmSubmit() {
    if (!assignment) return;
    setSuccessMessage(null);
    try {
      await submitFinal();
      setIsConfirmModalOpen(false);
      navigate(ROUTES.reviewer.assignmentDetail(assignment.assignmentId));
    } catch {
      setIsConfirmModalOpen(false);
    }
  }

  return (
    <ReviewerLayout>
      <PageContainer>
        {/* Header */}
        <div className="mb-6">
          <Link
            to={ROUTES.reviewer.assignmentDetail(assignment.assignmentId)}
            className="text-xs text-primary-700 hover:text-primary-800 font-medium inline-flex items-center gap-1 mb-2"
          >
            ← العودة إلى تفاصيل التكليف
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">استمارة تقييم وتحكيم البحث</h2>
                <Badge tone={reviewTypeBadge.tone}>{reviewTypeBadge.label}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                البحث: <span className="font-semibold text-slate-800">{assignment.paperTitle}</span> ({assignment.paperNumber}) • المهلة:{" "}
                <Badge tone={deadlineInfo.tone}>{deadlineInfo.label}</Badge>
              </p>
            </div>

            {isAlreadySubmitted && (
              <Badge tone="success" dot>تم تقديم هذا التقرير نهائياً (للقراءة فقط)</Badge>
            )}
          </div>
        </div>

        {/* Feedback Messages */}
        {formError && (
          <div className="mb-6">
            <Alert tone="danger">{formError}</Alert>
          </div>
        )}
        {successMessage && (
          <div className="mb-6">
            <Alert tone="success">{successMessage}</Alert>
          </div>
        )}

        <div className="space-y-6">
          {/* Section 1: Evaluation Criteria */}
          <Card className="p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">أولاً: المعايير العلمية والمنهجية</h3>
              <p className="text-xs text-slate-500">يرجى تقييم كل معيار من 1 (ضعيف جداً) إلى 5 (ممتاز).</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <ScoreSlider
                label="أصالة الفكرة والابتكار"
                description="جدة الموضوع والإضافة العلمية المقدمة في البحث"
                value={values.originalityScore}
                onChange={(val) => !isAlreadySubmitted && handleFieldChange("originalityScore", val)}
              />

              <ScoreSlider
                label="رصانة المنهجية العلمية"
                description="دقة أدوات البحث، جمع البيانات، والتحليل الإحصائي/النوعي"
                value={values.methodologyScore}
                onChange={(val) => !isAlreadySubmitted && handleFieldChange("methodologyScore", val)}
              />

              <ScoreSlider
                label="الوضوح والتنظيم الأكاديمي"
                description="تسلسل الأفكار، سلامة اللغة، والتوثيق المرجعي الدقيق"
                value={values.clarityScore}
                onChange={(val) => !isAlreadySubmitted && handleFieldChange("clarityScore", val)}
              />

              <ScoreSlider
                label="الأهمية والمساهمة العلمية"
                description="الفائدة التطبيقية أو النظرية للبحث في مجاله التخصصي"
                value={values.significanceScore}
                onChange={(val) => !isAlreadySubmitted && handleFieldChange("significanceScore", val)}
              />

              <div className="md:col-span-2">
                <ScoreSlider
                  label="التقييم العام للبحث"
                  description="الحكم الكلي والشامل على جودة وقيمة الورقة البحثية"
                  value={values.overallScore}
                  onChange={(val) => !isAlreadySubmitted && handleFieldChange("overallScore", val)}
                />
              </div>
            </div>
          </Card>

          {/* Section 2: Academic Recommendation */}
          <Card className="p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">ثانياً: التوصية والقرار النهائي</h3>
              <p className="text-xs text-slate-500">اختر القرار الأكاديمي الذي تراه مناسباً لنشر هذا البحث.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {recommendationOptions.map((opt) => {
                const isSelected = values.recommendation === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isAlreadySubmitted}
                    onClick={() => handleFieldChange("recommendation", opt.id)}
                    className={`p-4 rounded-xl border text-right transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-primary-600 bg-primary-50/50 shadow-sm ring-2 ring-primary-500/20"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm text-slate-900">{opt.title}</span>
                        <span
                          className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                            isSelected ? "border-primary-600 bg-primary-600" : "border-slate-300"
                          }`}
                        >
                          {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white"></span>}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{opt.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Section 3: Comments for Author */}
          <Card className="p-6 space-y-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">ثالثاً: الملاحظات الموجهة للمؤلف (الباحث)</h3>
              <p className="text-xs text-slate-500">
                هذه الملاحظات سيتم إرسالها للباحث (دون كشف هويتك كمحكّم) لتوجيهه في إجراء التعديلات اللازمة.
              </p>
            </div>

            <textarea
              rows={6}
              disabled={isAlreadySubmitted}
              value={values.commentsForAuthor}
              onChange={(e) => handleFieldChange("commentsForAuthor", e.target.value)}
              placeholder="اكتب نقاط القوة، نقاط الضعف، والتعديلات التفصيلية المطلوبة..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs leading-relaxed focus:border-primary-500 focus:outline-none"
            />
          </Card>

          {/* Section 4: Confidential Comments for Editor */}
          <Card className="p-6 space-y-3 border-amber-200/80 bg-amber-50/20">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-amber-700">🔒</span>
                <h3 className="text-base font-bold text-slate-900">رابعاً: ملاحظات سرية لرئيس التحرير / الإدارة</h3>
              </div>
              <p className="text-xs text-slate-500">
                ملاحظات خاصة سرية تماماً ولن يراها الباحث مطلقاً (مثال: شكوك حول انتحال علمي، أسباب حساسة للرفض...).
              </p>
            </div>

            <textarea
              rows={4}
              disabled={isAlreadySubmitted}
              value={values.confidentialCommentsForEditor}
              onChange={(e) => handleFieldChange("confidentialCommentsForEditor", e.target.value)}
              placeholder="اكتب أي ملاحظات سرية ترغب في مشاركتها حصراً مع هيئة التحرير..."
              className="w-full rounded-xl border border-amber-300/80 p-3 text-xs leading-relaxed focus:border-amber-500 focus:outline-none bg-white"
            />
          </Card>

          {/* Section 5: Annotated Manuscript Attachment */}
          <Card className="p-6 space-y-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">خامساً: ملف الملاحظات المرفق (اختياري)</h3>
              <p className="text-xs text-slate-500">
                يمكنك إرفاق نسخة البحث بصيغة PDF بعد وضع الملاحظات والتأشيرات عليها.
              </p>
            </div>

            {values.attachmentFileName ? (
              <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 text-xs">
                <span className="font-semibold text-emerald-900 truncate">
                  📎 {values.attachmentFileName}
                </span>
                {!isAlreadySubmitted && (
                  <button
                    type="button"
                    onClick={() => {
                      handleFieldChange("attachmentFilePath", null);
                      handleFieldChange("attachmentFileName", null);
                    }}
                    className="text-red-600 hover:text-red-700 font-bold px-2 py-1"
                  >
                    حذف الملف
                  </button>
                )}
              </div>
            ) : (
              !isAlreadySubmitted && (
                <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-5 text-center bg-slate-50/50 hover:bg-slate-100/60 transition-colors">
                  <input
                    type="file"
                    id="review-attachment-file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/octet-stream"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={uploading}
                    aria-label="اختيار ملف الملاحظات"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                      e.target.value = "";
                    }}
                  />
                  <div className="pointer-events-none flex flex-col items-center">
                    <span className="text-xs font-bold text-primary-700">
                      {uploading ? "جاري رفع الملف..." : "📁 اضغط هنا لاختيار ورفع ملف الملاحظات (PDF / Word)"}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">الحد الأقصى لحجم الملف: 15 ميغابايت</p>
                  </div>
                </div>
              )
            )}
          </Card>

          {/* Bottom Action Footer */}
          {!isAlreadySubmitted && (
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
              <Link to={ROUTES.reviewer.assignmentDetail(assignment.assignmentId)}>
                <Button variant="ghost">إلغاء والعودة</Button>
              </Link>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  isLoading={saving}
                >
                  💾 حفظ كمسودة
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (!values.recommendation) {
                      alert("يرجى اختيار التوصية والقرار النهائي للبحث أولاً.");
                      return;
                    }
                    if (!values.commentsForAuthor.trim()) {
                      alert("يرجى كتابة الملاحظات الموجهة للمؤلف قبل الإرسال النهائي.");
                      return;
                    }
                    setIsConfirmModalOpen(true);
                  }}
                  isLoading={saving}
                >
                  🚀 إرسال التقرير النهائي
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        <Modal
          open={isConfirmModalOpen}
          onClose={() => !saving && setIsConfirmModalOpen(false)}
          title="تأكيد إرسال تقرير التحكيم النهائي"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-700 leading-relaxed">
              هل أنت متأكد من رغبتك في إرسال التقرير النهائي للبحث؟
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-slate-600">
              <p>• القرار الأكاديمي: <strong className="text-slate-900">{recommendationOptions.find(o => o.id === values.recommendation)?.title}</strong></p>
              <p>• التقييم العام: <strong className="text-slate-900">{values.overallScore} من 5</strong></p>
            </div>
            <p className="text-amber-700 font-semibold">
              تنبيه: بعد الإرسال النهائي سيتم قفل التقرير ولن تتمكن من تعديل التقييمات أو الملاحظات لاحقاً.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={saving}
              >
                مراجعة التقرير
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmSubmit}
                isLoading={saving}
              >
                نعم، إرسال التقرير الآن
              </Button>
            </div>
          </div>
        </Modal>
      </PageContainer>
    </ReviewerLayout>
  );
}
