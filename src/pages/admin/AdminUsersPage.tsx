import { useEffect, useState } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { PageContainer } from "@/components/layout";
import { Badge, Loading, Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui";
import { getAllProfiles } from "@/features/auth";
import { ROLE_LABELS_AR } from "@/features/auth/utils";
import type { Profile } from "@/types";

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAllProfiles()
      .then((data) => {
        if (!cancelled) setProfiles(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminLayout>
      <PageContainer>
        <h2 className="mb-1 text-lg font-semibold text-primary-900">المستخدمون</h2>
        <p className="mb-6 text-sm text-primary-500">
          عرض فقط في هذه المرحلة — تغيير الأدوار (ترقية إلى محكّم/مدير) يتم حاليًا من SQL
          Editor في لوحة Supabase (انظر README).
        </p>

        {loading && <Loading label="جارٍ تحميل المستخدمين..." />}
        {!loading && error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>الاسم</TableCell>
                <TableCell>البريد الإلكتروني</TableCell>
                <TableCell>الدور</TableCell>
                <TableCell>الحالة</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {profiles.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.fullName || "—"}</TableCell>
                  <TableCell><span dir="ltr">{p.email}</span></TableCell>
                  <TableCell>
                    <Badge>{ROLE_LABELS_AR[p.role]}</Badge>
                  </TableCell>
                  <TableCell>{p.isActive ? "نشط" : "موقوف"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </PageContainer>
    </AdminLayout>
  );
}
