import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPublicDeveloper } from '../services/api';
import Spinner from '../components/ui/Spinner';

export default function DeveloperStorefrontPage() {
  const { id } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-developer', id],
    queryFn: async () => (await getPublicDeveloper(id)).data.data,
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16">
        <Spinner label="Loading developer..." />
      </div>
    );
  }
  if (isError || !data?.developer) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-brand">
        <Link to="/marketplace/developers" className="mb-4 inline-block text-sm font-medium text-accent hover:underline">
          ← Back to Developers
        </Link>
        <p>Developer not found.</p>
      </div>
    );
  }

  const d = data.developer;
  const projects = data.projects || [];
  const initials = (d.name || 'D')
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-gradient-to-b from-sand via-mist to-white">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <Link
          to="/marketplace/developers"
          className="mb-6 inline-flex items-center gap-1.5 rounded-xl border border-line bg-card px-3.5 py-2 text-sm font-medium text-brand transition hover:border-accent hover:text-accent"
        >
          ← Back to Developers
        </Link>

        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="shrink-0">
            {d.avatar ? (
              <img
                src={d.avatar}
                alt={d.name}
                className="h-28 w-28 rounded-2xl object-cover ring-2 ring-line sm:h-32 sm:w-32"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-brand font-display text-2xl font-semibold text-white sm:h-32 sm:w-32">
                {initials}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Developer</p>
            <h1 className="mt-2 font-display text-4xl font-semibold text-brand sm:text-5xl">
              {d.name}
            </h1>
            {d.company ? <p className="mt-2 text-lg text-muted">{d.company}</p> : null}
            {d.bio ? <p className="mt-4 max-w-2xl text-brand/80">{d.bio}</p> : null}
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              {d.verified ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-900">Verified</span>
              ) : null}
              {d.portfolio ? (
                <a href={d.portfolio} target="_blank" rel="noreferrer" className="text-accent underline">
                  Portfolio
                </a>
              ) : null}
              {d.github ? (
                <a href={d.github} target="_blank" rel="noreferrer" className="text-accent underline">
                  GitHub
                </a>
              ) : null}
            </div>
            {d.skills?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {d.skills.map((s) => (
                  <span key={s} className="rounded-lg bg-mist px-2.5 py-1 text-xs text-brand">
                    {s}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <h2 className="mb-4 font-display text-2xl font-semibold text-brand">Storefront</h2>
        {projects.length === 0 ? (
          <p className="text-muted">No published projects yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <Link
                key={p._id}
                to={`/projects/${p.slug}`}
                className="block rounded-2xl border border-line bg-card p-4 transition hover:border-accent"
              >
                <div className="font-display text-lg font-semibold text-brand">{p.title}</div>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{p.shortDescription}</p>
                <div className="mt-3 text-sm text-brand">
                  {p.buyNowEnabled && p.price?.amount
                    ? `₹${Number(p.price.amount).toLocaleString('en-IN')}`
                    : p.price?.displayText || 'Custom quote'}
                  {p.ratingCount > 0
                    ? ` · ★ ${Number(p.ratingAvg || 0).toFixed(1)} (${p.ratingCount})`
                    : ''}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
