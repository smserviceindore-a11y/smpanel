import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getClientDashboard } from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import {
  EmptyState,
  ErrorBox,
  ListRow,
  PageHeader,
  Panel,
  StatCard,
  StatusPill,
} from '../../components/dashboard/DashboardUI';

export default function ClientDashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['client', 'dashboard'],
    queryFn: async () => (await getClientDashboard()).data,
  });

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorBox message="Failed to load client dashboard" />;

  const d = data.data;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title={`Welcome, ${d.profile.name}`}
        subtitle={`${d.profile.company || 'Buyer account'} · Track requirements, customizations and recommendations`}
        actions={
          <>
            <Link
              to="/submit-requirement"
              className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-deep"
            >
              New requirement
            </Link>
            <Link
              to="/projects"
              className="rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-semibold text-brand hover:bg-mist"
            >
              Browse solutions
            </Link>
          </>
        }
      />

      <div className="stagger grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Requirements" value={d.requirements.total} hint={`${d.requirements.active} active`} />
        <StatCard label="Customizations" value={d.customizations.total} hint={`${d.customizations.new} new`} tone="navy" />
        <StatCard label="Active orders" value={d.orders.active} />
        <StatCard label="Completed / Won" value={d.orders.completed} tone="navy" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <Panel
          title="Recent requirements"
          action={<Link to="/client/requirements" className="text-accent hover:underline">View all</Link>}
        >
          {d.recent.requirements.length === 0 && <EmptyState text="No requirements yet" />}
          {d.recent.requirements.map((r) => (
            <ListRow
              key={r._id}
              title={r.leadId}
              subtitle={`${r.projectType || 'General'} · ${r.industry || '—'}`}
              meta={<StatusPill value={r.status} />}
            />
          ))}
        </Panel>

        <Panel
          title="Recent customizations"
          action={<Link to="/client/customizations" className="text-accent hover:underline">View all</Link>}
        >
          {d.recent.customizations.length === 0 && <EmptyState text="No customization requests" />}
          {d.recent.customizations.map((r) => (
            <ListRow
              key={r._id}
              title={r.leadId}
              subtitle={r.projectTitle || r.projectId?.title}
              meta={<StatusPill value={r.status} />}
            />
          ))}
        </Panel>
      </div>
    </div>
  );
}
