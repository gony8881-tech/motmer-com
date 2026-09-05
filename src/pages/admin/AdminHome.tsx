import { useEffect, useState } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { PageContainer } from "@/components/layout";
import { Card } from "@/components/ui";
import { useAuth } from "@/features/auth/context/AuthContext";
import { ROLE_LABELS_AR } from "@/features/auth/utils";
import { useConferences } from "@/features/conferences";
import { getAllPapersCount } from "@/features/submissions";

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
        <h2 className="mb-1 text-lg font-semibold text-primary-900">
          مرحبًا، {profile?.fullName || "مدير النظام"}
        </h2>
        <p className="mb-6 text-sm text-primary-500">
          {profile ? ROLE_LABELS_AR[profile.role] : "لوحة المدير"}
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <p className="text-sm text-primary-500">عدد المؤتمرات</p>
            <p className="mt-1 text-2xl font-semibold">{conferences.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-primary-500">عدد الأبحاث</p>
            <p className="mt-1 text-2xl font-semibold">{papersCount ?? "—"}</p>
          </Card>
        </div>
      </PageContainer>
    </AdminLayout>
  );
}
