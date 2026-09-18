import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCoupon,
  getAdminProjects,
  getCoupons,
  getDeveloperProjects,
  updateCoupon,
} from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import Spinner from '../../components/ui/Spinner';
import ReportTable from '../../components/dashboard/ReportTable';
import {
  EntityCard,
  ErrorBox,
  PageHeader,
  SoftButton,
  StatusPill,
} from '../../components/dashboard/DashboardUI';

/**
 * Coupons manager for developer / admin / super_admin.
 * Developer: % only. Admin/Super: % or fixed. Include/Exclude multi-select with search.
 */
export default function CouponsPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role || 'admin';
  const isDev = role === 'developer';
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    code: '',
    discountType: isDev ? 'percent' : 'percent',
    discountValue: '',
    projectScope: 'all',
    includeProjectIds: [],
    excludeProjectIds: [],
    maxUses: 0,
    minOrderAmount: 0,
    expiresAt: '',
    description: '',
  });
  const [includeSearch, setIncludeSearch] = useState('');
  const [excludeSearch, setExcludeSearch] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const listQuery = useQuery({
    queryKey: ['coupons', role],
    queryFn: async () => (await getCoupons({ limit: 50 })).data,
  });

  const projectsQuery = useQuery({
    queryKey: ['coupon-projects', role],
    queryFn: async () => {
      if (isDev) {
        return (await getDeveloperProjects({ limit: 100 })).data;
      }
      return (await getAdminProjects({ limit: 100 })).data;
    },
  });

  const projects = projectsQuery.data?.data || [];

  const filteredInclude = useMemo(() => {
    const q = includeSearch.trim().toLowerCase();
    return projects.filter(
      (p) =>
        !q ||
        p.title?.toLowerCase().includes(q) ||
        p.slug?.toLowerCase().includes(q)
    );
  }, [projects, includeSearch]);

  const filteredExclude = useMemo(() => {
    const q = excludeSearch.trim().toLowerCase();
    return projects.filter(
      (p) =>
        !q ||
        p.title?.toLowerCase().includes(q) ||
        p.slug?.toLowerCase().includes(q)
    );
  }, [projects, excludeSearch]);

  const overlap = useMemo(() => {
    const setE = new Set(form.excludeProjectIds.map(String));
    return form.includeProjectIds.map(String).filter((id) => setE.has(id));
  }, [form.includeProjectIds, form.excludeProjectIds]);

  const createMutation = useMutation({
    mutationFn: createCoupon,
    onSuccess: () => {
      setMsg('Coupon created');
      setErr('');
      setForm((f) => ({
        ...f,
        code: '',
        discountValue: '',
        includeProjectIds: [],
        excludeProjectIds: [],
        description: '',
      }));
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
    onError: (e) => {
      setErr(e?.response?.data?.message || 'Create failed');
      setMsg('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => updateCoupon(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coupons'] }),
  });

  const toggleId = (listKey, id) => {
    setForm((f) => {
      const arr = f[listKey].map(String);
      const sid = String(id);
      const next = arr.includes(sid) ? arr.filter((x) => x !== sid) : [...arr, sid];
      return { ...f, [listKey]: next };
    });
  };

  const onCreate = (e) => {
    e.preventDefault();
    setErr('');
    if (overlap.length) {
      setErr(
        `Include & Exclude mein same project(s) select hain (${overlap.length}). Hatao pehle.`
      );
      return;
    }
    createMutation.mutate({
      code: form.code,
      discountType: isDev ? 'percent' : form.discountType,
      discountValue: Number(form.discountValue),
      projectScope: form.projectScope,
      includeProjectIds: form.projectScope === 'include' ? form.includeProjectIds : [],
      excludeProjectIds: form.projectScope === 'exclude' ? form.excludeProjectIds : [],
      maxUses: Number(form.maxUses) || 0,
      minOrderAmount: Number(form.minOrderAmount) || 0,
      expiresAt: form.expiresAt || undefined,
      description: form.description,
    });
  };

  const rows = listQuery.data?.data || [];

  return (
    <div>
      <PageHeader
        title="Coupons"
        subtitle={
          isDev
            ? 'Buy Now only. Your % coupons apply only on your own developer listings — not company catalog products.'
            : 'Buy Now only (not customization/requirement quotes). Platform coupons work on company listings; seller coupons only on that developer’s products.'
        }
      />

      {msg ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {msg}
        </div>
      ) : null}
      {err ? (
        <div className="mb-4">
          <ErrorBox message={err} />
        </div>
      ) : null}

      <EntityCard className="mb-6">
        <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-2">
          <input
            className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm uppercase"
            placeholder="CODE *"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            required
          />
          {!isDev ? (
            <select
              className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm"
              value={form.discountType}
              onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}
            >
              <option value="percent">Percent %</option>
              <option value="fixed">Fixed ₹</option>
            </select>
          ) : (
            <div className="rounded-xl border border-line bg-mist px-3 py-2.5 text-sm text-muted">
              Type: Percent only (developer)
            </div>
          )}
          <input
            type="number"
            min="1"
            className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm"
            placeholder={form.discountType === 'fixed' && !isDev ? 'Amount ₹ *' : 'Percent % *'}
            value={form.discountValue}
            onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
            required
          />
          <select
            className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm"
            value={form.projectScope}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                projectScope: e.target.value,
                includeProjectIds: [],
                excludeProjectIds: [],
              }))
            }
          >
            <option value="all">All eligible projects</option>
            <option value="include">Include only (selected)</option>
            <option value="exclude">Exclude selected</option>
          </select>

          {form.projectScope === 'include' ? (
            <div className="sm:col-span-2 rounded-xl border border-line bg-sand p-3">
              <div className="mb-2 text-xs font-medium text-muted">Include projects (search + multi)</div>
              <input
                className="mb-2 w-full rounded-lg border border-line bg-card px-3 py-2 text-sm"
                placeholder="Search projects…"
                value={includeSearch}
                onChange={(e) => setIncludeSearch(e.target.value)}
              />
              <div className="max-h-40 space-y-1 overflow-y-auto text-sm">
                {filteredInclude.map((p) => (
                  <label key={p._id} className="flex items-center gap-2 text-brand">
                    <input
                      type="checkbox"
                      checked={form.includeProjectIds.map(String).includes(String(p._id))}
                      onChange={() => toggleId('includeProjectIds', p._id)}
                    />
                    {p.title}
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {form.projectScope === 'exclude' ? (
            <div className="sm:col-span-2 rounded-xl border border-line bg-sand p-3">
              <div className="mb-2 text-xs font-medium text-muted">Exclude projects (search + multi)</div>
              <input
                className="mb-2 w-full rounded-lg border border-line bg-card px-3 py-2 text-sm"
                placeholder="Search projects…"
                value={excludeSearch}
                onChange={(e) => setExcludeSearch(e.target.value)}
              />
              <div className="max-h-40 space-y-1 overflow-y-auto text-sm">
                {filteredExclude.map((p) => (
                  <label key={p._id} className="flex items-center gap-2 text-brand">
                    <input
                      type="checkbox"
                      checked={form.excludeProjectIds.map(String).includes(String(p._id))}
                      onChange={() => toggleId('excludeProjectIds', p._id)}
                    />
                    {p.title}
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {overlap.length > 0 ? (
            <div className="sm:col-span-2 text-sm text-rose-700">
              Overlap: same project(s) in Include & Exclude — create blocked until fixed.
            </div>
          ) : null}

          <input
            type="number"
            min="0"
            className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm"
            placeholder="Max uses (0 = unlimited)"
            value={form.maxUses}
            onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
          />
          <input
            type="number"
            min="0"
            className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm"
            placeholder="Min order ₹"
            value={form.minOrderAmount}
            onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))}
          />
          <input
            type="date"
            className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm"
            value={form.expiresAt}
            onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
          />
          <input
            className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm sm:col-span-2"
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <SoftButton type="submit" variant="primary" disabled={createMutation.isPending || overlap.length > 0}>
            {createMutation.isPending ? 'Saving…' : 'Create coupon'}
          </SoftButton>
        </form>
      </EntityCard>

      {listQuery.isLoading ? <Spinner /> : null}
      {listQuery.isError ? <ErrorBox message="Failed to load coupons" /> : null}

      {!listQuery.isLoading && !listQuery.isError ? (
        <ReportTable
          emptyText="No coupons yet"
          rows={rows}
          columns={[
            {
              key: 'code',
              label: 'Code',
              render: (c) => <span className="font-semibold">{c.code}</span>,
            },
            {
              key: 'discount',
              label: 'Discount',
              render: (c) =>
                c.discountType === 'percent' ? `${c.discountValue}%` : `₹${c.discountValue}`,
            },
            { key: 'creatorRole', label: 'Creator' },
            { key: 'projectScope', label: 'Scope' },
            {
              key: 'used',
              label: 'Used',
              render: (c) =>
                `${c.usedCount || 0}${c.maxUses ? ` / ${c.maxUses}` : ''}`,
            },
            {
              key: 'expiresAt',
              label: 'Expires',
              render: (c) =>
                c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—',
            },
            {
              key: 'status',
              label: 'Status',
              render: (c) => <StatusPill value={c.isActive ? 'active' : 'inactive'} />,
            },
            {
              key: 'actions',
              label: 'Action',
              align: 'right',
              render: (c) => (
                <SoftButton
                  onClick={() =>
                    updateMutation.mutate({ id: c._id, body: { isActive: !c.isActive } })
                  }
                >
                  {c.isActive ? 'Disable' : 'Enable'}
                </SoftButton>
              ),
            },
          ]}
        />
      ) : null}
    </div>
  );
}
