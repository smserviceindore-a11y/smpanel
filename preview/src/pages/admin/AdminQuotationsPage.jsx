import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAdminQuotation,
  downloadAdminQuotationPdf,
  downloadBlob,
  exportAdminQuotationsExcel,
  getAdminDevelopers,
  getAdminQuotations,
  markAdminQuotationDelivered,
  sendAdminQuotation,
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

const emptyForm = {
  title: '',
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  clientCompany: '',
  description: 'Customization / implementation',
  unitAmount: '',
  taxPercent: 18,
  developerId: '',
  leadType: 'manual',
  notes: '',
  sendToClient: true,
  splitParts: '1',
};

export default function AdminQuotationsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [exporting, setExporting] = useState(false);
  const debouncedSearch = useDebounce(search, 400);
  const queryClient = useQueryClient();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, dateFrom, dateTo]);

  const params = useMemo(
    () => ({
      page,
      limit: 10,
      ...(status ? { status } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
    }),
    [page, status, debouncedSearch, dateFrom, dateTo]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'quotations', params],
    queryFn: async () => (await getAdminQuotations(params)).data,
    placeholderData: (prev) => prev,
  });

  const developersQuery = useQuery({
    queryKey: ['admin', 'developers', 'mini'],
    queryFn: async () => (await getAdminDevelopers({ limit: 50, verificationStatus: 'verified' })).data,
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: createAdminQuotation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'quotations'] });
      setForm(emptyForm);
      setFormError('');
    },
    onError: (err) => setFormError(err?.response?.data?.message || 'Create failed'),
  });

  const sendMutation = useMutation({
    mutationFn: (id) => sendAdminQuotation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'quotations'] }),
  });

  const deliverMutation = useMutation({
    mutationFn: (id) => markAdminQuotationDelivered(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'quotations'] }),
  });

  const rows = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1 };
  const developers = developersQuery.data?.data || [];

  const onCreate = (e) => {
    e.preventDefault();
    const amount = Number(form.unitAmount);
    if (!form.title || !form.clientName || !form.clientEmail || !amount) {
      setFormError('Title, client name, email and amount are required');
      return;
    }
    createMutation.mutate({
      title: form.title,
      clientName: form.clientName,
      clientEmail: form.clientEmail,
      clientPhone: form.clientPhone,
      clientCompany: form.clientCompany,
      developerId: form.developerId || undefined,
      leadType: form.leadType || 'manual',
      taxPercent: Number(form.taxPercent) || 18,
      notes: form.notes,
      sendToClient: !!form.sendToClient,
      items: [
        {
          description: form.description || 'Service',
          quantity: 1,
          unitAmount: amount,
        },
      ],
      ...(Number(form.splitParts) > 1
        ? (() => {
            const parts = Math.min(4, Math.max(2, Number(form.splitParts) || 2));
            const tax = Math.round((amount * (Number(form.taxPercent) || 0)) / 100);
            const total = amount + tax;
            const base = Math.floor(total / parts);
            const milestones = Array.from({ length: parts }, (_, i) => ({
              label: `Part ${i + 1}`,
              amount: i === parts - 1 ? total - base * (parts - 1) : base,
            }));
            return { milestones };
          })()
        : {}),
    });
  };

  return (
    <div>
      <PageHeader
        title="Quotations"
        subtitle="Build quotations, send to clients, track payment. Search, date filter, Excel export."
        actions={
          <SoftButton
            variant="primary"
            disabled={exporting}
            onClick={async () => {
              setExporting(true);
              try {
                const { page: _p, limit: _l, ...ep } = params;
                await downloadBlob(exportAdminQuotationsExcel(ep), 'quotations.xlsx');
              } finally {
                setExporting(false);
              }
            }}
          >
            {exporting ? 'Exporting…' : 'Export Excel'}
          </SoftButton>
        }
      />

      <EntityCard className="mb-5">
        <div className="mb-3 text-sm font-semibold text-brand">New quotation</div>
        {formError ? (
          <div className="mb-3">
            <ErrorBox message={formError} />
          </div>
        ) : null}
        <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-2">
          <input
            className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm"
            placeholder="Title *"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <input
            className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm"
            placeholder="Amount (INR) *"
            type="number"
            min="0"
            value={form.unitAmount}
            onChange={(e) => setForm((f) => ({ ...f, unitAmount: e.target.value }))}
          />
          <select
            className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm"
            value={form.leadType}
            onChange={(e) => setForm((f) => ({ ...f, leadType: e.target.value }))}
          >
            <option value="manual">Lead type: manual</option>
            <option value="customization">customization</option>
            <option value="requirement">requirement</option>
            <option value="buy_now">buy_now</option>
          </select>
          <input
            className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm"
            placeholder="Client name *"
            value={form.clientName}
            onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
          />
          <input
            className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm"
            placeholder="Client email *"
            type="email"
            value={form.clientEmail}
            onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))}
          />
          <input
            className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm"
            placeholder="Phone"
            value={form.clientPhone}
            onChange={(e) => setForm((f) => ({ ...f, clientPhone: e.target.value }))}
          />
          <input
            className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm"
            placeholder="Company"
            value={form.clientCompany}
            onChange={(e) => setForm((f) => ({ ...f, clientCompany: e.target.value }))}
          />
          <input
            className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm sm:col-span-2"
            placeholder="Line item description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <select
            className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm"
            value={form.splitParts}
            onChange={(e) => setForm((f) => ({ ...f, splitParts: e.target.value }))}
          >
            <option value="1">Full payment (1 part)</option>
            <option value="2">Split into 2 parts</option>
            <option value="3">Split into 3 parts</option>
            <option value="4">Split into 4 parts</option>
          </select>
          <select
            className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm"
            value={form.developerId}
            onChange={(e) => setForm((f) => ({ ...f, developerId: e.target.value }))}
          >
            <option value="">No developer (company delivery)</option>
            {developers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} · {d.email}
              </option>
            ))}
          </select>
          <input
            className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm"
            placeholder="Tax %"
            type="number"
            value={form.taxPercent}
            onChange={(e) => setForm((f) => ({ ...f, taxPercent: e.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm text-brand sm:col-span-2">
            <input
              type="checkbox"
              checked={form.sendToClient}
              onChange={(e) => setForm((f) => ({ ...f, sendToClient: e.target.checked }))}
            />
            Send to client immediately
          </label>
          <div className="sm:col-span-2">
            <SoftButton type="submit" variant="primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating…' : 'Create quotation'}
            </SoftButton>
          </div>
        </form>
      </EntityCard>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search QT id, client…"
        filters={
          <>
            <FilterSelect value={status} onChange={setStatus}>
              <option value="">All statuses</option>
              {['draft', 'sent', 'accepted', 'rejected', 'partially_paid', 'paid'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </FilterSelect>
            <DateRangeFilters
              dateFrom={dateFrom}
              dateTo={dateTo}
              onFromChange={setDateFrom}
              onToChange={setDateTo}
            />
          </>
        }
        actions={
          <span className="text-xs text-muted">
            {pagination.total ?? 0} result{(pagination.total ?? 0) === 1 ? '' : 's'}
          </span>
        }
      />

      {isLoading && <Spinner />}
      {isError && <ErrorBox message="Failed to load quotations" />}

      {!isLoading && !isError && (
        <>
          <ReportTable
            emptyText="No quotations match these filters"
            rows={rows}
            columns={[
              {
                key: 'quotationId',
                label: 'Quote ID',
                render: (q) => <span className="font-semibold">{q.quotationId}</span>,
              },
              {
                key: 'title',
                label: 'Title',
                render: (q) => (
                  <span className="line-clamp-1 max-w-[200px]" title={q.title}>
                    {q.title}
                  </span>
                ),
              },
              { key: 'clientName', label: 'Client' },
              {
                key: 'clientEmail',
                label: 'Email',
                render: (q) => <span className="text-muted">{q.clientEmail}</span>,
              },
              {
                key: 'total',
                label: 'Amount',
                align: 'right',
                render: (q) => `₹${Number(q.total || 0).toLocaleString('en-IN')}`,
              },
              {
                key: 'status',
                label: 'Status',
                render: (q) => <StatusPill value={q.status} />,
              },
              {
                key: 'createdAt',
                label: 'Date',
                render: (q) =>
                  q.createdAt ? new Date(q.createdAt).toLocaleDateString('en-IN') : '—',
              },
              {
                key: 'actions',
                label: 'Actions',
                align: 'right',
                render: (q) => (
                  <div className="flex flex-wrap justify-end gap-1">
                    <SoftButton
                      onClick={() =>
                        downloadBlob(downloadAdminQuotationPdf(q._id), `${q.quotationId}.pdf`)
                      }
                    >
                      PDF
                    </SoftButton>
                    {q.status === 'draft' ? (
                      <SoftButton variant="primary" onClick={() => sendMutation.mutate(q._id)}>
                        Send
                      </SoftButton>
                    ) : null}
                    {['paid', 'partially_paid'].includes(q.status) && !q.deliveredAt ? (
                      <SoftButton
                        variant="primary"
                        onClick={() => deliverMutation.mutate(q._id)}
                      >
                        Deliver
                      </SoftButton>
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
