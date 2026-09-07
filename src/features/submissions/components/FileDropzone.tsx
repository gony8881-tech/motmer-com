import { useRef, useState, type DragEvent } from "react";
import { Alert } from "@/components/ui";
import { ALLOWED_FILE_EXTENSIONS } from "@/features/submissions/types";
import type { SelectedFileState } from "@/features/submissions/types";
import { cn } from "@/lib/cn";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} بايت`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} كيلوبايت`;
  return `${(kb / 1024).toFixed(1)} ميجابايت`;
}

interface FileDropzoneProps {
  fileState: SelectedFileState;
  onFileSelected: (file: File) => void;
  errorMessage?: string | null;
}

export function FileDropzone({ fileState, onFileSelected, errorMessage }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const isUploading = fileState.status === "uploading";
  const displayError = errorMessage || (fileState.status === "error" ? fileState.errorMessage : null);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    if (isUploading) return; // تجنّب اختيار ملف جديد أثناء رفع ملف سابق قيد التنفيذ
    const file = event.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isUploading) setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
        }}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center gap-3 rounded-md2 border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragActive ? "border-primary-500 bg-primary-50" : "border-primary-200 bg-white",
          isUploading && "pointer-events-none opacity-60"
        )}
      >
        <p className="text-sm text-primary-600">
          اسحب ملف البحث وأفلته هنا، أو
        </p>
        <label
          htmlFor="submission-file-input"
          role="button"
          tabIndex={isUploading ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-md2 px-4 py-2 text-sm font-medium transition-colors cursor-pointer select-none",
            "bg-primary-100 text-primary-800 hover:bg-primary-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600",
            isUploading && "pointer-events-none opacity-50 cursor-not-allowed"
          )}
        >
          اختر ملف البحث
        </label>
        <p className="text-xs text-primary-400">
          الصيغ المدعومة: {ALLOWED_FILE_EXTENSIONS.join("، ")} — الحد الأقصى 10 ميجابايت
        </p>
        <input
          id="submission-file-input"
          ref={inputRef}
          type="file"
          accept={ALLOWED_FILE_EXTENSIONS.join(",")}
          className="sr-only"
          disabled={isUploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelected(file);
            e.target.value = "";
          }}
        />
      </div>

      {displayError && (
        <Alert tone="danger">{displayError}</Alert>
      )}

      {fileState.file && fileState.status !== "error" && (
        <div className="flex flex-col gap-2 rounded-md2 border border-primary-100 bg-white p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-primary-900">{fileState.file.name}</span>
            <span className="text-xs text-primary-500">{formatFileSize(fileState.file.size)}</span>
          </div>
          <div className="text-xs text-primary-500">
            النوع: {fileState.file.type || "غير معروف"}
          </div>

          {fileState.status === "uploading" && (
            <div className="mt-1 flex flex-col gap-1">
              <span className="text-xs text-primary-600">جارٍ رفع الملف...</span>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary-100">
                <div className="h-full w-1/3 animate-[upload-progress_1.1s_ease-in-out_infinite] rounded-full bg-primary-600" />
              </div>
            </div>
          )}

          {fileState.status === "uploaded" && (
            <span className="text-xs font-medium text-emerald-600">تم رفع الملف بنجاح ✓</span>
          )}
        </div>
      )}

      <style>{`
        @keyframes upload-progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}
