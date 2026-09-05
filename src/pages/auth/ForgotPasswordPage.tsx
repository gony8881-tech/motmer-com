import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "@/components/layout";
import { Alert, Button, Card, Input } from "@/components/ui";
import { FormField } from "@/components/forms";
import { requestPasswordReset } from "@/features/auth";
import { ROUTES } from "@/constants/routes";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) {
      setError("البريد الإلكتروني مطلوب.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContainer>
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <h1 className="text-xl font-semibold text-primary-900">استعادة كلمة المرور</h1>

        <Card>
          {sent ? (
            <Alert tone="success">
              إذا كان البريد الإلكتروني مسجّلًا لدينا، ستصلك رسالة تحتوي على رابط لاستعادة كلمة
              المرور.
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && <Alert tone="danger">{error}</Alert>}
              <FormField label="البريد الإلكتروني" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormField>
              <Button type="submit" disabled={submitting}>
                {submitting ? "جارٍ الإرسال..." : "إرسال رابط الاستعادة"}
              </Button>
            </form>
          )}
          <p className="mt-4 text-center text-sm text-primary-600">
            <Link to={ROUTES.login} className="font-medium text-primary-800 hover:underline">
              العودة لتسجيل الدخول
            </Link>
          </p>
        </Card>
      </div>
    </PageContainer>
  );
}
