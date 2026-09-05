import { useCallback, useState } from "react";
import {
  EMPTY_WIZARD_STATE,
  type PaperFormValues,
  type ResearcherFormValues,
  type SelectedFileState,
  type SubmissionStep,
  type SubmissionWizardState,
} from "@/features/submissions/types";

/**
 * يحافظ على كل بيانات معالج التقديم في الذاكرة عبر الخطوات الأربع،
 * بحيث لا تُفقد البيانات عند الرجوع لخطوة سابقة لتعديلها (متطلب واجهة إلزامي).
 */
export function useSubmissionWizard() {
  const [state, setState] = useState<SubmissionWizardState>(EMPTY_WIZARD_STATE);

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

  return {
    state,
    goToStep,
    nextStep,
    previousStep,
    updateResearcher,
    updatePaper,
    updateFile,
    setAgreedToAccuracy,
  };
}
