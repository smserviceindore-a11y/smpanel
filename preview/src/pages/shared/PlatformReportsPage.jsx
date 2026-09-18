import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDashboardBase } from '../../context/DashboardBaseContext';
import {
  downloadBlob,
  getAdminProjects,
  getAdminRequirements,
  getAdminCustomizations,
} from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import ReportTable from '../../components/dashboard/ReportTable';
import { ErrorBox, SoftButton, StatusPill } from '../../components/dashboard/DashboardUI';
import {
  ChartCard,
  DonutFromMap,
  MonthlyTrendChart,
  StackedMonthlyChart,
  StatusBarsChart,
} from '../../components/dashboard/ReportCharts';

const MONTHS = [
  { n: 1, label: 'Jan' },
  { n: 2, label: 'Feb' },
  { n: 3, label: 'Mar' },
  { n: 4, label: 'Apr' },
  { n: 5, label: 'May' },
  { n: 6, label: 'Jun' },
  { n: 7, label: 'Jul' },
  { n: 8, label: 'Aug' },
  { n: 9, label: 'Sep' },
  { n: 10, label: 'Oct' },
  { n: 11, label: 'Nov' },
  { n: 12, label: 'Dec' },
];

const SHEETS = [
  { id: 'overview', label: 'Overview' },
  { id: 'projects', label: 'Projects' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'customizations', label: 'Customizations' },
  { id: 'funnel', label: 'Lead funnel' },
];

