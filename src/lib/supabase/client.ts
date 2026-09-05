import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** true إذا كانت متغيرات البيئة الخاصة بـ Supabase موجودة */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/** رسالة عربية واضحة تُعرض في الواجهة عند عدم إعداد Supabase بعد */
export const SUPABASE_NOT_CONFIGURED_MESSAGE =
  "Supabase غير مُعد بعد. أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY إلى ملف البيئة (.env) بالاعتماد على .env.example.";

/**
 * عميل Supabase المركزي. يبقى null إذا لم تكن متغيرات البيئة متوفرة،
 * حتى لا ينهار التطبيق عند التشغيل بدون إعداد — بدلاً من ذلك تتحقق كل
 * دالة في conferenceService من isSupabaseConfigured وتُرجع خطأ عربيًا واضحًا.
 */
export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl as string, supabaseAnonKey as string)
  : null;

/** يرمي خطأ عربيًا واضحًا إن لم يكن Supabase مُعدًا، وإلا يُعيد العميل جاهزًا للاستخدام. */
export function requireSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error(SUPABASE_NOT_CONFIGURED_MESSAGE);
  }
  return supabase;
}
