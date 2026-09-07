import { useState, type FormEvent, type PropsWithChildren } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { PageContainer } from "@/components/layout";
import { Alert, Button, Card, Checkbox, Input } from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import {
  EMPTY_REVIEWER_FORM,
  validateReviewerForm,
  isReviewerFormValid,
  createReviewer,
  type ReviewerFormErrors,
  type ReviewerFormValues,
} from "@/features/reviewers";

function FormField({
  label,
  htmlFor,
  error,
  required,
  children,
}: PropsWithChildren<{
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
}>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-semibold text-slate-700">
        {label} {required && <span className="text-rose-600">*</span>}
      </label>
      {children}
      {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}

export default function ReviewerNewPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState<ReviewerFormValues>(EMPTY_REVIEWER_FORM);
  const [errors, setErrors] = useState<ReviewerFormErrors>({});
  const [specialtyDraft, setSpecialtyDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function update<K extends keyof ReviewerFormValues>(key: K, value: ReviewerFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function addSpecialty() {
    const trimmed = specialtyDraft.trim();
    if (!trimmed || values.specialties.includes(trimmed)) {
      setSpecialtyDraft("");
      return;
    }
    update("specialties", [...values.specialties, trimmed]);
    setSpecialtyDraft("");
  }

  function removeSpecialty(specialty: string) {
    update(
      "specialties",
      values.specialties.filter((s) => s !== specialty)
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const validationErrors = validateReviewerForm(values);
    setErrors(validationErrors);
    if (!isReviewerFormValid(validationErrors)) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await createReviewer(values);
      navigate(ROUTES.admin.reviewers.list);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "حدث خطأ غير متوقع.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminLayout>
      <PageContainer maxWidth="narrow">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">إضافة محكّم جديد</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              تسجيل بيانات محكّم جديد وتحديد تخصصاته العلمية في المنصة
            </p>
          </div>
          <Link to={ROUTES.admin.reviewers.list} className="self-start sm:self-auto">
            <Button variant="outline" size="sm">
              إلغاء والعودة
            </Button>
          </Link>
        </div>

        {submitError && (
          <div className="mb-5">
            <Alert tone="danger">{submitError}</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Personal & Contact Info Card */}
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
              البيانات الشخصية وبيانات التواصل
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="الاسم الكامل"
                htmlFor="fullName"
                required
                error={errors.fullName}
              >
                <Input
                  id="fullName"
                  placeholder="مثال: د. عبد الله السعيد"
                  value={values.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                />
              </FormField>

              <FormField
                label="البريد الإلكتروني"
                htmlFor="email"
                required
                error={errors.email}
              >
                <Input
                  id="email"
                  type="email"
                  dir="ltr"
                  placeholder="name@example.com"
                  value={values.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </FormField>

              <FormField
                label="رقم الهاتف"
                htmlFor="phone"
                error={errors.phone}
              >
                <Input
                  id="phone"
                  dir="ltr"
                  placeholder="+966 50 123 4567"
                  value={values.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </FormField>

              <FormField
                label="المؤسسة / الجامعة / جهة العمل"
                htmlFor="affiliation"
              >
                <Input
                  id="affiliation"
                  placeholder="مثال: جامعة الملك سعود"
                  value={values.affiliation}
                  onChange={(e) => update("affiliation", e.target.value)}
                />
              </FormField>
            </div>
          </Card>

          {/* Specialties Card */}
          <Card className="p-5 space-y-4">
            <div className="pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">التخصصات العلمية</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                أدخل التخصص واضغط Enter أو زر إضافة لإضافته إلى قائمة اهتمامات المحكّم
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="مثال: ذكاء اصطناعي، أمن سيبراني، معالجة لغات..."
                value={specialtyDraft}
                onChange={(e) => setSpecialtyDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSpecialty();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={addSpecialty}>
                إضافة
              </Button>
            </div>

            {values.specialties.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {values.specialties.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => removeSpecialty(s)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors"
                  >
                    <span>{s}</span>
                    <span className="text-slate-400 hover:text-rose-600 font-bold">✕</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">لم تُضف أي تخصصات بعد (اختياري).</p>
            )}
          </Card>

          {/* Account Status Card */}
          <Card className="p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
              حالة الحساب
            </h3>
            <Checkbox
              id="isActive"
              label="تفعيل حساب المحكّم فورًا (جاهز لاستلام أبحاث للتحكيم)"
              checked={values.isActive}
              onChange={(e) => update("isActive", e.target.checked)}
            />
          </Card>

          {/* Submit Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              size="md"
              isLoading={submitting}
              className="min-w-[140px]"
            >
              {submitting ? "جارٍ الحفظ..." : "حفظ وإضافة المحكّم"}
            </Button>
            <Link to={ROUTES.admin.reviewers.list}>
              <Button type="button" variant="ghost" size="md">
                إلغاء
              </Button>
            </Link>
          </div>
        </form>
      </PageContainer>
    </AdminLayout>
  );
}
