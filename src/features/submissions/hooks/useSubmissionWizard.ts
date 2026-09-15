import { useCallback, useEffect, useState } from "react";
import {
  EMPTY_FILE_STATE,
  EMPTY_PAPER_FORM,
  EMPTY_RESEARCHER_FORM,
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

  // حالة نموذج التقديم النصية المحفوظة في sessionStorage (بدون الملف)
  const [draftState, setDraftState] = useState<{
    step: SubmissionStep;
    researcher: ResearcherFormValues;
    paper: PaperFormValues;
    agreedToAccuracy: boolean;
  }>(() => {
    if (!slug) {
      return {
        step: 1,
        researcher: EMPTY_RESEARCHER_FORM,
        paper: EMPTY_PAPER_FORM,
        agreedToAccuracy: false,
      };
    }
    const draft = loadSubmissionDraft(slug);
    if (!draft) {
      return {
        step: 1,
        researcher: EMPTY_RESEARCHER_FORM,
        paper: EMPTY_PAPER_FORM,
        agreedToAccuracy: false,
      };
    }

    return {
      // عند استعادة مسودة محفوظة سابقاً، نحدد أقصى خطوة بـ 3 لأن ملف البحث لا يُحفظ في المتصفح
      step:
        typeof draft.step === "number" && draft.step >= 1 && draft.step <= 4
          ? (Math.min(draft.step, 3) as SubmissionStep)
          : 1,
      researcher: {
        ...EMPTY_RESEARCHER_FORM,
        ...(draft.researcher ?? {}),
      },
      paper: {
        ...EMPTY_PAPER_FORM,
        ...(draft.paper ?? {}),
      },
      agreedToAccuracy: Boolean(draft.agreedToAccuracy),
    };
  });

  // حالة الملف مفصولة تماماً ومحصورة في الذاكرة (in-memory state) ولا تُقرأ أو تُكتب من/إلى sessionStorage نهائياً
  const [fileState, setFileState] = useState<SelectedFileState>(EMPTY_FILE_STATE);

  // إذا تغيّر slug أو تم تمريره بعد أول تصيير، نستعيد المسودة للبيانات النصية فقط دون المساس بحالة الملف
  useEffect(() => {
    if (!slug) return;
    const draft = loadSubmissionDraft(slug);
    if (draft && (draft.step > 1 || draft.researcher?.fullName || draft.paper?.title)) {
      setRestoredFromDraft(true);
      setDraftState((prev) => {
        // إذا بدأ المستخدم الإدخال في نموذج غير افتراضي فلا نلغي مدخلاته
        if (prev.step !== 1 || prev.researcher.fullName || prev.paper.title) {
          return prev;
        }
        return {
          step:
            typeof draft.step === "number" && draft.step >= 1 && draft.step <= 4
              ? (Math.min(draft.step, 3) as SubmissionStep)
              : 1,
          researcher: {
            ...EMPTY_RESEARCHER_FORM,
            ...(draft.researcher ?? {}),
          },
          paper: {
            ...EMPTY_PAPER_FORM,
            ...(draft.paper ?? {}),
          },
          agreedToAccuracy: Boolean(draft.agreedToAccuracy),
        };
      });
    }
  }, [slug]);

  // حفظ تلقائي في sessionStorage للبيانات النصية فقط (الملف لا يُخزن في المتصفح)
  useEffect(() => {
    if (!slug) return;
    saveSubmissionDraft(slug, {
      step: draftState.step,
      researcher: draftState.researcher,
      paper: draftState.paper,
      agreedToAccuracy: draftState.agreedToAccuracy,
    });
  }, [slug, draftState.step, draftState.researcher, draftState.paper, draftState.agreedToAccuracy]);

  const goToStep = useCallback((step: SubmissionStep) => {
    setDraftState((prev) => ({ ...prev, step }));
  }, []);

  const nextStep = useCallback(() => {
    setDraftState((prev) => ({ ...prev, step: Math.min(4, prev.step + 1) as SubmissionStep }));
  }, []);

  const previousStep = useCallback(() => {
    setDraftState((prev) => ({ ...prev, step: Math.max(1, prev.step - 1) as SubmissionStep }));
  }, []);

  const updateResearcher = useCallback((values: Partial<ResearcherFormValues>) => {
    setDraftState((prev) => ({ ...prev, researcher: { ...prev.researcher, ...values } }));
  }, []);

  const updatePaper = useCallback((values: Partial<PaperFormValues>) => {
    setDraftState((prev) => ({ ...prev, paper: { ...prev.paper, ...values } }));
  }, []);

  const updateFile = useCallback((values: Partial<SelectedFileState>) => {
    setFileState((prev) => ({ ...prev, ...values }));
  }, []);

  const setAgreedToAccuracy = useCallback((agreed: boolean) => {
    setDraftState((prev) => ({ ...prev, agreedToAccuracy: agreed }));
  }, []);

  const clearDraft = useCallback(() => {
    if (slug) {
      clearSubmissionDraft(slug);
    }
    setRestoredFromDraft(false);
    setFileState(EMPTY_FILE_STATE);
  }, [slug]);

  const state: SubmissionWizardState = {
    ...draftState,
    file: fileState,
  };

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
