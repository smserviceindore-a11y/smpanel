import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getCategories, submitDeveloperProject, uploadImage } from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import { ErrorBox, PageHeader, SoftButton } from '../../components/dashboard/DashboardUI';

const empty = {
  title: '',
  shortDescription: '',
  description: '',
  industry: '',
  projectType: '',
  technologies: '',
  features: '',
  category: '',
  demoUrl: '',
  priceDisplay: '',
  priceAmount: '',
  buyNowEnabled: false,
  deliveryAccessUrl: '',
  deliveryZipUrl: '',
  deliveryLicenseKey: '',
  deliveryInstructions: '',
};

export default function DeveloperProjectSubmitPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(empty);
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const catsQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await getCategories()).data.data,
    staleTime: 5 * 60_000,
  });

  const mutation = useMutation({
    mutationFn: (payload) => submitDeveloperProject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developer', 'projects'] });
      navigate('/developer/projects');
    },
    onError: (err) => {
      setError(err?.response?.data?.message || 'Could not submit project');
    },
  });

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const res = await uploadImage(file);
      setScreenshotUrl(res.data.data.url);
    } catch {
      setError('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    mutation.mutate({
      title: form.title.trim(),
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
      industry: form.industry.trim(),
      projectType: form.projectType.trim(),
      technologies: form.technologies
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      features: form.features
        .split('\n')
        .map((t) => t.trim())
        .filter(Boolean),
      category: form.category || undefined,
      demoUrl: form.demoUrl.trim() || undefined,
      buyNowEnabled: Boolean(form.buyNowEnabled) && Number(form.priceAmount) > 0,
      deliveryAccessUrl: form.deliveryAccessUrl.trim() || undefined,
      deliveryZipUrl: form.deliveryZipUrl.trim() || undefined,
      deliveryLicenseKey: form.deliveryLicenseKey.trim() || undefined,
      deliveryInstructions: form.deliveryInstructions.trim() || undefined,
      price: {
        displayText: form.priceDisplay.trim() || undefined,
        amount: form.priceAmount === '' ? undefined : Number(form.priceAmount),
        currency: 'INR',
      },
      screenshots: screenshotUrl ? [{ url: screenshotUrl, caption: 'Screenshot', order: 0 }] : [],
      status: 'draft',
    });
  };

  return (
    <div>
      <PageHeader
        title="Submit project"
        subtitle="Your listing is saved as draft. Admin reviews and publishes to the marketplace."
        actions={
          <Link to="/developer/projects" className="btn btn-outline btn-sm">
            Back
          </Link>
        }
      />

      {error ? (
        <div className="mb-4">
          <ErrorBox message={error} />
        </div>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-2xl border border-line bg-card p-4 sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium text-muted">Title *</span>
            <input
              required
              value={form.title}
              onChange={setField('title')}
              className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium text-muted">Short description</span>
            <input
              value={form.shortDescription}
              onChange={setField('shortDescription')}
              maxLength={200}
              className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium text-muted">Full description</span>
            <textarea
              rows={4}
              value={form.description}
              onChange={setField('description')}
              className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-muted">Industry</span>
            <input
              value={form.industry}
              onChange={setField('industry')}
              placeholder="e.g. Education, Retail"
              className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-muted">Project type</span>
            <input
              value={form.projectType}
              onChange={setField('projectType')}
              placeholder="e.g. ERP, CRM"
              className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-muted">Category</span>
            <select
              value={form.category}
              onChange={setField('category')}
              className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
            >
              <option value="">Select…</option>
              {(catsQuery.data || []).map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-muted">Price display</span>
            <input
              value={form.priceDisplay}
              onChange={setField('priceDisplay')}
              placeholder="e.g. Starting ₹49,999"
              className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-muted">Fixed Buy Now price (₹)</span>
            <input
              type="number"
              value={form.priceAmount}
              onChange={setField('priceAmount')}
              className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-brand sm:col-span-2">
            <input
              type="checkbox"
              checked={form.buyNowEnabled}
              onChange={(e) => setForm((f) => ({ ...f, buyNowEnabled: e.target.checked }))}
            />
            Enable Buy Now (requires fixed price; admin must publish)
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium text-muted">Delivery / access URL (optional)</span>
            <input
              value={form.deliveryAccessUrl}
              onChange={setField('deliveryAccessUrl')}
              placeholder="https://…"
              className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium text-muted">Delivery zip URL</span>
            <input
              value={form.deliveryZipUrl}
              onChange={setField('deliveryZipUrl')}
              placeholder="https://…/package.zip"
              className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium text-muted">License key</span>
            <input
              value={form.deliveryLicenseKey}
              onChange={setField('deliveryLicenseKey')}
              className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium text-muted">Delivery instructions</span>
            <textarea
              rows={2}
              value={form.deliveryInstructions}
              onChange={setField('deliveryInstructions')}
              className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium text-muted">Technologies (comma separated)</span>
            <input
              value={form.technologies}
              onChange={setField('technologies')}
              className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium text-muted">Features (one per line)</span>
            <textarea
              rows={4}
              value={form.features}
              onChange={setField('features')}
              className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium text-muted">Demo URL</span>
            <input
              value={form.demoUrl}
              onChange={setField('demoUrl')}
              className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-muted">Cover screenshot</span>
            <input type="file" accept="image/*" onChange={onFile} className="text-sm" />
            {uploading ? <div className="mt-2"><Spinner label="Uploading…" /></div> : null}
            {screenshotUrl ? (
              <img
                src={screenshotUrl}
                alt=""
                className="mt-3 h-28 w-44 rounded-lg object-cover ring-1 ring-line"
              />
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <SoftButton type="submit" variant="primary" disabled={mutation.isPending || uploading}>
            {mutation.isPending ? 'Submitting…' : 'Submit as draft'}
          </SoftButton>
        </div>
      </form>
    </div>
  );
}
