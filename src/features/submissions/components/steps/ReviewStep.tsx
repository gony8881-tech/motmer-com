import { Alert, Button, Card, Checkbox } from "@/components/ui";
import type { PaperFormValues, ResearcherFormValues, SelectedFileState } from "@/features/submissions/types";

interface ReviewStepProps {
  researcher: ResearcherFormValues;
  paper: PaperFormValues;
  file: SelectedFileState;
  agreedToAccuracy: boolean;
  submitting: boolean;
  submitError: string | null;
  onAgreedChange: (agreed: boolean) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export function ReviewStep({
  researcher,
  paper,
  file,
  agreedToAccuracy,
  submitting,
  submitError,
  onAgreedChange,
  onSubmit,
  onBack,
}: ReviewStepProps) {
  return (
    <Card className="flex flex-col gap-5">
      <h2 className="text-base font-semibold text-primary-900">مراجعة قبل الإرسال</h2>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-primary-800">بيانات الباحث</h3>
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-primary-500">الاسم</dt>
            <dd>{researcher.fullName}</dd>
          </div>
          <div>
            <dt className="text-primary-500">البريد</dt>
            <dd dir="ltr" className="text-right">{researcher.email}</dd>
          </div>
          <div>
            <dt className="text-primary-500">الهاتف</dt>
            <dd>{researcher.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-primary-500">المؤسسة</dt>
            <dd>{researcher.organization || "—"}</dd>
          </div>
          <div>
            <dt className="text-primary-500">الدولة</dt>
            <dd>{researcher.country || "—"}</dd>
          </div>
          <div>
            <dt className="text-primary-500">الدرجة العلمية</dt>
            <dd>{researcher.academicDegree || "—"}</dd>
          </div>
          <div>
            <dt className="text-primary-500">التخصص</dt>
            <dd>{researcher.specialization || "—"}</dd>
          </div>
        </dl>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-primary-800">بيانات البحث</h3>
        <dl className="flex flex-col gap-2 text-sm">
          <div>
            <dt className="text-primary-500">العنوان</dt>
            <dd>{paper.title}</dd>
          </div>
          <div>
            <dt className="text-primary-500">الملخص</dt>
            <dd className="whitespace-pre-line">{paper.abstract}</dd>
          </div>
          <div>
            <dt className="text-primary-500">المجال</dt>
            <dd>{paper.scientificField}</dd>
          </div>
          <div>
            <dt className="text-primary-500">الكلمات المفتاحية</dt>
            <dd>{paper.keywords.length > 0 ? paper.keywords.join("، ") : "—"}</dd>
          </div>
          <div>
            <dt className="text-primary-500">اسم الملف</dt>
            <dd>{file.file?.name ?? "—"}</dd>
          </div>
        </dl>
      </div>

      <Checkbox
        id="agreedToAccuracy"
        label="أقر بأن البيانات المدخلة صحيحة"
        checked={agreedToAccuracy}
        onChange={(e) => onAgreedChange(e.target.checked)}
      />

      {submitError && <Alert tone="danger">{submitError}</Alert>}

      <div className="flex justify-between">
        <Button type="button" variant="ghost" onClick={onBack} disabled={submitting}>
          السابق
        </Button>
        <Button type="button" disabled={!agreedToAccuracy || submitting} onClick={onSubmit}>
          {submitting ? "جاري إرسال البحث..." : "إرسال البحث"}
        </Button>
      </div>
    </Card>
  );
}
