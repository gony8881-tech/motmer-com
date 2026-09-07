import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { PageContainer } from "@/components/layout";
import { Card, Button } from "@/components/ui";
import { useAuth } from "@/features/auth/context/AuthContext";
import { ROLE_LABELS_AR } from "@/features/auth/utils";
import { useConferences } from "@/features/conferences";
import { getAllPapersCount } from "@/features/submissions";
import { ConferencesIcon, PapersIcon } from "@/components/layout/NavIcons";
import { ROUTES } from "@/constants/routes";

export default function AdminHome() {
  const { profile } = useAuth();
  const { conferences } = useConferences();
  const [papersCount, setPapersCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAllPapersCount()
      .then((count) => {
        if (!cancelled) setPapersCount(count);
      })
      .catch(() => {
        if (!cancelled) setPapersCount(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminLayout>
      <PageContainer>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              مرحبًا، {profile?.fullName || "مدير النظام"} 👋
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {profile ? ROLE_LABELS_AR[profile.role] : "لوحة تحكم المدير"} — نظرة عامة على نشاط المنصة
            </p>
          </div>
          <Link to={ROUTES.admin.conferences.new} className="self-start sm:self-auto">
            <Button size="md">+ إنشاء مؤتمر جديد</Button>
          </Link>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Conferences Metric */}
          <Link to={ROUTES.admin.conferences.list} className="block group">
            <Card hoverable className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">إجمالي المؤتمرات</p>
                <p className="mt-1 text-3xl font-extrabold text-slate-900 group-hover:text-primary-700 transition-colors">
                  {conferences.length}
                </p>
                <span className="text-xs text-primary-700 font-medium mt-1 inline-block">
                  عرض المؤتمرات ←
                </span>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 group-hover:bg-primary-100 transition-colors">
                <ConferencesIcon className="h-7 w-7" />
              </div>
            </Card>
          </Link>

          {/* Papers Metric */}
          <Link to={ROUTES.admin.papers} className="block group">
            <Card hoverable className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">إجمالي الأبحاث المقدَّمة</p>
                <p className="mt-1 text-3xl font-extrabold text-slate-900 group-hover:text-primary-700 transition-colors">
                  {papersCount ?? "—"}
                </p>
                <span className="text-xs text-primary-700 font-medium mt-1 inline-block">
                  استعراض الأبحاث ←
                </span>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 group-hover:bg-primary-100 transition-colors">
                <PapersIcon className="h-7 w-7" />
              </div>
            </Card>
          </Link>
        </div>
      </PageContainer>
    </AdminLayout>
  );
}
