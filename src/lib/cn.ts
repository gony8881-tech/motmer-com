/**
 * دمج أصناف Tailwind CSS بأمان (بديل بسيط عن clsx/tailwind-merge لتفادي إضافة تبعيات غير ضرورية الآن).
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
