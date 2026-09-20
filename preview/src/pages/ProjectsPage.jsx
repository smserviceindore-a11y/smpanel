import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getCategories, getProjects, getPublicDevelopers } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import ProjectCard from '../components/projects/ProjectCard';
import Pagination from '../components/ui/Pagination';
import Spinner from '../components/ui/Spinner';

export default function ProjectsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(search, 400);

  const page = Number(searchParams.get('page') || 1);
  const ownerType = searchParams.get('ownerType') || '';
  const category = searchParams.get('category') || '';
  const liveDemo = searchParams.get('liveDemo') || '';
  const sort = searchParams.get('sort') || 'featured';
  const developerId = searchParams.get('developerId') || '';

  const filters = useMemo(
    () => ({
      page,
      limit: 12,
      sort,
      ...(ownerType ? { ownerType } : {}),
      ...(category ? { category } : {}),
      ...(liveDemo ? { liveDemo } : {}),
      ...(developerId ? { developerId } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }),
    [page, ownerType, category, liveDemo, sort, developerId, debouncedSearch]
  );

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await getCategories()).data,
    staleTime: 5 * 60_000,
  });

  const { data: developersData } = useQuery({
    queryKey: ['public-developers'],
    queryFn: async () => (await getPublicDevelopers()).data,
    staleTime: 5 * 60_000,
  });

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['projects', filters],
    queryFn: async () => (await getProjects(filters)).data,
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });

  const projects = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };
  const categories = catData?.data || [];
  const developers = developersData?.data || [];

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    if (key === 'developerId' && value) {
      next.set('ownerType', 'developer');
    }
    if (key === 'ownerType' && value !== 'developer') {
      next.delete('developerId');
    }
    setSearchParams(next);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-brand">Project Gallery</h1>
        <p className="mt-2 text-sm text-muted">
          Filter by company or developer projects. Search ERP, CRM, HRMS, education and more.
        </p>
      </div>

      <div className="mb-6 grid gap-3 rounded-2xl border border-line bg-card p-4 md:grid-cols-2 lg:grid-cols-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects..."
          className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent lg:col-span-2"
        />

        <select
          value={ownerType}
          onChange={(e) => updateParam('ownerType', e.target.value)}
          className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm"
        >
          <option value="">All owners</option>
          <option value="company">Company projects</option>
          <option value="developer">Developer projects</option>
        </select>

        <select
          value={developerId}
          onChange={(e) => updateParam('developerId', e.target.value)}
          className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm"
          disabled={ownerType === 'company'}
        >
          <option value="">All developers</option>
          {developers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
              {d.company ? ` · ${d.company}` : ''}
            </option>
          ))}
        </select>

        <select
          value={category}
          onChange={(e) => updateParam('category', e.target.value)}
          className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => updateParam('sort', e.target.value)}
          className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm"
        >
          <option value="featured">Featured first</option>
          <option value="newest">Newest</option>
          <option value="popular">Popular</option>
        </select>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => updateParam('category', '')}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
            !category ? 'bg-brand text-white' : 'border border-line bg-sand text-brand hover:border-accent'
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c._id}
            type="button"
            onClick={() => updateParam('category', c.slug)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              category === c.slug
                ? 'bg-accent text-brand-deep'
                : 'border border-line bg-sand text-brand hover:border-accent'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
        <span>
          {pagination.total} projects
          {isFetching ? ' · updating…' : ''}
        </span>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={liveDemo === 'true'}
            onChange={(e) => updateParam('liveDemo', e.target.checked ? 'true' : '')}
          />
          Live demo available
        </label>
      </div>

      {isLoading && <Spinner />}
      {isError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load projects.
        </p>
      )}

      {!isLoading && !isError && projects.length === 0 && (
        <p className="rounded-xl border border-line bg-card px-4 py-10 text-center text-muted">
          No projects match these filters.
        </p>
      )}

      <div className="stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project._id} project={project} />
        ))}
      </div>

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onChange={(p) => updateParam('page', String(p))}
      />
    </div>
  );
}
