/**
 * Feature: conferences
 * المرحلة الثانية: منطق إدارة المؤتمرات مكتمل (CRUD + slug + حالة العرض).
 * الصفحات نفسها موجودة في src/pages/admin/conferences و src/pages/public
 * (اتساقًا مع الهيكل الذي أُنشئ في المرحلة الأولى: pages/ منفصلة عن features/).
 */
export * from "@/features/conferences/types";
export * from "@/features/conferences/validation";
export * from "@/features/conferences/services/conferenceService";
export * from "@/features/conferences/utils/computeStatus";
export * from "@/features/conferences/hooks/useConferences";
export * from "@/features/conferences/hooks/useConference";
export * from "@/features/conferences/hooks/useConferenceBySlug";
export * from "@/features/conferences/hooks/useOpenConferences";
