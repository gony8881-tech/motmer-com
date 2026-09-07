import { useEffect, useRef, useState } from "react";
import { Button, Card } from "@/components/ui";
import { FileDropzone } from "@/features/submissions/components/FileDropzone";
import { validateSubmissionFile } from "@/features/submissions/validation";
import { uploadPaperFile, deleteUploadedPaperFile } from "@/features/submissions/services/submissionService";
import type { SelectedFileState } from "@/features/submissions/types";

interface FileUploadStepProps {
  conferenceId: string;
  fileState: SelectedFileState;
  onFileStateChange: (values: Partial<SelectedFileState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function FileUploadStep({
  conferenceId,
  fileState,
  onFileStateChange,
  onNext,
  onBack,
}: FileUploadStepProps) {
  // يحمل رقم "أحدث عملية اختيار ملف". أي رفع تنتهي نتيجته بعد اختيار لاحق تُعتبر قديمة (stale) وتُتجاهل،
  // بدل أن تكتب فوق حالة اختيار أحدث (كان يسبب عدم تطابق بين الملف المعروض ومساره الفعلي في Storage).
  const selectionTokenRef = useRef(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  // عند تفكيك المكوّن (مغادرة الخطوة)، أي نتيجة رفع متأخرة تصل لاحقًا تُتجاهل أيضًا.
  // منع السلوك الافتراضي للمتصفح (فتح الملف أو إعادة تحميل الصفحة) عند إفلات ملف في النافذة.
  useEffect(() => {
    function preventDefaults(e: DragEvent) {
      e.preventDefault();
    }
    window.addEventListener("dragover", preventDefaults);
    window.addEventListener("drop", preventDefaults);

    return () => {
      selectionTokenRef.current += 1;
      window.removeEventListener("dragover", preventDefaults);
      window.removeEventListener("drop", preventDefaults);
    };
  }, []);

  async function handleFileSelected(file: File) {
    const token = ++selectionTokenRef.current;
    const previousStoragePath = fileState.storagePath;

    // التحقق من صحة الملف قبل قبوله في الحالة
    const errorMsg = validateSubmissionFile(file);
    if (errorMsg) {
      if (token !== selectionTokenRef.current) return;
      setValidationError(errorMsg);
      // عدم قبول الملف: لا يُحفظ في الحالة كملف مختار
      onFileStateChange({
        file: null,
        status: "idle",
        storagePath: null,
        errorMessage: null,
      });
      if (previousStoragePath) {
        await deleteUploadedPaperFile(previousStoragePath);
      }
      return;
    }

    setValidationError(null);

    onFileStateChange({ file, status: "uploading", storagePath: null, errorMessage: null });

    // إذا كان هناك ملف مرفوع سابقًا (المستخدم غيّر اختياره)، احذفه لتجنّب تراكم ملفات يتيمة.
    // هذا لا يعتمد على نتيجة الرفع الجديد، فيُنفَّذ بغض النظر عن التوكن.
    if (previousStoragePath) {
      await deleteUploadedPaperFile(previousStoragePath);
    }

    try {
      const { storagePath } = await uploadPaperFile(conferenceId, file);

      // اختيار أحدث حدث بعد بدء هذا الرفع (أو تمت مغادرة الخطوة) — هذه النتيجة قديمة، تجاهلها
      // واحذف الملف الذي رُفع للتو حتى لا يبقى يتيمًا في Storage دون أن يُشار إليه من الحالة.
      if (token !== selectionTokenRef.current) {
        await deleteUploadedPaperFile(storagePath);
        return;
      }

      onFileStateChange({ status: "uploaded", storagePath });
    } catch (err) {
      if (token !== selectionTokenRef.current) return;
      onFileStateChange({
        status: "error",
        storagePath: null,
        errorMessage: err instanceof Error ? err.message : "تعذّر رفع الملف.",
      });
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-primary-900">رفع ملف البحث</h2>

      <FileDropzone
        fileState={fileState}
        onFileSelected={handleFileSelected}
        errorMessage={validationError}
      />

      <div className="flex justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>
          السابق
        </Button>
        <Button type="button" disabled={fileState.status !== "uploaded"} onClick={onNext}>
          التالي
        </Button>
      </div>
    </Card>
  );
}
