import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../../services/api';
import { useDashboardBase } from '../../context/DashboardBaseContext';
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

export default function AdminDashboardPage() {
  const base = useDashboardBase();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => (await getDashboard()).data,
  });

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorBox message="Failed to load admin dashboard" />;

  const d = data.data;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Ops Admin"
        subtitle="Day-to-day operations: projects, leads, categories and developer verification. User & role control stays with Master Super Admin."
        actions={
          <>
            <Link to={`${base}/projects/new`} className="btn btn-outline btn-md">
              Add project
            </Link>
            <Link to={`${base}/leads`} className="btn btn-accent btn-md">
              Review leads
            </Link>
          </>
        }
      />

      <div className="stagger grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <StatCard
          to={`${base}/projects`}
          label="Total projects"
          value={d.projects.total}
          hint={`${d.projects.company} company · ${d.projects.developer} developer`}
        />
        <StatCard
          to={`${base}/projects`}
          label="Published"
          value={d.projects.published}
          hint={`${d.projects.featured} featured · ${d.projects.draft} draft`}
          tone="navy"
        />
        <StatCard
          to={`${base}/leads`}
          label="Requirement leads"
          value={d.leads.requirements.total}
          hint={`${d.leads.requirements.new} new`}
        />
        <StatCard
          to={`${base}/leads`}
          label="Customization leads"
          value={d.leads.customizations.total}
          hint={`${d.leads.customizations.new} new`}
          tone="navy"
        />
        <StatCard
          to={`${base}/developers`}
          label="Developers"
          value={d.developers.total}
          hint={`${d.developers.pendingApproval} pending`}
        />
        <StatCard to={`${base}/categories`} label="Categories" value={d.categories.total} tone="sand" />
        <StatCard
          to={`${base}/leads`}
          label="Contacted"
          value={d.leads.requirements.contacted}
          tone="navy"
        />
        <StatCard to={`${base}/reports`} label="Ops reports" value="Open" tone="sand" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <Panel
          title="Recent requirements"
          action={
            <Link to={`${base}/leads`} className="text-accent hover:underline">
              Manage
            </Link>
          }
        >
          {d.recent.requirements.length === 0 && <EmptyState text="No leads yet" />}
          {d.recent.requirements.map((r) => (
            <ListRow
              key={r._id}
              title={r.leadId}
              subtitle={r.name}
              meta={<StatusPill value={r.status} />}
              to={`${base}/leads`}
            />
          ))}
        </Panel>

        <Panel
          title="Recent customizations"
          action={
            <Link to={`${base}/leads`} className="text-accent hover:underline">
              Manage
            </Link>
          }
        >
          {d.recent.customizations.length === 0 && <EmptyState text="No requests" />}
          {d.recent.customizations.map((r) => (
            <ListRow
              key={r._id}
              title={r.leadId}
              subtitle={r.projectTitle}
              meta={<StatusPill value={r.status} />}
              to={`${base}/leads`}
            />
          ))}
        </Panel>

        <Panel
          title="Top viewed projects"
          action={
            <Link to={`${base}/reports`} className="text-accent hover:underline">
              Reports
            </Link>
          }
        >
          {d.recent.topProjects.length === 0 && <EmptyState text="No projects" />}
          {d.recent.topProjects.map((p) => (
            <ListRow
              key={p._id}
              title={p.title}
              subtitle={`${p.views} views`}
              to={`/projects/${p.slug}`}
            />
          ))}
        </Panel>
      </div>
    </div>
  );
}
