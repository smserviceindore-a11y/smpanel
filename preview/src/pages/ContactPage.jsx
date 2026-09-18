import { useState } from 'react';
import { submitContact } from '../services/api';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await submitContact(form);
      setDone(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Contact</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-brand sm:text-4xl">
        Talk to SM Global
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Questions about a demo, customization, or partnership? Send a message — our ops team responds
        on business days.
      </p>

      {done ? (
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-8 text-center text-sm text-emerald-900">
          Message received. We will get back to you soon.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-line bg-card p-5 sm:p-6">
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-muted">Name *</span>
              <input
                required
                value={form.name}
                onChange={update('name')}
                className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-muted">Email *</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={update('email')}
                className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-muted">Phone</span>
              <input
                value={form.phone}
                onChange={update('phone')}
                className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-muted">Subject</span>
              <input
                value={form.subject}
                onChange={update('subject')}
                className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-muted">Message *</span>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={update('message')}
              className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
          <button type="submit" disabled={loading} className="btn btn-accent btn-md disabled:opacity-50">
            {loading ? 'Sending…' : 'Send message'}
          </button>
        </form>
      )}
    </div>
  );
}
