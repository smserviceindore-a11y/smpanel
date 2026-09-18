import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getSuperDashboard } from '../../services/api';
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

export default function SuperAdminDashboardPage() {
  const base = useDashboardBase();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['super-admin', 'dashboard'],
    queryFn: async () => (await getSuperDashboard()).data,
  });

  if (isLoading) return <Spinner label="Loading master dashboard..." />;
  if (isError) return <ErrorBox message="Failed to load super admin dashboard" />;

  const d = data.data;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Master Control Center"
        subtitle="Full platform control — users, roles, projects, leads, developers, categories, payments and reports."
        actions={
          <>
            <Link to="/super-admin/payment-reports" className="btn btn-outline btn-md">
              Payment reports
            </Link>
            <Link to="/super-admin/settings" className="btn btn-accent btn-md">
              Payment settings
            </Link>
          </>
        }
      />

      <div className="stagger grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <StatCard
          to={`${base}/projects`}
          label="Total projects"
          value={d.overview.totalProjects}
          hint={`${d.overview.companyProjects} company · ${d.overview.developerProjects} developer`}
        />
        <StatCard
          to={`${base}/projects`}
          label="Published"
          value={d.overview.publishedProjects}
          hint={`${d.overview.featuredProjects} featured`}
          tone="navy"
        />
        <StatCard
          to={`${base}/users`}
          label="Total users"
          value={d.overview.totalUsers}
          hint={`${d.users.admins} admins`}
        />
        <StatCard to={`${base}/reports`} label="Total views" value={d.overview.totalViews} tone="navy" />
        <StatCard
          to={`${base}/leads`}
          label="Requirement leads"
          value={d.leads.requirements.total}
          hint={`${d.leads.requirements.new} new · ${d.leads.requirements.won} won`}
        />
        <StatCard
          to={`${base}/leads`}
          label="Customization leads"
          value={d.leads.customizations.total}
          hint={`${d.leads.customizations.new} new · ${d.leads.customizations.won} won`}
          tone="navy"
        />
        <StatCard
          to={`${base}/reports`}
          label="Conversion rate"
          value={`${d.leads.conversionRate}%`}
          hint="Won / all leads"
        />
        <StatCard
          to={`${base}/developers`}
          label="Developers"
          value={d.users.developers.total}
          hint={`${d.users.developers.pending} pending`}
          tone="sand"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <Panel title="Recent requirements">
          {d.recent.requirements.length === 0 && <EmptyState text="No requirements yet" />}
          {d.recent.requirements.map((r) => (
            <ListRow
              key={r._id}
              title={r.leadId}
              subtitle={`${r.name}${r.company ? ` · ${r.company}` : ''}`}
              meta={<StatusPill value={r.status} />}
              to={`${base}/leads`}
            />
          ))}
        </Panel>

        <Panel title="Recent customizations">
          {d.recent.customizations.length === 0 && <EmptyState text="No customization requests" />}
          {d.recent.customizations.map((r) => (
            <ListRow
              key={r._id}
              title={r.leadId}
              subtitle={r.projectTitle || r.name}
              meta={<StatusPill value={r.status} />}
              to={`${base}/leads`}
            />
          ))}
        </Panel>

        <Panel title="Recent users">
          {(d.recent.users || []).length === 0 && <EmptyState text="No users" />}
          {(d.recent.users || []).map((u) => (
            <ListRow
              key={u._id}
              title={u.name}
              subtitle={`${u.email} · ${u.role?.replace(/_/g, ' ')}`}
              meta={<StatusPill value={u.status} />}
              to={`${base}/users`}
            />
          ))}
        </Panel>
      </div>

      <Panel title="Master permissions">
        <ul className="grid gap-2 sm:grid-cols-2">
          {d.permissions.map((p) => (
            <li
              key={p}
              className="flex items-center gap-2 rounded-xl bg-sand/80 px-3 py-2.5 text-sm text-muted"
            >
              <span className="text-accent">✓</span>
              <span className="capitalize">{p.replace(/_/g, ' ')}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted">
          Clients: {d.users.clients} · Categories: {d.overview.totalCategories} · Draft:{' '}
          {d.overview.draftProjects}
        </p>
      </Panel>
    </div>
  );
}
