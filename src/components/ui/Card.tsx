import type { PropsWithChildren } from "react";
import { cn } from "@/lib/cn";

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("rounded-md2 border border-primary-100 bg-white p-5 shadow-sm", className)}>
      {children}
    </div>
  );
}
