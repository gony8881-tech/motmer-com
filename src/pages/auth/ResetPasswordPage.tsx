import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/layout";
import { Alert, Button, Card, Input } from "@/components/ui";
import { FormField } from "@/components/forms";
import { updatePassword } from "@/features/auth";
import { ROUTES } from "@/constants/routes";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (password.length < 6) {
      setError("كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل.");
      return;
    }
    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => navigate(ROUTES.login, { replace: true }), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <h1 className="text-xl font-semibold text-primary-900">تعيين كلمة مرور جديدة</h1>

        <Card>
          {done ? (
            <Alert tone="success">تم تحديث كلمة المرور بنجاح. سيتم تحويلك لتسجيل الدخول...</Alert>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && <Alert tone="danger">{error}</Alert>}
              <FormField label="كلمة المرور الجديدة" htmlFor="password">
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </FormField>
              <FormField label="تأكيد كلمة المرور" htmlFor="confirmPassword">
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </FormField>
              <Button type="submit" disabled={submitting}>
                {submitting ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
