import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageContainer } from "@/components/layout";
import { Alert, Loading } from "@/components/ui";
import { computeDisplayStatus, useConferenceBySlug } from "@/features/conferences";
import { useAuth } from "@/features/auth/context/AuthContext";
import {
  ResearcherStep,
  PaperStep,
  FileUploadStep,
  ReviewStep,
} from "@/features/submissions/components/steps";
import { SubmissionStepper } from "@/features/submissions/components/SubmissionStepper";
import {
  deleteUploadedPaperFile,
  submitPaper,
  useSubmissionWizard,
  validatePaperForm,
  validateResearcherForm,
  isResearcherFormValid,
  isPaperFormValid,
  type PaperFormErrors,
  type ResearcherFormErrors,
} from "@/features/submissions";
import { ROUTES } from "@/constants/routes";

export default function ConferenceSubmitPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { conference, loading, error, notFound } = useConferenceBySlug(slug);
  const { profile } = useAuth();

  const {
    state,
    goToStep,
    nextStep,
    previousStep,
    updateResearcher,
    updatePaper,
    updateFile,
    setAgreedToAccuracy,
    clearDraft,
    restoredFromDraft,
  } = useSubmissionWizard(slug);

  const [researcherErrors, setResearcherErrors] = useState<ResearcherFormErrors>({});
  const [paperErrors, setPaperErrors] = useState<PaperFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const prefilledRef = useRef(false);

  // الصفحة محمية بـ ProtectedRoute، لذا يوجد دائمًا profile هنا. نملأ بيانات
  // الباحث تلقائيًا من الحساب إن لم تكن مستعادة مسبقًا من المسودة (البريد يبقى
  // مقفلًا لاحقًا لأنه مرتبط بالحساب — انظر submit_paper الذي يعتمد على auth.users).
  useEffect(() => {
    if (profile && !prefilledRef.current) {
      prefilledRef.current = true;
      updateResearcher({
        fullName: state.researcher.fullName || profile.fullName,
        email: profile.email,
      });
    }
  }, [profile, updateResearcher, state.researcher.fullName]);

  if (loading) {
    return (
      <PageContainer>
        <Loading label="جارٍ تحميل بيانات المؤتمر..." />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <Alert tone="danger">حدث خطأ أثناء تحميل بيانات المؤتمر. يرجى المحاولة مرة أخرى.</Alert>
      </PageContainer>
    );
  }

  if (notFound || !conference) {
    return (
      <PageContainer>
        <Alert tone="warning">لم يتم العثور على هذا المؤتمر.</Alert>
      </PageContainer>
    );
  }

  const displayStatus = computeDisplayStatus(conference.status, conference.submissionEnd);

  if (displayStatus === "DRAFT") {
    return (
      <PageContainer>
        <Alert tone="info">هذا المؤتمر غير متاح للتقديم حاليًا.</Alert>
      </PageContainer>
    );
  }

  if (displayStatus === "CLOSED") {
    const notStarted = new Date().toISOString().slice(0, 10) < conference.submissionStart;
    return (
      <PageContainer>
        <Alert tone="warning">
          {notStarted ? "لم يبدأ استقبال الأبحاث بعد." : "انتهت فترة استقبال الأبحاث."}
        </Alert>
      </PageContainer>
    );
  }

  async function handleSubmit() {
    if (submittingRef.current || !conference) return; // منع الإرسال المكرر (double click)
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);

    try {
      if (!state.file.storagePath || !state.file.file) {
        throw new Error("يرجى رفع ملف البحث أولًا.");
      }

      const result = await submitPaper({
        conferenceId: conference.id,
        researcher: state.researcher,
        paper: state.paper,
        file: {
          storagePath: state.file.storagePath,
          fileName: state.file.file.name,
          fileType: state.file.file.type || "application/octet-stream",
          fileSize: state.file.file.size,
        },
      });

      // مسح المسودة من sessionStorage فور نجاح إرسال البحث
      clearDraft();

      navigate(ROUTES.publicConference.submissionSuccess(conference.slug), {
        state: { paperNumber: result.paperNumber },
      });
    } catch (err) {
      // نجح رفع الملف وفشل إنشاء البحث في قاعدة البيانات: نظّف الملف اليتيم من التخزين.
      if (state.file.storagePath) {
        await deleteUploadedPaperFile(state.file.storagePath).catch(() => undefined);
        updateFile({ status: "error", storagePath: null });
      }
      setSubmitError(err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء إرسال البحث.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-primary-900">تقديم بحث إلى {conference.title}</h1>
        </div>

        <SubmissionStepper currentStep={state.step} />

        {state.step === 1 && (
          <ResearcherStep
            values={state.researcher}
            errors={researcherErrors}
            onChange={updateResearcher}
            emailLocked
            onNext={() => {
              const errors = validateResearcherForm(state.researcher);
              setResearcherErrors(errors);
              if (isResearcherFormValid(errors)) {
                goToStep(2);
              }
            }}
          />
        )}

        {state.step === 2 && (
          <PaperStep
            values={state.paper}
            errors={paperErrors}
            scientificFields={conference.scientificFields}
            onChange={updatePaper}
            onBack={previousStep}
            onNext={() => {
              const errors = validatePaperForm(state.paper);
              setPaperErrors(errors);
              if (isPaperFormValid(errors)) {
                goToStep(3);
              }
            }}
          />
        )}

        {state.step === 3 && (
          <FileUploadStep
            conferenceId={conference.id}
            userId={profile?.id}
            fileState={state.file}
            onFileStateChange={updateFile}
            onBack={previousStep}
            onNext={nextStep}
            restoredFromDraft={restoredFromDraft}
          />
        )}

        {state.step === 4 && (
          <ReviewStep
            researcher={state.researcher}
            paper={state.paper}
            file={state.file}
            agreedToAccuracy={state.agreedToAccuracy}
            submitting={submitting}
            submitError={
              submitError ||
              (restoredFromDraft && !state.file.file
                ? "تمت استعادة بيانات التقديم، لكن يرجى العودة للخطوة السابقة وإعادة اختيار ملف البحث قبل الإرسال."
                : null)
            }
            onAgreedChange={setAgreedToAccuracy}
            onBack={previousStep}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </PageContainer>
  );
}
