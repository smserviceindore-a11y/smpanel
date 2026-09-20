import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { getProjects, getPublicDevelopers } from '../services/api';
import ProjectCard from '../components/projects/ProjectCard';
import Spinner from '../components/ui/Spinner';

/** Dedicated developer marketplace landing */
export default function DeveloperMarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const developerId = searchParams.get('developerId') || '';

  const { data: developersData } = useQuery({
    queryKey: ['public-developers'],
    queryFn: async () => (await getPublicDevelopers()).data,
    staleTime: 5 * 60_000,
  });

  const developers = developersData?.data || [];

  const filters = useMemo(
    () => ({
      ownerType: 'developer',
      page: 1,
      limit: 48,
      sort: 'featured',
      ...(developerId ? { developerId } : {}),
    }),
    [developerId]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ['projects', 'developer-marketplace', filters],
    queryFn: async () => (await getProjects(filters)).data,
  });

  const projects = data?.data || [];
  const selected = developers.find((d) => d.id === developerId);

  const setDeveloper = (id) => {
    const next = new URLSearchParams(searchParams);
    if (!id) next.delete('developerId');
    else next.set('developerId', id);
    setSearchParams(next);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          Developer marketplace
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-brand">
          Verified developer solutions
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Products listed by verified developers, reviewed by SM Global, and delivered with hub
          quality control, quotations and settlements.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to={
              developerId
                ? `/projects?ownerType=developer&developerId=${developerId}`
                : '/projects?ownerType=developer'
            }
            className="btn btn-accent btn-md"
          >
            Browse all developer projects
          </Link>
          <Link to="/login?mode=register" className="btn btn-outline btn-md">
            Become a developer
          </Link>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-line bg-card p-4 sm:flex-row sm:items-center">
        <label className="shrink-0 text-sm font-medium text-brand" htmlFor="developer-filter">
          Filter by developer
        </label>
        <select
          id="developer-filter"
          value={developerId}
          onChange={(e) => setDeveloper(e.target.value)}
          className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent sm:max-w-sm"
        >
          <option value="">All developers</option>
          {developers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
              {d.company ? ` · ${d.company}` : ''}
              {d.verified ? ' ✓' : ''}
            </option>
          ))}
        </select>
        {selected && (
          <Link
            to={`/developers/${selected.id}`}
            className="text-sm font-medium text-accent hover:underline"
          >
            View {selected.name}&apos;s storefront →
          </Link>
        )}
      </div>

      {developers.length > 0 && (
        <div className="mb-8 flex gap-3 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setDeveloper('')}
            className={`flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition ${
              !developerId
                ? 'border-brand bg-brand text-white'
                : 'border-line bg-card text-brand hover:border-accent'
            }`}
          >
            All
          </button>
          {developers.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDeveloper(d.id)}
              className={`flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition ${
                developerId === d.id
                  ? 'border-accent bg-mist text-brand'
                  : 'border-line bg-card text-brand hover:border-accent'
              }`}
            >
              {d.avatar ? (
                <img src={d.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs text-white">
                  {(d.name || '?')[0]}
                </span>
              )}
              {d.name}
            </button>
          ))}
        </div>
      )}

      {isLoading && <Spinner />}
      {isError && <p className="text-sm text-rose-700">Could not load developer projects.</p>}

      {!isLoading && !isError && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.length === 0 && (
            <p className="text-sm text-muted sm:col-span-2 lg:col-span-3">
              {developerId
                ? 'No published projects for this developer yet.'
                : 'No published developer projects yet.'}
            </p>
          )}
          {projects.map((p) => (
            <ProjectCard key={p._id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
