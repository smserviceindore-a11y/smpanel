import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSupportDashboard } from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import { EntityCard, ErrorBox, PageHeader } from '../../components/dashboard/DashboardUI';

export default function SupportDashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['support', 'dashboard'],
    queryFn: async () => (await getSupportDashboard()).data.data,
  });

  if (isLoading) return <Spinner label="Loading…" />;
  if (isError) return <ErrorBox message="Failed to load support dashboard" />;

  const cards = [
    { label: 'Live chat', value: 'Open', to: '/support/live-chat' },
    { label: 'Overdue reminders', value: data.overdueReminders, to: '/support/follow-ups' },
    { label: 'Upcoming reminders', value: data.upcomingReminders, to: '/support/follow-ups' },
    { label: 'New requirements', value: data.newRequirements, to: '/support/leads' },
    { label: 'New customizations', value: data.newCustomizations, to: '/support/leads' },
    { label: 'My follow-ups', value: data.myFollowUps, to: '/support/follow-ups' },
  ];

  return (
    <div>
      <PageHeader
        title="Support desk"
        subtitle="Live chat visitors, follow-ups, and requirements — no ticket queue."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} to={c.to}>
            <EntityCard className="transition hover:border-accent">
              <div className="text-xs text-muted">{c.label}</div>
              <div className="mt-1 font-display text-2xl font-semibold text-brand">{c.value}</div>
            </EntityCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
