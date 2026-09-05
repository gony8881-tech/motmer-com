/**
 * تحويل نص (عربي أو إنجليزي) إلى slug صالح للاستخدام في الروابط.
 * ملاحظة: النص العربي يُترجم صوتيًا (transliteration) بسيطة لأن الأحرف العربية
 * لا يمكن تمثيلها مباشرة كـ slug لاتيني نظيف وقابل للقراءة عالميًا في الرابط.
 * لا تتحقق هذه الدالة من التفرد (Uniqueness) — هذا مسؤولية
 * features/conferences/services/conferenceService.ts (generateUniqueSlug).
 */

const ARABIC_TRANSLITERATION: Record<string, string> = {
  ا: "a", أ: "a", إ: "e", آ: "a", ب: "b", ت: "t", ث: "th", ج: "j",
  ح: "h", خ: "kh", د: "d", ذ: "th", ر: "r", ز: "z", س: "s", ش: "sh",
  ص: "s", ض: "d", ط: "t", ظ: "z", ع: "a", غ: "gh", ف: "f", ق: "q",
  ك: "k", ل: "l", م: "m", ن: "n", ه: "h", و: "w", ي: "y", ى: "a",
  ة: "a", ء: "", ئ: "e", ؤ: "o",
};

function transliterateArabic(input: string): string {
  return input
    .split("")
    .map((char) => ARABIC_TRANSLITERATION[char] ?? char)
    .join("");
}

export function slugify(input: string): string {
  const transliterated = transliterateArabic(input.trim().toLowerCase());

  return transliterated
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // إزالة علامات التشكيل اللاتينية
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
