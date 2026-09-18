import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  downloadBlob,
  downloadClientInvoicePdf,
  exportClientInvoicesExcel,
  getClientInvoices,
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
  StatusPill,
} from '../../components/dashboard/DashboardUI';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function ClientInvoicesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

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

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['client', 'invoices', params],
    queryFn: async () => (await getClientInvoices(params)).data,
    placeholderData: (prev) => prev,
  });

  const rows = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const columns = [
    {
      key: 'invoiceId',
      label: 'Invoice ID',
      render: (r) => <span className="font-semibold">{r.invoiceId}</span>,
    },
    {
      key: 'title',
      label: 'Title',
      render: (r) => <span className="line-clamp-1 max-w-[240px]" title={r.title}>{r.title}</span>,
    },
    {
      key: 'total',
      label: 'Amount',
      align: 'right',
      render: (r) => inr(r.total),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusPill value={r.status} />,
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (r) =>
        r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '—',
    },
    {
      key: 'actions',
      label: 'Action',
      align: 'right',
      render: (r) => (
        <SoftButton
          onClick={() => downloadBlob(downloadClientInvoicePdf(r._id), `${r.invoiceId}.pdf`)}
        >
          PDF
        </SoftButton>
      ),
    },
  ];

  if (isLoading && !data) return <Spinner />;
  if (isError) return <ErrorBox message="Failed to load invoices" />;

  return (
    <div>
      <PageHeader
        title="Tax Invoices"
        subtitle="Your invoices in a compact table — filter, page through, export Excel."
        actions={
          <SoftButton
            variant="primary"
            disabled={exporting}
            onClick={async () => {
              setExporting(true);
              try {
                const { page: _p, limit: _l, ...ep } = params;
                await downloadBlob(exportClientInvoicesExcel(ep), 'my-invoices.xlsx');
              } finally {
                setExporting(false);
              }
            }}
          >
            {exporting ? 'Exporting…' : 'Export Excel'}
          </SoftButton>
        }
      />

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search invoice ID or title…"
        filters={
          <>
            <FilterSelect value={status} onChange={setStatus}>
              <option value="">All statuses</option>
              <option value="paid">Paid</option>
              <option value="issued">Issued</option>
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
          <span className="text-xs text-muted">{isFetching && !isLoading ? 'Updating…' : null}</span>
        }
      />

      <ReportTable columns={columns} rows={rows} emptyText="No invoices match these filters" />

      <Pagination
        page={pagination.page || page}
        totalPages={pagination.totalPages || 1}
        total={pagination.total}
        onChange={setPage}
      />
    </div>
  );
}
