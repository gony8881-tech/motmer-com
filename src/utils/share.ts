/** ينسخ نصًا إلى الحافظة، يُعيد true عند النجاح */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** true إذا كان المتصفح يدعم Web Share API */
export function canUseWebShare(): boolean {
  return typeof navigator !== "undefined" && "share" in navigator;
}

/** يشارك رابطًا عبر Web Share API إن كان متاحًا، يُعيد true عند نجاح المشاركة الفعلية */
export async function shareLink(title: string, url: string): Promise<boolean> {
  if (!canUseWebShare()) return false;
  try {
    await navigator.share({ title, url });
    return true;
  } catch {
    // المستخدم ألغى المشاركة أو حدث خطأ — لا نعتبره فشلاً يستدعي رسالة خطأ
    return false;
  }
}
