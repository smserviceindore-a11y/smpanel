import { useState } from 'react';
import { createAdminUser } from '../../services/api';
import { PageHeader } from '../../components/dashboard/DashboardUI';

export default function SuperAdminCreateAdminPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    setError('');
    try {
      const res = await createAdminUser(form);
      setMsg(`Admin created: ${res.data.data.email}`);
      setForm({ name: '', email: '', phone: '', password: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        title="Create Admin"
        subtitle="Only Super Admin can provision platform ops accounts."
      />

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-2xl border border-line bg-card p-5 shadow-[0_1px_0_rgba(15,61,62,0.04)] sm:p-6"
      >
        {['name', 'email', 'phone', 'password'].map((key) => (
          <label key={key} className="block text-sm">
            <span className="mb-1.5 block font-medium capitalize text-brand">{key}</span>
            <input
              required={key !== 'phone'}
              type={key === 'password' ? 'password' : key === 'email' ? 'email' : 'text'}
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </label>
        ))}
        {msg && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{msg}</p>}
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-deep disabled:opacity-60"
        >
          {loading ? 'Creating...' : 'Create admin user'}
        </button>
      </form>
    </div>
  );
}
