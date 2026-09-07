import { useEffect, useState } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { PageContainer } from "@/components/layout";
import {
  Badge,
  Card,
  SkeletonTable,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui";
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
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">المستخدمون</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            قائمة بجميع المستخدمين المسجلين في المنصة وتفاصيل أدوارهم وحالات حساباتهم
          </p>
        </div>

        {loading && <SkeletonTable rows={5} columns={4} />}
        {!loading && error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {!loading && !error && (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
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
                      <TableCell className="font-medium text-slate-900">
                        {p.fullName || "—"}
                      </TableCell>
                      <TableCell>
                        <span dir="ltr" className="text-slate-600 font-mono text-xs">
                          {p.email}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge tone="primary" dot>
                          {ROLE_LABELS_AR[p.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge tone={p.isActive ? "success" : "danger"}>
                          {p.isActive ? "نشط" : "موقوف"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {profiles.map((p) => {
                const initial =
                  p.fullName?.trim().charAt(0) || p.email?.charAt(0).toUpperCase() || "؟";
                return (
                  <Card key={p.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-xs font-bold text-primary-800">
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-900 truncate leading-tight">
                            {p.fullName || "مستخدم بدون اسم"}
                          </p>
                          <p dir="ltr" className="text-xs text-slate-500 truncate text-right mt-0.5">
                            {p.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <Badge tone="primary" dot>
                        {ROLE_LABELS_AR[p.role]}
                      </Badge>
                      <Badge tone={p.isActive ? "success" : "danger"}>
                        {p.isActive ? "نشط" : "موقوف"}
                      </Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </PageContainer>
    </AdminLayout>
  );
}
