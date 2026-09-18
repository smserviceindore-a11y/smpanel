import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getProjectBySlug, submitCustomization } from '../services/api';
import Spinner from '../components/ui/Spinner';

export default function CustomizePage() {
  const { slug } = useParams();
  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    mobile: '',
    additionalRequirements: '',
    budget: '',
    timeline: '',
  });
  const [leadId, setLeadId] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['project', slug],
    queryFn: async () => (await getProjectBySlug(slug)).data,
  });

  const project = data?.data;
  const modules = useMemo(() => project?.features || [], [project]);

  const mutation = useMutation({
    mutationFn: async (payload) => (await submitCustomization(payload)).data,
    onSuccess: (res) => setLeadId(res.data?.leadId),
  });

  const toggle = (mod) => {
    setSelected((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  const onSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      ...form,
      projectId: project._id,
      selectedModules: selected,
    });
  };

  if (isLoading) return <Spinner />;
  if (isError || !project) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-muted">Project not found.</p>
        <Link to="/projects" className="mt-3 inline-block text-accent">Back</Link>
      </div>
    );
  }

  if (leadId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-accent/30 bg-card p-8">
          <h1 className="font-display text-2xl font-semibold text-brand">Customization request sent</h1>
          <p className="mt-3 text-muted">
            Request ID <strong>{leadId}</strong> for <strong>{project.title}</strong>.
          </p>
          <Link to={`/projects/${project.slug}`} className="mt-6 inline-block text-sm text-accent">
            Back to project
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent">Customize</p>
      <h1 className="font-display mt-1 text-3xl font-semibold text-brand">{project.title}</h1>
      <p className="mt-2 text-sm text-muted">Select modules and share your business requirements.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-5 rounded-2xl border border-line bg-card p-6">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-brand">Select modules</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {modules.map((mod) => (
              <label key={mod} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(mod)}
                  onChange={() => toggle(mod)}
                />
                {mod}
              </label>
            ))}
          </div>
        </div>

        {['name', 'company', 'email', 'mobile', 'budget', 'timeline'].map((key) => (
          <label key={key} className="block text-sm">
            <span className="mb-1.5 block font-medium capitalize text-brand">
              {key === 'name' || key === 'email' || key === 'mobile' ? `${key} *` : key}
            </span>
            <input
              required={['name', 'email', 'mobile'].includes(key)}
              type={key === 'email' ? 'email' : 'text'}
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
        ))}

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-brand">Additional requirements</span>
          <textarea
            rows={4}
            value={form.additionalRequirements}
            onChange={(e) => setForm((f) => ({ ...f, additionalRequirements: e.target.value }))}
            className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
          />
        </label>

        {mutation.isError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {mutation.error?.response?.data?.message || 'Submit failed'}
          </p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {mutation.isPending ? 'Submitting...' : 'Submit Customization Request'}
        </button>
      </form>
    </div>
  );
}
