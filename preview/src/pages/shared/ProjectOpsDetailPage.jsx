import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProjectOpsDetail } from '../../services/api';
import { useDashboardBase } from '../../context/DashboardBaseContext';
import { useAuthStore } from '../../store/authStore';
import Spinner from '../../components/ui/Spinner';
import {
  EntityCard,
  ErrorBox,
  PageHeader,
  StatusPill,
} from '../../components/dashboard/DashboardUI';
import {
  AmountTrendLine,
  ChartCard,
  MoneySplitPie,
} from '../../components/dashboard/ReportCharts';

function inr(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

export default function ProjectOpsDetailPage() {
  const { id } = useParams();
  const base = useDashboardBase();
  const role = useAuthStore((s) => s.user?.role);
  const canEdit = ['admin', 'super_admin'].includes(role);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['project-ops', id],
    queryFn: async () => (await getProjectOpsDetail(id)).data.data,
  });

  if (isLoading) return <Spinner label="Loading project ops…" />;
  if (isError || !data) return <ErrorBox message="Could not load project" />;

  const p = data.project;
  const sales = data.sales || {};

  return (
    <div>
      <PageHeader
        title={p.title}
        subtitle={`${p.slug} · ${p.ownerType || 'project'}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to={`/projects/${p.slug}`} className="btn btn-outline btn-sm">
              Public page
            </Link>
            {canEdit ? (
              <Link to={`${base}/projects/${p._id}/edit`} className="btn btn-outline btn-sm">
                Edit
              </Link>
            ) : null}
            {canEdit ? (
              <Link to={`${base}/projects`} className="btn btn-outline btn-sm">
                All projects
              </Link>
            ) : null}
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <StatusPill value={p.status} />
        {p.featured ? <StatusPill value="featured" /> : null}
        {p.buyNowEnabled ? <StatusPill value="buy now" /> : null}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        {[
          ['Orders', sales.orders || 0],
          ['Gross sales', inr(sales.grossSales)],
          ['Platform cut', inr(sales.platformCommission)],
          ['Developer share', inr(sales.developerShare)],
        ].map(([label, val]) => (
          <EntityCard key={label}>
            <div className="text-xs text-muted">{label}</div>
            <div className="mt-1 font-display text-xl font-semibold text-brand">{val}</div>
          </EntityCard>
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Income split">
          <MoneySplitPie
            commission={sales.platformCommission}
            developerShare={sales.developerShare}
          />
        </ChartCard>
        <ChartCard title="Monthly sales">
          <AmountTrendLine data={sales.monthlyChart || []} />
        </ChartCard>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <EntityCard>
          <h3 className="font-display font-semibold text-brand">Creator</h3>
          {data.creator ? (
            <Link
              to={`${base}/users/${data.creator._id || data.creator.id}`}
              className="mt-2 block text-accent hover:underline"
            >
              {data.creator.name} ({data.creator.role})
            </Link>
          ) : (
            <p className="mt-2 text-sm text-muted">—</p>
          )}
        </EntityCard>
        <EntityCard>
          <h3 className="font-display font-semibold text-brand">Developer</h3>
          {data.developer ? (
            <>
              <Link
                to={`${base}/users/${data.developer._id || data.developer.id}`}
                className="mt-2 block font-medium text-accent hover:underline"
              >
                {data.developer.name}
              </Link>
              <div className="text-sm text-muted">{data.developer.email}</div>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">Company listing</p>
          )}
        </EntityCard>
      </div>

      <h2 className="mb-3 font-display text-lg font-semibold text-brand">Buyers</h2>
      <div className="mb-6 space-y-2">
        {(sales.buyers || []).length === 0 ? (
          <p className="text-sm text-muted">No paid buyers yet</p>
        ) : (
          sales.buyers.map((b) => (
            <EntityCard key={b.clientId}>
              <Link
                to={`${base}/users/${b.clientId}`}
                className="font-semibold text-brand hover:text-accent"
              >
                {b.name}
              </Link>
              <div className="text-sm text-muted">
                {b.email} · {b.orders} orders · {inr(b.spent)}
              </div>
            </EntityCard>
          ))
        )}
      </div>

      {data.siblingProjects?.length > 0 ? (
        <>
          <h2 className="mb-3 font-display text-lg font-semibold text-brand">
            Other projects by this developer
          </h2>
          <div className="mb-6 space-y-2">
            {data.siblingProjects.map((s) => (
              <EntityCard key={s._id}>
                <Link
                  to={`${base}/projects/${s._id}/ops`}
                  className="font-semibold text-brand hover:text-accent"
                >
                  {s.title}
                </Link>
                <div className="text-xs text-muted">{s.status}</div>
              </EntityCard>
            ))}
          </div>
        </>
      ) : null}

      <h2 className="mb-3 font-display text-lg font-semibold text-brand">Transactions</h2>
      <div className="space-y-2">
        {(sales.transactions || []).map((t) => (
          <EntityCard key={t._id}>
            <div className="font-medium text-brand">
              {t.quotationId?.quotationId || t.transactionId} · {inr(t.amount)}
            </div>
            <div className="text-xs text-muted">
              {t.clientId?.name || 'Client'} · Platform {inr(t.platformCommission)} · Dev{' '}
              {inr(t.developerShare)}
            </div>
          </EntityCard>
        ))}
      </div>
    </div>
  );
}
