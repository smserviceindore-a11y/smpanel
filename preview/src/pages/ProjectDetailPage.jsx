import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  buyNowProject,
  createClientReview,
  getProjectBySlug,
  getProjectReviews,
  incrementProjectView,
} from '../services/api';
import { useAuthStore } from '../store/authStore';
import Spinner from '../components/ui/Spinner';

export default function ProjectDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [buyMsg, setBuyMsg] = useState('');
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewMsg, setReviewMsg] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['project', slug],
    queryFn: async () => (await getProjectBySlug(slug)).data,
    staleTime: 60_000,
  });

  const project = data?.data;

  const reviewsQuery = useQuery({
    queryKey: ['project', slug, 'reviews'],
    queryFn: async () => (await getProjectReviews(slug)).data.data,
    enabled: Boolean(slug),
  });

  useEffect(() => {
    if (project?._id) {
      incrementProjectView(project._id).catch(() => {});
    }
  }, [project?._id]);

  const buyMutation = useMutation({
    mutationFn: () => buyNowProject(slug),
    onSuccess: () => {
      setBuyMsg('Quotation created — complete payment on Quotations & Pay.');
      navigate('/client/quotations');
    },
    onError: (err) => {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        navigate(`/login?redirect=/projects/${slug}`);
        return;
      }
      setBuyMsg(err?.response?.data?.message || 'Buy Now failed');
    },
  });

  const reviewMutation = useMutation({
    mutationFn: () =>
      createClientReview({
        projectId: project._id,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
      }),
    onSuccess: () => {
      setReviewMsg('Review submitted for moderation. Thank you!');
      setReviewForm({ rating: 5, comment: '' });
      queryClient.invalidateQueries({ queryKey: ['project', slug, 'reviews'] });
    },
    onError: (err) => setReviewMsg(err?.response?.data?.message || 'Could not submit review'),
  });

  if (isLoading) return <Spinner label="Loading project..." />;
  if (isError || !project) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl text-brand">Project not found</h1>
        <Link to="/projects" className="mt-4 inline-block text-accent">
          Back to gallery
        </Link>
      </div>
    );
  }

  const cover =
    project.screenshots?.[0]?.url ||
    `https://picsum.photos/seed/${project.slug}/1400/700`;
  const canBuy = project.buyNowEnabled && Number(project.price?.amount) > 0;
  const priceLabel = canBuy
    ? `₹${Number(project.price.amount).toLocaleString('en-IN')}`
    : project.price?.displayText;
  const metaTitle = project.seo?.metaTitle || `${project.title} | SM Global Hub`;
  const metaDesc =
    project.seo?.metaDescription || project.shortDescription || project.title;
  const reviews = reviewsQuery.data?.reviews || [];

  return (
    <div className="animate-fade-up">
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:type" content="website" />
        {cover ? <meta property="og:image" content={cover} /> : null}
      </Helmet>

      <section className="border-b border-line bg-brand text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                {project.ownerType === 'company' ? 'Company Project' : 'Developer Project'}
              </span>
              {project.featured && (
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-brand-deep">
                  Featured
                </span>
              )}
              {canBuy ? (
                <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-100">
                  Ready · Buy Now
                </span>
              ) : null}
            </div>
            <h1 className="font-display text-3xl font-bold md:text-4xl">{project.title}</h1>
            <p className="mt-3 max-w-2xl text-white/75">{project.shortDescription}</p>
            <p className="mt-3 text-sm text-accent-soft">
              {project.industry} · {project.projectType}
              {project.category?.name ? ` · ${project.category.name}` : ''}
              {project.ratingCount > 0
                ? ` · ★ ${project.ratingAvg} (${project.ratingCount})`
                : ''}
            </p>
            {project.developerId?._id || typeof project.developerId === 'string' ? (
              <p className="mt-2 text-sm text-white/70">
                By{' '}
                <Link
                  to={`/developers/${project.developerId._id || project.developerId}`}
                  className="text-accent-soft underline"
                >
                  {project.developerId?.name || 'Developer'}
                </Link>
                {' '}storefront
              </p>
            ) : null}

            {priceLabel ? (
              <p className="mt-4 font-display text-2xl font-semibold text-accent-soft">{priceLabel}</p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              {canBuy ? (
                <button
                  type="button"
                  className="btn btn-accent btn-lg"
                  disabled={buyMutation.isPending}
                  onClick={() => {
                    if (!user || user.role !== 'client') {
                      navigate(`/login?redirect=/projects/${slug}`);
                      return;
                    }
                    buyMutation.mutate();
                  }}
                >
                  {buyMutation.isPending ? 'Starting…' : `Buy Now · ${priceLabel}`}
                </button>
              ) : null}
              {project.liveDemoAvailable && project.demoUrl ? (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost-light btn-lg"
                >
                  Launch Live Demo
                </a>
              ) : null}
              {project.customizable !== false ? (
                <Link to={`/customize/${project.slug}`} className="btn btn-ghost-light btn-lg">
                  Request customization
                </Link>
              ) : null}
            </div>
            {buyMsg ? <p className="mt-3 text-sm text-rose-200">{buyMsg}</p> : null}
            <p className="mt-3 text-xs text-white/60">
              Buy Now = ready product at fixed price (coupons apply). Customization = separate quote
              (extra charges, no coupon).
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10">
            <img src={cover} alt={project.title} className="aspect-[16/10] w-full object-cover" />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1.4fr_0.6fr]">
        <div>
          <div
            className="prose-project rounded-2xl border border-line bg-card p-6 md:p-8"
            dangerouslySetInnerHTML={{ __html: project.description || '' }}
          />

          {project.screenshots?.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display mb-4 text-xl font-semibold text-brand">Screenshots</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {project.screenshots.map((shot, idx) => (
                  <img
                    key={idx}
                    src={shot.url}
                    alt={shot.caption || `Shot ${idx + 1}`}
                    className="rounded-xl border border-line object-cover"
                  />
                ))}
              </div>
            </section>
          )}

          <section className="mt-10">
            <h2 className="font-display mb-4 text-xl font-semibold text-brand">Reviews</h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted">No approved reviews yet.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r._id} className="rounded-xl border border-line bg-card p-4">
                    <div className="text-sm font-semibold text-brand">
                      ★ {r.rating} · {r.clientId?.name || 'Client'}
                    </div>
                    {r.comment ? <p className="mt-1 text-sm text-muted">{r.comment}</p> : null}
                  </div>
                ))}
              </div>
            )}

            {user?.role === 'client' ? (
              <div className="mt-6 rounded-xl border border-line bg-mist p-4">
                <div className="mb-2 text-sm font-semibold text-brand">Leave a review</div>
                <p className="mb-3 text-xs text-muted">Available after you purchase this project.</p>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm((f) => ({ ...f, rating: e.target.value }))}
                    className="rounded-xl border border-line bg-sand px-3 py-2 text-sm"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} stars
                      </option>
                    ))}
                  </select>
                  <input
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                    placeholder="Comment (optional)"
                    className="min-w-[200px] flex-1 rounded-xl border border-line bg-sand px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    className="btn btn-accent"
                    disabled={reviewMutation.isPending}
                    onClick={() => reviewMutation.mutate()}
                  >
                    Submit
                  </button>
                </div>
                {reviewMsg ? <p className="mt-2 text-xs text-muted">{reviewMsg}</p> : null}
              </div>
            ) : null}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-line bg-card p-5">
            <h3 className="font-display text-lg font-semibold text-brand">Need this for your business?</h3>
            <p className="mt-2 text-sm text-muted">
              Buy the ready version now, or request customization for extra modules — we will send a
              separate bill for custom work.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {canBuy ? (
                <button
                  type="button"
                  className="btn btn-accent w-full"
                  disabled={buyMutation.isPending}
                  onClick={() => {
                    if (!user || user.role !== 'client') {
                      navigate(`/login?redirect=/projects/${slug}`);
                      return;
                    }
                    buyMutation.mutate();
                  }}
                >
                  Buy Now
                </button>
              ) : null}
              {project.customizable !== false ? (
                <Link to={`/customize/${project.slug}`} className="btn btn-outline w-full text-center">
                  Request customization
                </Link>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
