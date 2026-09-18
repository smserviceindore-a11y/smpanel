import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminSupportTicket, getAdminSupportTickets, updateAdminSupportTicket } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import ListToolbar, { FilterSelect } from '../../components/dashboard/ListToolbar';
import ReportTable from '../../components/dashboard/ReportTable';
import {
  ErrorBox,
  PageHeader,
  SoftButton,
  StatusPill,
} from '../../components/dashboard/DashboardUI';

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

export default function AdminSupportPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('open');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState('');
  const [reply, setReply] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    setPage(1);
  }, [status, debouncedSearch]);

  const params = useMemo(
    () => ({
      page,
      limit: 10,
      ...(status ? { status } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    }),
    [page, status, debouncedSearch]
  );

  const listQuery = useQuery({
    queryKey: ['admin', 'support', params],
    queryFn: async () => (await getAdminSupportTickets(params)).data,
    placeholderData: (prev) => prev,
  });

  const detailQuery = useQuery({
    queryKey: ['admin', 'support', selectedId],
    queryFn: async () => (await getAdminSupportTicket(selectedId)).data.data,
    enabled: Boolean(selectedId),
  });

  const mutation = useMutation({
    mutationFn: ({ id, ...body }) => updateAdminSupportTicket(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'support'] });
      setReply('');
    },
  });

  const rows = listQuery.data?.data || [];
  const pagination = listQuery.data?.pagination || { page: 1, totalPages: 1, total: 0 };
  const ticket = detailQuery.data;

  if (listQuery.isLoading && !listQuery.data) return <Spinner label="Loading tickets…" />;
  if (listQuery.isError) return <ErrorBox message="Failed to load support tickets" />;

  return (
    <div>
      <PageHeader
        title="Support tickets"
        subtitle="Reply and update status for client/developer tickets. Public Contact form stays separate."
      />

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search subject…"
        filters={
          <FilterSelect value={status} onChange={setStatus}>
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </FilterSelect>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <ReportTable
            emptyText="No tickets"
            rows={rows}
            columns={[
              {
                key: 'ticket',
                label: 'Ticket',
                render: (t) => (
                  <button
                    type="button"
                    className={`text-left font-semibold hover:text-accent ${
                      selectedId === t._id ? 'text-accent' : 'text-brand'
                    }`}
                    onClick={() => setSelectedId(t._id)}
                  >
                    {t.ticketId}
                  </button>
                ),
              },
              {
                key: 'subject',
                label: 'Subject',
                render: (t) => (
                  <button
                    type="button"
                    className="line-clamp-1 max-w-[160px] text-left hover:text-accent"
                    title={t.subject}
                    onClick={() => setSelectedId(t._id)}
                  >
                    {t.subject}
                  </button>
                ),
              },
              {
                key: 'user',
                label: 'User',
                render: (t) => (
                  <span className="text-xs text-muted">
                    {t.userId?.name || t.userId?.email || 'User'}
                  </span>
                ),
              },
              {
                key: 'status',
                label: 'Status',
                render: (t) => <StatusPill value={t.status} />,
              },
            ]}
          />
          <Pagination
            page={pagination.page || page}
            totalPages={pagination.totalPages || 1}
            total={pagination.total}
            onChange={setPage}
          />
        </div>

        <div className="rounded-2xl border border-line bg-card p-4 sm:p-5">
          {!selectedId ? (
            <p className="text-sm text-muted">Select a ticket to reply.</p>
          ) : detailQuery.isLoading ? (
            <Spinner label="Loading…" />
          ) : !ticket ? (
            <ErrorBox message="Ticket not found" />
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-display text-lg font-semibold text-brand">{ticket.subject}</h3>
                <p className="mt-1 text-sm text-muted">
                  {ticket.ticketId} · {ticket.category}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-brand">
                  {ticket.messages?.[0]?.body || '—'}
                </p>
              </div>

              <div className="max-h-64 space-y-2 overflow-y-auto border-t border-line pt-3">
                {(ticket.messages || []).map((m, i) => (
                  <div key={i} className="rounded-xl bg-sand px-3 py-2 text-sm">
                    <div className="text-xs text-muted">
                      {m.senderId?.role || m.senderId?.name || 'user'}
                    </div>
                    <div className="whitespace-pre-wrap text-brand">{m.body}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <SoftButton
                    key={s}
                    disabled={mutation.isPending || ticket.status === s}
                    onClick={() => mutation.mutate({ id: ticket._id, status: s })}
                  >
                    {s}
                  </SoftButton>
                ))}
              </div>

              <textarea
                rows={3}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Reply…"
                className="w-full rounded-xl border border-line bg-sand px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <SoftButton
                variant="primary"
                disabled={!reply.trim() || mutation.isPending}
                onClick={() =>
                  mutation.mutate({ id: ticket._id, body: reply.trim(), status: 'in_progress' })
                }
              >
                Send reply
              </SoftButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
