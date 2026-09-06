import { useState, type FormEvent } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { PageContainer } from "@/components/layout";
import { Alert, Button, Card, Input, Loading } from "@/components/ui";
import { FormField } from "@/components/forms";
import { useAuth } from "@/features/auth/context/AuthContext";
import {
  EMPTY_REGISTER_FORM,
  validateRegisterForm,
  isRegisterFormValid,
  type RegisterFormErrors,
  type RegisterFormValues,
} from "@/features/auth";
import { getRoleDashboardPath } from "@/features/auth/utils";
import { ROUTES } from "@/constants/routes";

export default function RegisterPage() {
  const { isAuthenticated, loading, role, signUp } = useAuth();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  const [values, setValues] = useState<RegisterFormValues>(EMPTY_REGISTER_FORM);
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);

  if (loading) {
    return (
      <PageContainer>
        <Loading label="جارٍ التحقق من حالة الدخول..." />
      </PageContainer>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={returnUrl || (role ? getRoleDashboardPath(role) : ROUTES.home)} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const validationErrors = validateRegisterForm(values);
    setErrors(validationErrors);
    if (!isRegisterFormValid(validationErrors)) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await signUp(values.fullName, values.email, values.password);
      setRegistered(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "حدث خطأ أثناء إنشاء الحساب.");
    } finally {
      setSubmitting(false);
    }
  }

  if (registered) {
    return (
      <PageContainer>
        <div className="mx-auto max-w-md">
          <Card className="flex flex-col gap-4 text-center">
            <h1 className="text-lg font-semibold text-primary-900">تم إنشاء الحساب بنجاح</h1>
            <p className="text-sm text-primary-600">
              إذا كان تأكيد البريد الإلكتروني مفعّلًا في المشروع، يرجى تفقّد بريدك لتأكيد الحساب
              قبل تسجيل الدخول.
            </p>
            <Link to={returnUrl ? `${ROUTES.login}?returnUrl=${encodeURIComponent(returnUrl)}` : ROUTES.login}>
              <Button className="w-full">الذهاب لتسجيل الدخول</Button>
            </Link>
          </Card>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <h1 className="text-xl font-semibold text-primary-900">إنشاء حساب جديد</h1>

        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {submitError && <Alert tone="danger">{submitError}</Alert>}

            <FormField label="الاسم الكامل" htmlFor="fullName" error={errors.fullName}>
              <Input
                id="fullName"
                value={values.fullName}
                onChange={(e) => setValues((prev) => ({ ...prev, fullName: e.target.value }))}
              />
            </FormField>

            <FormField label="البريد الإلكتروني" htmlFor="email" error={errors.email}>
              <Input
                id="email"
                type="email"
                dir="ltr"
                value={values.email}
                onChange={(e) => setValues((prev) => ({ ...prev, email: e.target.value }))}
              />
            </FormField>

            <FormField label="كلمة المرور" htmlFor="password" error={errors.password}>
              <Input
                id="password"
                type="password"
                value={values.password}
                onChange={(e) => setValues((prev) => ({ ...prev, password: e.target.value }))}
              />
            </FormField>

            <FormField
              label="تأكيد كلمة المرور"
              htmlFor="confirmPassword"
              error={errors.confirmPassword}
            >
              <Input
                id="confirmPassword"
                type="password"
                value={values.confirmPassword}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, confirmPassword: e.target.value }))
                }
              />
            </FormField>

            <Button type="submit" disabled={submitting}>
              {submitting ? "جارٍ إنشاء الحساب..." : "إنشاء حساب"}
            </Button>

            <p className="text-center text-sm text-primary-600">
              لديك حساب بالفعل؟{" "}
              <Link to={ROUTES.login} className="font-medium text-primary-800 hover:underline">
                تسجيل الدخول
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </PageContainer>
  );
}
