import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { PageContainer } from "@/components/layout";
import { Alert, Badge, Button, Card, Input } from "@/components/ui";
import { FormField } from "@/components/forms";
import { ROUTES } from "@/constants/routes";
import {
  EMPTY_CONFERENCE_FORM,
  createConference,
  validateConferenceForm,
  isConferenceFormValid,
  type ConferenceFormErrors,
  type ConferenceFormValues,
} from "@/features/conferences";

export default function ConferenceNewPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState<ConferenceFormValues>(EMPTY_CONFERENCE_FORM);
  const [errors, setErrors] = useState<ConferenceFormErrors>({});
  const [fieldDraft, setFieldDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function update<K extends keyof ConferenceFormValues>(key: K, value: ConferenceFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function addScientificField() {
    const trimmed = fieldDraft.trim();
    if (!trimmed || values.scientificFields.includes(trimmed)) {
      setFieldDraft("");
      return;
    }
    update("scientificFields", [...values.scientificFields, trimmed]);
    setFieldDraft("");
  }

  function removeScientificField(field: string) {
    update(
      "scientificFields",
      values.scientificFields.filter((item) => item !== field)
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const validationErrors = validateConferenceForm(values);
    setErrors(validationErrors);
    if (!isConferenceFormValid(validationErrors)) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const conference = await createConference(values);
      navigate(ROUTES.admin.conferences.detail(conference.id));
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "حدث خطأ غير متوقع.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminLayout>
      <PageContainer>
        <h2 className="mb-6 text-lg font-semibold text-primary-900">إنشاء مؤتمر جديد</h2>

        {submitError && (
          <div className="mb-4">
            <Alert tone="danger">{submitError}</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Card className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-primary-800">معلومات المؤتمر</h3>
            <FormField label="اسم المؤتمر" htmlFor="title" error={errors.title}>
              <Input
                id="title"
                value={values.title}
                onChange={(e) => update("title", e.target.value)}
              />
            </FormField>
            <FormField label="وصف المؤتمر" htmlFor="description">
              <textarea
                id="description"
                rows={3}
                className="w-full rounded-md2 border border-primary-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                value={values.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </FormField>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="الجهة المنظمة" htmlFor="organizerName">
                <Input
                  id="organizerName"
                  value={values.organizerName}
                  onChange={(e) => update("organizerName", e.target.value)}
                />
              </FormField>
              <FormField label="مكان المؤتمر" htmlFor="location">
                <Input
                  id="location"
                  value={values.location}
                  onChange={(e) => update("location", e.target.value)}
                />
              </FormField>
            </div>
            <FormField
              label="البريد الإلكتروني للتواصل"
              htmlFor="contactEmail"
              error={errors.contactEmail}
            >
              <Input
                id="contactEmail"
                type="email"
                value={values.contactEmail}
                onChange={(e) => update("contactEmail", e.target.value)}
              />
            </FormField>
          </Card>

          <Card className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-primary-800">مواعيد المؤتمر</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="تاريخ البداية" htmlFor="startDate" error={errors.startDate}>
                <Input
                  id="startDate"
                  type="date"
                  value={values.startDate}
                  onChange={(e) => update("startDate", e.target.value)}
                />
              </FormField>
              <FormField label="تاريخ النهاية" htmlFor="endDate" error={errors.endDate}>
                <Input
                  id="endDate"
                  type="date"
                  value={values.endDate}
                  onChange={(e) => update("endDate", e.target.value)}
                />
              </FormField>
            </div>
          </Card>

          <Card className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-primary-800">فترة استقبال الأبحاث</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                label="بداية استقبال الأبحاث"
                htmlFor="submissionStart"
                error={errors.submissionStart}
              >
                <Input
                  id="submissionStart"
                  type="date"
                  value={values.submissionStart}
                  onChange={(e) => update("submissionStart", e.target.value)}
                />
              </FormField>
              <FormField
                label="نهاية استقبال الأبحاث"
                htmlFor="submissionEnd"
                error={errors.submissionEnd}
              >
                <Input
                  id="submissionEnd"
                  type="date"
                  value={values.submissionEnd}
                  onChange={(e) => update("submissionEnd", e.target.value)}
                />
              </FormField>
            </div>
          </Card>

          <Card className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-primary-800">المجالات العلمية</h3>
            <div className="flex gap-2">
              <Input
                placeholder="مثال: الذكاء الاصطناعي"
                value={fieldDraft}
                onChange={(e) => setFieldDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addScientificField();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={addScientificField}>
                إضافة
              </Button>
            </div>
            {values.scientificFields.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {values.scientificFields.map((field) => (
                  <button
                    key={field}
                    type="button"
                    onClick={() => removeScientificField(field)}
                    aria-label={`إزالة ${field}`}
                  >
                    <Badge>{field} ✕</Badge>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-primary-800">شروط التقديم</h3>
            <FormField label="شروط التقديم" htmlFor="submissionConditions">
              <textarea
                id="submissionConditions"
                rows={4}
                className="w-full rounded-md2 border border-primary-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                value={values.submissionConditions}
                onChange={(e) => update("submissionConditions", e.target.value)}
              />
            </FormField>
          </Card>

          <div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "جارٍ الحفظ..." : "إنشاء المؤتمر"}
            </Button>
          </div>
        </form>
      </PageContainer>
    </AdminLayout>
  );
}
