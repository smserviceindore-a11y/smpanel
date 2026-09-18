import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createFollowUp,
  getDirectoryUser,
  updateDirectoryUser,
} from '../../services/api';
import { useDashboardBase } from '../../context/DashboardBaseContext';
import Spinner from '../../components/ui/Spinner';
import {
  EntityCard,
  ErrorBox,
  PageHeader,
  SoftButton,
  StatusPill,
} from '../../components/dashboard/DashboardUI';
import {
  ChartCard,
  MoneySplitPie,
  AmountTrendLine,
} from '../../components/dashboard/ReportCharts';

function inr(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

export default function UserDetailPage() {
  const { id } = useParams();
  const base = useDashboardBase();
  const queryClient = useQueryClient();
  const [cred, setCred] = useState({ name: '', email: '', phone: '', password: '' });
  const [follow, setFollow] = useState({
    channel: 'call',
    notes: '',
    nextFollowUpAt: '',
  });
  const [msg, setMsg] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['directory', 'user', id],
    queryFn: async () => (await getDirectoryUser(id)).data.data,
  });

  const updateMutation = useMutation({
    mutationFn: (body) => updateDirectoryUser(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directory', 'user', id] });
      setMsg('User updated');
      setCred((c) => ({ ...c, password: '' }));
    },
    onError: (e) => setMsg(e?.response?.data?.message || 'Update failed'),
  });

  const followMutation = useMutation({
    mutationFn: createFollowUp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directory', 'user', id] });
      setFollow({ channel: 'call', notes: '', nextFollowUpAt: '' });
      setMsg('Follow-up note saved');
    },
    onError: (e) => setMsg(e?.response?.data?.message || 'Follow-up failed'),
  });

  if (isLoading) return <Spinner label="Loading profile…" />;
  if (isError || !data) return <ErrorBox message="Could not load user" />;

  const u = data.user;
  const kind = data.kind;

  return (
    <div>
      <PageHeader
        title={u.name}
        subtitle={`${u.role?.replace(/_/g, ' ')} · ${u.email}`}
        actions={
          <Link to={`${base}/users`} className="btn btn-outline btn-sm">
            Back to users
          </Link>
        }
      />

      {msg ? (
        <div className="mb-4 rounded-xl border border-line bg-mist px-4 py-3 text-sm text-brand">
          {msg}
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        <StatusPill value={u.role?.replace(/_/g, ' ')} />
        <StatusPill value={u.status} />
        {u.verificationStatus ? <StatusPill value={u.verificationStatus} /> : null}
      </div>

      {kind === 'developer' && data.sales ? (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-4">
            {[
              ['Projects', data.projects?.length || 0],
              ['Orders', data.sales.orders],
              ['Gross sales', inr(data.sales.grossSales)],
              ['Dev share', inr(data.sales.developerShare)],
            ].map(([label, val]) => (
              <EntityCard key={label}>
                <div className="text-xs text-muted">{label}</div>
                <div className="mt-1 font-display text-xl font-semibold text-brand">{val}</div>
              </EntityCard>
            ))}
          </div>
          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            <ChartCard title="Platform vs developer share">
              <MoneySplitPie
                commission={data.sales.platformCommission}
                developerShare={data.sales.developerShare}
              />
            </ChartCard>
            <ChartCard title="Monthly sales">
              <AmountTrendLine data={data.sales.monthlyChart || []} />
            </ChartCard>
          </div>

          <h2 className="mb-3 font-display text-lg font-semibold text-brand">Listed projects</h2>
          <div className="mb-6 space-y-2">
            {(data.projects || []).map((p) => (
              <EntityCard key={p._id}>
                <Link
                  to={`${base}/projects/${p._id}/ops`}
                  className="font-semibold text-brand hover:text-accent"
                >
                  {p.title}
                </Link>
                <div className="mt-1 text-xs text-muted">
                  {p.status}
                  {p.buyNowEnabled ? ` · Buy Now ₹${Number(p.price?.amount || 0).toLocaleString('en-IN')}` : ''}
                </div>
              </EntityCard>
            ))}
          </div>

          <h2 className="mb-3 font-display text-lg font-semibold text-brand">Sales by project</h2>
          <div className="mb-6 space-y-2">
            {(data.sales.byProject || []).map((row) => (
              <EntityCard key={row.projectId}>
                <Link
                  to={`${base}/projects/${row.projectId}/ops`}
                  className="font-semibold text-brand hover:text-accent"
                >
                  {row.title}
                </Link>
                <div className="mt-1 text-sm text-muted">
                  {row.orders} orders · Gross {inr(row.gross)} · Platform {inr(row.platform)} · Dev{' '}
                  {inr(row.developer)}
                </div>
              </EntityCard>
            ))}
          </div>

          <h2 className="mb-3 font-display text-lg font-semibold text-brand">Buyers</h2>
          <div className="mb-6 space-y-2">
            {(data.sales.buyers || []).map((b) => (
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
            ))}
          </div>
        </>
      ) : null}

      {kind === 'client' && data.stats ? (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ['Requirements', data.stats.requirements],
              ['Customizations', data.stats.customizations],
              ['Quotations', data.stats.quotations],
              ['Paid orders', data.stats.paidOrders],
              ['Spent', inr(data.stats.totalSpent)],
              ['Open tickets', data.stats.openTickets],
            ].map(([label, val]) => (
              <EntityCard key={label}>
                <div className="text-xs text-muted">{label}</div>
                <div className="mt-1 font-display text-lg font-semibold text-brand">{val}</div>
              </EntityCard>
            ))}
          </div>
          <div className="mb-6">
            <ChartCard title="Monthly spend">
              <AmountTrendLine data={data.charts?.monthlySpend || []} />
            </ChartCard>
          </div>
          <h2 className="mb-3 font-display text-lg font-semibold text-brand">Purchases</h2>
          <div className="mb-6 space-y-2">
            {(data.purchases || []).map((t) => (
              <EntityCard key={t._id}>
                <div className="font-medium text-brand">
                  {t.quotationId?.projectId?.title || t.quotationId?.title || 'Purchase'}
                </div>
                <div className="text-sm text-muted">
                  {inr(t.amount)} · {t.paidAt ? new Date(t.paidAt).toLocaleDateString('en-IN') : ''}
                </div>
                {t.quotationId?.projectId?._id ? (
                  <Link
                    to={`${base}/projects/${t.quotationId.projectId._id}/ops`}
                    className="mt-1 inline-block text-xs text-accent"
                  >
                    Project ops →
                  </Link>
                ) : null}
              </EntityCard>
            ))}
          </div>
          <h2 className="mb-3 font-display text-lg font-semibold text-brand">Requirements</h2>
          <div className="mb-6 space-y-2">
            {(data.requirements || []).slice(0, 10).map((r) => (
              <EntityCard key={r._id}>
                <div className="font-medium text-brand">
                  {r.leadId} · {r.projectType || r.industry}
                </div>
                <div className="text-xs text-muted">
                  {r.status} · {r.budget}
                </div>
              </EntityCard>
            ))}
          </div>
        </>
      ) : null}

      {kind === 'staff' ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <EntityCard>
            <div className="text-xs text-muted">Follow-ups logged</div>
            <div className="font-display text-xl font-semibold">{data.stats?.followUpsCreated || 0}</div>
          </EntityCard>
          <EntityCard>
            <div className="text-xs text-muted">Tickets touched</div>
            <div className="font-display text-xl font-semibold">{data.stats?.ticketsTouched || 0}</div>
          </EntityCard>
        </div>
      ) : null}

      {['developer', 'client'].includes(u.role) ? (
        <section className="mb-6 rounded-2xl border border-line bg-card p-4 sm:p-5">
          <h2 className="font-display text-base font-semibold text-brand">Log follow-up</h2>
          <p className="mt-1 text-sm text-muted">
            Call / email notes + optional next reminder for this {u.role}.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <select
              value={follow.channel}
              onChange={(e) => setFollow((f) => ({ ...f, channel: e.target.value }))}
              className="rounded-xl border border-line bg-sand px-3 py-2 text-sm"
            >
              {['call', 'email', 'chat', 'meeting', 'other'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={follow.nextFollowUpAt}
              onChange={(e) => setFollow((f) => ({ ...f, nextFollowUpAt: e.target.value }))}
              className="rounded-xl border border-line bg-sand px-3 py-2 text-sm"
            />
            <textarea
              rows={3}
              placeholder="Short notes of the conversation…"
              value={follow.notes}
              onChange={(e) => setFollow((f) => ({ ...f, notes: e.target.value }))}
              className="rounded-xl border border-line bg-sand px-3 py-2 text-sm sm:col-span-2"
            />
          </div>
          <div className="mt-3">
          <SoftButton
            variant="primary"
            disabled={!follow.notes.trim() || followMutation.isPending}
            onClick={() =>
              followMutation.mutate({
                subjectUserId: u.id || id,
                channel: follow.channel,
                notes: follow.notes.trim(),
                nextFollowUpAt: follow.nextFollowUpAt || undefined,
              })
            }
          >
            Save follow-up
          </SoftButton>
          </div>
          {(data.followUps || []).length > 0 ? (
            <div className="mt-4 space-y-2 border-t border-line pt-3">
              {data.followUps.map((f) => (
                <div key={f._id} className="rounded-xl bg-sand px-3 py-2 text-sm">
                  <div className="text-xs text-muted">
                    {f.channel} · {f.agentId?.name || 'Agent'}
                    {f.nextFollowUpAt
                      ? ` · next ${new Date(f.nextFollowUpAt).toLocaleString('en-IN')}`
                      : ''}
                  </div>
                  <div className="mt-1 whitespace-pre-wrap">{f.notes}</div>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {data.canEditCredentials ? (
        <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
          <h2 className="font-display text-base font-semibold text-brand">Edit credentials</h2>
          <p className="mt-1 text-sm text-muted">Admin / Master Admin only. Leave password blank to keep.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              placeholder={u.name}
              value={cred.name}
              onChange={(e) => setCred((c) => ({ ...c, name: e.target.value }))}
              className="rounded-xl border border-line bg-sand px-3 py-2 text-sm"
            />
            <input
              placeholder={u.email}
              value={cred.email}
              onChange={(e) => setCred((c) => ({ ...c, email: e.target.value }))}
              className="rounded-xl border border-line bg-sand px-3 py-2 text-sm"
            />
            <input
              placeholder={u.phone || 'Phone'}
              value={cred.phone}
              onChange={(e) => setCred((c) => ({ ...c, phone: e.target.value }))}
              className="rounded-xl border border-line bg-sand px-3 py-2 text-sm"
            />
            <input
              type="password"
              placeholder="New password"
              value={cred.password}
              onChange={(e) => setCred((c) => ({ ...c, password: e.target.value }))}
              className="rounded-xl border border-line bg-sand px-3 py-2 text-sm"
            />
          </div>
          <div className="mt-3">
          <SoftButton
            variant="primary"
            disabled={updateMutation.isPending}
            onClick={() => {
              const body = {};
              if (cred.name.trim()) body.name = cred.name.trim();
              if (cred.email.trim()) body.email = cred.email.trim();
              if (cred.phone !== '') body.phone = cred.phone;
              if (cred.password) body.password = cred.password;
              if (!Object.keys(body).length) {
                setMsg('Nothing to update');
                return;
              }
              updateMutation.mutate(body);
            }}
          >
            Save changes
          </SoftButton>
          </div>
        </section>
      ) : null}
    </div>
  );
}
