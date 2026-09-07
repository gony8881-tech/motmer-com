import type { PropsWithChildren, HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  maxWidth?: "default" | "full" | "narrow";
}

export function PageContainer({
  children,
  className,
  maxWidth = "default",
  ...props
}: PropsWithChildren<PageContainerProps>) {
  const maxWidthClasses = {
    narrow: "max-w-4xl",
    default: "max-w-6xl",
    full: "max-w-7xl",
  };

  return (
    <div
      className={cn(
        "mx-auto w-full px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8",
        maxWidthClasses[maxWidth],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
