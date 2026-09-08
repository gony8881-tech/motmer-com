import { useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { PageContainer } from "@/components/layout";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  SkeletonTable,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { useReviewers, toggleReviewerActive, inviteReviewer } from "@/features/reviewers";
import type { Reviewer } from "@/types";

function InvitationBadge({ reviewer }: { reviewer: Reviewer }) {
  if (reviewer.acceptedAt) {
    return <Badge tone="success" dot>مقبولة</Badge>;
  }
  if (reviewer.invitedAt) {
    return <Badge tone="warning" dot>بانتظار القبول</Badge>;
  }
  return <Badge tone="neutral">لم تُرسل</Badge>;
}

export default function ReviewerListPage() {
  const { reviewers, loading, error, reload } = useReviewers();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "danger"; message: string } | null>(null);

  async function handleToggle(id: string, currentStatus: boolean) {
    setTogglingId(id);
    try {
      await toggleReviewerActive(id, currentStatus);
      reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "تعذّر تغيير حالة المحكّم.";
      alert(msg);
    } finally {
      setTogglingId(null);
    }
  }

  async function handleInvite(reviewer: Reviewer) {
    if (!reviewer.isActive) {
      setFeedback({
        type: "danger",
        message: "لا يمكن إرسال دعوة لمحكّم حسابه معطّل. يرجى تفعيل حسابه أولاً.",
      });
      return;
    }
    setInvitingId(reviewer.id);
    setFeedback(null);
    try {
      const res = await inviteReviewer(reviewer.id);
      setFeedback({
        type: "success",
        message: res.message || `تم إرسال رابط الدعوة إلى ${reviewer.fullName} بنجاح.`,
      });
      reload();
    } catch (err) {
      setFeedback({
        type: "danger",
        message: err instanceof Error ? err.message : "تعذّر إرسال رابط الدعوة.",
      });
    } finally {
      setInvitingId(null);
    }
  }

  return (
    <AdminLayout>
      <PageContainer>
        {/* Page Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">دليل المحكّمين</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              إدارة أعضاء لجان التحكيم، تخصصاتهم العلمية، وتفعيل أو تعطيل صلاحياتهم ومتابعة دعواتهم
            </p>
          </div>
          <Link to={ROUTES.admin.reviewers.new} className="self-start sm:self-auto">
            <Button size="md">+ إضافة محكّم جديد</Button>
          </Link>
        </div>

        {feedback && (
          <div className="mb-5">
            <Alert tone={feedback.type}>{feedback.message}</Alert>
          </div>
        )}

        {loading && <SkeletonTable rows={4} columns={6} />}

        {!loading && error && (
          <Alert tone="danger">
            {error}
          </Alert>
        )}

        {!loading && !error && reviewers.length === 0 && (
          <EmptyState
            title="لا يوجد محكّمون مسجلون حاليًا"
            description="ابدأ بإضافة أول محكّم إلى دليل المنصة ليتمكن من تقييم الأبحاث مستقبلاً."
          >
            <Link to={ROUTES.admin.reviewers.new} className="mt-4 inline-block">
              <Button>+ إضافة محكّم جديد</Button>
            </Link>
          </EmptyState>
        )}

        {!loading && !error && reviewers.length > 0 && (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>الاسم والبريد الإلكتروني</TableCell>
                    <TableCell>المؤسسة / الجامعة</TableCell>
                    <TableCell>التخصصات العلمية</TableCell>
                    <TableCell>حالة الحساب</TableCell>
                    <TableCell>حالة الدعوة</TableCell>
                    <TableCell>إجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reviewers.map((reviewer) => (
                    <TableRow key={reviewer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-xs font-bold text-primary-800">
                            {reviewer.fullName.trim().charAt(0) || "؟"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">
                              {reviewer.fullName}
                            </p>
                            <p dir="ltr" className="text-xs text-slate-500 text-right mt-0.5 font-mono">
                              {reviewer.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-700">
                          {reviewer.affiliation || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {reviewer.specialties.length > 0 ? (
                            reviewer.specialties.map((s) => (
                              <Badge key={s} tone="neutral">
                                {s}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">لا توجد تخصصات مسجلة</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge tone={reviewer.isActive ? "success" : "danger"} dot>
                          {reviewer.isActive ? "نشط" : "معطّل"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <InvitationBadge reviewer={reviewer} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link
                            to={ROUTES.admin.reviewers.detail(reviewer.id)}
                            className="text-xs font-semibold text-primary-700 hover:text-primary-800 hover:underline"
                          >
                            عرض وتعديل
                          </Link>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            disabled={togglingId === reviewer.id || invitingId === reviewer.id}
                            onClick={() => handleToggle(reviewer.id, reviewer.isActive)}
                            className={`text-xs font-medium transition-colors disabled:opacity-50 ${
                              reviewer.isActive
                                ? "text-rose-600 hover:text-rose-700"
                                : "text-emerald-700 hover:text-emerald-800"
                            }`}
                          >
                            {togglingId === reviewer.id
                              ? "..."
                              : reviewer.isActive
                              ? "تعطيل"
                              : "تفعيل"}
                          </button>
                          {!reviewer.acceptedAt && (
                            <>
                              <span className="text-slate-300">|</span>
                              <button
                                type="button"
                                disabled={!reviewer.isActive || invitingId === reviewer.id || togglingId === reviewer.id}
                                onClick={() => handleInvite(reviewer)}
                                className="text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors disabled:opacity-40"
                                title={!reviewer.isActive ? "يرجى تفعيل الحساب أولاً لإرسال الدعوة" : ""}
                              >
                                {invitingId === reviewer.id
                                  ? "جارٍ الإرسال..."
                                  : reviewer.invitedAt
                                  ? "إعادة إرسال الدعوة"
                                  : "إرسال الدعوة"}
                              </button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-3.5">
              {reviewers.map((reviewer) => (
                <Card key={reviewer.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-sm font-bold text-primary-800">
                        {reviewer.fullName.trim().charAt(0) || "؟"}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 leading-tight truncate">
                          {reviewer.fullName}
                        </h4>
                        <p dir="ltr" className="text-xs text-slate-500 font-mono truncate text-right mt-0.5">
                          {reviewer.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge tone={reviewer.isActive ? "success" : "danger"} dot>
                        {reviewer.isActive ? "نشط" : "معطّل"}
                      </Badge>
                      <InvitationBadge reviewer={reviewer} />
                    </div>
                  </div>

                  {reviewer.affiliation && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                      <span className="text-slate-400 font-medium">المؤسسة: </span>
                      {reviewer.affiliation}
                    </p>
                  )}

                  {reviewer.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {reviewer.specialties.map((s) => (
                        <Badge key={s} tone="neutral">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={togglingId === reviewer.id || invitingId === reviewer.id}
                        onClick={() => handleToggle(reviewer.id, reviewer.isActive)}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                          reviewer.isActive
                            ? "border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100"
                            : "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                        }`}
                      >
                        {togglingId === reviewer.id
                          ? "..."
                          : reviewer.isActive
                          ? "تعطيل"
                          : "تفعيل"}
                      </button>
                      {!reviewer.acceptedAt && (
                        <button
                          type="button"
                          disabled={!reviewer.isActive || invitingId === reviewer.id || togglingId === reviewer.id}
                          onClick={() => handleInvite(reviewer)}
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors disabled:opacity-40"
                        >
                          {invitingId === reviewer.id
                            ? "..."
                            : reviewer.invitedAt
                            ? "إعادة الدعوة"
                            : "إرسال الدعوة"}
                        </button>
                      )}
                    </div>
                    <Link to={ROUTES.admin.reviewers.detail(reviewer.id)}>
                      <Button size="sm" variant="secondary">
                        عرض وتعديل
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </PageContainer>
    </AdminLayout>
  );
}
