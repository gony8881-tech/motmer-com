import type { BadgeTone } from "@/components/ui/Badge";
import type { AssignmentStatus, ReviewRecommendation, ReviewType } from "@/types/reviewerWorkflow";

export function getAssignmentStatusBadge(status: AssignmentStatus): {
  label: string;
  tone: BadgeTone;
} {
  switch (status) {
    case "PENDING":
      return { label: "بانتظار قبولك", tone: "warning" };
    case "ACCEPTED":
      return { label: "قيد التحكيم", tone: "info" };
    case "DECLINED":
      return { label: "معتذر عنه", tone: "danger" };
    case "COMPLETED":
      return { label: "مكتمل", tone: "success" };
    case "CANCELLED":
      return { label: "ملغى", tone: "neutral" };
    default:
      return { label: status, tone: "neutral" };
  }
}

export function getRecommendationBadge(recommendation: ReviewRecommendation | null): {
  label: string;
  tone: BadgeTone;
} {
  switch (recommendation) {
    case "ACCEPT":
      return { label: "قبول البحث", tone: "success" };
    case "MINOR_REVISION":
      return { label: "تعديلات طفيفة", tone: "info" };
    case "MAJOR_REVISION":
      return { label: "تعديلات جوهرية", tone: "warning" };
    case "REJECT":
      return { label: "رفض البحث", tone: "danger" };
    default:
      return { label: "قيد التقييم", tone: "neutral" };
  }
}

export function getReviewTypeBadge(reviewType: ReviewType): {
  label: string;
  tone: BadgeTone;
  description: string;
} {
  switch (reviewType) {
    case "DOUBLE_BLIND":
      return {
        label: "مزدوجة التعمية (Double-Blind)",
        tone: "primary",
        description: "بيانات وهوية الباحث محجوبة تماماً عن المحكّم لحفظ النزاهة العلمية.",
      };
    case "SINGLE_BLIND":
      return {
        label: "أحادية التعمية (Single-Blind)",
        tone: "info",
        description: "بيانات الباحث ظاهرة للمحكّم، وهوية المحكّم سرية عن الباحث.",
      };
    case "OPEN":
      return {
        label: "تحكيم مفتوح (Open Review)",
        tone: "neutral",
        description: "هوية الباحث والمحكّم معلنة لكلا الطرفين.",
      };
    default:
      return {
        label: reviewType,
        tone: "neutral",
        description: "",
      };
  }
}

export function getDeadlineInfo(dueDateIso: string): {
  isOverdue: boolean;
  daysDiff: number;
  label: string;
  tone: BadgeTone;
} {
  const now = new Date();
  const due = new Date(dueDateIso);
  const diffMs = due.getTime() - now.getTime();
  const daysDiff = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysDiff < 0) {
    const overdueDays = Math.abs(daysDiff);
    return {
      isOverdue: true,
      daysDiff,
      label: `متأخر بـ ${overdueDays} ${overdueDays === 1 ? "يوم" : "أيام"}`,
      tone: "danger",
    };
  }

  if (daysDiff === 0) {
    return {
      isOverdue: false,
      daysDiff: 0,
      label: "ينتهي اليوم",
      tone: "warning",
    };
  }

  if (daysDiff <= 3) {
    return {
      isOverdue: false,
      daysDiff,
      label: `متبقي ${daysDiff} أيام`,
      tone: "warning",
    };
  }

  return {
    isOverdue: false,
    daysDiff,
    label: `متبقي ${daysDiff} يوم`,
    tone: "info",
  };
}
