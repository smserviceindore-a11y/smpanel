import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminApprovals, reviewAdminApproval } from '../../services/api';
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

export default function AdminApprovalsPage() {
  const [search, setSearch] = useState('');
  const [reviewStatus, setReviewStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [notes, setNotes] = useState({});
  const debouncedSearch = useDebounce(search, 400);
  const queryClient = useQueryClient();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, reviewStatus]);

  const params = useMemo(
    () => ({
      page,
      limit: 10,
      reviewStatus,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }),
    [page, reviewStatus, debouncedSearch]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'approvals', params],
    queryFn: async () => (await getAdminApprovals(params)).data,
    placeholderData: (prev) => prev,
  });

  const mutation = useMutation({
    mutationFn: ({ id, body }) => reviewAdminApproval(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'approvals'] }),
  });

  const rows = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <div>
      <PageHeader
        title="Project Approvals"
        subtitle="Review developer-submitted listings before they go live on the marketplace."
      />

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search title…"
        filters={
          <FilterSelect value={reviewStatus} onChange={setReviewStatus}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </FilterSelect>
        }
      />

      {isLoading && <Spinner />}
      {isError && <ErrorBox message="Failed to load approval queue" />}

      {!isLoading && !isError && (
        <>
          <ReportTable
            emptyText="No projects in this queue"
            rows={rows}
            columns={[
              {
                key: 'title',
                label: 'Title',
                render: (p) => <span className="font-semibold">{p.title}</span>,
              },
              {
                key: 'meta',
                label: 'Details',
                render: (p) => (
                  <span className="text-xs text-muted">
                    {p.industry} · {p.projectType}
                  </span>
                ),
              },
              {
                key: 'developer',
                label: 'Developer',
                render: (p) => (
                  <div>
                    <div>{p.developerId?.name || '—'}</div>
                    <div className="text-xs text-muted">{p.developerId?.email || ''}</div>
                  </div>
                ),
              },
              {
                key: 'status',
                label: 'Status',
                render: (p) => (
                  <div className="flex flex-wrap gap-1">
                    <StatusPill value={p.reviewStatus} />
                    <StatusPill value={p.status} />
                  </div>
                ),
              },
              {
                key: 'notes',
                label: 'Notes',
                render: (p) => (
                  <textarea
                    rows={2}
                    className="w-44 max-w-full rounded-xl border border-line bg-sand px-2 py-1.5 text-xs outline-none focus:border-accent"
                    placeholder="Review notes…"
                    value={notes[p._id] ?? p.reviewNotes ?? ''}
                    onChange={(e) => setNotes((n) => ({ ...n, [p._id]: e.target.value }))}
                  />
                ),
              },
              {
                key: 'actions',
                label: 'Actions',
                align: 'right',
                render: (p) =>
                  reviewStatus === 'pending' ? (
                    <div className="flex flex-wrap justify-end gap-1">
                      <SoftButton
                        variant="primary"
                        onClick={() =>
                          mutation.mutate({
                            id: p._id,
                            body: {
                              decision: 'approve',
                              publish: true,
                              notes: notes[p._id] ?? '',
                            },
                          })
                        }
                      >
                        Approve
                      </SoftButton>
                      <SoftButton
                        variant="danger"
                        onClick={() =>
                          mutation.mutate({
                            id: p._id,
                            body: { decision: 'reject', notes: notes[p._id] ?? '' },
                          })
                        }
                      >
                        Reject
                      </SoftButton>
                    </div>
                  ) : (
                    '—'
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
