import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/features/auth/context/AuthContext";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { RoleRoute } from "@/features/auth/components/RoleRoute";
import { getRoleDashboardPath } from "@/features/auth/utils";
import { Loading } from "@/components/ui";

import AdminHome from "@/pages/admin/AdminHome";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminPapersPage from "@/pages/admin/AdminPapersPage";
import ReviewerListPage from "@/pages/admin/reviewers/ReviewerListPage";
import ReviewerNewPage from "@/pages/admin/reviewers/ReviewerNewPage";
import ReviewerDetailPage from "@/pages/admin/reviewers/ReviewerDetailPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";
import ConferenceListPage from "@/pages/admin/conferences/ConferenceListPage";
import ConferenceNewPage from "@/pages/admin/conferences/ConferenceNewPage";
import ConferenceDetailPage from "@/pages/admin/conferences/ConferenceDetailPage";
import AdminSubmissionsListPage from "@/pages/admin/submissions/AdminSubmissionsListPage";
import AdminSubmissionDetailPage from "@/pages/admin/submissions/AdminSubmissionDetailPage";

import ResearcherHome from "@/pages/researcher/ResearcherHome";
import ResearcherSubmitPage from "@/pages/researcher/ResearcherSubmitPage";

import ReviewerHome from "@/pages/reviewer/ReviewerHome";
import ReviewerAssignedPage from "@/pages/reviewer/ReviewerAssignedPage";

import ConferencePublicPage from "@/pages/public/ConferencePublicPage";
import ConferenceSubmitPage from "@/pages/public/ConferenceSubmitPage";
import SubmissionSuccessPage from "@/pages/public/SubmissionSuccessPage";

import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import UnauthorizedPage from "@/pages/auth/UnauthorizedPage";
import AccountPage from "@/pages/account/AccountPage";

/** "/" يوجّه حسب حالة الدخول: مسجّل → لوحته، غير مسجّل → تسجيل الدخول. */
function HomeRedirect() {
  const { loading, isAuthenticated, role } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loading label="جارٍ التحقق من حالة الدخول..." />
      </div>
    );
  }

  if (isAuthenticated && role) {
    return <Navigate to={getRoleDashboardPath(role)} replace />;
  }

  return <Navigate to={ROUTES.login} replace />;
}

/**
 * Router رئيسي للتطبيق.
 * المرحلة الرابعة: كل مسارات /admin/* محمية بدور ADMIN، /researcher/* بدور
 * RESEARCHER، /reviewer/* بدور REVIEWER عبر RoleRoute — و/conference/:slug/submit
 * و/account محميتان بتسجيل دخول عام فقط (أي دور) عبر ProtectedRoute.
 * /conference/:slug و/conference/:slug/submission-success يبقيان عامّين بالكامل.
 */
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.home} element={<HomeRedirect />} />

        {/* Auth routes (عامة) */}
        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route path={ROUTES.register} element={<RegisterPage />} />
        <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.resetPassword} element={<ResetPasswordPage />} />
        <Route path={ROUTES.setPassword} element={<ResetPasswordPage />} />
        <Route path={ROUTES.unauthorized} element={<UnauthorizedPage />} />

        <Route
          path={ROUTES.account}
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path={ROUTES.admin.root}
          element={
            <RoleRoute allow={["ADMIN"]}>
              <AdminHome />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.admin.users}
          element={
            <RoleRoute allow={["ADMIN"]}>
              <AdminUsersPage />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.admin.papers}
          element={
            <RoleRoute allow={["ADMIN"]}>
              <AdminPapersPage />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.admin.reviewers.list}
          element={
            <RoleRoute allow={["ADMIN"]}>
              <ReviewerListPage />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.admin.reviewers.new}
          element={
            <RoleRoute allow={["ADMIN"]}>
              <ReviewerNewPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/reviewers/:id"
          element={
            <RoleRoute allow={["ADMIN"]}>
              <ReviewerDetailPage />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.admin.settings}
          element={
            <RoleRoute allow={["ADMIN"]}>
              <AdminSettingsPage />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.admin.conferences.list}
          element={
            <RoleRoute allow={["ADMIN"]}>
              <ConferenceListPage />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.admin.conferences.new}
          element={
            <RoleRoute allow={["ADMIN"]}>
              <ConferenceNewPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/conferences/:id"
          element={
            <RoleRoute allow={["ADMIN"]}>
              <ConferenceDetailPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/conferences/:id/submissions"
          element={
            <RoleRoute allow={["ADMIN"]}>
              <AdminSubmissionsListPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/submissions/:id"
          element={
            <RoleRoute allow={["ADMIN"]}>
              <AdminSubmissionDetailPage />
            </RoleRoute>
          }
        />

        {/* Researcher routes */}
        <Route
          path={ROUTES.researcher.root}
          element={
            <RoleRoute allow={["RESEARCHER"]}>
              <ResearcherHome />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.researcher.submit}
          element={
            <RoleRoute allow={["RESEARCHER"]}>
              <ResearcherSubmitPage />
            </RoleRoute>
          }
        />

        {/* Reviewer routes */}
        <Route
          path={ROUTES.reviewer.root}
          element={
            <RoleRoute allow={["REVIEWER"]}>
              <ReviewerHome />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.reviewer.assigned}
          element={
            <RoleRoute allow={["REVIEWER"]}>
              <ReviewerAssignedPage />
            </RoleRoute>
          }
        />

        {/* Public conference routes */}
        <Route path="/conference/:slug" element={<ConferencePublicPage />} />
        <Route
          path="/conference/:slug/submit"
          element={
            <ProtectedRoute>
              <ConferenceSubmitPage />
            </ProtectedRoute>
          }
        />
        <Route path="/conference/:slug/submission-success" element={<SubmissionSuccessPage />} />

        <Route
          path="*"
          element={
            <div dir="rtl" className="flex h-screen items-center justify-center text-primary-600">
              الصفحة غير موجودة
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
