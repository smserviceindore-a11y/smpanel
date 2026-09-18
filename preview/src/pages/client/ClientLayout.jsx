import DashboardShell from '../../components/dashboard/DashboardShell';
import LiveChatWidget from '../../components/chat/LiveChatWidget';

const links = [
  { to: '/client', label: 'Overview', end: true },
  { to: '/client/requirements', label: 'My Requirements' },
  { to: '/client/customizations', label: 'My Customizations' },
  { to: '/client/quotations', label: 'Quotations & Pay' },
  { to: '/client/invoices', label: 'Invoices' },
  { to: '/submit-requirement', label: 'New Requirement' },
  { to: '/projects', label: 'Browse Projects' },
];

export default function ClientLayout() {
  return (
    <>
      <DashboardShell title="Client / Buyer Dashboard" basePath="/client" links={links} />
      <LiveChatWidget />
    </>
  );
}
