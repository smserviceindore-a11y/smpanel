import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSuperUsers, updateSuperUser } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import ListToolbar, { FilterSelect } from '../../components/dashboard/ListToolbar';
import {
  EmptyState,
  EntityCard,
  ErrorBox,
  PageHeader,
  SoftButton,
  StatusPill,
} from '../../components/dashboard/DashboardUI';

const PAGE_SIZE = 20;

export default function SuperAdminUsersPage() {
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);
  const queryClient = useQueryClient();

  useEffect(() => {
    setPage(1);
  }, [role, debouncedSearch]);

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(role ? { role } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }),
    [page, role, debouncedSearch]
  );

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['super-admin', 'users', params],
    queryFn: async () => (await getSuperUsers(params)).data,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: ({ id, body }) => updateSuperUser(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['super-admin', 'users'] }),
  });

  const users = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <div>
      <PageHeader
        title="Users & Roles"
        subtitle="Suspend accounts, verify developers, adjust commission."
      />

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name or email…"
        filters={
          <FilterSelect value={role} onChange={setRole}>
            <option value="">All roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="developer">Developer</option>
            <option value="client">Client</option>
          </FilterSelect>
        }
        actions={
          <span className="text-xs text-muted">
            {pagination.total ?? 0} users
            {isFetching && !isLoading ? ' · updating…' : ''}
          </span>
        }
      />

      {isLoading && <Spinner />}
      {isError && <ErrorBox message="Failed to load users" />}

      {!isLoading && !isError && (
        <>
          {users.length === 0 && <EmptyState text="No users found" />}

          <div className="space-y-3 md:hidden">
            {users.map((u) => (
              <EntityCard key={u.id}>
                <div className="font-semibold text-brand">{u.name}</div>
                <div className="mt-1 break-all text-xs text-muted">{u.email}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusPill value={u.role?.replace(/_/g, ' ')} />
                  <StatusPill value={u.status} />
                  <StatusPill value={u.verificationStatus} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {u.role === 'developer' && (
                    <>
                      <SoftButton
                        variant="primary"
                        onClick={() =>
                          mutation.mutate({ id: u.id, body: { verificationStatus: 'verified' } })
                        }
                      >
                        Verify
                      </SoftButton>
                      <SoftButton
                        variant="danger"
                        onClick={() =>
                          mutation.mutate({ id: u.id, body: { verificationStatus: 'rejected' } })
                        }
                      >
                        Reject
                      </SoftButton>
                    </>
                  )}
                  <SoftButton
                    onClick={() =>
                      mutation.mutate({
                        id: u.id,
                        body: { status: u.status === 'active' ? 'suspended' : 'active' },
                      })
                    }
                  >
                    {u.status === 'active' ? 'Suspend' : 'Activate'}
                  </SoftButton>
                </div>
              </EntityCard>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-2xl border border-line bg-card md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-line bg-mist/50 text-[11px] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3.5 font-semibold">User</th>
                    <th className="px-4 py-3.5 font-semibold">Role</th>
                    <th className="px-4 py-3.5 font-semibold">Status</th>
                    <th className="px-4 py-3.5 font-semibold">Verification</th>
                    <th className="px-4 py-3.5 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-line/70 last:border-0">
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-brand">{u.name}</div>
                        <div className="text-xs text-muted">{u.email}</div>
                      </td>
                      <td className="px-4 py-3.5 capitalize text-muted">
                        {u.role?.replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusPill value={u.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusPill value={u.verificationStatus} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1.5">
                          {u.role === 'developer' && (
                            <>
                              <SoftButton
                                variant="primary"
                                onClick={() =>
                                  mutation.mutate({
                                    id: u.id,
                                    body: { verificationStatus: 'verified' },
                                  })
                                }
                              >
                                Verify
                              </SoftButton>
                              <SoftButton
                                variant="danger"
                                onClick={() =>
                                  mutation.mutate({
                                    id: u.id,
                                    body: { verificationStatus: 'rejected' },
                                  })
                                }
                              >
                                Reject
                              </SoftButton>
                              <SoftButton
                                onClick={() =>
                                  mutation.mutate({ id: u.id, body: { commissionRate: 30 } })
                                }
                              >
                                30% commission
                              </SoftButton>
                            </>
                          )}
                          <SoftButton
                            onClick={() =>
                              mutation.mutate({
                                id: u.id,
                                body: { status: u.status === 'active' ? 'suspended' : 'active' },
                              })
                            }
                          >
                            {u.status === 'active' ? 'Suspend' : 'Activate'}
                          </SoftButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

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