function SlicerGroup({ title, children }) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/55">{title}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function SlicerChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
        active
          ? 'bg-accent text-brand-deep shadow-sm'
          : 'bg-white/10 text-white/90 hover:bg-white/20'
      }`}
    >
      {children}
    </button>
  );
}

function KpiTile({ label, value, hint }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-brand px-4 py-4 text-white shadow-md">
      <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-accent/20" />
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/65">{label}</div>
      <div className="mt-2 font-display text-2xl font-semibold tabular-nums sm:text-3xl">{value}</div>
      {hint ? <div className="mt-1 text-[11px] text-white/55">{hint}</div> : null}
    </div>
  );
}

function periodToRange(year, month) {
  if (!year) return { dateFrom: '', dateTo: '' };
  if (month) {
    const last = new Date(year, month, 0).getDate();
    const mm = String(month).padStart(2, '0');
    return {
      dateFrom: `${year}-${mm}-01`,
      dateTo: `${year}-${mm}-${String(last).padStart(2, '0')}`,
    };
  }
  return { dateFrom: `${year}-01-01`, dateTo: `${year}-12-31` };
}

/**
 * Professional Excel-style analytics dashboard with slicers + sheet tabs.
 */
export default function PlatformReportsPage({
  title,
  subtitlePrefix = 'Platform report',
  queryKey,
  fetchReports,
  exportExcel,
  showMonthlyTrend = true,
}) {
  const base = useDashboardBase();
  const now = new Date();
  const yearOptions = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2];

  const [sheet, setSheet] = useState('overview');
  const [year, setYear] = useState(null);
  const [month, setMonth] = useState(null);
  const [category, setCategory] = useState('');
  const [ownerType, setOwnerType] = useState('');
  const [projectStatus, setProjectStatus] = useState('');
  const [industry, setIndustry] = useState('');
  const [leadStatus, setLeadStatus] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [slicerOpen, setSlicerOpen] = useState(true);
  const [listPage, setListPage] = useState(1);

  const { dateFrom, dateTo } = useMemo(() => periodToRange(year, month), [year, month]);

  useEffect(() => {
    setListPage(1);
  }, [sheet, dateFrom, dateTo, category, ownerType, projectStatus, industry, leadStatus]);

  const params = useMemo(
    () => ({
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
      ...(category ? { category } : {}),
      ...(ownerType ? { ownerType } : {}),
      ...(projectStatus ? { projectStatus } : {}),
      ...(industry ? { industry } : {}),
      ...(leadStatus ? { leadStatus } : {}),
    }),
    [dateFrom, dateTo, category, ownerType, projectStatus, industry, leadStatus]
  );

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: [queryKey, params],
    queryFn: async () => (await fetchReports(params)).data.data,
    placeholderData: (prev) => prev,
  });

  const projectsQuery = useQuery({
    queryKey: [queryKey, 'projects-sheet', params, listPage],
    queryFn: async () =>
      (
        await getAdminProjects({
          page: listPage,
          limit: 10,
          ...(category ? { category } : {}),
          ...(ownerType ? { ownerType } : {}),
          ...(projectStatus ? { status: projectStatus } : {}),
        })
      ).data,
    enabled: sheet === 'projects',
    placeholderData: (prev) => prev,
  });

  const reqQuery = useQuery({
    queryKey: [queryKey, 'req-sheet', params, listPage],
    queryFn: async () =>
      (
        await getAdminRequirements({
          page: listPage,
          limit: 10,
          ...(leadStatus ? { status: leadStatus } : {}),
          ...(dateFrom ? { dateFrom } : {}),
          ...(dateTo ? { dateTo } : {}),
        })
      ).data,
    enabled: sheet === 'requirements',
    placeholderData: (prev) => prev,
  });

  const custQuery = useQuery({
    queryKey: [queryKey, 'cust-sheet', params, listPage],
    queryFn: async () =>
      (
        await getAdminCustomizations({
          page: listPage,
          limit: 10,
          ...(leadStatus ? { status: leadStatus } : {}),
          ...(dateFrom ? { dateFrom } : {}),
          ...(dateTo ? { dateTo } : {}),
        })
      ).data,
    enabled: sheet === 'customizations',
    placeholderData: (prev) => prev,
  });

  const handleExport = async () => {
    setExporting(true);
    setExportError('');
    try {
      await downloadBlob(exportExcel(params), `master-reports-${Date.now()}.xlsx`);
    } catch (e) {
      setExportError(e?.response?.data?.message || e?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setYear(null);
    setMonth(null);
    setCategory('');
    setOwnerType('');
    setProjectStatus('');
    setIndustry('');
    setLeadStatus('');
  };

  const hasFilters =
    year != null ||
    month != null ||
    category ||
    ownerType ||
    projectStatus ||
    industry ||
    leadStatus;

  if (isLoading && !data) return <Spinner label="Building analytics dashboard…" />;
  if (isError && !data) return <ErrorBox message="Failed to load reports" />;

  const r = data;
  const opts = r.filterOptions || {};
  const s = r.summary || {};

  const activeFilterLabels = [
    year ? (month ? `${MONTHS[month - 1]?.label} ${year}` : `Year ${year}`) : null,
    ownerType || null,
    projectStatus || null,
    industry || null,
    leadStatus ? leadStatus.replace(/_/g, ' ') : null,
    category ? opts.categories?.find((c) => c.id === category)?.name || 'Category' : null,
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      {/* Dashboard chrome */}
      <div className="overflow-hidden rounded-2xl border border-brand/20 bg-brand text-white shadow-lg">
        <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-soft">
              Analytics workspace
            </div>
            <h1 className="mt-1 font-display text-xl font-semibold sm:text-2xl">{title}</h1>
            <p className="mt-1 text-xs text-white/65">
              {subtitlePrefix} · {new Date(r.generatedAt).toLocaleString('en-IN')}
              {isFetching && !isLoading ? ' · refreshing…' : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <button
              type="button"
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold lg:hidden"
              onClick={() => setSlicerOpen((v) => !v)}
            >
              {slicerOpen ? 'Hide slicers' : 'Show slicers'}
            </button>
            <SoftButton variant="primary" onClick={handleExport} disabled={exporting}>
              {exporting ? 'Exporting…' : 'Export Excel'}
            </SoftButton>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg border border-white/25 bg-transparent px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
            >
              Print / PDF
            </button>
          </div>
        </div>

        {/* Sheet tabs like Excel */}
        <div className="flex gap-1 overflow-x-auto border-t border-white/10 bg-brand-deep/40 px-3 py-2 sm:px-4">
          {SHEETS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSheet(t.id)}
              className={`shrink-0 rounded-t-md px-3 py-1.5 text-xs font-semibold transition ${
                sheet === t.id
                  ? 'bg-card text-brand'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {exportError ? <ErrorBox message={exportError} /> : null}

      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Slicer panel */}
        <aside
          className={`print:hidden ${slicerOpen ? 'block' : 'hidden lg:block'} rounded-2xl bg-brand p-4 text-white shadow-md`}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-accent-soft">
              Slicers
            </div>
            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="text-[11px] font-semibold text-accent-soft underline-offset-2 hover:underline"
              >
                Reset all
              </button>
            ) : null}
          </div>

          <div className="space-y-5">
            <SlicerGroup title="Period">
              <SlicerChip
                active={year == null}
                onClick={() => {
                  setYear(null);
                  setMonth(null);
                }}
              >
                All time
              </SlicerChip>
            </SlicerGroup>

            <SlicerGroup title="Year">
              {yearOptions.map((y) => (
                <SlicerChip
                  key={y}
                  active={year === y}
                  onClick={() => {
                    setYear(y);
                    setMonth(null);
                  }}
                >
                  {y}
                </SlicerChip>
              ))}
            </SlicerGroup>

            <SlicerGroup title="Month">
              {MONTHS.map((m) => (
                <SlicerChip
                  key={m.n}
                  active={month === m.n}
                  onClick={() => {
                    if (!year) setYear(now.getFullYear());
                    setMonth(month === m.n ? null : m.n);
                  }}
                >
                  {m.label}
                </SlicerChip>
              ))}
            </SlicerGroup>

            <SlicerGroup title="Owner">
              <SlicerChip active={!ownerType} onClick={() => setOwnerType('')}>
                All
              </SlicerChip>
              {(opts.ownerTypes || ['company', 'developer']).map((o) => (
                <SlicerChip key={o} active={ownerType === o} onClick={() => setOwnerType(o)}>
                  {o}
                </SlicerChip>
              ))}
            </SlicerGroup>

            <SlicerGroup title="Project status">
              <SlicerChip active={!projectStatus} onClick={() => setProjectStatus('')}>
                All
              </SlicerChip>
              {(opts.projectStatuses || []).map((sStatus) => (
                <SlicerChip
                  key={sStatus}
                  active={projectStatus === sStatus}
                  onClick={() => setProjectStatus(sStatus)}
                >
                  {sStatus}
                </SlicerChip>
              ))}
            </SlicerGroup>

            <SlicerGroup title="Category">
              <SlicerChip active={!category} onClick={() => setCategory('')}>
                All
              </SlicerChip>
              {(opts.categories || []).map((c) => (
                <SlicerChip
                  key={c.id}
                  active={category === c.id}
                  onClick={() => setCategory(c.id)}
                >
                  {c.name}
                </SlicerChip>
              ))}
            </SlicerGroup>

            <SlicerGroup title="Industry">
              <SlicerChip active={!industry} onClick={() => setIndustry('')}>
                All
              </SlicerChip>
              {(opts.industries || []).slice(0, 16).map((i) => (
                <SlicerChip key={i} active={industry === i} onClick={() => setIndustry(i)}>
                  {i}
                </SlicerChip>
              ))}
            </SlicerGroup>

            <SlicerGroup title="Lead status">
              <SlicerChip active={!leadStatus} onClick={() => setLeadStatus('')}>
                All
              </SlicerChip>
              {(opts.leadStatuses || []).map((ls) => (
                <SlicerChip
                  key={ls}
                  active={leadStatus === ls}
                  onClick={() => setLeadStatus(ls)}
                >
                  {ls.replace(/_/g, ' ')}
                </SlicerChip>
              ))}
            </SlicerGroup>
          </div>
        </aside>

        {/* Main canvas */}
        <div className="min-w-0 space-y-4">
          {activeFilterLabels.length ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-card px-3 py-2 text-xs text-muted">
              <span className="font-semibold text-brand">Active slices:</span>
              {activeFilterLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-md bg-mist px-2 py-1 font-medium text-brand"
                >
                  {label}
                </span>
              ))}
            </div>
          ) : null}

          {/* KPI strip */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <KpiTile label="Projects" value={s.totalProjects ?? 0} hint="In current slice" />
            <KpiTile label="Views" value={s.totalViews ?? 0} hint="Catalog engagement" />
            <KpiTile label="Leads" value={s.totalLeads ?? 0} hint="Req + customization" />
            <KpiTile label="Won deals" value={s.wonDeals ?? 0} hint="Closed won" />
            <KpiTile
              label="Conversion"
              value={`${s.conversionRate ?? 0}%`}
              hint="Won ÷ leads"
            />
          </div>

          {sheet === 'overview' ? (
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-3">
                <ChartCard title="Owner mix">
                  <DonutFromMap map={r.projectsByOwner} />
                </ChartCard>
                <ChartCard title="Projects by status">
                  <DonutFromMap map={r.projectsByStatus} />
                </ChartCard>
                <ChartCard title="Projects by category">
                  <StatusBarsChart map={r.projectsByCategory} titleKey="category" />
                </ChartCard>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <ChartCard title="Requirement funnel">
                  <StatusBarsChart map={r.requirementsByStatus} />
                </ChartCard>
                <ChartCard title="Customization funnel">
                  <StatusBarsChart map={r.customizationsByStatus} />
                </ChartCard>
              </div>

              {showMonthlyTrend ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <ChartCard title="Monthly volume (stacked)" tall>
                    <StackedMonthlyChart rows={r.monthlyTrend} />
                  </ChartCard>
                  <ChartCard title="Monthly trend lines" tall>
                    <MonthlyTrendChart rows={r.monthlyTrend} />
                  </ChartCard>
                </div>
              ) : null}

              <section className="rounded-2xl border border-line bg-card p-4 shadow-sm sm:p-5">
                <div className="mb-3 flex items-end justify-between gap-2">
                  <div>
                    <h2 className="font-display text-base font-semibold text-brand">
                      Top projects
                    </h2>
                    <p className="text-xs text-muted">Highest views in the current slice</p>
                  </div>
                  <Link to={`${base}/projects`} className="text-xs font-semibold text-accent">
                    Open catalog →
                  </Link>
                </div>
                <ReportTable
                  emptyText="No projects in this slice"
                  rows={r.topProjects || []}
                  columns={[
                    {
                      key: 'title',
                      label: 'Title',
                      render: (p) => (
                        <Link
                          to={`/projects/${p.slug}`}
                          className="font-semibold hover:text-accent"
                        >
                          {p.title}
                        </Link>
                      ),
                    },
                    {
                      key: 'category',
                      label: 'Category',
                      render: (p) => p.category?.name || '—',
                    },
                    { key: 'ownerType', label: 'Owner' },
                    {
                      key: 'industry',
                      label: 'Industry',
                      render: (p) => p.industry || '—',
                    },
                    {
                      key: 'views',
                      label: 'Views',
                      align: 'right',
                      render: (p) => p.views ?? 0,
                    },
                    {
                      key: 'status',
                      label: 'Status',
                      render: (p) => <StatusPill value={p.status} />,
                    },
                  ]}
                />
              </section>

              <section className="rounded-2xl border border-line bg-card p-4 shadow-sm sm:p-5">
                <h2 className="mb-1 font-display text-base font-semibold text-brand">
                  Recent won leads
                </h2>
                <p className="mb-3 text-xs text-muted">Latest closed deals for this slice</p>
                <ReportTable
                  emptyText="No won deals in this slice"
                  rows={r.recentWon || []}
                  columns={[
                    {
                      key: 'leadId',
                      label: 'Lead ID',
                      render: (lead) => (
                        <span className="font-semibold">{lead.leadId}</span>
                      ),
                    },
                    { key: 'name', label: 'Name' },
                    {
                      key: 'company',
                      label: 'Company',
                      render: (lead) => lead.company || '—',
                    },
                    {
                      key: 'budget',
                      label: 'Budget',
                      render: (lead) => lead.budget || '—',
                    },
                    {
                      key: 'status',
                      label: 'Status',
                      render: (lead) => <StatusPill value={lead.status} />,
                    },
                    {
                      key: 'updatedAt',
                      label: 'Updated',
                      render: (lead) =>
                        lead.updatedAt
                          ? new Date(lead.updatedAt).toLocaleDateString('en-IN')
                          : '—',
                    },
                  ]}
                />
              </section>
            </div>
          ) : null}

          {sheet === 'projects' ? (
            <section className="rounded-2xl border border-line bg-card p-4 shadow-sm sm:p-5">
              <h2 className="mb-1 font-display text-base font-semibold text-brand">
                Projects detail
              </h2>
              <p className="mb-3 text-xs text-muted">
                Spreadsheet-style project list · page {listPage}
              </p>
              {projectsQuery.isLoading ? <Spinner /> : null}
              {projectsQuery.isError ? <ErrorBox message="Failed to load projects" /> : null}
              {!projectsQuery.isLoading && !projectsQuery.isError ? (
                <>
                  <ReportTable
                    emptyText="No projects match slicers"
                    rows={projectsQuery.data?.data || []}
                    columns={[
                      {
                        key: 'title',
                        label: 'Title',
                        render: (p) => (
                          <span className="font-semibold">{p.title}</span>
                        ),
                      },
                      { key: 'slug', label: 'Slug', render: (p) => p.slug || '—' },
                      {
                        key: 'status',
                        label: 'Status',
                        render: (p) => <StatusPill value={p.status} />,
                      },
                      { key: 'ownerType', label: 'Owner' },
                      {
                        key: 'category',
                        label: 'Category',
                        render: (p) => p.category?.name || '—',
                      },
                      {
                        key: 'industry',
                        label: 'Industry',
                        render: (p) => p.industry || '—',
                      },
                      {
                        key: 'views',
                        label: 'Views',
                        align: 'right',
                        render: (p) => p.views ?? 0,
                      },
                      {
                        key: 'createdAt',
                        label: 'Created',
                        render: (p) =>
                          p.createdAt
                            ? new Date(p.createdAt).toLocaleString('en-IN')
                            : '—',
                      },
                    ]}
                  />
                  <Pagination
                    page={projectsQuery.data?.pagination?.page || listPage}
                    totalPages={projectsQuery.data?.pagination?.totalPages || 1}
                    total={projectsQuery.data?.pagination?.total}
                    onChange={setListPage}
                  />
                </>
              ) : null}
            </section>
          ) : null}

          {sheet === 'requirements' ? (
            <section className="rounded-2xl border border-line bg-card p-4 shadow-sm sm:p-5">
              <h2 className="mb-1 font-display text-base font-semibold text-brand">
                Requirements detail
              </h2>
              <p className="mb-3 text-xs text-muted">Requirement leads · Excel-style columns</p>
              {reqQuery.isLoading ? <Spinner /> : null}
              {reqQuery.isError ? <ErrorBox message="Failed to load requirements" /> : null}
              {!reqQuery.isLoading && !reqQuery.isError ? (
                <>
                  <ReportTable
                    emptyText="No requirements in this slice"
                    rows={reqQuery.data?.data || []}
                    columns={[
                      {
                        key: 'leadId',
                        label: 'Lead ID',
                        render: (row) => (
                          <span className="font-semibold">{row.leadId}</span>
                        ),
                      },
                      { key: 'name', label: 'Name' },
                      { key: 'email', label: 'Email' },
                      { key: 'mobile', label: 'Mobile', render: (row) => row.mobile || '—' },
                      {
                        key: 'industry',
                        label: 'Industry',
                        render: (row) => row.industry || '—',
                      },
                      {
                        key: 'budget',
                        label: 'Budget',
                        render: (row) => row.budget || '—',
                      },
                      {
                        key: 'status',
                        label: 'Status',
                        render: (row) => <StatusPill value={row.status} />,
                      },
                      {
                        key: 'createdAt',
                        label: 'Created',
                        render: (row) =>
                          row.createdAt
                            ? new Date(row.createdAt).toLocaleString('en-IN')
                            : '—',
                      },
                    ]}
                  />
                  <Pagination
                    page={reqQuery.data?.pagination?.page || listPage}
                    totalPages={reqQuery.data?.pagination?.totalPages || 1}
                    total={reqQuery.data?.pagination?.total}
                    onChange={setListPage}
                  />
                </>
              ) : null}
            </section>
          ) : null}

          {sheet === 'customizations' ? (
            <section className="rounded-2xl border border-line bg-card p-4 shadow-sm sm:p-5">
              <h2 className="mb-1 font-display text-base font-semibold text-brand">
                Customizations detail
              </h2>
              <p className="mb-3 text-xs text-muted">Customization requests for current slicers</p>
              {custQuery.isLoading ? <Spinner /> : null}
              {custQuery.isError ? (
                <ErrorBox message="Failed to load customizations" />
              ) : null}
              {!custQuery.isLoading && !custQuery.isError ? (
                <>
                  <ReportTable
                    emptyText="No customizations in this slice"
                    rows={custQuery.data?.data || []}
                    columns={[
                      {
                        key: 'leadId',
                        label: 'Lead ID',
                        render: (row) => (
                          <span className="font-semibold">{row.leadId}</span>
                        ),
                      },
                      { key: 'name', label: 'Name' },
                      { key: 'email', label: 'Email' },
                      {
                        key: 'project',
                        label: 'Project',
                        render: (row) =>
                          row.projectTitle || row.projectId?.title || '—',
                      },
                      {
                        key: 'ownership',
                        label: 'Ownership',
                        render: (row) => row.ownership || '—',
                      },
                      {
                        key: 'status',
                        label: 'Status',
                        render: (row) => <StatusPill value={row.status} />,
                      },
                      {
                        key: 'createdAt',
                        label: 'Created',
                        render: (row) =>
                          row.createdAt
                            ? new Date(row.createdAt).toLocaleString('en-IN')
                            : '—',
                      },
                    ]}
                  />
                  <Pagination
                    page={custQuery.data?.pagination?.page || listPage}
                    totalPages={custQuery.data?.pagination?.totalPages || 1}
                    total={custQuery.data?.pagination?.total}
                    onChange={setListPage}
                  />
                </>
              ) : null}
            </section>
          ) : null}

          {sheet === 'funnel' ? (
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <ChartCard title="Requirement statuses" tall>
                  <StatusBarsChart map={r.requirementsByStatus} />
                </ChartCard>
                <ChartCard title="Customization statuses" tall>
                  <StatusBarsChart map={r.customizationsByStatus} />
                </ChartCard>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['Requirements', Object.values(r.requirementsByStatus || {}).reduce((a, b) => a + b, 0)],
                  ['Customizations', Object.values(r.customizationsByStatus || {}).reduce((a, b) => a + b, 0)],
                  ['Won (combined)', s.wonDeals ?? 0],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-line bg-card px-4 py-4 shadow-sm"
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
                      {label}
                    </div>
                    <div className="mt-2 font-display text-2xl font-semibold text-brand">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
