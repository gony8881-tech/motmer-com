import { useEffect, useRef, useState } from "react";
import { Alert, Button, Card } from "@/components/ui";
import { FileDropzone } from "@/features/submissions/components/FileDropzone";
import { validateSubmissionFile } from "@/features/submissions/validation";
import { uploadPaperFile, deleteUploadedPaperFile } from "@/features/submissions/services/submissionService";
import type { SelectedFileState } from "@/features/submissions/types";

interface FileUploadStepProps {
  conferenceId: string;
  userId?: string;
  fileState: SelectedFileState;
  onFileStateChange: (values: Partial<SelectedFileState>) => void;
  onNext: () => void;
  onBack: () => void;
  restoredFromDraft?: boolean;
}

export function FileUploadStep({
  conferenceId,
  userId,
  fileState,
  onFileStateChange,
  onNext,
  onBack,
  restoredFromDraft,
}: FileUploadStepProps) {
  // يحمل رقم "أحدث عملية اختيار ملف". أي رفع تنتهي نتيجته بعد اختيار لاحق تُعتبر قديمة (stale) وتُتجاهل،
  // بدل أن تكتب فوق حالة اختيار أحدث (كان يسبب عدم تطابق بين الملف المعروض ومساره الفعلي في Storage).
  const selectionTokenRef = useRef(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  // عند تفكيك المكوّن (مغادرة الخطوة)، تتبع حالة التثبيت لمنع تحديث الحالة بعد التفكيك
  useEffect(() => {
    isMountedRef.current = true;
    function preventDefaults(e: DragEvent) {
      // نتحقق من أن الحدث يخص سحب ملفات فعلية لتفادي أي تداخل مع إيماءات اللمس في المتصفحات
      const isFileDrag = e.dataTransfer?.types
        ? Array.from(e.dataTransfer.types).includes("Files")
        : false;

      if (!isFileDrag) return;

      e.preventDefault();
    }
    window.addEventListener("dragover", preventDefaults);
    window.addEventListener("drop", preventDefaults);

    return () => {
      isMountedRef.current = false;
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
      const { storagePath } = await uploadPaperFile(conferenceId, file, userId);

      // اختيار أحدث حدث بعد بدء هذا الرفع (أو تمت مغادرة الخطوة) — هذه النتيجة قديمة، تجاهلها
      // واحذف الملف الذي رُفع للتو حتى لا يبقى يتيمًا في Storage دون أن يُشار إليه من الحالة.
      if (!isMountedRef.current || token !== selectionTokenRef.current) {
        await deleteUploadedPaperFile(storagePath);
        return;
      }

      onFileStateChange({ file, status: "uploaded", storagePath, errorMessage: null });
    } catch (err) {
      if (!isMountedRef.current || token !== selectionTokenRef.current) return;
      onFileStateChange({
        file,
        status: "error",
        storagePath: null,
        errorMessage: err instanceof Error ? err.message : "تعذّر رفع الملف.",
      });
    }
  }

  function handleNext() {
    if (!fileState.file || fileState.status !== "uploaded" || !fileState.storagePath) {
      if (fileState.status === "uploading") {
        setValidationError("جارٍ رفع الملف حالياً، يرجى الانتظار حتى اكتمال الرفع.");
      } else if (!fileState.file) {
        setValidationError("يرجى اختيار ملف البحث أولاً للمتابعة.");
      } else if (fileState.status === "error") {
        setValidationError(fileState.errorMessage || "تعذّر رفع الملف، يرجى إعادة المحاولة.");
      } else {
        setValidationError("يرجى اختيار ورفع ملف البحث للمتابعة.");
      }
      return;
    }
    setValidationError(null);
    onNext();
  }

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-base font-semibold text-primary-900">رفع ملف البحث</h2>

      {restoredFromDraft && !fileState.file && (
        <Alert tone="info">
          تمت استعادة بيانات التقديم السابقة بنجاح. يرجى اختيار ملف البحث للمتابعة.
        </Alert>
      )}

      <FileDropzone
        fileState={fileState}
        onFileSelected={handleFileSelected}
        errorMessage={validationError}
      />

      <div className="flex justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>
          السابق
        </Button>
        <Button
          type="button"
          disabled={fileState.status === "uploading"}
          onClick={handleNext}
        >
          التالي
        </Button>
      </div>
    </Card>
  );
}
