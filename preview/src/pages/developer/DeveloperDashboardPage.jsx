import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDeveloperDashboard } from '../../services/api';
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

export default function DeveloperDashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['developer', 'dashboard'],
    queryFn: async () => (await getDeveloperDashboard()).data,
  });

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorBox message="Failed to load developer dashboard" />;

  const d = data.data;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Developer Overview"
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-2">
            Verification <StatusPill value={d.profile.verificationStatus} />
            <span>· Platform commission {d.profile.commissionRate}%</span>
          </span>
        }
        actions={
          <Link
            to="/developer/requests"
            className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-deep"
          >
            View requests
          </Link>
        }
      />

      <div className="stagger grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <StatCard label="My projects" value={d.projects.total} hint={`${d.projects.published} published`} />
        <StatCard label="Project views" value={d.projects.views} tone="navy" />
        <StatCard label="Client requests" value={d.requests.total} hint={`${d.requests.new} new`} />
        <StatCard label="Won deals" value={d.requests.won} tone="navy" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <Panel
          title="Earnings snapshot"
          action={<Link to="/developer/earnings" className="text-accent hover:underline">Details</Link>}
        >
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Estimated won value', d.earnings.estimatedWonValue],
              ['Your share', d.earnings.developerShare],
              ['Platform commission', d.earnings.platformCommission],
              ['Pending settlement', d.earnings.pendingSettlement],
            ].map(([label, val]) => (
              <div key={label} className="rounded-xl bg-sand/90 p-3 sm:p-4">
                <div className="text-[11px] text-muted">{label}</div>
                <div className="mt-1 font-display text-lg font-semibold tabular-nums text-brand sm:text-xl">
                  ₹{Number(val).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">{d.earnings.note}</p>
        </Panel>

        <Panel title="Recent requests">
          {d.recent.requests.length === 0 && <EmptyState text="No client requests yet" />}
          {d.recent.requests.map((r) => (
            <ListRow
              key={r._id}
              title={r.leadId}
              subtitle={r.projectTitle || r.projectId?.title}
              meta={<StatusPill value={r.status} />}
            />
          ))}
        </Panel>
      </div>

      <Panel
        title="My projects"
        action={<Link to="/developer/projects" className="text-accent hover:underline">View all</Link>}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {d.recent.projects.map((p) => (
            <Link
              key={p._id}
              to={`/projects/${p.slug}`}
              className="rounded-xl border border-line bg-sand/40 p-3 transition hover:border-accent hover:bg-card sm:p-4"
            >
              <div className="font-medium text-brand">{p.title}</div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                <StatusPill value={p.status} />
                <span>{p.views || 0} views</span>
              </div>
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  );
}
