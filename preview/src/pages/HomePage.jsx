import { Link } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getCategories, getFeaturedProjects, getRecommendedProjects } from '../services/api';
import ProjectCard from '../components/projects/ProjectCard';
import Spinner from '../components/ui/Spinner';

const IMG = {
  hero: '/images/hero-marketplace.jpg',
  explore: '/images/step-explore.jpg',
  demo: '/images/step-demo.jpg',
  customize: '/images/step-customize.jpg',
  cta: '/images/cta-requirement.jpg',
};

const FEATURED_PAGE_SIZE = 6;

const steps = [
  {
    n: '01',
    title: 'Explore the marketplace',
    text: 'Browse live ERP, CRM, school, ecommerce and job-portal products from SM Global and verified developers.',
    image: IMG.explore,
  },
  {
    n: '02',
    title: 'Experience live demos',
    text: 'Open working demos, check modules and credentials, and see how the product behaves before you buy.',
    image: IMG.demo,
  },
  {
    n: '03',
    title: 'Customize for your business',
    text: 'Request customization or submit a fresh requirement — SM Global delivers the fitted solution.',
    image: IMG.customize,
  },
];

const audiences = [
  {
    title: 'Businesses & buyers',
    text: 'Find ready solutions, launch demos and request custom builds.',
    image:
      'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=900&h=700&q=80',
  },
  {
    title: 'Verified developers',
    text: 'List products on the hub and receive routed client requests.',
    image:
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=900&h=700&q=80',
  },
  {
    title: 'SM Global delivery',
    text: 'Company-led quality, quotation and end-to-end project delivery.',
    image:
      'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=900&h=700&q=80',
  },
];

