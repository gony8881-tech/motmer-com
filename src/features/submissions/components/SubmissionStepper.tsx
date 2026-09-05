import { SUBMISSION_STEPS, type SubmissionStep } from "@/features/submissions/types";
import { cn } from "@/lib/cn";

interface SubmissionStepperProps {
  currentStep: SubmissionStep;
}

export function SubmissionStepper({ currentStep }: SubmissionStepperProps) {
  return (
    <ol className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-0">
      {SUBMISSION_STEPS.map(({ step, label }, index) => {
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;

        return (
          <li key={step} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  isCurrent && "bg-primary-700 text-white",
                  isCompleted && "bg-emerald-600 text-white",
                  !isCurrent && !isCompleted && "bg-primary-100 text-primary-600"
                )}
              >
                {isCompleted ? "✓" : step}
              </span>
              <span
                className={cn(
                  "text-xs font-medium sm:text-sm",
                  isCurrent ? "text-primary-900" : "text-primary-500"
                )}
              >
                {label}
              </span>
            </div>
            {index < SUBMISSION_STEPS.length - 1 && (
              <span className="hidden h-px flex-1 bg-primary-200 sm:mx-3 sm:block" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
