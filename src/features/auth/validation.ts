import type {
  LoginFormErrors,
  LoginFormValues,
  RegisterFormErrors,
  RegisterFormValues,
} from "@/features/auth/types";

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MIN_PASSWORD_LENGTH = 6;

export function validateLoginForm(values: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {};

  if (!values.email.trim()) {
    errors.email = "البريد الإلكتروني مطلوب.";
  } else if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = "صيغة البريد الإلكتروني غير صحيحة.";
  }

  if (!values.password) {
    errors.password = "كلمة المرور مطلوبة.";
  }

  return errors;
}

export function isLoginFormValid(errors: LoginFormErrors): boolean {
  return Object.keys(errors).length === 0;
}

export function validateRegisterForm(values: RegisterFormValues): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  if (!values.fullName.trim()) {
    errors.fullName = "الاسم الكامل مطلوب.";
  }

  if (!values.email.trim()) {
    errors.email = "البريد الإلكتروني مطلوب.";
  } else if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = "صيغة البريد الإلكتروني غير صحيحة.";
  }

  if (!values.password) {
    errors.password = "كلمة المرور مطلوبة.";
  } else if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `كلمة المرور يجب أن تحتوي على ${MIN_PASSWORD_LENGTH} أحرف على الأقل.`;
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "يرجى تأكيد كلمة المرور.";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "كلمتا المرور غير متطابقتين.";
  }

  return errors;
}

export function isRegisterFormValid(errors: RegisterFormErrors): boolean {
  return Object.keys(errors).length === 0;
}

/** يحوّل رسائل خطأ Supabase Auth التقنية إلى رسائل عربية مفهومة للمستخدم. */
export function translateAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  }
  if (normalized.includes("already registered") || normalized.includes("already exists") || normalized.includes("user already registered")) {
    return "هذا البريد الإلكتروني مستخدم بالفعل.";
  }
  if (normalized.includes("password") && normalized.includes("6")) {
    return "كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل.";
  }
  if (normalized.includes("email not confirmed")) {
    return "يرجى تأكيد بريدك الإلكتروني أولًا عبر الرابط المُرسَل إليك.";
  }
  if (normalized.includes("rate limit")) {
    return "محاولات كثيرة جدًا. يرجى الانتظار قليلًا ثم إعادة المحاولة.";
  }

  return "حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.";
}
