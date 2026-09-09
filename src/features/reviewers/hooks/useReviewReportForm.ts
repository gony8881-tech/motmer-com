import { useState, useEffect, useCallback } from "react";
import {
  getReviewReport,
  saveReviewReport,
  uploadReviewAttachment,
} from "../services/reviewerWorkflowService";
import type {
  ReviewReport,
  ReviewRecommendation,
} from "@/types/reviewerWorkflow";

export interface ReviewFormValues {
  recommendation: ReviewRecommendation | "";
  originalityScore: number;
  methodologyScore: number;
  clarityScore: number;
  significanceScore: number;
  overallScore: number;
  commentsForAuthor: string;
  confidentialCommentsForEditor: string;
  attachmentFilePath: string | null;
  attachmentFileName: string | null;
}

export function useReviewReportForm(
  assignmentId: string,
  paperId: string,
  reviewerId: string
) {
  const [values, setValues] = useState<ReviewFormValues>({
    recommendation: "",
    originalityScore: 3,
    methodologyScore: 3,
    clarityScore: 3,
    significanceScore: 3,
    overallScore: 3,
    commentsForAuthor: "",
    confidentialCommentsForEditor: "",
    attachmentFilePath: null,
    attachmentFileName: null,
  });

  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingReport, setExistingReport] = useState<ReviewReport | null>(null);

  useEffect(() => {
    if (!assignmentId) return;

    let cancelled = false;
    setInitialLoading(true);

    getReviewReport(assignmentId)
      .then((report) => {
        if (cancelled) return;
        if (report) {
          setExistingReport(report);
          setValues({
            recommendation: report.recommendation ?? "",
            originalityScore: report.originalityScore ?? 3,
            methodologyScore: report.methodologyScore ?? 3,
            clarityScore: report.clarityScore ?? 3,
            significanceScore: report.significanceScore ?? 3,
            overallScore: report.overallScore ?? 3,
            commentsForAuthor: report.commentsForAuthor ?? "",
            confidentialCommentsForEditor: report.confidentialCommentsForEditor ?? "",
            attachmentFilePath: report.attachmentFilePath,
            attachmentFileName: report.attachmentFileName,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "تعذّر جلب التقرير السابق.");
      })
      .finally(() => {
        if (!cancelled) setInitialLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [assignmentId]);

  const handleFieldChange = useCallback(
    <K extends keyof ReviewFormValues>(field: K, val: ReviewFormValues[K]) => {
      setValues((prev) => ({ ...prev, [field]: val }));
    },
    []
  );

  const handleFileUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);
      try {
        const { filePath, fileName } = await uploadReviewAttachment(assignmentId, file);
        setValues((prev) => ({
          ...prev,
          attachmentFilePath: filePath,
          attachmentFileName: fileName,
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "تعذّر رفع الملف.");
      } finally {
        setUploading(false);
      }
    },
    [assignmentId]
  );

  const save = useCallback(
    async (isSubmit: boolean) => {
      if (isSubmit && !values.recommendation) {
        throw new Error("يرجى اختيار التوصية والقرار النهائي للبحث.");
      }
      if (isSubmit && !values.commentsForAuthor.trim()) {
        throw new Error("يرجى كتابة الملاحظات الموجهة للمؤلف قبل الإرسال النهائي.");
      }

      setSaving(true);
      setError(null);
      try {
        const saved = await saveReviewReport(
          assignmentId,
          paperId,
          reviewerId,
          {
            recommendation: (values.recommendation || "ACCEPT") as ReviewRecommendation,
            originalityScore: values.originalityScore,
            methodologyScore: values.methodologyScore,
            clarityScore: values.clarityScore,
            significanceScore: values.significanceScore,
            overallScore: values.overallScore,
            commentsForAuthor: values.commentsForAuthor,
            confidentialCommentsForEditor: values.confidentialCommentsForEditor,
            attachmentFilePath: values.attachmentFilePath,
            attachmentFileName: values.attachmentFileName,
          },
          isSubmit
        );
        setExistingReport(saved);
        return saved;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "تعذّر حفظ التقرير.";
        setError(msg);
        throw new Error(msg);
      } finally {
        setSaving(false);
      }
    },
    [assignmentId, paperId, reviewerId, values]
  );

  return {
    values,
    setValues,
    existingReport,
    initialLoading,
    saving,
    uploading,
    error,
    handleFieldChange,
    handleFileUpload,
    saveDraft: () => save(false),
    submitFinal: () => save(true),
  };
}
