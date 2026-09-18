import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PublicLayout from './components/layout/PublicLayout';
import RoleProtectedRoute from './components/auth/RoleProtectedRoute';
import Spinner from './components/ui/Spinner';
import HomePage from './pages/HomePage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import RequirementPage from './pages/RequirementPage';
import CustomizePage from './pages/CustomizePage';
import LoginPage from './pages/LoginPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import DeveloperMarketplacePage from './pages/DeveloperMarketplacePage';
import DeveloperStorefrontPage from './pages/DeveloperStorefrontPage';

const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminProjectsPage = lazy(() => import('./pages/admin/AdminProjectsPage'));
const AdminProjectEditPage = lazy(() => import('./pages/admin/AdminProjectEditPage'));
const AdminLeadsPage = lazy(() => import('./pages/admin/AdminLeadsPage'));
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage'));
const AdminReportsPage = lazy(() => import('./pages/admin/AdminReportsPage'));
const AdminApprovalsPage = lazy(() => import('./pages/admin/AdminApprovalsPage'));
const AdminQuotationsPage = lazy(() => import('./pages/admin/AdminQuotationsPage'));
const AdminSettlementsPage = lazy(() => import('./pages/admin/AdminSettlementsPage'));
const AdminContactsPage = lazy(() => import('./pages/admin/AdminContactsPage'));
const AdminReviewsPage = lazy(() => import('./pages/admin/AdminReviewsPage'));
const AdminCurationPage = lazy(() => import('./pages/admin/AdminCurationPage'));
const CouponsPage = lazy(() => import('./pages/shared/CouponsPage'));
const UsersDirectoryPage = lazy(() => import('./pages/shared/UsersDirectoryPage'));
const UserDetailPage = lazy(() => import('./pages/shared/UserDetailPage'));
const CreateStaffUserPage = lazy(() => import('./pages/shared/CreateStaffUserPage'));
const ClientsDirectoryPage = lazy(() => import('./pages/shared/ClientsDirectoryPage'));
const DevelopersDirectoryPage = lazy(() => import('./pages/shared/DevelopersDirectoryPage'));
const ProjectOpsDetailPage = lazy(() => import('./pages/shared/ProjectOpsDetailPage'));
const FollowUpsPage = lazy(() => import('./pages/shared/FollowUpsPage'));
const LiveChatInboxPage = lazy(() => import('./pages/shared/LiveChatInboxPage'));
const AdminInvoicesPage = lazy(() => import('./pages/shared/AdminInvoicesPage'));

const SuperAdminLayout = lazy(() => import('./pages/super-admin/SuperAdminLayout'));
const SuperAdminDashboardPage = lazy(() => import('./pages/super-admin/SuperAdminDashboardPage'));
const SuperAdminReportsPage = lazy(() => import('./pages/super-admin/SuperAdminReportsPage'));
const SuperAdminSettingsPage = lazy(() => import('./pages/super-admin/SuperAdminSettingsPage'));
const SuperAdminAnalyticsPage = lazy(() => import('./pages/super-admin/SuperAdminAnalyticsPage'));
const SuperAdminAuditPage = lazy(() => import('./pages/super-admin/SuperAdminAuditPage'));
const SuperAdminPaymentReportsPage = lazy(
  () => import('./pages/super-admin/SuperAdminPaymentReportsPage')
);
const SuperAdminPaymentDeveloperPage = lazy(
  () => import('./pages/super-admin/SuperAdminPaymentDeveloperPage')
);

const SupportLayout = lazy(() => import('./pages/support/SupportLayout'));
const SupportDashboardPage = lazy(() => import('./pages/support/SupportDashboardPage'));

const DeveloperLayout = lazy(() => import('./pages/developer/DeveloperLayout'));
const DeveloperDashboardPage = lazy(() => import('./pages/developer/DeveloperDashboardPage'));
const DeveloperProjectsPage = lazy(() => import('./pages/developer/DeveloperProjectsPage'));
const DeveloperProjectSubmitPage = lazy(() => import('./pages/developer/DeveloperProjectSubmitPage'));
const DeveloperRequestsPage = lazy(() => import('./pages/developer/DeveloperRequestsPage'));
const DeveloperEarningsPage = lazy(() => import('./pages/developer/DeveloperEarningsPage'));

const ClientLayout = lazy(() => import('./pages/client/ClientLayout'));
const ClientDashboardPage = lazy(() => import('./pages/client/ClientDashboardPage'));
const ClientRequirementsPage = lazy(() => import('./pages/client/ClientRequirementsPage'));
const ClientCustomizationsPage = lazy(() => import('./pages/client/ClientCustomizationsPage'));
const ClientQuotationsPage = lazy(() => import('./pages/client/ClientQuotationsPage'));
const ClientInvoicesPage = lazy(() => import('./pages/client/ClientInvoicesPage'));
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
    },
  },
});

function Lazy({ children }) {
  return <Suspense fallback={<Spinner label="Loading dashboard..." />}>{children}</Suspense>;
}

function Public({ children }) {
  return <PublicLayout>{children}</PublicLayout>;
}

