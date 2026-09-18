import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { curateAdminProject, getAdminProjects } from '../../services/api';
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

export default function AdminCurationPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('published');
  const [page, setPage] = useState(1);
  const [msg, setMsg] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

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
    queryKey: ['admin', 'curation', params],
    queryFn: async () => (await getAdminProjects(params)).data,
    placeholderData: (prev) => prev,
  });

  const mutation = useMutation({
    mutationFn: ({ id, ...body }) => curateAdminProject(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'curation'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'featured'] });
      setMsg('Curation updated');
    },
    onError: (e) => setMsg(e?.response?.data?.message || 'Update failed'),
  });

  const rows = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  if (isLoading && !data) return <Spinner label="Loading projects…" />;
  if (isError) return <ErrorBox message="Failed to load projects" />;

  return (
    <div>
      <PageHeader
        title="Featured curation"
        subtitle="Search listings and toggle Featured / tier for the home marketplace section."
      />

      {msg ? (
        <div className="mb-4 rounded-xl border border-line bg-mist px-4 py-3 text-sm text-brand">
          {msg}
        </div>
      ) : null}

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search title or slug…"
        filters={
          <FilterSelect value={status} onChange={setStatus}>
            <option value="">All statuses</option>
            {['draft', 'pending_review', 'published', 'featured', 'rejected'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </FilterSelect>
        }
      />

      <ReportTable
        emptyText="No projects"
        rows={rows}
        columns={[
          {
            key: 'title',
            label: 'Title',
            render: (p) => (
              <div>
                <div className="font-semibold">{p.title}</div>
                <div className="text-xs text-muted">/{p.slug}</div>
              </div>
            ),
          },
          {
            key: 'status',
            label: 'Status',
            render: (p) => (
              <div className="flex flex-wrap items-center gap-1">
                <StatusPill value={p.status} />
                {p.featured ? (
                  <span className="rounded-lg bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                    featured
                  </span>
                ) : null}
              </div>
            ),
          },
          {
            key: 'price',
            label: 'Buy Now',
            align: 'right',
            render: (p) =>
              p.buyNowEnabled
                ? `₹${Number(p.price?.amount || 0).toLocaleString('en-IN')}`
                : '—',
          },
          {
            key: 'tier',
            label: 'Tier',
            render: (p) => (
              <select
                className="rounded-xl border border-line bg-sand px-2 py-2 text-xs"
                value={p.tier ?? 1}
                disabled={mutation.isPending}
                onChange={(e) =>
                  mutation.mutate({ id: p._id, tier: Number(e.target.value) || 1 })
                }
              >
                {[1, 2, 3, 4, 5].map((t) => (
                  <option key={t} value={t}>
                    Tier {t}
                  </option>
                ))}
              </select>
            ),
          },
          {
            key: 'actions',
            label: 'Action',
            align: 'right',
            render: (p) => (
              <SoftButton
                variant={p.featured ? 'primary' : undefined}
                disabled={mutation.isPending}
                onClick={() =>
                  mutation.mutate({
                    id: p._id,
                    featured: !p.featured,
                    status: !p.featured
                      ? 'featured'
                      : p.status === 'featured'
                        ? 'published'
                        : p.status,
                  })
                }
              >
                {p.featured ? 'Unfeature' : 'Feature'}
              </SoftButton>
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
