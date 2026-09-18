import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuditLogs } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import ListToolbar, { FilterSelect } from '../../components/dashboard/ListToolbar';
import ReportTable from '../../components/dashboard/ReportTable';
import { ErrorBox, PageHeader } from '../../components/dashboard/DashboardUI';

export default function SuperAdminAuditPage() {
  const [action, setAction] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    setPage(1);
  }, [action, debouncedSearch]);

  const params = useMemo(
    () => ({
      page,
      limit: 15,
      ...(action ? { action } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }),
    [page, action, debouncedSearch]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ['super-admin', 'audit', params],
    queryFn: async () => (await getAuditLogs(params)).data,
    placeholderData: (prev) => prev,
  });

  const rows = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1 };

  if (isLoading && !data) return <Spinner label="Loading audit log…" />;
  if (isError) return <ErrorBox message="Failed to load audit logs" />;

  return (
    <div>
      <PageHeader
        title="Audit log"
        subtitle="Read-only trail of settings changes, refunds, curation, reviews, and ticket updates."
      />

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter action / entity…"
        filters={
          <FilterSelect value={action} onChange={setAction}>
            <option value="">All actions</option>
            <option value="settings.billing">settings.billing</option>
            <option value="settings.payments">settings.payments</option>
            <option value="project.curate">project.curate</option>
            <option value="review.moderate">review.moderate</option>
            <option value="ticket.status">ticket.status</option>
            <option value="refund">refund</option>
            <option value="payout.review">payout.review</option>
          </FilterSelect>
        }
      />

      <ReportTable
        emptyText="No audit entries"
        rows={rows}
        columns={[
          {
            key: 'action',
            label: 'Action',
            render: (row) => <span className="font-semibold">{row.action}</span>,
          },
          {
            key: 'entity',
            label: 'Entity',
            render: (row) => (
              <span className="text-muted">
                {row.entityType}
                {row.entityId ? ` · ${row.entityId}` : ''}
              </span>
            ),
          },
          {
            key: 'actor',
            label: 'Actor',
            render: (row) => row.actorId?.email || '—',
          },
          {
            key: 'meta',
            label: 'Meta',
            render: (row) =>
              row.meta ? (
                <span className="line-clamp-1 max-w-xs font-mono text-[11px] text-muted" title={JSON.stringify(row.meta)}>
                  {JSON.stringify(row.meta)}
                </span>
              ) : (
                '—'
              ),
          },
          {
            key: 'createdAt',
            label: 'When',
            render: (row) =>
              row.createdAt ? new Date(row.createdAt).toLocaleString('en-IN') : '—',
          },
          {
            key: 'ip',
            label: 'IP',
            render: (row) => row.ip || '—',
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
