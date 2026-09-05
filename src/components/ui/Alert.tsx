import type { PropsWithChildren } from "react";
import { cn } from "@/lib/cn";

type Tone = "info" | "success" | "warning" | "danger";

const toneClasses: Record<Tone, string> = {
  info: "bg-primary-50 text-primary-800 border-primary-200",
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  danger: "bg-red-50 text-red-800 border-red-200",
};

export function Alert({ tone = "info", children }: PropsWithChildren<{ tone?: Tone }>) {
  return (
    <div className={cn("rounded-md2 border px-4 py-3 text-sm", toneClasses[tone])} role="alert">
      {children}
    </div>
  );
}
