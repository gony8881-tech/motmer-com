import { Button, Card, Input } from "@/components/ui";
import { FormField } from "@/components/forms";
import type { ResearcherFormErrors, ResearcherFormValues } from "@/features/submissions/types";

interface ResearcherStepProps {
  values: ResearcherFormValues;
  errors: ResearcherFormErrors;
  onChange: (values: Partial<ResearcherFormValues>) => void;
  onNext: () => void;
  emailLocked?: boolean;
}

export function ResearcherStep({ values, errors, onChange, onNext, emailLocked }: ResearcherStepProps) {
  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-primary-900">بيانات الباحث</h2>

      <FormField label="الاسم الكامل *" htmlFor="fullName" error={errors.fullName}>
        <Input
          id="fullName"
          value={values.fullName}
          onChange={(e) => onChange({ fullName: e.target.value })}
        />
      </FormField>

      <FormField label="البريد الإلكتروني *" htmlFor="email" error={errors.email}>
        <Input
          id="email"
          type="email"
          dir="ltr"
          disabled={emailLocked}
          value={values.email}
          onChange={(e) => onChange({ email: e.target.value })}
        />
        {emailLocked && (
          <p className="mt-1 text-xs text-primary-400">
            البريد الإلكتروني مرتبط بحسابك ولا يمكن تغييره من هنا.
          </p>
        )}
      </FormField>

      <FormField label="رقم الهاتف" htmlFor="phone">
        <Input
          id="phone"
          type="tel"
          dir="ltr"
          value={values.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
        />
      </FormField>

      <FormField label="المؤسسة / الجامعة" htmlFor="organization">
        <Input
          id="organization"
          value={values.organization}
          onChange={(e) => onChange({ organization: e.target.value })}
        />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="الدولة" htmlFor="country">
          <Input
            id="country"
            value={values.country}
            onChange={(e) => onChange({ country: e.target.value })}
          />
        </FormField>

        <FormField label="الدرجة العلمية" htmlFor="academicDegree">
          <Input
            id="academicDegree"
            value={values.academicDegree}
            onChange={(e) => onChange({ academicDegree: e.target.value })}
          />
        </FormField>
      </div>

      <FormField label="التخصص" htmlFor="specialization">
        <Input
          id="specialization"
          value={values.specialization}
          onChange={(e) => onChange({ specialization: e.target.value })}
        />
      </FormField>

      <div className="flex justify-end">
        <Button type="button" onClick={onNext}>
          التالي
        </Button>
      </div>
    </Card>
  );
}
