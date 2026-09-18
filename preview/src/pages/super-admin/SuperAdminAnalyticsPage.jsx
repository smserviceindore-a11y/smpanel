import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getSuperAnalytics,
  getAbandonedQuotes,
  remindAbandonedQuotes,
  exportAbandonedQuotesExcel,
  downloadBlob,
} from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import ReportTable from '../../components/dashboard/ReportTable';
import {
  ErrorBox,
  PageHeader,
  SoftButton,
} from '../../components/dashboard/DashboardUI';

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 font-display text-2xl font-semibold text-brand">{value}</div>
    </div>
  );
}

export default function SuperAdminAnalyticsPage() {
  const queryClient = useQueryClient();
  const [exporting, setExporting] = useState(false);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['super-admin', 'analytics'],
    queryFn: async () => (await getSuperAnalytics()).data.data,
  });
  const abandoned = useQuery({
    queryKey: ['super-admin', 'abandoned-quotes'],
    queryFn: async () => (await getAbandonedQuotes({ days: 3 })).data.data,
  });

  const remindMut = useMutation({
    mutationFn: () => remindAbandonedQuotes({ days: 3 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'abandoned-quotes'] });
    },
  });

  if (isLoading) return <Spinner label="Loading analytics..." />;
  if (isError) return <ErrorBox message="Failed to load analytics" />;

  const a = data || {};
  const rows = abandoned.data || [];

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Revenue snapshot and abandoned-quote reminders. Export abandoned list to Excel."
        actions={
          <SoftButton
            variant="primary"
            disabled={exporting || rows.length === 0}
            onClick={async () => {
              setExporting(true);
              try {
                await downloadBlob(
                  exportAbandonedQuotesExcel({ days: 3 }),
                  'abandoned-quotes.xlsx'
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

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Revenue 7d" value={`₹${Number(a.revenue7d || 0).toLocaleString('en-IN')}`} />
        <Stat label="Revenue 30d" value={`₹${Number(a.revenue30d || 0).toLocaleString('en-IN')}`} />
        <Stat label="Payments 30d" value={a.payments30d || 0} />
        <Stat label="Abandoned quotes" value={a.abandonedQuotes || 0} />
        <Stat label="Invoices 30d" value={a.invoices30d || 0} />
        <Stat label="New clients 7d" value={a.newClients7d || 0} />
        <Stat label="Live projects" value={a.liveProjects || 0} />
        <Stat label="Open customizations" value={a.openCustomizations || 0} />
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-brand">
          Abandoned quotations (sent, idle ≥ 3 days)
        </h2>
        <SoftButton
          type="button"
          variant="primary"
          disabled={remindMut.isPending || rows.length === 0}
          onClick={() => remindMut.mutate()}
        >
          {remindMut.isPending ? 'Sending…' : 'Email reminders'}
        </SoftButton>
      </div>
      {remindMut.isSuccess ? (
        <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {remindMut.data?.data?.message || 'Reminders sent'}
        </div>
      ) : null}
      {abandoned.isLoading ? (
        <Spinner label="Loading quotes..." />
      ) : (
        <ReportTable
          emptyText="No abandoned quotations"
          rows={rows}
          columns={[
            {
              key: 'quotationId',
              label: 'Quotation',
              render: (q) => (
                <div>
                  <div className="font-semibold">{q.quotationId}</div>
                  <div className="line-clamp-1 max-w-[200px] text-xs text-muted" title={q.title}>
                    {q.title}
                  </div>
                </div>
              ),
            },
            {
              key: 'client',
              label: 'Client',
              render: (q) => (
                <div>
                  <div>{q.clientName}</div>
                  <div className="text-xs text-muted">{q.clientEmail}</div>
                </div>
              ),
            },
            {
              key: 'total',
              label: 'Amount',
              align: 'right',
              render: (q) => `₹${Number(q.total || 0).toLocaleString('en-IN')}`,
            },
          ]}
        />
      )}
    </div>
  );
}
