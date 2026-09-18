import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAdminProject,
  updateAdminProject,
  createAdminProject,
  getCategories,
  deleteAdminProject,
  uploadImage,
  uploadImages,
} from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import { ErrorBox, PageHeader } from '../../components/dashboard/DashboardUI';
import { useDashboardBase } from '../../context/DashboardBaseContext';

const empty = {
  title: '',
  shortDescription: '',
  description: '',
  industry: '',
  projectType: '',
  technologies: '',
  features: '',
  demoUrl: '',
  videoUrl: '',
  liveDemoAvailable: false,
  customizable: true,
  buyNowEnabled: false,
  deliveryAccessUrl: '',
  deliveryZipUrl: '',
  deliveryLicenseKey: '',
  deliveryInstructions: '',
  status: 'draft',
  featured: false,
  tier: 1,
  ownerType: 'company',
  category: '',
  priceDisplay: '',
  priceAmount: '',
  priceMin: '',
  priceMax: '',
  metaTitle: '',
  metaDescription: '',
  demoUsername: '',
  demoPassword: '',
  demoNotes: '',
};

let shotKey = 0;
const makeShot = (url, caption = 'Screenshot') => ({
  key: `shot-${Date.now()}-${shotKey++}`,
  url,
  caption,
});

export default function AdminProjectEditPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const base = useDashboardBase();
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const [form, setForm] = useState(empty);
  const [screenshots, setScreenshots] = useState([]);
  const [urlDraft, setUrlDraft] = useState('');
  const [urlCaption, setUrlCaption] = useState('Screenshot');
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const projectQuery = useQuery({
    queryKey: ['admin', 'project', id],
    queryFn: async () => (await getAdminProject(id)).data.data,
    enabled: !isNew,
  });

  const catsQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await getCategories()).data.data,
  });

  useEffect(() => {
    if (!projectQuery.data) return;
    const p = projectQuery.data;
    setForm({
      title: p.title || '',
      shortDescription: p.shortDescription || '',
      description: p.description || '',
      industry: p.industry || '',
      projectType: p.projectType || '',
      technologies: (p.technologies || []).join(', '),
      features: (p.features || []).join('\n'),
      demoUrl: p.demoUrl || '',
      videoUrl: p.videoUrl || '',
      liveDemoAvailable: !!p.liveDemoAvailable,
      customizable: p.customizable !== false,
      buyNowEnabled: Boolean(p.buyNowEnabled),
      deliveryAccessUrl: p.deliveryAccessUrl || '',
      deliveryZipUrl: p.deliveryZipUrl || '',
      deliveryLicenseKey: p.deliveryLicenseKey || '',
      deliveryInstructions: p.deliveryInstructions || '',
      status: p.status || 'draft',
      featured: !!p.featured,
      tier: p.tier || 1,
      ownerType: p.ownerType || 'company',
      category: p.category?._id || p.category || '',
      priceDisplay: p.price?.displayText || '',
      priceAmount: p.price?.amount ?? '',
      priceMin: p.price?.min ?? '',
      priceMax: p.price?.max ?? '',
      metaTitle: p.seo?.metaTitle || '',
      metaDescription: p.seo?.metaDescription || '',
      demoUsername: p.demoCredentials?.username || '',
      demoPassword: p.demoCredentials?.password || '',
      demoNotes: p.demoCredentials?.notes || '',
    });
    setScreenshots(
      (p.screenshots || [])
        .slice()
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((s) => makeShot(s.url, s.caption || 'Screenshot'))
    );
  }, [projectQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (body) => {
      if (isNew) return createAdminProject(body);
      return updateAdminProject(id, body);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'projects'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'project', id] });
      setMsg('Saved successfully');
      const newId = res.data?.data?._id;
      if (isNew && newId) navigate(`${base}/projects/${newId}/edit`, { replace: true });
    },
    onError: (err) => setError(err.response?.data?.message || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAdminProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'projects'] });
      navigate(`${base}/projects`);
    },
  });

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const updateShot = (key, patch) => {
    setScreenshots((list) => list.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  };

  const removeShot = (key) => {
    setScreenshots((list) => list.filter((s) => s.key !== key));
  };

  const moveShot = (key, dir) => {
    setScreenshots((list) => {
      const idx = list.findIndex((s) => s.key === key);
      if (idx < 0) return list;
      const next = idx + dir;
      if (next < 0 || next >= list.length) return list;
      const copy = list.slice();
      const [item] = copy.splice(idx, 1);
      copy.splice(next, 0, item);
      return copy;
    });
  };

  const onPickFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;

    setUploading(true);
    setUploadMsg('');
    setError('');
    try {
      if (files.length === 1) {
        const res = await uploadImage(files[0]);
        const url = res.data.data.url;
        setScreenshots((list) => [...list, makeShot(url, files[0].name.replace(/\.[^.]+$/, '') || 'Screenshot')]);
        setUploadMsg('1 image uploaded');
      } else {
        const uploaded = await uploadImages(files);
        setScreenshots((list) => [
          ...list,
          ...uploaded.map((u, i) =>
            makeShot(u.url, files[i]?.name?.replace(/\.[^.]+$/, '') || `Screenshot ${list.length + i + 1}`)
          ),
        ]);
        setUploadMsg(`${uploaded.length} images uploaded`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Image upload failed. Check Cloudinary config / login.');
    } finally {
      setUploading(false);
    }
  };

  const addByUrl = () => {
    const url = urlDraft.trim();
    if (!url) return;
    setScreenshots((list) => [...list, makeShot(url, urlCaption.trim() || 'Screenshot')]);
    setUrlDraft('');
    setUrlCaption('Screenshot');
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    const body = {
      title: form.title,
      shortDescription: form.shortDescription,
      description: form.description,
      industry: form.industry,
      projectType: form.projectType,
      technologies: form.technologies
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      features: form.features
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      demoUrl: form.demoUrl,
      videoUrl: form.videoUrl,
      liveDemoAvailable: form.liveDemoAvailable,
      customizable: form.customizable,
      buyNowEnabled: Boolean(form.buyNowEnabled) && Number(form.priceAmount) > 0,
      deliveryAccessUrl: form.deliveryAccessUrl || undefined,
      deliveryZipUrl: form.deliveryZipUrl || undefined,
      deliveryLicenseKey: form.deliveryLicenseKey || undefined,
      deliveryInstructions: form.deliveryInstructions || undefined,
      status: form.status,
      featured: form.featured || form.status === 'featured',
      tier: Number(form.tier) || 1,
      ownerType: form.ownerType,
      category: form.category || undefined,
      price: {
        displayText: form.priceDisplay,
        amount: form.priceAmount === '' ? undefined : Number(form.priceAmount),
        min: form.priceMin === '' ? undefined : Number(form.priceMin),
        max: form.priceMax === '' ? undefined : Number(form.priceMax),
        currency: 'INR',
      },
      seo: {
        metaTitle: form.metaTitle || undefined,
        metaDescription: form.metaDescription || undefined,
      },
      screenshots: screenshots
        .filter((s) => s.url?.trim())
        .map((s, order) => ({
          url: s.url.trim(),
          caption: s.caption || `Screenshot ${order + 1}`,
          order,
        })),
      demoCredentials: {
        username: form.demoUsername,
        password: form.demoPassword,
        notes: form.demoNotes,
      },
    };
    saveMutation.mutate(body);
  };

  if (!isNew && projectQuery.isLoading) return <Spinner />;
  if (!isNew && projectQuery.isError) return <ErrorBox message="Failed to load project" />;

  const field = (label, key, opts = {}) => (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-brand">{label}</span>
      {opts.textarea ? (
        <textarea
          rows={opts.rows || 4}
          value={form[key]}
          onChange={(e) => update(key, e.target.value)}
          required={opts.required}
          className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
      ) : (
        <input
          type={opts.type || 'text'}
          value={form[key]}
          onChange={(e) => update(key, opts.type === 'checkbox' ? e.target.checked : e.target.value)}
          required={opts.required}
          checked={opts.type === 'checkbox' ? form[key] : undefined}
          className={
            opts.type === 'checkbox'
              ? 'h-4 w-4 accent-brand'
              : 'w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent'
          }
        />
      )}
    </label>
  );

  return (
    <div>
      <PageHeader
        title={isNew ? 'Add project' : 'Edit project'}
        subtitle={isNew ? 'Create a new marketplace listing' : form.title || 'Update listing details'}
        actions={
          <Link to={`${base}/projects`} className="btn btn-outline btn-md">
            ← Back to list
          </Link>
        }
      />

      <form onSubmit={onSubmit} className="space-y-6">
        <section className="grid gap-4 rounded-2xl border border-line bg-card p-5 sm:grid-cols-2 sm:p-6">
          <div className="sm:col-span-2">{field('Title *', 'title', { required: true })}</div>
          <div className="sm:col-span-2">{field('Short description', 'shortDescription')}</div>
          <div className="sm:col-span-2">{field('Full description (HTML allowed)', 'description', { textarea: true, rows: 8 })}</div>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-brand">Category</span>
            <select
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
              className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm"
            >
              <option value="">Select category</option>
              {(catsQuery.data || []).map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          {field('Industry', 'industry')}
          {field('Project type', 'projectType')}
          {field('Technologies (comma separated)', 'technologies')}
          <div className="sm:col-span-2">{field('Features (one per line)', 'features', { textarea: true, rows: 5 })}</div>
        </section>

        <section className="space-y-4 rounded-2xl border border-line bg-card p-5 sm:p-6">
          <div>
            <h2 className="font-display text-base font-semibold text-brand">Images & screenshots</h2>
            <p className="mt-1 text-xs text-muted">
              First image is the cover/thumbnail. Upload multiple files or paste URLs. JPEG/PNG/WebP, max 5MB each.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              multiple
              className="hidden"
              onChange={onPickFiles}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="btn btn-accent btn-md disabled:opacity-60"
            >
              {uploading ? 'Uploading…' : 'Upload images'}
            </button>
            {uploadMsg && <span className="self-center text-sm text-emerald-700">{uploadMsg}</span>}
          </div>

          <div className="grid gap-2 rounded-xl border border-dashed border-line bg-sand/60 p-3 sm:grid-cols-[1fr_160px_auto]">
            <input
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="Or paste image URL…"
              className="rounded-xl border border-line bg-card px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
            <input
              value={urlCaption}
              onChange={(e) => setUrlCaption(e.target.value)}
              placeholder="Caption"
              className="rounded-xl border border-line bg-card px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
            <button type="button" onClick={addByUrl} className="btn btn-outline btn-md">
              Add URL
            </button>
          </div>

          {screenshots.length === 0 && (
            <p className="rounded-xl bg-sand px-4 py-8 text-center text-sm text-muted">
              No images yet — upload from your device or add a URL.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {screenshots.map((shot, idx) => (
              <article key={shot.key} className="overflow-hidden rounded-2xl border border-line bg-sand/40">
                <div className="relative aspect-video bg-mist">
                  <img src={shot.url} alt={shot.caption || `Shot ${idx + 1}`} className="h-full w-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute left-2 top-2 rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold uppercase text-brand-deep">
                      Cover
                    </span>
                  )}
                </div>
                <div className="space-y-2 p-3">
                  <input
                    value={shot.caption}
                    onChange={(e) => updateShot(shot.key, { caption: e.target.value })}
                    className="w-full rounded-lg border border-line bg-card px-2.5 py-1.5 text-xs outline-none focus:border-accent"
                    placeholder="Caption"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => moveShot(shot.key, -1)} disabled={idx === 0}>
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => moveShot(shot.key, 1)}
                      disabled={idx === screenshots.length - 1}
                    >
                      ↓
                    </button>
                    {idx !== 0 && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          setScreenshots((list) => {
                            const copy = list.slice();
                            const [item] = copy.splice(idx, 1);
                            copy.unshift(item);
                            return copy;
                          });
                        }}
                      >
                        Set cover
                      </button>
                    )}
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => removeShot(shot.key)}>
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
            <h3 className="font-display text-sm font-semibold text-brand sm:col-span-2">Demo details</h3>
            {field('Demo URL', 'demoUrl')}
            {field('Video URL', 'videoUrl')}
            {field('Demo username', 'demoUsername')}
            {field('Demo password', 'demoPassword')}
            <div className="sm:col-span-2">{field('Demo notes', 'demoNotes')}</div>
            <label className="flex items-center gap-2 text-sm text-brand">
              <input
                type="checkbox"
                checked={form.liveDemoAvailable}
                onChange={(e) => update('liveDemoAvailable', e.target.checked)}
                className="h-4 w-4 accent-brand"
              />
              Live demo available
            </label>
            <label className="flex items-center gap-2 text-sm text-brand">
              <input
                type="checkbox"
                checked={form.customizable}
                onChange={(e) => update('customizable', e.target.checked)}
                className="h-4 w-4 accent-brand"
              />
              Customizable (show Request customization)
            </label>
            <label className="flex items-center gap-2 text-sm text-brand">
              <input
                type="checkbox"
                checked={form.buyNowEnabled}
                onChange={(e) => update('buyNowEnabled', e.target.checked)}
                className="h-4 w-4 accent-brand"
              />
              Enable Buy Now (requires fixed price amount)
            </label>
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl border border-line bg-card p-5 sm:grid-cols-2 sm:p-6">
          <h2 className="font-display text-base font-semibold text-brand sm:col-span-2">
            Pricing, Buy Now & SEO
          </h2>
          {field('Fixed Buy Now price (₹)', 'priceAmount', { type: 'number' })}
          {field('Delivery / access URL (after pay)', 'deliveryAccessUrl')}
          {field('Delivery zip / package URL', 'deliveryZipUrl')}
          {field('License key (shown after pay)', 'deliveryLicenseKey')}
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-muted">Delivery instructions</span>
            <textarea
              value={form.deliveryInstructions}
              onChange={(e) => setForm((f) => ({ ...f, deliveryInstructions: e.target.value }))}
              rows={2}
              className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          {field('Price display text', 'priceDisplay')}
          {field('Min price', 'priceMin', { type: 'number' })}
          {field('Max price', 'priceMax', { type: 'number' })}
          {field('SEO meta title', 'metaTitle')}
          {field('SEO meta description', 'metaDescription')}
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-brand">Status</span>
            <select
              value={form.status}
              onChange={(e) => update('status', e.target.value)}
              className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm"
            >
              {['draft', 'published', 'featured', 'archived'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-brand">Owner type</span>
            <select
              value={form.ownerType}
              onChange={(e) => update('ownerType', e.target.value)}
              className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm"
            >
              <option value="company">Company</option>
              <option value="developer">Developer</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-brand sm:col-span-2">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => update('featured', e.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            Featured on homepage
          </label>
        </section>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        {msg && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{msg}</p>}

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saveMutation.isPending || uploading} className="btn btn-brand btn-lg disabled:opacity-60">
            {saveMutation.isPending ? 'Saving...' : 'Save project'}
          </button>
          {!isNew && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Delete this project?')) deleteMutation.mutate();
              }}
              className="btn btn-danger btn-lg"
            >
              Delete
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
