import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAdminSettlement,
  downloadBlob,
  exportAdminPayoutsExcel,
  exportAdminSettlementsExcel,
  exportAdminTransactionsExcel,
  getAdminPayouts,
  getAdminSettlements,
  getAdminTransactions,
  refundAdminTransaction,
  reviewAdminPayout,
  updateAdminSettlement,
} from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import ListToolbar, { FilterSelect, DateRangeFilters } from '../../components/dashboard/ListToolbar';
import ReportTable from '../../components/dashboard/ReportTable';
import {
  EmptyState,
  EntityCard,
  ErrorBox,
  PageHeader,
  SoftButton,
  StatusPill,
} from '../../components/dashboard/DashboardUI';

export default function AdminSettlementsPage() {
  const [selected, setSelected] = useState([]);
  const [tab, setTab] = useState('payouts');
  const [payoutPage, setPayoutPage] = useState(1);
  const [settlePage, setSettlePage] = useState(1);
  const [txnPage, setTxnPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [refundMsg, setRefundMsg] = useState('');
  const [exporting, setExporting] = useState(false);
  const debouncedSearch = useDebounce(search, 400);
  const queryClient = useQueryClient();

  useEffect(() => {
    setPayoutPage(1);
    setSettlePage(1);
    setTxnPage(1);
  }, [debouncedSearch, status, dateFrom, dateTo, tab]);

  const filterParams = useMemo(
    () => ({
      ...(status ? { status } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
    }),
    [status, debouncedSearch, dateFrom, dateTo]
  );

  const pendingQuery = useQuery({
    queryKey: ['admin', 'transactions', 'pending-settlement', filterParams],
    queryFn: async () =>
      (
        await getAdminTransactions({
          status: 'paid',
          settlementStatus: 'pending',
          limit: 50,
          ...filterParams,
        })
      ).data,
  });

  const settlementsQuery = useQuery({
    queryKey: ['admin', 'settlements', settlePage, filterParams],
    queryFn: async () =>
      (await getAdminSettlements({ page: settlePage, limit: 20, ...filterParams })).data,
  });

  const payoutsQuery = useQuery({
    queryKey: ['admin', 'payouts', payoutPage, filterParams],
    queryFn: async () =>
      (await getAdminPayouts({ page: payoutPage, limit: 10, ...filterParams })).data,
  });

  const createMutation = useMutation({
    mutationFn: createAdminSettlement,
    onSuccess: () => {
      setSelected([]);
      queryClient.invalidateQueries({ queryKey: ['admin', 'settlements'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'transactions'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => updateAdminSettlement(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'settlements'] }),
  });

  const payoutMutation = useMutation({
    mutationFn: ({ id, body }) => reviewAdminPayout(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] });
      queryClient.invalidateQueries({ queryKey: ['developer'] });
    },
  });

  const refundMutation = useMutation({
    mutationFn: ({ id, amount, reason }) => refundAdminTransaction(id, { amount, reason }),
    onSuccess: () => {
      setRefundMsg('Refund recorded');
      queryClient.invalidateQueries({ queryKey: ['admin', 'transactions'] });
    },
    onError: (e) => setRefundMsg(e?.response?.data?.message || 'Refund failed'),
  });

  const paidTxnsQuery = useQuery({
    queryKey: ['admin', 'transactions', 'paid-refund', txnPage, filterParams],
    queryFn: async () =>
      (await getAdminTransactions({ status: 'paid', page: txnPage, limit: 20, ...filterParams }))
        .data,
    enabled: tab === 'refunds',
  });

  const pending = pendingQuery.data?.data || [];
  const settlements = settlementsQuery.data?.data || [];
  const payouts = payoutsQuery.data?.data || [];
  const payoutPag = payoutsQuery.data?.pagination || {};
  const settlePag = settlementsQuery.data?.pagination || {};
  const txnPag = paidTxnsQuery.data?.pagination || {};

  const grouped = useMemo(() => {
    const map = {};
    pending.forEach((t) => {
      const id = t.developerId?._id || t.developerId;
      if (!id) return;
      if (!map[id]) {
        map[id] = {
          developerId: id,
          name: t.developerId?.name || 'Developer',
          email: t.developerId?.email || '',
          txns: [],
          total: 0,
        };
      }
      map[id].txns.push(t);
      map[id].total += t.developerShare || 0;
    });
    return Object.values(map);
  }, [pending]);

  const toggle = (id) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      if (tab === 'payouts') {
        await downloadBlob(exportAdminPayoutsExcel(filterParams), 'payouts.xlsx');
      } else if (tab === 'legacy') {
        await downloadBlob(exportAdminSettlementsExcel(filterParams), 'settlements.xlsx');
      } else {
        await downloadBlob(
          exportAdminTransactionsExcel({ ...filterParams, status: 'paid' }),
          'transactions.xlsx'
        );
      }
    } finally {
      setExporting(false);
    }
  };

  if (pendingQuery.isLoading || settlementsQuery.isLoading || payoutsQuery.isLoading) {
    return <Spinner />;
  }
  if (pendingQuery.isError || settlementsQuery.isError || payoutsQuery.isError) {
    return <ErrorBox message="Failed to load settlements / payouts" />;
  }

  return (
    <div>
      <PageHeader
        title="Settlements & Payouts"
        subtitle="Search, date filter, paginate, and export Excel for payouts / settlements / transactions."
        actions={
          <SoftButton variant="primary" onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting…' : 'Export Excel'}
          </SoftButton>
        }
      />

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {[
          ['payouts', 'Payout requests'],
          ['refunds', 'Refunds'],
          ['legacy', 'Legacy settlements'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold ${
              tab === id ? 'bg-brand text-white' : 'bg-card text-muted ring-1 ring-line'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search ID, notes…"
        filters={
          <>
            <FilterSelect value={status} onChange={setStatus}>
              <option value="">All statuses</option>
              {tab === 'payouts' ? (
                <>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="paid">Paid</option>
                </>
              ) : tab === 'legacy' ? (
                <>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </>
              ) : (
                <>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                </>
              )}
            </FilterSelect>
            <DateRangeFilters
              dateFrom={dateFrom}
              dateTo={dateTo}
              onFromChange={setDateFrom}
              onToChange={setDateTo}
            />
          </>
        }
      />

      {refundMsg ? (
        <div className="mb-4 rounded-xl border border-line bg-mist px-4 py-3 text-sm text-brand">
          {refundMsg}
        </div>
      ) : null}

      {tab === 'payouts' ? (
        <div>
          <ReportTable
            emptyText="No payout requests"
            rows={payouts}
            columns={[
              {
                key: 'payoutId',
                label: 'Payout ID',
                render: (p) => <span className="font-semibold">{p.payoutId}</span>,
              },
              {
                key: 'developer',
                label: 'Developer',
                render: (p) => p.developerId?.name || '—',
              },
              {
                key: 'email',
                label: 'Email',
                render: (p) => (
                  <span className="text-muted">{p.developerId?.email || '—'}</span>
                ),
              },
              {
                key: 'amount',
                label: 'Amount',
                align: 'right',
                render: (p) => `₹${Number(p.amount || 0).toLocaleString('en-IN')}`,
              },
              { key: 'method', label: 'Method' },
              {
                key: 'status',
                label: 'Status',
                render: (p) => <StatusPill value={p.status} />,
              },
              {
                key: 'createdAt',
                label: 'Date',
                render: (p) =>
                  p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : '—',
              },
              {
                key: 'actions',
                label: 'Actions',
                align: 'right',
                render: (p) => (
                  <div className="flex flex-wrap justify-end gap-1">
                    {p.status === 'pending' ? (
                      <>
                        <SoftButton
                          onClick={() =>
                            payoutMutation.mutate({ id: p._id, body: { status: 'approved' } })
                          }
                        >
                          Approve
                        </SoftButton>
                        <SoftButton
                          variant="danger"
                          onClick={() =>
                            payoutMutation.mutate({ id: p._id, body: { status: 'rejected' } })
                          }
                        >
                          Reject
                        </SoftButton>
                      </>
                    ) : null}
                    {['pending', 'approved'].includes(p.status) ? (
                      <SoftButton
                        variant="primary"
                        onClick={() =>
                          payoutMutation.mutate({ id: p._id, body: { status: 'paid' } })
                        }
                      >
                        Mark paid
                      </SoftButton>
                    ) : null}
                  </div>
                ),
              },
            ]}
          />
          <Pagination
            page={payoutsQuery.data?.pagination?.page || payoutPage}
            totalPages={payoutsQuery.data?.pagination?.totalPages || 1}
            total={payoutsQuery.data?.pagination?.total}
            onChange={setPayoutPage}
          />
        </div>
      ) : tab === 'refunds' ? (
        <div>
          <ReportTable
            emptyText="No paid transactions"
            rows={paidTxnsQuery.data?.data || []}
            columns={[
              {
                key: 'transactionId',
                label: 'Txn ID',
                render: (t) => <span className="font-semibold">{t.transactionId}</span>,
              },
              {
                key: 'amount',
                label: 'Paid',
                align: 'right',
                render: (t) => `₹${Number(t.amount || 0).toLocaleString('en-IN')}`,
              },
              {
                key: 'refundAmount',
                label: 'Refunded',
                align: 'right',
                render: (t) => `₹${Number(t.refundAmount || 0).toLocaleString('en-IN')}`,
              },
              {
                key: 'couponCode',
                label: 'Coupon',
                render: (t) => t.couponCode || '—',
              },
              {
                key: 'status',
                label: 'Status',
                render: (t) => <StatusPill value={t.status} />,
              },
              {
                key: 'actions',
                label: 'Action',
                align: 'right',
                render: (t) => (
                  <SoftButton
                    variant="danger"
                    disabled={refundMutation.isPending || t.status === 'refunded'}
                    onClick={() => {
                      const amt = window.prompt(
                        'Refund amount (blank = full remaining)',
                        String((t.amount || 0) - (t.refundAmount || 0))
                      );
                      if (amt === null) return;
                      const reason = window.prompt('Reason', 'Client requested refund') || '';
                      refundMutation.mutate({
                        id: t._id,
                        amount: amt === '' ? undefined : Number(amt),
                        reason,
                      });
                    }}
                  >
                    Refund
                  </SoftButton>
                ),
              },
            ]}
          />
          <Pagination
            page={txnPag.page || txnPage}
            totalPages={txnPag.totalPages || 1}
            total={txnPag.total}
            onChange={setTxnPage}
          />
        </div>
      ) : (
        <>
          <div className="mb-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-brand">Pending developer share</h2>
            {grouped.length === 0 && <EmptyState text="No pending settlements" />}
            {grouped.map((g) => (
              <EntityCard key={g.developerId}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="font-semibold text-brand">
                      {g.name} · {g.email}
                    </div>
                    <div className="mt-1 text-sm text-muted">
                      {g.txns.length} txn(s) · ₹{g.total.toLocaleString('en-IN')}
                    </div>
                    <div className="mt-3 space-y-1">
                      {g.txns.map((t) => (
                        <label key={t._id} className="flex items-center gap-2 text-xs text-muted">
                          <input
                            type="checkbox"
                            checked={selected.includes(t._id)}
                            onChange={() => toggle(t._id)}
                          />
                          {t.transactionId} · ₹{(t.developerShare || 0).toLocaleString('en-IN')}
                        </label>
                      ))}
                    </div>
                  </div>
                  <SoftButton
                    variant="primary"
                    disabled={createMutation.isPending}
                    onClick={() => {
                      const ids = g.txns.map((t) => t._id).filter((id) => selected.includes(id));
                      if (ids.length === 0) return;
                      createMutation.mutate({ developerId: g.developerId, transactionIds: ids });
                    }}
                  >
                    Create settlement
                  </SoftButton>
                </div>
              </EntityCard>
            ))}
          </div>

          <h2 className="mb-3 font-display text-lg font-semibold text-brand">Settlement history</h2>
          <ReportTable
            emptyText="No settlements yet"
            rows={settlements}
            columns={[
              {
                key: 'settlementId',
                label: 'Settlement ID',
                render: (s) => <span className="font-semibold">{s.settlementId}</span>,
              },
              {
                key: 'developer',
                label: 'Developer',
                render: (s) => s.developerId?.name || '—',
              },
              {
                key: 'amount',
                label: 'Amount',
                align: 'right',
                render: (s) => `₹${Number(s.amount || 0).toLocaleString('en-IN')}`,
              },
              {
                key: 'status',
                label: 'Status',
                render: (s) => <StatusPill value={s.status} />,
              },
              {
                key: 'createdAt',
                label: 'Date',
                render: (s) =>
                  s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN') : '—',
              },
              {
                key: 'actions',
                label: 'Actions',
                align: 'right',
                render: (s) =>
                  s.status !== 'paid' ? (
                    <SoftButton
                      variant="primary"
                      onClick={() => updateMutation.mutate({ id: s._id, body: { status: 'paid' } })}
                    >
                      Mark paid
                    </SoftButton>
                  ) : (
                    '—'
                  ),
              },
            ]}
          />
          <Pagination
            page={settlePag.page || settlePage}
            totalPages={settlePag.totalPages || 1}
            total={settlePag.total}
            onChange={setSettlePage}
          />
        </>
      )}
    </div>
  );
}
