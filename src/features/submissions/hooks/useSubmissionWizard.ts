import { useCallback, useEffect, useState } from "react";
import {
  EMPTY_FILE_STATE,
  EMPTY_PAPER_FORM,
  EMPTY_RESEARCHER_FORM,
  EMPTY_WIZARD_STATE,
  type PaperFormValues,
  type ResearcherFormValues,
  type SelectedFileState,
  type SubmissionStep,
  type SubmissionWizardState,
} from "@/features/submissions/types";

export interface SubmissionDraftStorage {
  step: SubmissionStep;
  researcher: ResearcherFormValues;
  paper: PaperFormValues;
  agreedToAccuracy: boolean;
}

export function getSubmissionDraftKey(slug: string): string {
  return `submission-draft-${slug}`;
}

export function loadSubmissionDraft(slug: string): SubmissionDraftStorage | null {
  if (typeof window === "undefined" || !slug) return null;
  try {
    const raw = window.sessionStorage.getItem(getSubmissionDraftKey(slug));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && typeof data === "object") {
      return data as SubmissionDraftStorage;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveSubmissionDraft(slug: string, draft: SubmissionDraftStorage): void {
  if (typeof window === "undefined" || !slug) return;
  try {
    window.sessionStorage.setItem(getSubmissionDraftKey(slug), JSON.stringify(draft));
  } catch {
    // تتجاهل الأخطاء في حال منع التخزين (مثل التصفح الخاص أو امتلاء المساحة)
  }
}

export function clearSubmissionDraft(slug: string): void {
  if (typeof window === "undefined" || !slug) return;
  try {
    window.sessionStorage.removeItem(getSubmissionDraftKey(slug));
  } catch {
    // تتجاهل أي خطأ أثناء الحذف
  }
}

/**
 * يحافظ على كل بيانات معالج التقديم في الذاكرة ومزامنتها مع sessionStorage عبر الخطوات الأربع،
 * بحيث لا تُفقد البيانات عند الرجوع لخطوة سابقة لتعديلها أو عند إعادة تحميل التبويب في متصفحات الموبايل.
 */
export function useSubmissionWizard(slug?: string) {
  const [restoredFromDraft, setRestoredFromDraft] = useState<boolean>(() => {
    if (!slug) return false;
    const draft = loadSubmissionDraft(slug);
    return Boolean(draft && (draft.step > 1 || draft.researcher?.fullName || draft.paper?.title));
  });

  const [state, setState] = useState<SubmissionWizardState>(() => {
    if (!slug) return EMPTY_WIZARD_STATE;
    const draft = loadSubmissionDraft(slug);
    if (!draft) return EMPTY_WIZARD_STATE;

    return {
      step:
        typeof draft.step === "number" && draft.step >= 1 && draft.step <= 4
          ? draft.step
          : 1,
      researcher: {
        ...EMPTY_RESEARCHER_FORM,
        ...(draft.researcher ?? {}),
      },
      paper: {
        ...EMPTY_PAPER_FORM,
        ...(draft.paper ?? {}),
      },
      file: EMPTY_FILE_STATE,
      agreedToAccuracy: Boolean(draft.agreedToAccuracy),
    };
  });

  // إذا تغيّر slug أو تم تمريره بعد أول تصيير، نحاول استعادة المسودة
  useEffect(() => {
    if (!slug) return;
    const draft = loadSubmissionDraft(slug);
    if (draft && (draft.step > 1 || draft.researcher?.fullName || draft.paper?.title)) {
      setRestoredFromDraft(true);
      setState((prev) => {
        // إذا بدأ المستخدم الإدخال في نموذج غير افتراضي فلا نلغي مدخلاته
        if (prev.step !== 1 || prev.researcher.fullName || prev.paper.title) {
          return prev;
        }
        return {
          step:
            typeof draft.step === "number" && draft.step >= 1 && draft.step <= 4
              ? draft.step
              : 1,
          researcher: {
            ...EMPTY_RESEARCHER_FORM,
            ...(draft.researcher ?? {}),
          },
          paper: {
            ...EMPTY_PAPER_FORM,
            ...(draft.paper ?? {}),
          },
          file: EMPTY_FILE_STATE,
          agreedToAccuracy: Boolean(draft.agreedToAccuracy),
        };
      });
    }
  }, [slug]);

  // حفظ تلقائي في sessionStorage عند أي تغيير في بيانات النموذج أو الخطوة
  useEffect(() => {
    if (!slug) return;
    saveSubmissionDraft(slug, {
      step: state.step,
      researcher: state.researcher,
      paper: state.paper,
      agreedToAccuracy: state.agreedToAccuracy,
    });
  }, [slug, state.step, state.researcher, state.paper, state.agreedToAccuracy]);

  const goToStep = useCallback((step: SubmissionStep) => {
    setState((prev) => ({ ...prev, step }));
  }, []);

  const nextStep = useCallback(() => {
    setState((prev) => ({ ...prev, step: Math.min(4, prev.step + 1) as SubmissionStep }));
  }, []);

  const previousStep = useCallback(() => {
    setState((prev) => ({ ...prev, step: Math.max(1, prev.step - 1) as SubmissionStep }));
  }, []);

  const updateResearcher = useCallback((values: Partial<ResearcherFormValues>) => {
    setState((prev) => ({ ...prev, researcher: { ...prev.researcher, ...values } }));
  }, []);

  const updatePaper = useCallback((values: Partial<PaperFormValues>) => {
    setState((prev) => ({ ...prev, paper: { ...prev.paper, ...values } }));
  }, []);

  const updateFile = useCallback((values: Partial<SelectedFileState>) => {
    setState((prev) => ({ ...prev, file: { ...prev.file, ...values } }));
  }, []);

  const setAgreedToAccuracy = useCallback((agreed: boolean) => {
    setState((prev) => ({ ...prev, agreedToAccuracy: agreed }));
  }, []);

  const clearDraft = useCallback(() => {
    if (slug) {
      clearSubmissionDraft(slug);
    }
    setRestoredFromDraft(false);
  }, [slug]);

  return {
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
  };
}
