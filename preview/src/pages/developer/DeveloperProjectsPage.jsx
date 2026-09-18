import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDeveloperProjects } from '../../services/api';
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

export default function DeveloperProjectsPage() {
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
    queryKey: ['developer', 'projects', params],
    queryFn: async () => (await getDeveloperProjects(params)).data,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const projects = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <div>
      <PageHeader
        title="My Projects"
        subtitle="Solutions listed under your developer account. New submissions stay draft until admin publishes."
        actions={
          <Link to="/developer/projects/new" className="btn btn-accent btn-md">
            Submit project
          </Link>
        }
      />

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search title, industry…"
        filters={
          <FilterSelect value={status} onChange={setStatus}>
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="featured">Featured</option>
            <option value="archived">Archived</option>
          </FilterSelect>
        }
        actions={
          <span className="text-xs text-muted">
            {pagination.total ?? 0} projects
            {isFetching && !isLoading ? ' · updating…' : ''}
          </span>
        }
      />

      {isLoading && <Spinner />}
      {isError && <ErrorBox message="Failed to load projects" />}

      {!isLoading && !isError && (
        <>
          <div className="space-y-3 sm:space-y-4">
            {projects.length === 0 && <EmptyState text="No projects match these filters" />}
            {projects.map((p) => (
              <EntityCard key={p._id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <Link
                      to={`/projects/${p.slug}`}
                      className="font-display font-semibold text-brand hover:text-accent"
                    >
                      {p.title}
                    </Link>
                    <p className="mt-1 text-xs text-muted">
                      {p.industry} · {p.projectType} · {p.views || 0} views
                    </p>
                  </div>
                  <StatusPill value={p.status} />
                  {p.reviewStatus && p.reviewStatus !== 'none' ? (
                    <StatusPill value={p.reviewStatus} />
                  ) : null}
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
