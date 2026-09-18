import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDirectoryUsers } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import { useDashboardBase } from '../../context/DashboardBaseContext';
import { useAuthStore } from '../../store/authStore';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import ListToolbar, { FilterSelect } from '../../components/dashboard/ListToolbar';
import ReportTable from '../../components/dashboard/ReportTable';
import {
  ErrorBox,
  PageHeader,
  StatusPill,
} from '../../components/dashboard/DashboardUI';

const ROLE_TABS = {
  super_admin: [
    { key: '', label: 'All' },
    { key: 'super_admin', label: 'Master Admins' },
    { key: 'admin', label: 'Admins' },
    { key: 'support_agent', label: 'Support team' },
    { key: 'developer', label: 'Developers' },
    { key: 'client', label: 'Clients' },
  ],
  admin: [
    { key: '', label: 'All' },
    { key: 'support_agent', label: 'Support team' },
    { key: 'developer', label: 'Developers' },
    { key: 'client', label: 'Clients' },
  ],
  support_agent: [
    { key: '', label: 'All' },
    { key: 'developer', label: 'Developers' },
    { key: 'client', label: 'Clients' },
  ],
};

/**
 * @param {{ forcedRole?: string, title?: string, subtitle?: string }} props
 */
export default function UsersDirectoryPage({
  forcedRole = '',
  title = 'Users',
  subtitle = 'Role-filtered directory. Click a name for full overview.',
}) {
  const base = useDashboardBase();
  const actorRole = useAuthStore((s) => s.user?.role) || 'admin';
  const tabs = ROLE_TABS[actorRole] || ROLE_TABS.admin;
  const [role, setRole] = useState(forcedRole || '');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    if (forcedRole) setRole(forcedRole);
  }, [forcedRole]);

  useEffect(() => {
    setPage(1);
  }, [role, debouncedSearch]);

  const params = useMemo(
    () => ({
      page,
      limit: 10,
      ...(role ? { role } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }),
    [page, role, debouncedSearch]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ['directory', 'users', params, actorRole],
    queryFn: async () => (await getDirectoryUsers(params)).data,
    placeholderData: (prev) => prev,
  });

  const users = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, byRole: {} };
  const byRole = pagination.byRole || {};
  const canCreate = ['admin', 'super_admin'].includes(actorRole);

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          canCreate ? (
            <Link to={`${base}/users/create`} className="btn btn-brand btn-sm">
              Create user
            </Link>
          ) : null
        }
      />

      {!forcedRole ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.key || 'all'}
              type="button"
              onClick={() => setRole(t.key)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                role === t.key
                  ? 'bg-brand text-white'
                  : 'border border-line bg-card text-brand hover:border-accent'
              }`}
            >
              {t.label}
              {t.key && byRole[t.key] != null ? ` (${byRole[t.key]})` : ''}
            </button>
          ))}
        </div>
      ) : null}

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name or email…"
        filters={
          !forcedRole ? (
            <FilterSelect value={role} onChange={setRole}>
              {tabs.map((t) => (
                <option key={t.key || 'all'} value={t.key}>
                  {t.label}
                </option>
              ))}
            </FilterSelect>
          ) : null
        }
      />

      {isLoading && <Spinner />}
      {isError && <ErrorBox message="Failed to load users" />}

      {!isLoading && !isError && (
        <>
          <ReportTable
            emptyText="No users in this category"
            rows={users}
            rowKey="id"
            columns={[
              {
                key: 'name',
                label: 'Name',
                render: (u) => (
                  <Link
                    to={`${base}/users/${u.id || u._id}`}
                    className="font-semibold text-brand hover:text-accent"
                  >
                    {u.name}
                  </Link>
                ),
              },
              { key: 'email', label: 'Email' },
              {
                key: 'role',
                label: 'Role',
                render: (u) => <StatusPill value={u.role?.replace(/_/g, ' ')} />,
              },
              {
                key: 'status',
                label: 'Status',
                render: (u) => <StatusPill value={u.status} />,
              },
              {
                key: 'verification',
                label: 'Verification',
                render: (u) =>
                  u.role === 'developer' ? (
                    <StatusPill value={u.verificationStatus} />
                  ) : (
                    '—'
                  ),
              },
              {
                key: 'actions',
                label: 'Actions',
                align: 'right',
                render: (u) => (
                  <Link to={`${base}/users/${u.id || u._id}`} className="btn btn-outline btn-sm">
                    Open
                  </Link>
                ),
              },
            ]}
          />
          <Pagination
            page={pagination.page || page}
            totalPages={pagination.totalPages || 1}
            total={pagination.total}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}
