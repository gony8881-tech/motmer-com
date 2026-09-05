import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { PageContainer } from "@/components/layout";
import { Alert, Button, Card, Input, Loading } from "@/components/ui";
import { FormField } from "@/components/forms";
import { useAuth } from "@/features/auth/context/AuthContext";
import {
  EMPTY_LOGIN_FORM,
  validateLoginForm,
  isLoginFormValid,
  type LoginFormErrors,
  type LoginFormValues,
} from "@/features/auth";
import { getRoleDashboardPath } from "@/features/auth/utils";
import { ROUTES } from "@/constants/routes";

export default function LoginPage() {
  const { isAuthenticated, loading, role, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  const [values, setValues] = useState<LoginFormValues>(EMPTY_LOGIN_FORM);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    const validationErrors = validateLoginForm(values);
    setErrors(validationErrors);
    if (!isLoginFormValid(validationErrors)) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await signIn(values.email, values.password);
      navigate(returnUrl || ROUTES.home, { replace: true });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "حدث خطأ أثناء تسجيل الدخول.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <h1 className="text-xl font-semibold text-primary-900">تسجيل الدخول</h1>

        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {submitError && <Alert tone="danger">{submitError}</Alert>}

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

            <div className="text-left text-xs">
              <Link to={ROUTES.forgotPassword} className="text-primary-600 hover:underline">
                نسيت كلمة المرور؟
              </Link>
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>

            <p className="text-center text-sm text-primary-600">
              ليس لديك حساب؟{" "}
              <Link to={ROUTES.register} className="font-medium text-primary-800 hover:underline">
                إنشاء حساب جديد
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </PageContainer>
  );
}
