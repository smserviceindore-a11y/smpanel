import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getStaffLiveChat,
  getStaffLiveChats,
  replyStaffLiveChat,
  updateStaffLiveChat,
} from '../../services/api';
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

export default function LiveChatInboxPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
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
    queryKey: ['staff', 'live-chat', params],
    queryFn: async () => (await getStaffLiveChats(params)).data,
    refetchInterval: 5000,
    placeholderData: (prev) => prev,
  });

  const detailQuery = useQuery({
    queryKey: ['staff', 'live-chat', selectedId],
    queryFn: async () => (await getStaffLiveChat(selectedId)).data.data,
    enabled: Boolean(selectedId),
    refetchInterval: selectedId ? 4000 : false,
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, body }) => replyStaffLiveChat(id, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', 'live-chat'] });
      setReply('');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status: next }) => updateStaffLiveChat(id, { status: next }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff', 'live-chat'] }),
  });

  const rows = listQuery.data?.data || [];
  const pagination = listQuery.data?.pagination || {};
  const chat = detailQuery.data;

  if (listQuery.isLoading && !listQuery.data) return <Spinner label="Loading live chats…" />;
  if (listQuery.isError) return <ErrorBox message="Failed to load live chats" />;

  return (
    <div>
      <PageHeader
        title="Live chat"
        subtitle="Visitors chat from the website. Unregistered users must share name, email & phone first. Team auto-replies instantly; you can reply here too."
      />

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, email, phone, CH-…"
        filters={
          <FilterSelect value={status} onChange={setStatus}>
            <option value="">All statuses</option>
            <option value="open">open</option>
            <option value="waiting">waiting</option>
            <option value="active">active</option>
            <option value="closed">closed</option>
          </FilterSelect>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <ReportTable
            emptyText="No chats yet"
            rows={rows}
            rowKey="_id"
            columns={[
              {
                key: 'chatId',
                label: 'Chat',
                render: (c) => (
                  <button
                    type="button"
                    className="text-left font-semibold text-brand hover:text-accent"
                    onClick={() => setSelectedId(c._id || c.id)}
                  >
                    {c.chatId}
                  </button>
                ),
              },
              {
                key: 'visitor',
                label: 'Visitor',
                render: (c) => (
                  <div className="text-xs">
                    <div className="font-medium">{c.visitorName}</div>
                    <div className="text-muted">{c.visitorEmail}</div>
                    <div className="text-muted">{c.visitorPhone}</div>
                  </div>
                ),
              },
              {
                key: 'preview',
                label: 'Last message',
                render: (c) => (
                  <span className="line-clamp-2 max-w-[160px] text-xs text-muted">
                    {c.lastMessage?.body || '—'}
                  </span>
                ),
              },
              {
                key: 'status',
                label: 'Status',
                render: (c) => <StatusPill value={c.status} />,
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
            <p className="text-sm text-muted">Select a chat to view & reply.</p>
          ) : detailQuery.isLoading ? (
            <Spinner />
          ) : !chat ? (
            <ErrorBox message="Chat not found" />
          ) : (
            <div className="flex h-[min(640px,70vh)] flex-col">
              <div className="mb-3 border-b border-line pb-3">
                <div className="font-display text-lg font-semibold text-brand">{chat.chatId}</div>
                <div className="mt-1 text-sm text-muted">
                  {chat.visitorName} · {chat.visitorEmail} · {chat.visitorPhone}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusPill value={chat.status} />
                  {chat.status !== 'closed' ? (
                    <SoftButton
                      onClick={() =>
                        statusMutation.mutate({ id: chat._id || selectedId, status: 'closed' })
                      }
                    >
                      Close chat
                    </SoftButton>
                  ) : (
                    <SoftButton
                      onClick={() =>
                        statusMutation.mutate({ id: chat._id || selectedId, status: 'active' })
                      }
                    >
                      Reopen
                    </SoftButton>
                  )}
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-xl bg-sand/50 p-3">
                {(chat.messages || []).map((m) => {
                  const mine = m.sender === 'team' || m.sender === 'system';
                  return (
                    <div
                      key={String(m._id || m.createdAt)}
                      className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${
                          mine
                            ? 'bg-brand text-white'
                            : 'border border-line bg-card text-brand'
                        }`}
                      >
                        <div className="mb-0.5 text-[10px] font-semibold uppercase opacity-80">
                          {m.senderName || m.sender}
                        </div>
                        <div className="whitespace-pre-wrap">{m.body}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!reply.trim()) return;
                  replyMutation.mutate({ id: chat._id || selectedId, body: reply.trim() });
                }}
              >
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Reply as support team…"
                  className="min-w-0 flex-1 rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
                <SoftButton
                  type="submit"
                  variant="primary"
                  disabled={!reply.trim() || replyMutation.isPending}
                >
                  Send
                </SoftButton>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