const staffOpsRouteElements = (
  <>
    <Route path="users" element={<UsersDirectoryPage />} />
    <Route path="users/create" element={<CreateStaffUserPage />} />
    <Route path="users/:id" element={<UserDetailPage />} />
    <Route path="clients" element={<ClientsDirectoryPage />} />
    <Route path="follow-ups" element={<FollowUpsPage />} />
    <Route path="projects" element={<AdminProjectsPage />} />
    <Route path="projects/new" element={<AdminProjectEditPage />} />
    <Route path="projects/:id/edit" element={<AdminProjectEditPage />} />
    <Route path="projects/:id/ops" element={<ProjectOpsDetailPage />} />
    <Route path="approvals" element={<AdminApprovalsPage />} />
    <Route path="leads" element={<AdminLeadsPage />} />
    <Route path="contacts" element={<AdminContactsPage />} />
    <Route path="live-chat" element={<LiveChatInboxPage />} />
    <Route path="support" element={<Navigate to="../live-chat" replace />} />
    <Route path="reviews" element={<AdminReviewsPage />} />
    <Route path="curation" element={<AdminCurationPage />} />
    <Route path="quotations" element={<AdminQuotationsPage />} />
    <Route path="invoices" element={<AdminInvoicesPage />} />
    <Route path="settlements" element={<AdminSettlementsPage />} />
    <Route path="coupons" element={<CouponsPage />} />
    <Route path="developers" element={<DevelopersDirectoryPage />} />
    <Route path="categories" element={<AdminCategoriesPage />} />
  </>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Public><HomePage /></Public>} />
          <Route path="/projects" element={<Public><ProjectsPage /></Public>} />
          <Route path="/projects/:slug" element={<Public><ProjectDetailPage /></Public>} />
          <Route path="/marketplace/developers" element={<Public><DeveloperMarketplacePage /></Public>} />
          <Route path="/developers/:id" element={<Public><DeveloperStorefrontPage /></Public>} />
          <Route path="/submit-requirement" element={<Public><RequirementPage /></Public>} />
          <Route path="/customize/:slug" element={<Public><CustomizePage /></Public>} />
          <Route path="/about" element={<Public><AboutPage /></Public>} />
          <Route path="/contact" element={<Public><ContactPage /></Public>} />
          <Route path="/login" element={<Public><LoginPage /></Public>} />
          <Route path="/admin/login" element={<Navigate to="/login" replace />} />
          <Route path="/register" element={<Navigate to="/login?mode=register" replace />} />

          <Route
            path="/super-admin"
            element={
              <RoleProtectedRoute roles={['super_admin']}>
                <Lazy><SuperAdminLayout /></Lazy>
              </RoleProtectedRoute>
            }
          >
            <Route index element={<SuperAdminDashboardPage />} />
            {staffOpsRouteElements}
            <Route path="admins" element={<Navigate to="users/create" replace />} />
            <Route path="payment-reports" element={<SuperAdminPaymentReportsPage />} />
            <Route path="payment-reports/developers/:id" element={<SuperAdminPaymentDeveloperPage />} />
            <Route path="reports" element={<SuperAdminReportsPage />} />
            <Route path="analytics" element={<SuperAdminAnalyticsPage />} />
            <Route path="settings" element={<SuperAdminSettingsPage />} />
            <Route path="audit-log" element={<SuperAdminAuditPage />} />
          </Route>

          <Route
            path="/admin"
            element={
              <RoleProtectedRoute roles={['admin']}>
                <Lazy><AdminLayout /></Lazy>
              </RoleProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            {staffOpsRouteElements}
            <Route path="reports" element={<AdminReportsPage />} />
          </Route>

          <Route
            path="/support"
            element={
              <RoleProtectedRoute roles={['support_agent']}>
                <Lazy><SupportLayout /></Lazy>
              </RoleProtectedRoute>
            }
          >
            <Route index element={<SupportDashboardPage />} />
            <Route path="tickets" element={<Navigate to="/support/live-chat" replace />} />
            <Route path="live-chat" element={<LiveChatInboxPage />} />
            <Route path="leads" element={<AdminLeadsPage />} />
            <Route path="follow-ups" element={<FollowUpsPage />} />
            <Route path="contacts" element={<AdminContactsPage />} />
            <Route path="clients" element={<ClientsDirectoryPage />} />
            <Route path="developers" element={<DevelopersDirectoryPage />} />
            <Route path="users" element={<UsersDirectoryPage />} />
            <Route path="users/:id" element={<UserDetailPage />} />
            <Route path="projects/:id/ops" element={<ProjectOpsDetailPage />} />
          </Route>

          <Route
            path="/developer"
            element={
              <RoleProtectedRoute roles={['developer']}>
                <Lazy><DeveloperLayout /></Lazy>
              </RoleProtectedRoute>
            }
          >
            <Route index element={<DeveloperDashboardPage />} />
            <Route path="projects" element={<DeveloperProjectsPage />} />
            <Route path="projects/new" element={<DeveloperProjectSubmitPage />} />
            <Route path="requests" element={<DeveloperRequestsPage />} />
            <Route path="earnings" element={<DeveloperEarningsPage />} />
            <Route path="wallet" element={<DeveloperEarningsPage />} />
            <Route path="coupons" element={<CouponsPage />} />
          </Route>

          <Route
            path="/client"
            element={
              <RoleProtectedRoute roles={['client']}>
                <Lazy><ClientLayout /></Lazy>
              </RoleProtectedRoute>
            }
          >
            <Route index element={<ClientDashboardPage />} />
            <Route path="requirements" element={<ClientRequirementsPage />} />
            <Route path="customizations" element={<ClientCustomizationsPage />} />
            <Route path="quotations" element={<ClientQuotationsPage />} />
            <Route path="invoices" element={<ClientInvoicesPage />} />
            <Route path="support" element={<Navigate to="/client" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
