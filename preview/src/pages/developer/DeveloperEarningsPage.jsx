import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createDeveloperPayout,
  getDeveloperEarnings,
  getDeveloperPayouts,
  getDeveloperWallet,
} from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import ReportTable from '../../components/dashboard/ReportTable';
import {
  EmptyState,
  EntityCard,
  ErrorBox,
  PageHeader,
  Panel,
  SoftButton,
  StatCard,
  StatusPill,
} from '../../components/dashboard/DashboardUI';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function DeveloperEarningsPage() {
  const queryClient = useQueryClient();
  const [msg, setMsg] = useState('');
  const [payoutPage, setPayoutPage] = useState(1);
  const [txnPage, setTxnPage] = useState(1);
  const [form, setForm] = useState({
    amount: '',
    method: 'upi',
    upiId: '',
    accountName: '',
    accountNumber: '',
    ifsc: '',
    paypalEmail: '',
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['developer', 'earnings', txnPage],
    queryFn: async () => (await getDeveloperEarnings({ page: txnPage, limit: 10 })).data.data,
  });

  const walletQuery = useQuery({
    queryKey: ['developer', 'wallet'],
    queryFn: async () => (await getDeveloperWallet()).data.data,
  });

  const payoutsQuery = useQuery({
    queryKey: ['developer', 'payouts', payoutPage],
    queryFn: async () => (await getDeveloperPayouts({ page: payoutPage, limit: 10 })).data,
  });

  const payoutMutation = useMutation({
    mutationFn: createDeveloperPayout,
    onSuccess: (res) => {
      const w = res?.data?.data?.wallet;
      setMsg(
        w
          ? `Payout submitted. Available now ₹${Number(w.availableBalance || 0).toLocaleString('en-IN')} (₹${Number(w.reservedBalance || 0).toLocaleString('en-IN')} reserved for withdrawal).`
          : 'Payout request submitted — amount reserved from available.'
      );
      setForm((f) => ({ ...f, amount: '' }));
      queryClient.invalidateQueries({ queryKey: ['developer'] });
    },
    onError: (err) => setMsg(err?.response?.data?.message || 'Payout failed'),
  });

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorBox message="Failed to load earnings" />;

  const s = data.summary;
  const settlements = data.recentSettlements || [];
  const txns = data.recentTransactions || [];
  const txnPag = data.transactionsPagination || {};
  const wallet = walletQuery.data?.wallet || {};
  const byProject = walletQuery.data?.byProject || [];
  const payouts = payoutsQuery.data?.data || [];
  const payoutPag = payoutsQuery.data?.pagination || {};

  const available = Number(s.availableBalance || wallet.availableBalance || 0);
  const onHold = Number(s.holdBalance || wallet.holdBalance || 0);
  const reserved = Number(s.reservedBalance || wallet.reservedBalance || 0);
  const pendingPayouts = payouts.filter((p) => p.status === 'pending' || p.status === 'approved');
  const pendingPayoutTotal = pendingPayouts.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const submitPayout = () => {
    const amount = Number(form.amount);
    const details =
      form.method === 'upi'
        ? { upiId: form.upiId }
        : form.method === 'paypal'
          ? { paypalEmail: form.paypalEmail }
          : {
              accountName: form.accountName,
              accountNumber: form.accountNumber,
              ifsc: form.ifsc,
            };
    payoutMutation.mutate({ amount, method: form.method, details });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Wallet & Payouts"
        subtitle={`Your share only. Hold lasts ~${
          s.refundHoldDays ?? 14
        } days after payment. Requesting payout immediately reserves money from Available.`}
      />

      <div className="rounded-2xl border border-line bg-mist px-4 py-3 text-sm text-brand">
        <div className="font-semibold">Wallet status</div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
          <li>
            <span className="font-medium text-brand">Available</span> — withdrawable now (₹
            {available.toLocaleString('en-IN')})
          </li>
          <li>
            <span className="font-medium text-brand">Reserved for payout</span> — requested /
            approved, waiting admin mark paid (₹{reserved.toLocaleString('en-IN')})
          </li>
          <li>
            <span className="font-medium text-brand">On hold</span> — refund window (₹
            {onHold.toLocaleString('en-IN')})
          </li>
          <li>
            <span className="font-medium text-brand">Open requests</span> —{' '}
            {pendingPayouts.length === 0
              ? 'none on this page'
              : `${pendingPayouts.length} on this page · ₹${pendingPayoutTotal.toLocaleString('en-IN')}`}
          </li>
        </ul>
      </div>

      {msg ? (
        <div className="rounded-xl border border-line bg-mist px-4 py-3 text-sm text-brand">{msg}</div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Available (withdrawable)" value={`₹${available.toLocaleString('en-IN')}`} />
        <StatCard
          label="Reserved for payout"
          value={`₹${reserved.toLocaleString('en-IN')}`}
          tone="sand"
        />
        <StatCard label="On hold" value={`₹${onHold.toLocaleString('en-IN')}`} tone="navy" />
        <StatCard
          label="Your share (paid orders)"
          value={`₹${(s.developerShare || 0).toLocaleString('en-IN')}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Request payout">
          <div className="space-y-3">
            <input
              type="number"
              min="1"
              placeholder="Amount (₹)"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="w-full rounded-xl border border-line bg-sand px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <select
              value={form.method}
              onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
              className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
            >
              <option value="upi">UPI</option>
              <option value="bank">Bank</option>
              <option value="paypal">PayPal</option>
            </select>
            {form.method === 'upi' && (
              <input
                placeholder="UPI ID"
                value={form.upiId}
                onChange={(e) => setForm((f) => ({ ...f, upiId: e.target.value }))}
                className="w-full rounded-xl border border-line bg-sand px-3 py-2 text-sm outline-none focus:border-accent"
              />
            )}
            {form.method === 'paypal' && (
              <input
                placeholder="PayPal email"
                value={form.paypalEmail}
                onChange={(e) => setForm((f) => ({ ...f, paypalEmail: e.target.value }))}
                className="w-full rounded-xl border border-line bg-sand px-3 py-2 text-sm outline-none focus:border-accent"
              />
            )}
            {form.method === 'bank' && (
              <>
                <input
                  placeholder="Account name"
                  value={form.accountName}
                  onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
                  className="w-full rounded-xl border border-line bg-sand px-3 py-2 text-sm outline-none focus:border-accent"
                />
                <input
                  placeholder="Account number"
                  value={form.accountNumber}
                  onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
                  className="w-full rounded-xl border border-line bg-sand px-3 py-2 text-sm outline-none focus:border-accent"
                />
                <input
                  placeholder="IFSC"
                  value={form.ifsc}
                  onChange={(e) => setForm((f) => ({ ...f, ifsc: e.target.value }))}
                  className="w-full rounded-xl border border-line bg-sand px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </>
            )}
            <SoftButton variant="primary" disabled={payoutMutation.isPending} onClick={submitPayout}>
              {payoutMutation.isPending ? 'Submitting…' : 'Request payout'}
            </SoftButton>
          </div>
        </Panel>

        <Panel title="Per-project earnings">
          {byProject.length === 0 && <EmptyState text="No wallet credits yet" />}
          {byProject.map((p) => (
            <EntityCard key={String(p.projectId || p.projectTitle)} className="mb-2">
              <div className="text-sm font-semibold text-brand">{p.projectTitle}</div>
              <div className="mt-1 text-xs text-muted">
                Earned ₹{Number(p.totalEarned || 0).toLocaleString('en-IN')} · Hold ₹
                {Number(p.hold || 0).toLocaleString('en-IN')} · Released ₹
                {Number(p.releasedOrPaid || 0).toLocaleString('en-IN')}
              </div>
            </EntityCard>
          ))}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Payout requests">
          <ReportTable
            emptyText="No payout requests"
            rows={payouts}
            columns={[
              {
                key: 'payoutId',
                label: 'Payout ID',
                render: (x) => <span className="font-semibold">{x.payoutId}</span>,
              },
              {
                key: 'amount',
                label: 'Amount',
                align: 'right',
                render: (x) => inr(x.amount),
              },
              { key: 'method', label: 'Method' },
              {
                key: 'status',
                label: 'Status',
                render: (x) => <StatusPill value={x.status} />,
              },
            ]}
          />
          <Pagination
            page={payoutPag.page || payoutPage}
            totalPages={payoutPag.totalPages || 1}
            total={payoutPag.total}
            onChange={setPayoutPage}
          />
        </Panel>
        <Panel title="Recent paid transactions">
          <ReportTable
            emptyText="No paid transactions yet"
            rows={txns}
            columns={[
              {
                key: 'transactionId',
                label: 'Transaction',
                render: (t) => <span className="font-semibold">{t.transactionId}</span>,
              },
              {
                key: 'developerShare',
                label: 'Your share',
                align: 'right',
                render: (t) => inr(t.developerShare),
              },
              {
                key: 'settlementStatus',
                label: 'Settlement',
                render: (t) => <StatusPill value={t.settlementStatus} />,
              },
            ]}
          />
          <Pagination
            page={txnPag.page || txnPage}
            totalPages={txnPag.totalPages || 1}
            total={txnPag.total}
            onChange={setTxnPage}
          />
        </Panel>
      </div>

      {settlements.length > 0 ? (
        <Panel title="Legacy settlements">
          <ReportTable
            emptyText="No settlements"
            rows={settlements}
            columns={[
              {
                key: 'settlementId',
                label: 'Settlement ID',
                render: (x) => <span className="font-semibold">{x.settlementId}</span>,
              },
              {
                key: 'amount',
                label: 'Amount',
                align: 'right',
                render: (x) => inr(x.amount),
              },
              {
                key: 'status',
                label: 'Status',
                render: (x) => <StatusPill value={x.status} />,
              },
            ]}
          />
        </Panel>
      ) : null}
    </div>
  );
}
