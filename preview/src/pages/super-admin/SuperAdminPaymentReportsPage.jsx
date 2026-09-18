import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  getPaymentReportDevelopers,
  getPaymentReportSummary,
  getPaymentReportTransactions,
  exportPaymentReportTransactionsExcel,
  downloadBlob,
} from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import ListToolbar, { FilterSelect, DateRangeFilters } from '../../components/dashboard/ListToolbar';
import ReportTable from '../../components/dashboard/ReportTable';
import {
  ErrorBox,
  PageHeader,
  SoftButton,
  StatCard,
  StatusPill,
} from '../../components/dashboard/DashboardUI';
import {
  ChartCard,
  MoneySplitPie,
  OrdersMixBar,
  TopDevelopersBar,
} from '../../components/dashboard/ReportCharts';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function SuperAdminPaymentReportsPage() {
  const [tab, setTab] = useState('overview');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('paid');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    setPage(1);
  }, [tab, from, to, debouncedSearch, status]);

  const dateParams = useMemo(
    () => ({
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      ...(status ? { status } : {}),
    }),
    [from, to, status]
  );

  const summaryQuery = useQuery({
    queryKey: ['super-admin', 'payment-summary', dateParams],
    queryFn: async () => (await getPaymentReportSummary(dateParams)).data.data,
    enabled: tab === 'overview',
  });

  const developersQuery = useQuery({
    queryKey: ['super-admin', 'payment-developers', dateParams, debouncedSearch, page],
    queryFn: async () =>
      (
        await getPaymentReportDevelopers({
          ...dateParams,
          page,
          limit: 12,
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
        })
      ).data,
    enabled: tab === 'developers',
    placeholderData: (prev) => prev,
  });

  const txnsQuery = useQuery({
    queryKey: ['super-admin', 'payment-txns', dateParams, debouncedSearch, page],
    queryFn: async () =>
      (
        await getPaymentReportTransactions({
          ...dateParams,
          page,
          limit: 10,
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
        })
      ).data,
    enabled: tab === 'transactions',
    placeholderData: (prev) => prev,
  });

  const filters = (
    <>
      <DateRangeFilters
        dateFrom={from}
        dateTo={to}
        onFromChange={setFrom}
        onToChange={setTo}
      />
      <FilterSelect value={status} onChange={setStatus}>
        <option value="paid">Paid</option>
        <option value="created">Created</option>
        <option value="failed">Failed</option>
      </FilterSelect>
    </>
  );

  return (
    <div>
      <PageHeader
        title="Payment Reports"
        subtitle="Platform-wide sales, commission and per-developer earnings. Filter by date and export transactions to Excel."
        actions={
          <SoftButton
            variant="primary"
            disabled={exporting}
            onClick={async () => {
              setExporting(true);
              try {
                await downloadBlob(
                  exportPaymentReportTransactionsExcel({
                    ...dateParams,
                    ...(debouncedSearch ? { search: debouncedSearch } : {}),
                  }),
                  'payment-report.xlsx'
                );
              } finally {
                setExporting(false);
              }
            }}
          >
            {exporting ? 'Exporting…' : 'Export Excel'}
          </SoftButton>
        }
      />

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {[
          ['overview', 'Overview'],
          ['developers', 'By developer'],
          ['transactions', 'Transactions'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              tab === id ? 'bg-brand text-white shadow-sm' : 'bg-card text-muted ring-1 ring-line hover:bg-mist'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <ListToolbar
        {...(tab === 'overview'
          ? {}
          : {
              search,
              onSearchChange: setSearch,
              searchPlaceholder:
                tab === 'developers' ? 'Search developer name/email…' : 'Search transaction ID…',
            })}
        filters={filters}
      />

      {tab === 'overview' && (
        <>
          {summaryQuery.isLoading && <Spinner />}
          {summaryQuery.isError && <ErrorBox message="Failed to load summary" />}
          {summaryQuery.data && (
            <>
              <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <StatCard label="Orders / sells" value={summaryQuery.data.summary.totalOrders} />
                <StatCard
                  label="Gross sales"
                  value={inr(summaryQuery.data.summary.grossSales)}
                  tone="navy"
                />
                <StatCard
                  label="Platform commission"
                  value={inr(summaryQuery.data.summary.platformCommission)}
                />
                <StatCard
                  label="Developer share"
                  value={inr(summaryQuery.data.summary.developerShare)}
                  tone="sand"
                />
                <StatCard
                  label="Company delivery orders"
                  value={summaryQuery.data.summary.companyOrders}
                />
                <StatCard
                  label="Developer project orders"
                  value={summaryQuery.data.summary.developerOrders}
                  tone="navy"
                />
              </div>

              <div className="mb-6 grid gap-4 lg:grid-cols-3">
                <ChartCard title="Commission vs developer share">
                  <MoneySplitPie
                    commission={summaryQuery.data.summary.platformCommission}
                    developerShare={summaryQuery.data.summary.developerShare}
                  />
                </ChartCard>
                <ChartCard title="Order mix">
                  <OrdersMixBar
                    company={summaryQuery.data.summary.companyOrders}
                    developer={summaryQuery.data.summary.developerOrders}
                  />
                </ChartCard>
                <ChartCard title="Top developers (gross / share)">
                  <TopDevelopersBar rows={summaryQuery.data.topDevelopers} />
                </ChartCard>
              </div>

              <h2 className="mb-3 font-display text-lg font-semibold text-brand">Top developers</h2>
              <ReportTable
                emptyText="No developer sales in this range"
                rowKey="developerId"
                rows={summaryQuery.data.topDevelopers || []}
                columns={[
                  {
                    key: 'name',
                    label: 'Developer',
                    render: (d) => <span className="font-semibold">{d.name || 'Developer'}</span>,
                  },
                  { key: 'email', label: 'Email', render: (d) => d.email || '—' },
                  { key: 'orders', label: 'Orders', align: 'right' },
                  {
                    key: 'grossSales',
                    label: 'Gross',
                    align: 'right',
                    render: (d) => inr(d.grossSales),
                  },
                  {
                    key: 'platformCommission',
                    label: 'Commission',
                    align: 'right',
                    render: (d) => inr(d.platformCommission),
                  },
                  {
                    key: 'developerShare',
                    label: 'Share',
                    align: 'right',
                    render: (d) => inr(d.developerShare),
                  },
                  {
                    key: 'actions',
                    label: '',
                    align: 'right',
                    render: (d) => (
                      <Link
                        to={`/super-admin/payment-reports/developers/${d.developerId}`}
                        className="btn btn-outline btn-sm"
                      >
                        Detail
                      </Link>
                    ),
                  },
                ]}
              />
            </>
          )}
        </>
      )}

      {tab === 'developers' && (
        <>
          {developersQuery.isLoading && <Spinner />}
          {developersQuery.isError && <ErrorBox message="Failed to load developer reports" />}
          {developersQuery.data && (
            <>
              {developersQuery.data.data?.totals && (
                <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label="Developers"
                    value={developersQuery.data.data.totals.developers}
                  />
                  <StatCard label="Orders" value={developersQuery.data.data.totals.orders} />
                  <StatCard
                    label="Gross"
                    value={inr(developersQuery.data.data.totals.grossSales)}
                    tone="navy"
                  />
                  <StatCard
                    label="Commission"
                    value={inr(developersQuery.data.data.totals.platformCommission)}
                  />
                </div>
              )}
              <ReportTable
                emptyText="No matching developers"
                rowKey="developerId"
                rows={developersQuery.data.data?.developers || []}
                columns={[
                  {
                    key: 'name',
                    label: 'Developer',
                    render: (d) => <span className="font-semibold">{d.name}</span>,
                  },
                  { key: 'email', label: 'Email' },
                  {
                    key: 'projectsSold',
                    label: 'Sold',
                    align: 'right',
                  },
                  {
                    key: 'grossSales',
                    label: 'Gross',
                    align: 'right',
                    render: (d) => inr(d.grossSales),
                  },
                  {
                    key: 'platformCommission',
                    label: 'Commission',
                    align: 'right',
                    render: (d) => `${inr(d.platformCommission)} (${d.avgCommissionRate}%)`,
                  },
                  {
                    key: 'developerShare',
                    label: 'Share',
                    align: 'right',
                    render: (d) => inr(d.developerShare),
                  },
                  {
                    key: 'actions',
                    label: '',
                    align: 'right',
                    render: (d) => (
                      <Link
                        to={`/super-admin/payment-reports/developers/${d.developerId}`}
                        className="btn btn-accent btn-sm"
                      >
                        Report
                      </Link>
                    ),
                  },
                ]}
              />
              <Pagination
                page={developersQuery.data.pagination?.page || page}
                totalPages={developersQuery.data.pagination?.totalPages || 1}
                total={developersQuery.data.pagination?.total}
                onChange={setPage}
              />
            </>
          )}
        </>
      )}

      {tab === 'transactions' && (
        <>
          {txnsQuery.isLoading && <Spinner />}
          {txnsQuery.isError && <ErrorBox message="Failed to load transactions" />}
          {txnsQuery.data && (
            <>
              <ReportTable
                emptyText="No transactions found"
                rows={txnsQuery.data.data || []}
                columns={[
                  {
                    key: 'transactionId',
                    label: 'Txn ID',
                    render: (t) => <span className="font-semibold">{t.transactionId}</span>,
                  },
                  {
                    key: 'quotation',
                    label: 'Quotation',
                    render: (t) => t.quotationId?.quotationId || '—',
                  },
                  {
                    key: 'client',
                    label: 'Client',
                    render: (t) => t.clientId?.name || t.clientId?.email || '—',
                  },
                  {
                    key: 'developer',
                    label: 'Developer',
                    render: (t) =>
                      t.developerId?._id ? (
                        <Link
                          to={`/super-admin/payment-reports/developers/${t.developerId._id}`}
                          className="text-accent hover:underline"
                        >
                          {t.developerId.name}
                        </Link>
                      ) : (
                        'Platform'
                      ),
                  },
                  {
                    key: 'amount',
                    label: 'Amount',
                    align: 'right',
                    render: (t) => inr(t.amount),
                  },
                  {
                    key: 'platformCommission',
                    label: 'Commission',
                    align: 'right',
                    render: (t) => inr(t.platformCommission),
                  },
                  {
                    key: 'developerShare',
                    label: 'Dev share',
                    align: 'right',
                    render: (t) => inr(t.developerShare),
                  },
                  {
                    key: 'status',
                    label: 'Status',
                    render: (t) => <StatusPill value={t.status} />,
                  },
                ]}
              />
              <Pagination
                page={txnsQuery.data.pagination?.page || page}
                totalPages={txnsQuery.data.pagination?.totalPages || 1}
                total={txnsQuery.data.pagination?.total}
                onChange={setPage}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
