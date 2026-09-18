import DashboardShell from '../../components/dashboard/DashboardShell';
import { DashboardBaseContext } from '../../context/DashboardBaseContext';

const links = [
  { to: '/super-admin', label: 'Overview', end: true },
  { to: '/super-admin/users', label: 'Users' },
  { to: '/super-admin/clients', label: 'Clients' },
  { to: '/super-admin/users/create', label: 'Create user' },
  { to: '/super-admin/projects', label: 'Projects' },
  { to: '/super-admin/approvals', label: 'Approvals' },
  { to: '/super-admin/leads', label: 'Leads' },
  { to: '/super-admin/contacts', label: 'Contact Inbox' },
  { to: '/super-admin/live-chat', label: 'Live Chat' },
  { to: '/super-admin/follow-ups', label: 'Follow-ups' },
  { to: '/super-admin/reviews', label: 'Reviews' },
  { to: '/super-admin/curation', label: 'Curation' },
  { to: '/super-admin/quotations', label: 'Quotations' },
  { to: '/super-admin/invoices', label: 'Invoices' },
  { to: '/super-admin/settlements', label: 'Settlements' },
  { to: '/super-admin/coupons', label: 'Coupons' },
  { to: '/super-admin/payment-reports', label: 'Payment Reports' },
  { to: '/super-admin/developers', label: 'Developers' },
  { to: '/super-admin/categories', label: 'Categories' },
  { to: '/super-admin/reports', label: 'Reports' },
  { to: '/super-admin/analytics', label: 'Analytics' },
  { to: '/super-admin/settings', label: 'Settings' },
  { to: '/super-admin/audit-log', label: 'Audit Log' },
];

export default function SuperAdminLayout() {
  return (
    <DashboardBaseContext.Provider value="/super-admin">
      <DashboardShell title="Master Super Admin" basePath="/super-admin" links={links} />
    </DashboardBaseContext.Provider>
  );
}
