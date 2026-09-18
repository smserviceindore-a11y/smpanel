import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getDeveloperRequests, submitDeveloperQuote } from '../../services/api';
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

const PAGE_SIZE = 12;
const statuses = ['new', 'contacted', 'quotation_sent', 'negotiation', 'won', 'lost'];

export default function DeveloperRequestsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [quotes, setQuotes] = useState({});
  const [msg, setMsg] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const queryClient = useQueryClient();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(status ? { status } : {}),
    }),
    [page, debouncedSearch, status]
  );

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['developer', 'requests', params],
    queryFn: async () => (await getDeveloperRequests(params)).data,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const quoteMutation = useMutation({
    mutationFn: ({ id, amount, notes }) => submitDeveloperQuote(id, { amount, notes }),
    onSuccess: () => {
      setMsg('Quote sent to SM team. They will talk to the client.');
      queryClient.invalidateQueries({ queryKey: ['developer', 'requests'] });
    },
    onError: (err) => setMsg(err?.response?.data?.message || 'Could not submit quote'),
  });

  const rows = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <div>
      <PageHeader
        title="Client Requests"
        subtitle="Only SM-approved briefs appear here. Client phone & email are never shown — quote your amount; SM contacts the client."
      />

      {msg ? (
        <div className="mb-4 rounded-xl border border-line bg-mist px-4 py-3 text-sm text-brand">{msg}</div>
      ) : null}

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search lead ID or project…"
        filters={
          <FilterSelect value={status} onChange={setStatus}>
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </FilterSelect>
        }
        actions={
          <span className="text-xs text-muted">
            {pagination.total ?? 0} requests
            {isFetching && !isLoading ? ' · updating…' : ''}
          </span>
        }
      />

      {isLoading && <Spinner />}
      {isError && <ErrorBox message="Failed to load requests" />}

      {!isLoading && !isError && (
        <>
          <div className="space-y-3 sm:space-y-4">
            {rows.length === 0 && (
              <EmptyState text="No approved requests yet. SM must release a brief first." />
            )}
            {rows.map((r) => {
              const q = quotes[r._id] || {
                amount: r.developerQuoteAmount || '',
                notes: r.developerQuoteNotes || '',
              };
              return (
                <EntityCard key={r._id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-semibold text-brand">{r.leadId}</div>
                      <div className="mt-1 text-sm text-brand">
                        {r.clientLabel || 'Client (contact hidden)'} ·{' '}
                        {r.projectTitle || r.projectId?.title}
                      </div>
                      <div className="mt-1 text-xs text-muted">
                        Budget hint: {r.budget || '—'} · Timeline: {r.timeline || '—'}
                      </div>
                      {r.developerBrief ? (
                        <p className="mt-3 text-sm text-brand whitespace-pre-wrap">{r.developerBrief}</p>
                      ) : null}
                      {r.selectedModules?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {r.selectedModules.map((m) => (
                            <span
                              key={m}
                              className="rounded-md bg-mist px-2 py-1 text-[11px] text-brand"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                        <input
                          type="number"
                          min="1"
                          placeholder="Your quote (₹)"
                          value={q.amount}
                          onChange={(e) =>
                            setQuotes((prev) => ({
                              ...prev,
                              [r._id]: { ...q, amount: e.target.value },
                            }))
                          }
                          className="rounded-xl border border-line bg-sand px-3 py-2 text-sm outline-none focus:border-accent"
                        />
                        <input
                          placeholder="Notes for SM team"
                          value={q.notes}
                          onChange={(e) =>
                            setQuotes((prev) => ({
                              ...prev,
                              [r._id]: { ...q, notes: e.target.value },
                            }))
                          }
                          className="rounded-xl border border-line bg-sand px-3 py-2 text-sm outline-none focus:border-accent"
                        />
                        <SoftButton
                          variant="primary"
                          disabled={quoteMutation.isPending}
                          onClick={() =>
                            quoteMutation.mutate({
                              id: r._id,
                              amount: Number(q.amount),
                              notes: q.notes,
                            })
                          }
                        >
                          Submit quote
                        </SoftButton>
                      </div>
                      {r.developerQuoteAmount ? (
                        <div className="mt-2 text-xs text-muted">
                          Last quote: ₹{Number(r.developerQuoteAmount).toLocaleString('en-IN')}
                        </div>
                      ) : null}
                    </div>
                    <StatusPill value={r.status} />
                  </div>
                </EntityCard>
              );
            })}
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
