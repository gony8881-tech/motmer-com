import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";


export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-700 text-white shadow-sm hover:bg-primary-800 active:bg-primary-900 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2",
  secondary:
    "bg-primary-50 text-primary-800 border border-primary-200/80 hover:bg-primary-100/80 active:bg-primary-200",
  outline:
    "border border-slate-300 bg-white text-slate-700 shadow-subtle hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200/70",
  danger:
    "bg-rose-600 text-white shadow-sm hover:bg-rose-700 active:bg-rose-800 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-[36px] px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md: "min-h-[44px] px-4 py-2.5 text-sm rounded-md2 gap-2",
  lg: "min-h-[48px] px-6 py-3 text-base rounded-xl2 gap-2.5",
  icon: "min-h-[40px] min-w-[40px] p-2 rounded-md2 justify-center",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-150 select-none",
        "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none",
        "active:scale-[0.98]",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={isDisabled}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="h-4 w-4 animate-spin text-current shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
}
