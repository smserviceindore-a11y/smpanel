import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPaymentReportDeveloperDetail } from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import ListToolbar from '../../components/dashboard/ListToolbar';
import ReportTable from '../../components/dashboard/ReportTable';
import {
  ErrorBox,
  PageHeader,
  StatCard,
  StatusPill,
} from '../../components/dashboard/DashboardUI';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function SuperAdminPaymentDeveloperPage() {
  const { id } = useParams();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [from, to, id]);

  const params = useMemo(
    () => ({
      page,
      limit: 10,
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      status: 'paid',
    }),
    [page, from, to]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ['super-admin', 'payment-developer', id, params],
    queryFn: async () => (await getPaymentReportDeveloperDetail(id, params)).data.data,
    enabled: Boolean(id),
    placeholderData: (prev) => prev,
  });

  if (isLoading) return <Spinner label="Loading developer report..." />;
  if (isError) return <ErrorBox message="Failed to load developer payment report" />;

  const d = data.developer;
  const s = data.summary;
  const transactions = data.transactions || [];
  const pagination = data.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <div>
      <PageHeader
        title={d.name}
        subtitle={`${d.email} · Commission rate ${d.commissionRate ?? 30}%`}
        actions={
          <Link to="/super-admin/payment-reports" className="btn btn-outline btn-sm">
            All payment reports
          </Link>
        }
      />

      <ListToolbar
        filters={
          <div className="flex flex-wrap gap-2">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm"
            />
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm"
            />
          </div>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Projects / orders sold" value={s.projectsSold} />
        <StatCard label="Gross sales" value={inr(s.grossSales)} tone="navy" />
        <StatCard label="Platform commission" value={inr(s.platformCommission)} />
        <StatCard label="Developer share" value={inr(s.developerShare)} tone="sand" />
      </div>

      <h2 className="mb-3 font-display text-lg font-semibold text-brand">Transactions</h2>
      <ReportTable
        emptyText="No paid transactions in this range"
        rows={transactions}
        columns={[
          {
            key: 'transactionId',
            label: 'Transaction',
            render: (t) => <span className="font-semibold">{t.transactionId}</span>,
          },
          {
            key: 'quotation',
            label: 'Quotation',
            render: (t) => (
              <span className="line-clamp-1 max-w-[180px]" title={t.quotationId?.title}>
                {t.quotationId?.quotationId}
                {t.quotationId?.title ? ` · ${t.quotationId.title}` : ''}
              </span>
            ),
          },
          {
            key: 'client',
            label: 'Client',
            render: (t) => t.clientId?.name || '—',
          },
          {
            key: 'amount',
            label: 'Amount',
            align: 'right',
            render: (t) => inr(t.amount),
          },
          {
            key: 'commission',
            label: 'Commission',
            align: 'right',
            render: (t) => inr(t.platformCommission),
          },
          {
            key: 'share',
            label: 'Dev share',
            align: 'right',
            render: (t) => inr(t.developerShare),
          },
          {
            key: 'status',
            label: 'Status',
            render: (t) => <StatusPill value={t.status} />,
          },
          {
            key: 'paidAt',
            label: 'Paid',
            render: (t) =>
              t.paidAt ? new Date(t.paidAt).toLocaleString('en-IN') : '—',
          },
        ]}
      />

      <Pagination
        page={pagination.page || page}
        totalPages={pagination.totalPages || 1}
        total={pagination.total}
        onChange={setPage}
      />
    </div>
  );
}
