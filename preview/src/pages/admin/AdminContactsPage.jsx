import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminContacts, updateAdminContactStatus } from '../../services/api';
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

const STATUSES = ['new', 'read', 'replied', 'archived'];
const PAGE_SIZE = 10;

export default function AdminContactsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const listParams = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(status ? { status } : {}),
    }),
    [page, debouncedSearch, status]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'contacts', listParams],
    queryFn: async () => (await getAdminContacts(listParams)).data,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status: next }) => updateAdminContactStatus(id, { status: next }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'contacts'] }),
  });

  const rows = data?.data || [];
  const pagination = data?.pagination || {};

  if (isLoading && !data) return <Spinner label="Loading inbox..." />;
  if (isError) return <ErrorBox message="Failed to load contact messages" />;

  return (
    <div>
      <PageHeader
        title="Contact inbox"
        subtitle="Messages from the public Contact form. Mark read / replied / archived as you follow up."
      />

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, email, subject…"
        filters={
          <FilterSelect value={status} onChange={setStatus}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </FilterSelect>
        }
      />

      <ReportTable
        emptyText="No contact messages"
        rows={rows}
        columns={[
          {
            key: 'subject',
            label: 'Subject',
            render: (m) => <span className="font-semibold">{m.subject || '(No subject)'}</span>,
          },
          {
            key: 'name',
            label: 'From',
            render: (m) => (
              <div>
                <div>{m.name}</div>
                <div className="text-xs text-muted">{m.email}</div>
              </div>
            ),
          },
          {
            key: 'phone',
            label: 'Phone',
            render: (m) => m.phone || '—',
          },
          {
            key: 'message',
            label: 'Message',
            render: (m) => (
              <span className="line-clamp-2 max-w-xs text-muted" title={m.message}>
                {m.message}
              </span>
            ),
          },
          {
            key: 'status',
            label: 'Status',
            render: (m) => <StatusPill value={m.status} />,
          },
          {
            key: 'createdAt',
            label: 'Date',
            render: (m) =>
              m.createdAt ? new Date(m.createdAt).toLocaleString('en-IN') : '—',
          },
          {
            key: 'actions',
            label: 'Actions',
            align: 'right',
            render: (m) => (
              <div className="flex flex-wrap justify-end gap-1">
                {STATUSES.filter((s) => s !== m.status).map((s) => (
                  <SoftButton
                    key={s}
                    type="button"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ id: m._id, status: s })}
                  >
                    {s}
                  </SoftButton>
                ))}
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
    </div>
  );
}
