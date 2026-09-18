import DashboardShell from '../../components/dashboard/DashboardShell';
import { DashboardBaseContext } from '../../context/DashboardBaseContext';

const links = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/clients', label: 'Clients' },
  { to: '/admin/projects', label: 'Projects' },
  { to: '/admin/approvals', label: 'Approvals' },
  { to: '/admin/leads', label: 'Leads' },
  { to: '/admin/contacts', label: 'Contact Inbox' },
  { to: '/admin/live-chat', label: 'Live Chat' },
  { to: '/admin/follow-ups', label: 'Follow-ups' },
  { to: '/admin/reviews', label: 'Reviews' },
  { to: '/admin/curation', label: 'Curation' },
  { to: '/admin/quotations', label: 'Quotations' },
  { to: '/admin/invoices', label: 'Invoices' },
  { to: '/admin/settlements', label: 'Settlements' },
  { to: '/admin/coupons', label: 'Coupons' },
  { to: '/admin/developers', label: 'Developers' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/reports', label: 'Ops Reports' },
];

export default function AdminLayout() {
  return (
    <DashboardBaseContext.Provider value="/admin">
      <DashboardShell title="Ops Admin" basePath="/admin" links={links} />
    </DashboardBaseContext.Provider>
  );
}
