import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200/80",
        className
      )}
      {...props}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  const widths = ["w-full", "w-5/6", "w-4/6", "w-3/4", "w-2/3"];
  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", widths[i % widths.length])}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl2 border border-slate-200/80 bg-white p-5 shadow-card space-y-4",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <SkeletonText lines={2} />
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-20 rounded-md2" />
      </div>
    </div>
  );
}

export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl2 border border-slate-200/80 bg-white p-5 shadow-card flex items-center justify-between",
        className
      )}
    >
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-16" />
      </div>
      <Skeleton className="h-12 w-12 rounded-xl" />
    </div>
  );
}

export function SkeletonTable({
  rows = 4,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full rounded-xl2 border border-slate-200/80 bg-white shadow-card overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/70 px-5 py-3.5">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`th-${i}`} className="h-4 w-20 flex-1" />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={`tr-${r}`}
            className="flex items-center justify-between gap-4 px-5 py-4"
          >
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton
                key={`td-${r}-${c}`}
                className={cn("h-4 flex-1", c === 0 ? "w-32" : "w-16")}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
