import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { submitRequirement } from '../services/api';
import ProjectCard from '../components/projects/ProjectCard';

const empty = {
  name: '',
  company: '',
  email: '',
  mobile: '',
  industry: '',
  location: '',
  projectType: '',
  modulesText: '',
  numUsers: '',
  needsWeb: true,
  needsMobile: false,
  needsERP: false,
  needsAI: false,
  budget: '',
  timeline: '',
  additionalNotes: '',
};

export default function RequirementPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(empty);
  const [result, setResult] = useState(null);

  const mutation = useMutation({
    mutationFn: async (payload) => (await submitRequirement(payload)).data,
    onSuccess: (res) => setResult(res.data),
  });

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = (e) => {
    e.preventDefault();
    mutation.mutate({
      name: form.name,
      company: form.company,
      email: form.email,
      mobile: form.mobile,
      industry: form.industry,
      location: form.location,
      projectType: form.projectType,
      modules: form.modulesText
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean),
      numUsers: form.numUsers ? Number(form.numUsers) : undefined,
      needsWeb: form.needsWeb,
      needsMobile: form.needsMobile,
      needsERP: form.needsERP,
      needsAI: form.needsAI,
      budget: form.budget,
      timeline: form.timeline,
      additionalNotes: form.additionalNotes,
    });
  };

  if (result) {
    const recommended = (result.recommendedProjects || [])
      .map((r) => r.projectId)
      .filter(Boolean);

    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-2xl border border-accent/30 bg-card p-8 text-center">
          <h1 className="font-display text-3xl font-semibold text-brand">Requirement submitted</h1>
          <p className="mt-3 text-muted">
            Your lead ID is <strong className="text-brand">{result.leadId}</strong>. Our team will contact you soon.
          </p>
          <Link to="/projects" className="mt-6 inline-block text-sm font-semibold text-accent">
            Browse more projects →
          </Link>
        </div>

        {recommended.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display mb-4 text-xl font-semibold text-brand">Recommended Solutions</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {recommended.map((p) => (
                <ProjectCard key={p._id || p.slug} project={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-3xl font-semibold text-brand">Tell Us What You Need</h1>
      <p className="mt-2 text-sm text-muted">
        Share your requirement — we will match existing solutions and contact you.
      </p>

      <div className="mt-6 flex gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
        {[1, 2, 3].map((s) => (
          <span
            key={s}
            className={`rounded-full px-3 py-1 ${step === s ? 'bg-brand text-white' : 'bg-mist'}`}
          >
            Step {s}
          </span>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-line bg-card p-6">
        {step === 1 && (
          <>
            <Field label="Name *" value={form.name} onChange={(v) => update('name', v)} required />
            <Field label="Company" value={form.company} onChange={(v) => update('company', v)} />
            <Field label="Email *" type="email" value={form.email} onChange={(v) => update('email', v)} required />
            <Field label="Mobile *" value={form.mobile} onChange={(v) => update('mobile', v)} required />
            <Field label="Industry" value={form.industry} onChange={(v) => update('industry', v)} />
            <Field label="Location" value={form.location} onChange={(v) => update('location', v)} />
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white"
            >
              Continue
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="Project type" value={form.projectType} onChange={(v) => update('projectType', v)} placeholder="ERP, HRMS, CRM..." />
            <Field
              label="Required modules (comma separated)"
              value={form.modulesText}
              onChange={(v) => update('modulesText', v)}
              placeholder="Inventory, Payroll, Attendance"
            />
            <Field label="Number of users" type="number" value={form.numUsers} onChange={(v) => update('numUsers', v)} />
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['needsWeb', 'Web application'],
                ['needsMobile', 'Mobile application'],
                ['needsERP', 'ERP'],
                ['needsAI', 'AI solution'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => update(key, e.target.checked)}
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-xl border border-line py-3 text-sm">
                Back
              </button>
              <button type="button" onClick={() => setStep(3)} className="flex-1 rounded-xl bg-brand py-3 text-sm font-semibold text-white">
                Continue
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <Field label="Budget" value={form.budget} onChange={(v) => update('budget', v)} placeholder="₹2,00,000 - ₹5,00,000" />
            <Field label="Expected timeline" value={form.timeline} onChange={(v) => update('timeline', v)} placeholder="2-3 months" />
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-brand">Additional requirements</span>
              <textarea
                value={form.additionalNotes}
                onChange={(e) => update('additionalNotes', e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </label>
            {mutation.isError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {mutation.error?.response?.data?.message || 'Submit failed'}
              </p>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(2)} className="flex-1 rounded-xl border border-line py-3 text-sm">
                Back
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1 rounded-xl bg-accent py-3 text-sm font-semibold text-brand-deep disabled:opacity-60"
              >
                {mutation.isPending ? 'Submitting...' : 'Submit Requirement'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required, placeholder }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-brand">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
      />
    </label>
  );
}
