import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  downloadBlob,
  downloadAdminInvoicePdf,
  exportAdminInvoicesExcel,
  getAdminInvoices,
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

/** Admin + Super Admin invoice list — Excel-style table. */
export default function AdminInvoicesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
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
    queryKey: ['admin', 'invoices', params],
    queryFn: async () => (await getAdminInvoices(params)).data,
    placeholderData: (prev) => prev,
  });

  const rows = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const handleExport = async () => {
    setExporting(true);
    setExportError('');
    try {
      const { page: _p, limit: _l, ...exportParams } = params;
      await downloadBlob(exportAdminInvoicesExcel(exportParams), 'invoices.xlsx');
    } catch (e) {
      setExportError(e?.response?.data?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    {
      key: 'invoiceId',
      label: 'Invoice ID',
      render: (r) => <span className="font-semibold">{r.invoiceId}</span>,
    },
    {
      key: 'title',
      label: 'Title',
      render: (r) => <span className="line-clamp-1 max-w-[220px]" title={r.title}>{r.title}</span>,
    },
    { key: 'clientName', label: 'Client' },
    {
      key: 'clientEmail',
      label: 'Email',
      render: (r) => <span className="text-muted">{r.clientEmail}</span>,
    },
    {
      key: 'total',
      label: 'Amount',
      align: 'right',
      render: (r) => inr(r.total),
    },
    {
      key: 'tax',
      label: 'Tax',
      render: (r) =>
        Number(r.cgst) > 0 || Number(r.sgst) > 0
          ? 'CGST+SGST'
          : Number(r.igst) > 0
            ? 'IGST'
            : '—',
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
          onClick={() => downloadBlob(downloadAdminInvoicePdf(r._id), `${r.invoiceId}.pdf`)}
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
        subtitle="Spreadsheet-style list — search, filter, page numbers, Excel export."
        actions={
          <SoftButton variant="primary" onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting…' : 'Export Excel'}
          </SoftButton>
        }
      />

      {exportError ? (
        <div className="mb-4">
          <ErrorBox message={exportError} />
        </div>
      ) : null}

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search invoice ID, client, title…"
        filters={
          <>
            <FilterSelect value={status} onChange={setStatus}>
              <option value="">All statuses</option>
              <option value="issued">Issued</option>
              <option value="paid">Paid</option>
              <option value="void">Void</option>
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
            {isFetching && !isLoading ? 'Updating…' : null}
          </span>
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
