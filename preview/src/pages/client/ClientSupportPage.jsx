import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSupportTicket,
  getMySupportTicket,
  getMySupportTickets,
  replyMySupportTicket,
} from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import ReportTable from '../../components/dashboard/ReportTable';
import {
  ErrorBox,
  PageHeader,
  SoftButton,
  StatusPill,
} from '../../components/dashboard/DashboardUI';

const CATEGORIES = ['billing', 'delivery', 'technical', 'account', 'other'];

export default function ClientSupportPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState('');
  const [reply, setReply] = useState('');
  const [form, setForm] = useState({
    subject: '',
    body: '',
    category: 'other',
  });
  const [msg, setMsg] = useState('');

  const listQuery = useQuery({
    queryKey: ['client', 'support'],
    queryFn: async () => (await getMySupportTickets({ limit: 50 })).data,
  });

  const detailQuery = useQuery({
    queryKey: ['client', 'support', selectedId],
    queryFn: async () => (await getMySupportTicket(selectedId)).data.data,
    enabled: Boolean(selectedId),
  });

  const createMutation = useMutation({
    mutationFn: createSupportTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', 'support'] });
      setForm({ subject: '', body: '', category: 'other' });
      setMsg('Ticket created');
    },
    onError: (e) => setMsg(e?.response?.data?.message || 'Could not create ticket'),
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, body }) => replyMySupportTicket(id, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', 'support'] });
      setReply('');
    },
  });

  const rows = listQuery.data?.data || [];
  const ticket = detailQuery.data;

  const openForm = useMemo(
    () => ({
      subject: form.subject,
      body: form.body,
      category: form.category,
    }),
    [form]
  );

  return (
    <div>
      <PageHeader
        title="Support"
        subtitle="Open a ticket for billing, delivery, or account help. Prefer this over Contact when you are logged in."
      />

      {msg ? (
        <div className="mb-4 rounded-xl border border-line bg-mist px-4 py-3 text-sm text-brand">
          {msg}
        </div>
      ) : null}

      <form
        className="mb-6 space-y-3 rounded-2xl border border-line bg-card p-4 sm:p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!openForm.subject.trim() || !openForm.body.trim()) return;
          createMutation.mutate(openForm);
        }}
      >
        <h2 className="font-display text-base font-semibold text-brand">New ticket</h2>
        <input
          required
          placeholder="Subject"
          value={form.subject}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
        <select
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <textarea
          required
          rows={3}
          placeholder="Describe the issue…"
          value={form.body}
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
        <SoftButton type="submit" variant="primary" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Submitting…' : 'Submit ticket'}
        </SoftButton>
      </form>

      {listQuery.isLoading ? <Spinner /> : null}
      {listQuery.isError ? <ErrorBox message="Failed to load tickets" /> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <ReportTable
            emptyText="No tickets yet"
            rows={rows}
            columns={[
              {
                key: 'ticket',
                label: 'Ticket',
                render: (t) => (
                  <button
                    type="button"
                    className="text-left font-semibold text-brand hover:text-accent"
                    onClick={() => setSelectedId(t._id)}
                  >
                    {t.ticketId} · {t.subject}
                  </button>
                ),
              },
              {
                key: 'status',
                label: 'Status',
                render: (t) => <StatusPill value={t.status} />,
              },
            ]}
          />
        </div>

        <div className="rounded-2xl border border-line bg-card p-4 sm:p-5">
          {!selectedId ? (
            <p className="text-sm text-muted">Select a ticket to view replies.</p>
          ) : detailQuery.isLoading ? (
            <Spinner />
          ) : !ticket ? (
            <ErrorBox message="Not found" />
          ) : (
            <div className="space-y-3">
              <h3 className="font-display font-semibold text-brand">{ticket.subject}</h3>
              <p className="whitespace-pre-wrap text-sm text-brand">
                {ticket.messages?.[0]?.body || '—'}
              </p>
              <div className="max-h-56 space-y-2 overflow-y-auto border-t border-line pt-3">
                {(ticket.messages || []).map((m, i) => (
                  <div key={i} className="rounded-xl bg-sand px-3 py-2 text-sm">
                    <div className="text-xs text-muted">
                      {m.senderId?.role || m.senderId?.name || 'user'}
                    </div>
                    <div className="whitespace-pre-wrap">{m.body}</div>
                  </div>
                ))}
              </div>
              {!['resolved', 'closed'].includes(ticket.status) ? (
                <>
                  <textarea
                    rows={2}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    className="w-full rounded-xl border border-line bg-sand px-3 py-2 text-sm"
                    placeholder="Add a reply…"
                  />
                  <SoftButton
                    variant="primary"
                    disabled={!reply.trim() || replyMutation.isPending}
                    onClick={() => replyMutation.mutate({ id: ticket._id, body: reply.trim() })}
                  >
                    Reply
                  </SoftButton>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
