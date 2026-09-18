import DashboardShell from '../../components/dashboard/DashboardShell';
import { DashboardBaseContext } from '../../context/DashboardBaseContext';

const links = [
  { to: '/support', label: 'Overview', end: true },
  { to: '/support/live-chat', label: 'Live Chat' },
  { to: '/support/leads', label: 'Requirements' },
  { to: '/support/follow-ups', label: 'Follow-ups' },
  { to: '/support/contacts', label: 'Contact Inbox' },
  { to: '/support/clients', label: 'Clients' },
  { to: '/support/developers', label: 'Developers' },
  { to: '/support/users', label: 'People' },
];

export default function SupportLayout() {
  return (
    <DashboardBaseContext.Provider value="/support">
      <DashboardShell title="Support Agent" basePath="/support" links={links} />
    </DashboardBaseContext.Provider>
  );
}
