/**
 * Feature: submissions
 * المرحلة الثالثة: نظام تقديم البحث العلمي مكتمل (معالج 4 خطوات + رفع ملف +
 * RPC آمن لإنشاء الباحث/البحث/النسخة الأولى + استعلامات لوحة الإدارة).
 * الصفحات نفسها موجودة في src/pages/public و src/pages/admin/submissions
 * (اتساقًا مع نمط features/conferences).
 */
export * from "@/features/submissions/types";
export * from "@/features/submissions/validation";
export * from "@/features/submissions/services/submissionService";
export * from "@/features/submissions/hooks/useSubmissionWizard";
export * from "@/features/submissions/hooks/useConferenceSubmissions";
export * from "@/features/submissions/hooks/useSubmissionDetail";
