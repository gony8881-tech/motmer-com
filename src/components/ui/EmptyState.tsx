import type { PropsWithChildren } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description, children }: PropsWithChildren<EmptyStateProps>) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md2 border border-dashed border-primary-200 px-6 py-12 text-center">
      <h3 className="text-sm font-semibold text-primary-800">{title}</h3>
      {description && <p className="mt-1 text-sm text-primary-500">{description}</p>}
      {children}
    </div>
  );
}
