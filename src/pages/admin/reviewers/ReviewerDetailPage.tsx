import { useState, type FormEvent, type PropsWithChildren } from "react";
import { Link, useParams } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { PageContainer } from "@/components/layout";
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Input,
  SkeletonCard,
} from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { formatDateAr } from "@/utils/date";
import {
  useReviewer,
  updateReviewer,
  toggleReviewerActive,
  inviteReviewer,
  validateReviewerForm,
  isReviewerFormValid,
  type ReviewerFormErrors,
  type ReviewerFormValues,
} from "@/features/reviewers";

function FormField({
  label,
  htmlFor,
  error,
  required,
  children,
}: PropsWithChildren<{
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
}>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-semibold text-slate-700">
        {label} {required && <span className="text-rose-600">*</span>}
      </label>
      {children}
      {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}

export default function ReviewerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { reviewer, loading, error, reload } = useReviewer(id);

  const [isEditing, setIsEditing] = useState(false);
  const [values, setValues] = useState<ReviewerFormValues>({
    fullName: "",
    email: "",
    phone: "",
    affiliation: "",
    specialties: [],
    isActive: true,
  });
  const [errors, setErrors] = useState<ReviewerFormErrors>({});
  const [specialtyDraft, setSpecialtyDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    type: "success" | "danger";
    message: string;
  } | null>(null);

  function startEditing() {
    if (!reviewer) return;
    setValues({
      fullName: reviewer.fullName,
      email: reviewer.email,
      phone: reviewer.phone || "",
      affiliation: reviewer.affiliation || "",
      specialties: reviewer.specialties ?? [],
      isActive: reviewer.isActive,
    });
    setErrors({});
    setSaveError(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setSaveError(null);
    setErrors({});
  }

  function update<K extends keyof ReviewerFormValues>(key: K, value: ReviewerFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function addSpecialty() {
    const trimmed = specialtyDraft.trim();
    if (!trimmed || values.specialties.includes(trimmed)) {
      setSpecialtyDraft("");
      return;
    }
    update("specialties", [...values.specialties, trimmed]);
    setSpecialtyDraft("");
  }

  function removeSpecialty(specialty: string) {
    update(
      "specialties",
      values.specialties.filter((s) => s !== specialty)
    );
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!reviewer) return;

    const validationErrors = validateReviewerForm(values);
    setErrors(validationErrors);
    if (!isReviewerFormValid(validationErrors)) return;

    setSaving(true);
    setSaveError(null);
    try {
      await updateReviewer(reviewer.id, values);
      setIsEditing(false);
      reload();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "حدث خطأ غير متوقع.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus() {
    if (!reviewer) return;
    setToggling(true);
    try {
      await toggleReviewerActive(reviewer.id, reviewer.isActive);
      reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "تعذّر تغيير حالة المحكّم.");
    } finally {
      setToggling(false);
    }
  }

  async function handleSendInvite() {
    if (!reviewer) return;
    if (!reviewer.isActive) {
      setActionFeedback({
        type: "danger",
        message: "لا يمكن إرسال دعوة لمحكّم حسابه معطّل. يرجى تفعيل حسابه أولاً.",
      });
      return;
    }
    setInviting(true);
    setActionFeedback(null);
    try {
      const res = await inviteReviewer(reviewer.id);
      setActionFeedback({
        type: "success",
        message: res.message || `تم إرسال رابط الدعوة إلى ${reviewer.fullName} بنجاح.`,
      });
      reload();
    } catch (err) {
      setActionFeedback({
        type: "danger",
        message: err instanceof Error ? err.message : "تعذّر إرسال رابط الدعوة.",
      });
    } finally {
      setInviting(false);
    }
  }

  const initial =
    reviewer?.fullName?.trim().charAt(0) || reviewer?.email?.charAt(0).toUpperCase() || "؟";

  return (
    <AdminLayout>
      <PageContainer maxWidth="narrow">
        {/* Header navigation */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {loading ? "تفاصيل المحكّم" : reviewer?.fullName || "المحكّم"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              عرض وتعديل بيانات المحكّم وإدارة التخصصات العلمية وحالة الحساب
            </p>
          </div>
          <Link to={ROUTES.admin.reviewers.list} className="self-start sm:self-auto">
            <Button variant="outline" size="sm">
              ← العودة لدليل المحكّمين
            </Button>
          </Link>
        </div>

        {actionFeedback && (
          <div className="mb-5">
            <Alert tone={actionFeedback.type}>{actionFeedback.message}</Alert>
          </div>
        )}

        {loading && <SkeletonCard />}

        {!loading && (error || !reviewer) && (
          <Alert tone="danger">
            {error || "المحكّم المطلوب غير موجود أو تم حذفه."}
          </Alert>
        )}

        {!loading && reviewer && (
          <div className="space-y-6">
            {/* Identity Card */}
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 text-center sm:text-right">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-700 to-primary-900 text-xl font-bold text-white shadow-sm ring-4 ring-primary-50 shrink-0">
                    {initial}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{reviewer.fullName}</h3>
                      <Badge tone={reviewer.isActive ? "success" : "danger"} dot>
                        {reviewer.isActive ? "الحساب نشط" : "الحساب معطّل"}
                      </Badge>
                      {reviewer.acceptedAt ? (
                        <Badge tone="success" dot>دعوة مقبولة</Badge>
                      ) : reviewer.invitedAt ? (
                        <Badge tone="warning" dot>بانتظار قبول الدعوة</Badge>
                      ) : (
                        <Badge tone="neutral">لم تُرسل دعوة</Badge>
                      )}
                    </div>
                    <p dir="ltr" className="text-sm font-medium text-slate-500 font-mono">
                      {reviewer.email}
                    </p>
                    {reviewer.affiliation && (
                      <p className="text-xs text-slate-600 font-medium">
                        {reviewer.affiliation}
                      </p>
                    )}
                  </div>
                </div>

                {!isEditing && (
                  <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 pt-2 sm:pt-0">
                    {!reviewer.acceptedAt && (
                      <Button
                        size="sm"
                        variant="secondary"
                        isLoading={inviting}
                        disabled={!reviewer.isActive || toggling}
                        onClick={handleSendInvite}
                        title={!reviewer.isActive ? "يرجى تفعيل الحساب أولاً لإرسال الدعوة" : ""}
                      >
                        {reviewer.invitedAt ? "إعادة إرسال الدعوة" : "إرسال رابط الدعوة"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={startEditing}
                    >
                      تعديل البيانات
                    </Button>
                    <Button
                      size="sm"
                      variant={reviewer.isActive ? "danger" : "primary"}
                      isLoading={toggling}
                      onClick={handleToggleStatus}
                    >
                      {reviewer.isActive ? "تعطيل الحساب" : "تفعيل الحساب"}
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Content Area: View Mode or Edit Mode */}
            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-5">
                {saveError && <Alert tone="danger">{saveError}</Alert>}

                <Card className="p-5 space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
                    تعديل البيانات الشخصية
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      label="الاسم الكامل"
                      htmlFor="fullName"
                      required
                      error={errors.fullName}
                    >
                      <Input
                        id="fullName"
                        value={values.fullName}
                        onChange={(e) => update("fullName", e.target.value)}
                      />
                    </FormField>

                    <FormField
                      label="البريد الإلكتروني"
                      htmlFor="email"
                      required
                      error={errors.email}
                    >
                      <Input
                        id="email"
                        type="email"
                        dir="ltr"
                        value={values.email}
                        onChange={(e) => update("email", e.target.value)}
                      />
                    </FormField>

                    <FormField
                      label="رقم الهاتف"
                      htmlFor="phone"
                      error={errors.phone}
                    >
                      <Input
                        id="phone"
                        dir="ltr"
                        value={values.phone}
                        onChange={(e) => update("phone", e.target.value)}
                      />
                    </FormField>

                    <FormField
                      label="المؤسسة / الجامعة"
                      htmlFor="affiliation"
                    >
                      <Input
                        id="affiliation"
                        value={values.affiliation}
                        onChange={(e) => update("affiliation", e.target.value)}
                      />
                    </FormField>
                  </div>
                </Card>

                {/* Edit Specialties */}
                <Card className="p-5 space-y-4">
                  <div className="pb-2 border-b border-slate-100">
                    <h4 className="text-sm font-bold text-slate-800">التخصصات العلمية</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      أضف أو احذف من مجالات تخصص المحكّم
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="أدخل التخصص واضغط إضافة..."
                      value={specialtyDraft}
                      onChange={(e) => setSpecialtyDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSpecialty();
                        }
                      }}
                    />
                    <Button type="button" variant="secondary" onClick={addSpecialty}>
                      إضافة
                    </Button>
                  </div>

                  {values.specialties.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {values.specialties.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => removeSpecialty(s)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors"
                        >
                          <span>{s}</span>
                          <span className="text-slate-400 hover:text-rose-600 font-bold">✕</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">لا توجد تخصصات مسجلة.</p>
                  )}
                </Card>

                {/* Edit Status */}
                <Card className="p-5 space-y-3">
                  <h4 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
                    حالة الحساب
                  </h4>
                  <Checkbox
                    id="isActive"
                    label="الحساب نشط (يمكن إسناد أبحاث إليه)"
                    checked={values.isActive}
                    onChange={(e) => update("isActive", e.target.checked)}
                  />
                </Card>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="submit"
                    size="md"
                    isLoading={saving}
                    className="min-w-[140px]"
                  >
                    {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={cancelEditing}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            ) : (
              /* View Mode */
              <div className="space-y-5">
                <Card className="p-6">
                  <h4 className="text-sm font-bold text-slate-800 pb-2 mb-4 border-b border-slate-100">
                    بيانات المحكّم التفصيلية
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-xs text-slate-400 font-medium">الاسم الكامل</span>
                      <p className="text-sm font-semibold text-slate-800">{reviewer.fullName}</p>
                    </div>

                    <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-xs text-slate-400 font-medium">البريد الإلكتروني</span>
                      <p dir="ltr" className="text-sm font-semibold text-slate-800 text-right font-mono">
                        {reviewer.email}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-xs text-slate-400 font-medium">رقم الهاتف</span>
                      <p dir="ltr" className="text-sm font-semibold text-slate-800 text-right">
                        {reviewer.phone || "—"}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-xs text-slate-400 font-medium">المؤسسة / الجامعة</span>
                      <p className="text-sm font-semibold text-slate-800">
                        {reviewer.affiliation || "—"}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-xs text-slate-400 font-medium">تاريخ الإضافة</span>
                      <p className="text-sm font-semibold text-slate-800">
                        {formatDateAr(reviewer.createdAt)}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-xs text-slate-400 font-medium">آخر تحديث</span>
                      <p className="text-sm font-semibold text-slate-800">
                        {formatDateAr(reviewer.updatedAt)}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Invitation Details Card */}
                <Card className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 mb-4 border-b border-slate-100">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">دعوة حساب المحكّم (Supabase Auth)</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        حالة رابط الدعوة المرسل لتعيين كلمة المرور وتفعيل بوابة التحكيم
                      </p>
                    </div>
                    {!reviewer.acceptedAt && (
                      <Button
                        size="sm"
                        isLoading={inviting}
                        disabled={!reviewer.isActive || toggling}
                        onClick={handleSendInvite}
                      >
                        {reviewer.invitedAt ? "إعادة إرسال الدعوة بالبريد" : "إرسال رابط الدعوة الآن"}
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-xs text-slate-400 font-medium">حالة الدعوة</span>
                      <div>
                        {reviewer.acceptedAt ? (
                          <Badge tone="success" dot>مقبولة وتم تفعيل الحساب</Badge>
                        ) : reviewer.invitedAt ? (
                          <Badge tone="warning" dot>تم الإرسال (بانتظار القبول)</Badge>
                        ) : (
                          <Badge tone="neutral">لم تُرسل بعد</Badge>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-xs text-slate-400 font-medium">تاريخ إرسال آخر دعوة</span>
                      <p className="text-sm font-semibold text-slate-800">
                        {reviewer.invitedAt ? formatDateAr(reviewer.invitedAt) : "—"}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-xs text-slate-400 font-medium">تاريخ قبول الدعوة</span>
                      <p className="text-sm font-semibold text-slate-800">
                        {reviewer.acceptedAt ? formatDateAr(reviewer.acceptedAt) : "—"}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Specialties Display */}
                <Card className="p-6">
                  <h4 className="text-sm font-bold text-slate-800 pb-2 mb-3 border-b border-slate-100">
                    التخصصات والمجالات العلمية
                  </h4>
                  {reviewer.specialties && reviewer.specialties.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {reviewer.specialties.map((s) => (
                        <Badge key={s} tone="neutral" className="px-3 py-1 text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">لم تُحدد تخصصات بعد لهذا المحكّم.</p>
                  )}
                </Card>
              </div>
            )}
          </div>
        )}
      </PageContainer>
    </AdminLayout>
  );
}
