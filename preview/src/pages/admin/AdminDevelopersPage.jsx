import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminDevelopers, updateDeveloperVerification } from '../../services/api';
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

const PAGE_SIZE = 10;

export default function AdminDevelopersPage() {
  const [search, setSearch] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);
  const queryClient = useQueryClient();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, verificationStatus]);

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(verificationStatus ? { verificationStatus } : {}),
    }),
    [page, debouncedSearch, verificationStatus]
  );

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['admin', 'developers', params],
    queryFn: async () => (await getAdminDevelopers(params)).data,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: ({ id, body }) => updateDeveloperVerification(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'developers'] }),
  });

  const rows = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <div>
      <PageHeader
        title="Developer Management"
        subtitle="Verify marketplace developers before they go live on the hub."
      />

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, email, phone…"
        filters={
          <FilterSelect value={verificationStatus} onChange={setVerificationStatus}>
            <option value="">All verification</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </FilterSelect>
        }
        actions={
          <span className="text-xs text-muted">
            {pagination.total ?? 0} developers
            {isFetching && !isLoading ? ' · updating…' : ''}
          </span>
        }
      />

      {isLoading && <Spinner />}
      {isError && <ErrorBox message="Failed to load developers" />}

      {!isLoading && !isError && (
        <>
          <ReportTable
            emptyText="No developers match these filters"
            rows={rows}
            rowKey="id"
            columns={[
              {
                key: 'name',
                label: 'Name',
                render: (d) => <span className="font-semibold">{d.name}</span>,
              },
              {
                key: 'contact',
                label: 'Contact',
                render: (d) => (
                  <div>
                    <div className="break-all text-xs">{d.email}</div>
                    {d.phone ? <div className="text-xs text-muted">{d.phone}</div> : null}
                  </div>
                ),
              },
              {
                key: 'verification',
                label: 'Verification',
                render: (d) => <StatusPill value={d.verificationStatus} />,
              },
              {
                key: 'status',
                label: 'Status',
                render: (d) => <StatusPill value={d.status} />,
              },
              {
                key: 'projects',
                label: 'Projects',
                align: 'right',
                render: (d) => d.projectCount,
              },
              {
                key: 'skills',
                label: 'Skills',
                render: (d) => (
                  <span className="line-clamp-2 max-w-[160px] text-xs text-muted">
                    {d.profile?.skills?.length ? d.profile.skills.join(', ') : '—'}
                  </span>
                ),
              },
              {
                key: 'actions',
                label: 'Actions',
                align: 'right',
                render: (d) => (
                  <div className="flex flex-wrap justify-end gap-1">
                    <SoftButton
                      variant="primary"
                      onClick={() =>
                        mutation.mutate({ id: d.id, body: { verificationStatus: 'verified' } })
                      }
                    >
                      Verify
                    </SoftButton>
                    <SoftButton
                      variant="danger"
                      onClick={() =>
                        mutation.mutate({ id: d.id, body: { verificationStatus: 'rejected' } })
                      }
                    >
                      Reject
                    </SoftButton>
                    <SoftButton
                      onClick={() =>
                        mutation.mutate({
                          id: d.id,
                          body: { status: d.status === 'active' ? 'suspended' : 'active' },
                        })
                      }
                    >
                      {d.status === 'active' ? 'Suspend' : 'Activate'}
                    </SoftButton>
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
