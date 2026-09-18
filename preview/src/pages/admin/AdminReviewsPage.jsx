import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminReviews, moderateAdminReview } from '../../services/api';
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

export default function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    setPage(1);
  }, [status, debouncedSearch]);

  const params = useMemo(
    () => ({
      page,
      limit: 10,
      ...(status ? { status } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }),
    [page, status, debouncedSearch]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'reviews', params],
    queryFn: async () => (await getAdminReviews(params)).data,
    placeholderData: (prev) => prev,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status: next }) => moderateAdminReview(id, { status: next }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] }),
  });

  const rows = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1 };

  if (isLoading && !data) return <Spinner label="Loading reviews…" />;
  if (isError) return <ErrorBox message="Failed to load reviews" />;

  return (
    <div>
      <PageHeader
        title="Reviews"
        subtitle="Approve or hide client ratings. Approved reviews update project averages on the public catalog."
      />

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search comment…"
        filters={
          <FilterSelect value={status} onChange={setStatus}>
            <option value="">All</option>
            <option value="pending">pending</option>
            <option value="approved">approved</option>
            <option value="hidden">hidden</option>
          </FilterSelect>
        }
      />

      <ReportTable
        emptyText="No reviews"
        rows={rows}
        columns={[
          {
            key: 'project',
            label: 'Project',
            render: (r) => (
              <span className="font-semibold">{r.projectId?.title || 'Project'}</span>
            ),
          },
          {
            key: 'rating',
            label: 'Rating',
            render: (r) => `${r.rating}/5`,
          },
          {
            key: 'comment',
            label: 'Comment',
            render: (r) => (
              <span className="line-clamp-2 max-w-sm text-muted" title={r.comment || ''}>
                {r.comment || '—'}
              </span>
            ),
          },
          {
            key: 'client',
            label: 'Client',
            render: (r) => r.clientId?.name || r.clientId?.email || 'Client',
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
              r.createdAt ? new Date(r.createdAt).toLocaleString('en-IN') : '—',
          },
          {
            key: 'actions',
            label: 'Actions',
            align: 'right',
            render: (r) => (
              <div className="flex flex-wrap justify-end gap-1">
                {r.status !== 'approved' ? (
                  <SoftButton
                    variant="primary"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ id: r._id, status: 'approved' })}
                  >
                    Approve
                  </SoftButton>
                ) : null}
                {r.status !== 'hidden' ? (
                  <SoftButton
                    variant="danger"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ id: r._id, status: 'hidden' })}
                  >
                    Hide
                  </SoftButton>
                ) : null}
                {r.status === 'hidden' ? (
                  <SoftButton
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ id: r._id, status: 'pending' })}
                  >
                    Reopen
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
    </div>
  );
}
