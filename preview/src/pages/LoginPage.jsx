import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { loginUser, registerUser } from '../services/api';
import { useAuthStore, roleHome } from '../store/authStore';

  const demos = [
  { role: 'Super Admin', email: 'superadmin@smglobal.com', password: 'Super@2026' },
  { role: 'Admin', email: 'ops@smglobal.com', password: 'Admin@2026' },
  { role: 'Support Agent', email: 'support@smglobal.com', password: 'Support@2026' },
  { role: 'Developer', email: 'rahul.dev@smglobalhub.com', password: 'Dev@2026' },
  { role: 'Client / Buyer', email: 'client@demo.com', password: 'Client@2026' },
];

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    company: '',
    role: 'client',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const finish = (token, user, path) => {
    setAuth(token, user);
    const home = path || roleHome(user.role);
    const from = location.state?.from;
    const roleOk =
      (user.role === 'super_admin' && from?.startsWith('/super-admin')) ||
      (user.role === 'admin' && from?.startsWith('/admin') && !from?.startsWith('/super-admin')) ||
      (user.role === 'support_agent' && from?.startsWith('/support')) ||
      (user.role === 'developer' && from?.startsWith('/developer')) ||
      (user.role === 'client' && from?.startsWith('/client'));
    navigate(roleOk ? from : home, { replace: true });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        const res = await loginUser({ email: form.email, password: form.password });
        const { token, user, dashboardPath } = res.data.data;
        finish(token, user, dashboardPath);
      } else {
        const res = await registerUser({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone,
          company: form.company,
          role: form.role,
        });
        const { token, user, dashboardPath } = res.data.data;
        finish(token, user, dashboardPath);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (email, password) => {
    setLoading(true);
    setError('');
    try {
      const res = await loginUser({ email, password });
      const { token, user, dashboardPath } = res.data.data;
      finish(token, user, dashboardPath);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.get('mode') === 'register') setMode('register');
  }, [params]);

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:gap-8 sm:py-12 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-brand sm:text-3xl">
          {mode === 'login' ? 'Sign in to your dashboard' : 'Create an account'}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Separate workspaces for Super Admin, Admin, Developer and Client (buyer).
        </p>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${mode === 'login' ? 'bg-brand text-white' : 'bg-card text-muted ring-1 ring-line'}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${mode === 'register' ? 'bg-brand text-white' : 'bg-card text-muted ring-1 ring-line'}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-line bg-card p-5 shadow-[0_1px_0_rgba(15,61,62,0.04)] sm:p-6">
          {mode === 'register' && (
            <>
              <Field label="Full name *" value={form.name} onChange={(v) => update('name', v)} required />
              <Field label="Phone" value={form.phone} onChange={(v) => update('phone', v)} />
              <Field label="Company" value={form.company} onChange={(v) => update('company', v)} />
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-brand">Register as</span>
                <select
                  value={form.role}
                  onChange={(e) => update('role', e.target.value)}
                  className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm"
                >
                  <option value="client">Client / Buyer</option>
                  <option value="developer">Developer</option>
                </select>
              </label>
            </>
          )}
          <Field label="Email *" type="email" value={form.email} onChange={(v) => update('email', v)} required />
          <Field label="Password *" type="password" value={form.password} onChange={(v) => update('password', v)} required />

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-deep disabled:opacity-60"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>

      <aside className="h-fit rounded-2xl border border-line bg-card p-5 shadow-[0_1px_0_rgba(15,61,62,0.04)] sm:p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-lg font-semibold text-brand">Demo accounts</h2>
        <p className="mt-1 text-xs text-muted">One-click login for college demo testing</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {demos.map((d) => (
            <button
              key={d.email}
              type="button"
              disabled={loading}
              onClick={() => quickLogin(d.email, d.password)}
              className="w-full rounded-xl border border-line px-4 py-3 text-left transition hover:border-accent hover:bg-sand disabled:opacity-60"
            >
              <div className="text-sm font-semibold text-brand">{d.role}</div>
              <div className="mt-0.5 break-all text-xs text-muted">{d.email}</div>
            </button>
          ))}
        </div>
        <Link to="/" className="mt-6 inline-block text-sm font-medium text-accent hover:underline">
          ← Back to marketplace
        </Link>
      </aside>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-brand">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
      />
    </label>
  );
}
