import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { createDirectoryUser } from '../../services/api';
import { useDashboardBase } from '../../context/DashboardBaseContext';
import { useAuthStore } from '../../store/authStore';
import { ErrorBox, PageHeader, SoftButton } from '../../components/dashboard/DashboardUI';

const ROLE_OPTIONS = {
  super_admin: [
    { value: 'super_admin', label: 'Master Admin' },
    { value: 'admin', label: 'Admin' },
    { value: 'support_agent', label: 'Support Agent' },
    { value: 'developer', label: 'Developer' },
    { value: 'client', label: 'Client' },
  ],
  admin: [
    { value: 'support_agent', label: 'Support Agent' },
    { value: 'developer', label: 'Developer' },
    { value: 'client', label: 'Client' },
  ],
};

export default function CreateStaffUserPage() {
  const base = useDashboardBase();
  const navigate = useNavigate();
  const actorRole = useAuthStore((s) => s.user?.role);
  const options = useMemo(() => ROLE_OPTIONS[actorRole] || ROLE_OPTIONS.admin, [actorRole]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: options[0]?.value || 'support_agent',
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: createDirectoryUser,
    onSuccess: (res) => {
      const id = res.data.data?.id || res.data.data?._id;
      navigate(id ? `${base}/users/${id}` : `${base}/users`);
    },
    onError: (e) => setError(e?.response?.data?.message || 'Could not create user'),
  });

  if (!['admin', 'super_admin'].includes(actorRole)) {
    return <ErrorBox message="Only Admin or Master Admin can create users" />;
  }

  return (
    <div>
      <PageHeader
        title="Create user"
        subtitle={
          actorRole === 'super_admin'
            ? 'Master Admin can create Master Admins, Admins, Support Agents, Developers and Clients.'
            : 'Admin can create Support Agents, Developers and Clients — not Admins or Master Admins.'
        }
        actions={
          <Link to={`${base}/users`} className="btn btn-outline btn-sm">
            Cancel
          </Link>
        }
      />

      {error ? (
        <div className="mb-4">
          <ErrorBox message={error} />
        </div>
      ) : null}

      <form
        className="max-w-xl space-y-3 rounded-2xl border border-line bg-card p-4 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          setError('');
          mutation.mutate(form);
        }}
      >
        <label className="block text-sm">
          <span className="mb-1 block text-muted">Role</span>
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm"
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        {['name', 'email', 'phone', 'password'].map((key) => (
          <label key={key} className="block text-sm">
            <span className="mb-1 block capitalize text-muted">{key}</span>
            <input
              required={key !== 'phone'}
              type={key === 'password' ? 'password' : key === 'email' ? 'email' : 'text'}
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm"
            />
          </label>
        ))}
        <SoftButton type="submit" variant="primary" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating…' : 'Create user'}
        </SoftButton>
      </form>
    </div>
  );
}
