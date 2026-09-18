import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginAdmin } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('admin@smglobal.com');
  const [password, setPassword] = useState('SmGlobal@2026');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const location = useLocation();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await loginAdmin({ email, password });
      const { token, user } = res.data.data;
      setAuth(token, user);
      navigate(location.state?.from || '/admin', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <form onSubmit={onSubmit} className="w-full rounded-2xl border border-line bg-card p-8 shadow-sm">
        <h1 className="font-display text-2xl font-semibold text-brand">Admin Login</h1>
        <p className="mt-2 text-sm text-muted">Manage projects and leads</p>

        <label className="mt-6 block text-sm">
          <span className="mb-1.5 block font-medium">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 outline-none focus:border-accent"
          />
        </label>

        <label className="mt-4 block text-sm">
          <span className="mb-1.5 block font-medium">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 outline-none focus:border-accent"
          />
        </label>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
