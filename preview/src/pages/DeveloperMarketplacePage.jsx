import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getProjects } from '../services/api';
import ProjectCard from '../components/projects/ProjectCard';
import Spinner from '../components/ui/Spinner';

/** Dedicated developer marketplace landing */
export default function DeveloperMarketplacePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['projects', 'developer-marketplace'],
    queryFn: async () =>
      (await getProjects({ ownerType: 'developer', page: 1, limit: 12, sort: 'featured' })).data,
  });

  const projects = data?.data || [];

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
          <Link to="/projects?ownerType=developer" className="btn btn-accent btn-md">
            Browse all developer projects
          </Link>
          <Link to="/login?mode=register" className="btn btn-outline btn-md">
            Become a developer
          </Link>
        </div>
      </div>

      {isLoading && <Spinner />}
      {isError && <p className="text-sm text-rose-700">Could not load developer projects.</p>}

      {!isLoading && !isError && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.length === 0 && (
            <p className="text-sm text-muted sm:col-span-2 lg:col-span-3">
              No published developer projects yet.
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
