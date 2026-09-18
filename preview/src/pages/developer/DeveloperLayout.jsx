import DashboardShell from '../../components/dashboard/DashboardShell';

const links = [
  { to: '/developer', label: 'Overview', end: true },
  { to: '/developer/projects', label: 'My Projects' },
  { to: '/developer/requests', label: 'Client Requests' },
  { to: '/developer/wallet', label: 'Wallet & Payouts' },
  { to: '/developer/coupons', label: 'Coupons' },
];

export default function DeveloperLayout() {
  return <DashboardShell title="Developer Dashboard" basePath="/developer" links={links} />;
}
