export function Loading({ label = "جارٍ التحميل..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-6 text-sm text-primary-600" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-300 border-t-primary-700" />
      {label}
    </div>
  );
}
