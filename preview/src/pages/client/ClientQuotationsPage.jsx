import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  confirmClientPayment,
  downloadBlob,
  downloadClientQuotationPdf,
  getClientQuotations,
  payClientQuotation,
  respondClientQuotation,
} from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import ListToolbar, { FilterSelect } from '../../components/dashboard/ListToolbar';
import ReportTable from '../../components/dashboard/ReportTable';
import {
  ErrorBox,
  PageHeader,
  SoftButton,
  StatusPill,
} from '../../components/dashboard/DashboardUI';

export default function ClientQuotationsPage() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState('');
  const [msg, setMsg] = useState('');
  const [coupons, setCoupons] = useState({});
  const debouncedSearch = useDebounce(search, 400);
  const queryClient = useQueryClient();

  useEffect(() => {
    setPage(1);
  }, [status, debouncedSearch]);

  const params = useMemo(
    () => ({
      page,
      limit: 10,
      ...(status ? { status } : {}),
    }),
    [page, status]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ['client', 'quotations', params],
    queryFn: async () => (await getClientQuotations(params)).data,
    placeholderData: (prev) => prev,
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, action }) => respondClientQuotation(id, { action }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client', 'quotations'] }),
  });

  const rows = (data?.data || []).filter((q) =>
    debouncedSearch
      ? `${q.quotationId} ${q.title}`.toLowerCase().includes(debouncedSearch.toLowerCase())
      : true
  );
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const pay = async (id, { demoPay = false, couponCode = '' } = {}) => {
    setBusyId(id);
    setMsg('');
    try {
      const body = {
        ...(demoPay ? { demoPay: true } : {}),
        ...(couponCode ? { couponCode: couponCode.trim().toUpperCase() } : {}),
      };
      const orderRes = await payClientQuotation(id, body);
      const { transaction, payment } = orderRes.data.data;

      if (payment.mode === 'mock') {
        await confirmClientPayment({
          transactionId: transaction.transactionId,
          mockConfirm: true,
        });
        setMsg(
          payment.discount
            ? `Demo payment successful. Saved ₹${payment.discount}. Invoice generated.`
            : 'Demo payment successful. Invoice generated.'
        );
      } else {
        if (!window.Razorpay) {
          await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://checkout.razorpay.com/v1/checkout.js';
            s.onload = resolve;
            s.onerror = () => reject(new Error('Could not load Razorpay checkout'));
            document.body.appendChild(s);
          });
        }
        await new Promise((resolve, reject) => {
          let settled = false;
          // When order_id is set, omit amount — Razorpay uses the server order amount.
          const rzp = new window.Razorpay({
            key: payment.keyId,
            currency: payment.currency || 'INR',
            order_id: payment.orderId,
            name: 'SM Global Hub',
            description: 'Quotation payment',
            handler: async (response) => {
              try {
                await confirmClientPayment({
                  transactionId: transaction.transactionId,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature,
                });
                settled = true;
                resolve();
              } catch (e) {
                settled = true;
                reject(e);
              }
            },
            modal: {
              ondismiss: () => {
                if (!settled) reject(new Error('Payment cancelled'));
              },
            },
          });
          rzp.on('payment.failed', (resp) => {
            settled = true;
            reject(new Error(resp?.error?.description || 'Payment failed'));
          });
          rzp.open();
        });
        setMsg('Payment successful. Invoice generated.');
      }

      queryClient.invalidateQueries({ queryKey: ['client', 'quotations'] });
      queryClient.invalidateQueries({ queryKey: ['client', 'invoices'] });
    } catch (err) {
      setMsg(err?.response?.data?.message || err?.message || 'Payment failed');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div>
      <PageHeader
        title="Quotations & Payments"
        subtitle="Coupons apply to Buy Now purchases only. After pay, delivery link appears when the project has one."
      />

      {msg ? (
        <div className="mb-4 rounded-xl border border-line bg-mist px-4 py-3 text-sm text-brand">{msg}</div>
      ) : null}

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter locally…"
        filters={
          <FilterSelect value={status} onChange={setStatus}>
            <option value="">All</option>
            {['sent', 'accepted', 'rejected', 'partially_paid', 'paid'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </FilterSelect>
        }
      />

      {isLoading && <Spinner />}
      {isError && <ErrorBox message="Failed to load quotations" />}

      {!isLoading && !isError && (
        <>
          <ReportTable
            emptyText="No quotations yet"
            rows={rows}
            columns={[
              {
                key: 'quotationId',
                label: 'Quotation',
                render: (q) => (
                  <div>
                    <div className="font-semibold">{q.quotationId}</div>
                    <div className="line-clamp-1 max-w-[180px] text-xs text-muted" title={q.title}>
                      {q.title}
                    </div>
                  </div>
                ),
              },
              {
                key: 'amount',
                label: 'Amount',
                align: 'right',
                render: (q) => (
                  <div>
                    <div>₹{Number(q.total || 0).toLocaleString('en-IN')}</div>
                    {q.paidAmount ? (
                      <div className="text-xs text-muted">
                        Paid ₹{Number(q.paidAmount).toLocaleString('en-IN')}
                      </div>
                    ) : null}
                  </div>
                ),
              },
              {
                key: 'leadType',
                label: 'Type',
                render: (q) => q.leadType || '—',
              },
              {
                key: 'status',
                label: 'Status',
                render: (q) => <StatusPill value={q.status} />,
              },
              {
                key: 'delivery',
                label: 'Delivery',
                render: (q) => {
                  if (q.status !== 'paid' || q.leadType !== 'buy_now') return '—';
                  const p = q.projectId;
                  if (!p?.deliveryAccessUrl && !p?.deliveryZipUrl && !p?.deliveryLicenseKey) {
                    return (
                      <span className="text-xs text-muted">
                        Team will contact you
                        {q.notes ? ` · ${q.notes}` : ''}
                      </span>
                    );
                  }
                  return (
                    <div className="space-y-0.5 text-xs">
                      {p.deliveryAccessUrl ? (
                        <a
                          href={p.deliveryAccessUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block font-medium text-accent underline"
                        >
                          Open link
                        </a>
                      ) : null}
                      {p.deliveryZipUrl ? (
                        <a
                          href={p.deliveryZipUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block font-medium text-accent underline"
                        >
                          Download zip
                        </a>
                      ) : null}
                      {p.deliveryLicenseKey ? (
                        <code className="rounded bg-sand px-1 text-[10px]">
                          {p.deliveryLicenseKey}
                        </code>
                      ) : null}
                    </div>
                  );
                },
              },
              {
                key: 'actions',
                label: 'Actions',
                align: 'right',
                render: (q) => (
                  <div className="flex max-w-xs flex-wrap justify-end gap-1">
                    <SoftButton
                      onClick={() =>
                        downloadBlob(downloadClientQuotationPdf(q._id), `${q.quotationId}.pdf`)
                      }
                    >
                      PDF
                    </SoftButton>
                    {q.status === 'sent' ? (
                      <>
                        <SoftButton
                          variant="primary"
                          onClick={() => respondMutation.mutate({ id: q._id, action: 'accept' })}
                        >
                          Accept
                        </SoftButton>
                        <SoftButton
                          variant="danger"
                          onClick={() => respondMutation.mutate({ id: q._id, action: 'reject' })}
                        >
                          Reject
                        </SoftButton>
                      </>
                    ) : null}
                    {['sent', 'accepted', 'partially_paid'].includes(q.status) ? (
                      <>
                        {q.leadType === 'buy_now' ? (
                          <input
                            className="w-24 rounded-xl border border-line bg-sand px-2 py-1.5 text-xs uppercase"
                            placeholder="COUPON"
                            title="Platform coupons work on company listings; seller coupons only on that developer’s products"
                            value={coupons[q._id] || ''}
                            onChange={(e) =>
                              setCoupons((c) => ({
                                ...c,
                                [q._id]: e.target.value.toUpperCase(),
                              }))
                            }
                          />
                        ) : null}
                        <SoftButton
                          variant="primary"
                          disabled={busyId === q._id}
                          onClick={() =>
                            pay(q._id, {
                              demoPay: true,
                              couponCode: q.leadType === 'buy_now' ? coupons[q._id] || '' : '',
                            })
                          }
                        >
                          {busyId === q._id
                            ? '…'
                            : q.status === 'partially_paid'
                              ? 'Demo next'
                              : 'Demo Pay'}
                        </SoftButton>
                        <SoftButton
                          disabled={busyId === q._id}
                          onClick={() =>
                            pay(q._id, {
                              couponCode: q.leadType === 'buy_now' ? coupons[q._id] || '' : '',
                            })
                          }
                        >
                          {q.status === 'partially_paid' ? 'Pay next' : 'Razorpay'}
                        </SoftButton>
                      </>
                    ) : null}
                  </div>
                ),
              },
            ]}
          />
          <Pagination
            page={pagination.page || page}
            totalPages={pagination.totalPages || 1}
            total={pagination.total}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}
