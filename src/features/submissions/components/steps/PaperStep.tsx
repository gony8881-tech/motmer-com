import { useState } from "react";
import { Badge, Button, Card, Input, Select, Textarea } from "@/components/ui";
import { FormField } from "@/components/forms";
import type { PaperFormErrors, PaperFormValues } from "@/features/submissions/types";

interface PaperStepProps {
  values: PaperFormValues;
  errors: PaperFormErrors;
  scientificFields: string[];
  onChange: (values: Partial<PaperFormValues>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function PaperStep({
  values,
  errors,
  scientificFields,
  onChange,
  onNext,
  onBack,
}: PaperStepProps) {
  const [keywordDraft, setKeywordDraft] = useState("");

  function addKeyword() {
    const trimmed = keywordDraft.trim();
    if (!trimmed || values.keywords.includes(trimmed)) {
      setKeywordDraft("");
      return;
    }
    onChange({ keywords: [...values.keywords, trimmed] });
    setKeywordDraft("");
  }

  function removeKeyword(keyword: string) {
    onChange({ keywords: values.keywords.filter((item) => item !== keyword) });
  }

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-primary-900">بيانات البحث</h2>

      <FormField label="عنوان البحث *" htmlFor="title" error={errors.title}>
        <Input id="title" value={values.title} onChange={(e) => onChange({ title: e.target.value })} />
      </FormField>

      <FormField label="الملخص *" htmlFor="abstract" error={errors.abstract}>
        <Textarea
          id="abstract"
          rows={6}
          value={values.abstract}
          onChange={(e) => onChange({ abstract: e.target.value })}
        />
      </FormField>

      <FormField label="المجال العلمي *" htmlFor="scientificField" error={errors.scientificField}>
        <Select
          id="scientificField"
          value={values.scientificField}
          onChange={(e) => onChange({ scientificField: e.target.value })}
        >
          <option value="">اختر المجال العلمي</option>
          {scientificFields.map((field) => (
            <option key={field} value={field}>
              {field}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="الكلمات المفتاحية" htmlFor="keywordDraft">
        <div className="flex gap-2">
          <Input
            id="keywordDraft"
            placeholder="مثال: تعلم آلي"
            value={keywordDraft}
            onChange={(e) => setKeywordDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addKeyword();
              }
            }}
          />
          <Button type="button" variant="secondary" onClick={addKeyword}>
            إضافة
          </Button>
        </div>
      </FormField>
      {values.keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.keywords.map((keyword) => (
            <button
              key={keyword}
              type="button"
              onClick={() => removeKeyword(keyword)}
              aria-label={`إزالة ${keyword}`}
            >
              <Badge>{keyword} ✕</Badge>
            </button>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>
          السابق
        </Button>
        <Button type="button" onClick={onNext}>
          التالي
        </Button>
      </div>
    </Card>
  );
}
