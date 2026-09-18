import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminProjects, updateProjectStatus } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import { useDashboardBase } from '../../context/DashboardBaseContext';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import ListToolbar, { FilterSelect } from '../../components/dashboard/ListToolbar';
import {
  EmptyState,
  EntityCard,
  ErrorBox,
  PageHeader,
  SoftButton,
  StatusPill,
} from '../../components/dashboard/DashboardUI';

const PAGE_SIZE = 20;

export default function AdminProjectsPage() {
  const base = useDashboardBase();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [ownerType, setOwnerType] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);
  const queryClient = useQueryClient();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, ownerType]);

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(status ? { status } : {}),
      ...(ownerType ? { ownerType } : {}),
    }),
    [page, debouncedSearch, status, ownerType]
  );

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['admin', 'projects', params],
    queryFn: async () => (await getAdminProjects(params)).data,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: ({ id, body }) => updateProjectStatus(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'projects'] }),
  });

  const projects = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const actions = (p) => (
    <div className="flex flex-wrap gap-2">
      <Link to={`${base}/projects/${p._id}/ops`} className="btn btn-outline btn-sm">
        Ops
      </Link>
      <Link to={`${base}/projects/${p._id}/edit`} className="btn btn-accent btn-sm">
        Edit
      </Link>
      <SoftButton
        onClick={() => mutation.mutate({ id: p._id, body: { status: 'published', featured: false } })}
      >
        Publish
      </SoftButton>
      <SoftButton
        variant="primary"
        onClick={() => mutation.mutate({ id: p._id, body: { status: 'featured', featured: true } })}
      >
        Feature
      </SoftButton>
      <SoftButton
        onClick={() => mutation.mutate({ id: p._id, body: { status: 'draft', featured: false } })}
      >
        Draft
      </SoftButton>
    </div>
  );

  const thumb = (p) =>
    p.screenshots?.[0]?.url || `https://picsum.photos/seed/${p.slug || p._id}/160/100`;

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle={`${pagination.total || 0} total · edit, publish, feature or draft`}
        actions={
          <Link to={`${base}/projects/new`} className="btn btn-accent btn-md">
            Add project
          </Link>
        }
      />

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search title, industry, type…"
        filters={
          <>
            <FilterSelect value={status} onChange={setStatus}>
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="featured">Featured</option>
              <option value="archived">Archived</option>
            </FilterSelect>
            <FilterSelect value={ownerType} onChange={setOwnerType}>
              <option value="">All owners</option>
              <option value="company">Company</option>
              <option value="developer">Developer</option>
            </FilterSelect>
          </>
        }
        actions={
          <span className="text-xs text-muted">{isFetching && !isLoading ? 'Updating…' : null}</span>
        }
      />

      {isLoading && <Spinner />}
      {isError && <ErrorBox message="Failed to load projects" />}

      {!isLoading && !isError && (
        <>
          {projects.length === 0 && <EmptyState text="No projects match these filters" />}

          <div className="space-y-3 md:hidden">
            {projects.map((p) => (
              <EntityCard key={p._id}>
                <div className="flex gap-3">
                  <img src={thumb(p)} alt="" className="h-16 w-20 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <div className="font-semibold text-brand">
                      <Link to={`${base}/projects/${p._id}/ops`} className="hover:text-accent">
                        {p.title}
                      </Link>
                    </div>
                    <Link to={`/projects/${p.slug}`} className="mt-1 inline-block text-xs text-accent">
                      View public
                    </Link>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusPill value={p.status} />
                  {p.featured ? <StatusPill value="featured" /> : null}
                  <span className="rounded-md bg-mist px-2 py-1 text-[11px] capitalize text-brand">
                    {p.ownerType}
                  </span>
                </div>
                <div className="mt-4">{actions(p)}</div>
              </EntityCard>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-2xl border border-line bg-card md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-line bg-mist/60 text-[11px] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3.5 font-semibold">Project</th>
                    <th className="px-4 py-3.5 font-semibold">Owner</th>
                    <th className="px-4 py-3.5 font-semibold">Status</th>
                    <th className="px-4 py-3.5 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p._id} className="border-b border-line/70 last:border-0">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <img src={thumb(p)} alt="" className="h-12 w-16 rounded-lg object-cover" />
                          <div>
                            <div className="font-medium text-brand">
                              <Link to={`${base}/projects/${p._id}/ops`} className="hover:text-accent">
                                {p.title}
                              </Link>
                            </div>
                            <Link to={`/projects/${p.slug}`} className="text-xs text-accent">
                              View public
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 capitalize text-muted">{p.ownerType}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          <StatusPill value={p.status} />
                          {p.featured ? <StatusPill value="featured" /> : null}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">{actions(p)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
