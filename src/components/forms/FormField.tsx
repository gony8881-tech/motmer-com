import type { PropsWithChildren } from "react";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
}

export function FormField({ label, htmlFor, error, children }: PropsWithChildren<FormFieldProps>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-primary-800">
        {label}
      </label>
      {children}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
