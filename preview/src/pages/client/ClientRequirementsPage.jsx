import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getClientRequirements } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import ListToolbar, { FilterSelect } from '../../components/dashboard/ListToolbar';
import {
  EmptyState,
  EntityCard,
  ErrorBox,
  PageHeader,
  StatusPill,
} from '../../components/dashboard/DashboardUI';

const PAGE_SIZE = 12;
const statuses = [
  'new',
  'contacted',
  'requirement_discussed',
  'demo_given',
  'quotation_sent',
  'negotiation',
  'won',
  'lost',
];

export default function ClientRequirementsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(status ? { status } : {}),
    }),
    [page, debouncedSearch, status]
  );

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['client', 'requirements', params],
    queryFn: async () => (await getClientRequirements(params)).data,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const rows = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <div>
      <PageHeader
        title="My Requirements"
        subtitle="Track CRM-style status for each submitted need."
        actions={
          <Link
            to="/submit-requirement"
            className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-deep"
          >
            New requirement
          </Link>
        }
      />

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search lead ID, industry…"
        filters={
          <FilterSelect value={status} onChange={setStatus}>
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </FilterSelect>
        }
        actions={
          <span className="text-xs text-muted">
            {pagination.total ?? 0} items
            {isFetching && !isLoading ? ' · updating…' : ''}
          </span>
        }
      />

      {isLoading && <Spinner />}
      {isError && <ErrorBox message="Failed to load requirements" />}

      {!isLoading && !isError && (
        <>
          <div className="space-y-3 sm:space-y-4">
            {rows.length === 0 && <EmptyState text="No requirements match these filters" />}
            {rows.map((r) => (
              <EntityCard key={r._id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="font-display font-semibold text-brand">{r.leadId}</div>
                    <div className="mt-1 text-sm text-muted">
                      {r.projectType || 'General'} · {r.industry || '—'} · Budget {r.budget || '—'}
                    </div>
                    {r.modules?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {r.modules.map((m) => (
                          <span key={m} className="rounded-md bg-mist px-2 py-1 text-[11px] text-brand">
                            {m}
                          </span>
                        ))}
                      </div>
                    )}
                    {r.recommendedProjects?.length > 0 && (
                      <div className="mt-3 text-xs text-muted">
                        Recommended:{' '}
                        {r.recommendedProjects.map((rp) => (
                          <Link
                            key={rp.projectId?._id || rp._id}
                            to={`/projects/${rp.projectId?.slug}`}
                            className="mr-2 text-accent hover:underline"
                          >
                            {rp.projectId?.title} ({rp.matchScore}%)
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  <StatusPill value={r.status} />
                </div>
              </EntityCard>
            ))}
          </div>
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