export default function HomePage() {
  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await getCategories()).data,
    staleTime: 5 * 60_000,
  });

  const { data: suggestData } = useQuery({
    queryKey: ['projects', 'recommend', 'home'],
    queryFn: async () => (await getRecommendedProjects({ limit: 6 })).data,
    staleTime: 60_000,
  });
  const suggested = suggestData?.data || [];

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['projects', 'featured', 'paged'],
    queryFn: async ({ pageParam = 1 }) =>
      (
        await getFeaturedProjects({
          page: pageParam,
          limit: FEATURED_PAGE_SIZE,
        })
      ).data,
    getNextPageParam: (last) => {
      const p = last?.pagination;
      if (!p) return undefined;
      return p.page < p.totalPages ? p.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 60_000,
  });

  const projects = data?.pages?.flatMap((p) => p.data || []) || [];
  const totalFeatured = data?.pages?.[0]?.pagination?.total ?? projects.length;
  const categories = catData?.data || [];

  return (
    <div>
      <section className="relative min-h-[88vh] overflow-hidden">
        <img
          src={IMG.hero}
          alt="Digital software marketplace workspace with live product dashboards"
          className="absolute inset-0 h-full w-full object-cover kenburns"
        />
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(10,42,43,0.92)_0%,rgba(15,61,62,0.78)_48%,rgba(10,42,43,0.55)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,rgba(20,184,166,0.18),transparent_55%)]" />

        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-center px-4 py-20 text-white md:py-24">
          <p className="animate-fade-up mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-accent-soft sm:text-sm">
            SM Global Solution Hub
          </p>
          <h1 className="animate-fade-up font-display max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
            Digital marketplace for
            <span className="block text-accent-soft">live business software</span>
          </h1>
          <div className="reveal-line mt-5 h-1 w-24 rounded-full bg-accent" />
          <p className="animate-fade-up mt-6 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            Explore company and developer products, experience live demos, then customize ERP, CRM,
            school, commerce and more for your business.
          </p>
          <div className="animate-fade-up mt-9 flex flex-wrap gap-3">
            <Link to="/projects" className="btn btn-accent btn-lg">
              Explore Projects
            </Link>
            <Link to="/submit-requirement" className="btn btn-ghost-light btn-lg">
              Submit Your Requirement
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-card">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[0.9fr_1.1fr] md:items-center md:py-16">
          <div className="animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">What we are</p>
            <h2 className="font-display mt-2 text-2xl font-semibold text-brand md:text-3xl">
              A solution marketplace, not a brochure site
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">
              SM Global Solution Hub is where businesses discover ready digital products, try live
              demos, and request customization — powered by SM Global Tech Solutions and verified
              developers.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-brand">
              <li className="flex gap-2"><span className="text-accent">✓</span> Live demos before you commit</li>
              <li className="flex gap-2"><span className="text-accent">✓</span> Company + developer catalog</li>
              <li className="flex gap-2"><span className="text-accent">✓</span> Customize & requirement workflows</li>
            </ul>
          </div>
          <div className="animate-fade-up relative overflow-hidden rounded-2xl border border-line shadow-lg">
            <img
              src={IMG.demo}
              alt="Live product demo dashboard"
              className="aspect-[16/11] w-full object-cover transition duration-700 hover:scale-[1.03]"
              loading="lazy"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-deep/80 to-transparent p-4 text-sm text-white">
              Try solutions the way they actually run — not just screenshots.
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-sand/40">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-14">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Categories</p>
              <h2 className="font-display mt-2 text-2xl font-semibold text-brand md:text-3xl">
                Browse by solution type
              </h2>
              <p className="mt-2 text-sm text-muted">
                Jump into a category — gallery loads only that filter, page by page.
              </p>
            </div>
            <Link to="/projects" className="btn btn-outline btn-md">
              All projects
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c._id}
                to={`/projects?category=${encodeURIComponent(c.slug)}`}
                className="rounded-xl border border-line bg-card px-3.5 py-2 text-sm font-medium text-brand transition hover:-translate-y-0.5 hover:border-accent hover:text-accent"
              >
                {c.name}
                {typeof c.projectCount === 'number' ? (
                  <span className="ml-1.5 text-xs text-muted">({c.projectCount})</span>
                ) : null}
              </Link>
            ))}
            {categories.length === 0 && <p className="text-sm text-muted">Categories loading…</p>}
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-sand/50">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">
          <div className="mb-10 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">How it works</p>
            <h2 className="font-display mt-2 text-2xl font-semibold text-brand md:text-3xl">
              From marketplace browse to delivery
            </h2>
          </div>
          <div className="stagger grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <article
                key={s.n}
                className="animate-fade-up group overflow-hidden rounded-2xl border border-line bg-card shadow-[0_8px_30px_rgba(11,31,31,0.04)] transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={s.image}
                    alt={s.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-lg bg-brand/90 px-2.5 py-1 font-display text-xs font-bold text-accent-soft">
                    {s.n}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-semibold text-brand">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 md:py-16">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Built for</p>
          <h2 className="font-display mt-2 text-2xl font-semibold text-brand md:text-3xl">
            Everyone in the digital delivery loop
          </h2>
        </div>
        <div className="stagger grid gap-5 sm:grid-cols-3">
          {audiences.map((a) => (
            <article
              key={a.title}
              className="animate-fade-up group relative overflow-hidden rounded-2xl border border-line"
            >
              <img
                src={a.image}
                alt={a.title}
                loading="lazy"
                className="aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-deep via-brand-deep/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <h3 className="font-display text-lg font-semibold">{a.title}</h3>
                <p className="mt-1 text-sm text-white/80">{a.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-brand text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-soft">
              Developer marketplace
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold">
              Verified developer products, hub-reviewed
            </h2>
            <p className="mt-2 text-sm text-white/70">
              Browse developer listings approved by SM Global — same demos, quotations and delivery quality.
            </p>
          </div>
          <Link to="/marketplace/developers" className="btn btn-accent btn-md shrink-0">
            Open marketplace
          </Link>
        </div>
      </section>

      {suggested.length > 0 ? (
        <section className="border-b border-line bg-sand/40">
          <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">
            <div className="mb-8 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                Suggested for you
              </p>
              <h2 className="font-display mt-2 text-2xl font-semibold text-brand md:text-3xl">
                Ready products matched by industry & budget
              </h2>
            </div>
            <div className="stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {suggested.map((project) => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-t border-line bg-card/70">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Catalog</p>
              <h2 className="font-display mt-2 text-2xl font-semibold text-brand md:text-3xl">
                Featured solutions
              </h2>
              <p className="mt-2 max-w-xl text-sm text-muted">
                Showing {projects.length} of {totalFeatured} featured — load more as you need.
              </p>
            </div>
            <Link to="/projects?sort=featured" className="btn btn-outline btn-md">
              View all projects →
            </Link>
          </div>

          {categories.length > 0 && (
            <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
              <Link
                to="/projects"
                className="shrink-0 rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-white"
              >
                All
              </Link>
              {categories.slice(0, 12).map((c) => (
                <Link
                  key={c._id}
                  to={`/projects?category=${encodeURIComponent(c.slug)}`}
                  className="shrink-0 rounded-full border border-line bg-sand px-3.5 py-1.5 text-xs font-semibold text-brand transition hover:border-accent hover:text-accent"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          )}

          {isLoading && <Spinner label="Loading featured projects..." />}
          {isError && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Could not load projects. Is the backend running on port 5001?
            </p>
          )}

          {!isLoading && !isError && (
            <>
              <div className="stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <ProjectCard key={project._id} project={project} />
                ))}
              </div>

              {projects.length === 0 && (
                <p className="rounded-xl border border-line bg-sand px-4 py-10 text-center text-sm text-muted">
                  No featured projects yet.
                </p>
              )}

              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                {hasNextPage ? (
                  <button
                    type="button"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="btn btn-accent btn-lg disabled:opacity-60"
                  >
                    {isFetchingNextPage ? 'Loading…' : `Load more (+${FEATURED_PAGE_SIZE})`}
                  </button>
                ) : (
                  totalFeatured > FEATURED_PAGE_SIZE && (
                    <p className="text-sm text-muted">All featured solutions loaded.</p>
                  )
                )}
                <Link to="/projects" className="btn btn-outline btn-lg">
                  Open full gallery
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="relative overflow-hidden">
        <img
          src={IMG.cta}
          alt="Team reviewing digital solutions"
          className="absolute inset-0 h-full w-full object-cover kenburns-slow"
        />
        <div className="absolute inset-0 bg-brand-deep/80" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-14 text-white md:flex-row md:items-center md:py-16">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-semibold md:text-3xl">
              Need a custom digital solution?
            </h2>
            <p className="mt-2 text-sm text-white/85 md:text-base">
              Submit your requirement — we match marketplace products or build what you need.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/submit-requirement" className="btn btn-accent btn-lg">
              Submit requirement
            </Link>
            <Link to="/projects" className="btn btn-ghost-light btn-lg">
              Browse marketplace
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
