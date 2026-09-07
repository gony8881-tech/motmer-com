import type { PropsWithChildren } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "primary";

export interface BadgeProps extends PropsWithChildren {
  tone?: BadgeTone;
  className?: string;
  dot?: boolean;
}

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  primary: "bg-primary-50 text-primary-800 border-primary-200/70",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  warning: "bg-amber-50 text-amber-700 border-amber-200/80",
  danger: "bg-rose-50 text-rose-700 border-rose-200/80",
  info: "bg-sky-50 text-sky-700 border-sky-200/80",
};

const dotClasses: Record<BadgeTone, string> = {
  neutral: "bg-slate-400",
  primary: "bg-primary-600",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  info: "bg-sky-500",
};

export function Badge({ tone = "neutral", dot = false, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        toneClasses[tone],
        className
      )}
    >
      {dot && (
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotClasses[tone])} />
      )}
      <span>{children}</span>
    </span>
  );
}

