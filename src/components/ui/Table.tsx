import type { TdHTMLAttributes, PropsWithChildren, HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Table({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("overflow-x-auto rounded-xl2 border border-slate-200/80 bg-white shadow-card", className)}>
      <table className="w-full text-right text-sm">{children}</table>
    </div>
  );
}

export function TableHead({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <thead className={cn("bg-slate-50/90 text-xs font-semibold text-slate-600 border-b border-slate-200/80", className)}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <tbody className={cn("divide-y divide-slate-100", className)}>{children}</tbody>;
}

export function TableRow({ children, className, ...props }: PropsWithChildren<HTMLAttributes<HTMLTableRowElement>>) {
  return (
    <tr className={cn("hover:bg-slate-50/60 transition-colors", className)} {...props}>
      {children}
    </tr>
  );
}

export function TableCell({ children, className, ...props }: PropsWithChildren<TdHTMLAttributes<HTMLTableCellElement>>) {
  return (
    <td className={cn("px-4 py-3.5 align-middle text-slate-700", className)} {...props}>
      {children}
    </td>
  );
}
