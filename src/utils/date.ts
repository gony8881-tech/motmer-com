/**
 * تنسيق التاريخ بالعربية — سيُستخدم لاحقًا في جداول الأبحاث والتحكيم والـ Audit Log.
 */
export function formatDateAr(iso: string): string {
  return new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(
    new Date(iso)
  );
}
