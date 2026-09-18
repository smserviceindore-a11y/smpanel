import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getFollowUpReport, getFollowUps, updateFollowUp } from '../../services/api';
import { useDashboardBase } from '../../context/DashboardBaseContext';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import ListToolbar, { FilterSelect } from '../../components/dashboard/ListToolbar';
import ReportTable from '../../components/dashboard/ReportTable';
import {
  EntityCard,
  ErrorBox,
  PageHeader,
  SoftButton,
  StatusPill,
} from '../../components/dashboard/DashboardUI';
import { ChartCard } from '../../components/dashboard/ReportCharts';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function FollowUpsPage() {
  const base = useDashboardBase();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const params = useMemo(() => {
    const p = { page, limit: 10 };
    if (filter === 'upcoming') p.upcoming = '1';
    if (filter === 'overdue') p.overdue = '1';
    if (filter === 'mine') p.mine = '1';
    return p;
  }, [page, filter]);

  const listQuery = useQuery({
    queryKey: ['follow-ups', params],
    queryFn: async () => (await getFollowUps(params)).data,
  });

  const reportQuery = useQuery({
    queryKey: ['follow-ups', 'report'],
    queryFn: async () => (await getFollowUpReport()).data.data,
  });

  const doneMutation = useMutation({
    mutationFn: (id) => updateFollowUp(id, { reminderDone: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
    },
  });

  const rows = listQuery.data?.data || [];
  const pagination = listQuery.data?.pagination || { page: 1, totalPages: 1, total: 0 };
  const report = reportQuery.data;

  return (
    <div>
      <PageHeader
        title="Follow-ups & reminders"
        subtitle="Conversation notes and next-call reminders for clients and developers."
      />

      {report ? (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Total notes', report.total],
              ['Upcoming', report.upcoming],
              ['Overdue', report.overdue],
            ].map(([label, val]) => (
              <EntityCard key={label}>
                <div className="text-xs text-muted">{label}</div>
                <div className="font-display text-xl font-semibold text-brand">{val}</div>
              </EntityCard>
            ))}
          </div>
          <ChartCard title="By channel">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.byChannel || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="channel" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0f766e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      ) : null}

      <ListToolbar
        search=""
        onSearchChange={() => {}}
        searchPlaceholder=""
        filters={
          <FilterSelect value={filter} onChange={setFilter}>
            <option value="">All</option>
            <option value="upcoming">Upcoming reminders</option>
            <option value="overdue">Overdue</option>
            <option value="mine">My notes</option>
          </FilterSelect>
        }
      />

      {listQuery.isLoading && <Spinner />}
      {listQuery.isError && <ErrorBox message="Failed to load follow-ups" />}

      {!listQuery.isLoading && !listQuery.isError && (
        <>
          <ReportTable
            emptyText="No follow-ups"
            rows={rows}
            columns={[
              {
                key: 'channel',
                label: 'Channel',
                render: (f) => (
                  <div className="flex flex-wrap items-center gap-1">
                    <StatusPill value={f.channel} />
                    {f.nextFollowUpAt && !f.reminderDone ? (
                      <StatusPill
                        value={
                          new Date(f.nextFollowUpAt) < new Date() ? 'overdue' : 'reminder'
                        }
                      />
                    ) : null}
                    {f.reminderDone ? <StatusPill value="done" /> : null}
                  </div>
                ),
              },
              {
                key: 'subject',
                label: 'Subject',
                render: (f) => (
                  <Link
                    to={`${base}/users/${f.subjectUserId?._id || f.subjectUserId}`}
                    className="font-semibold text-brand hover:text-accent"
                  >
                    {f.subjectUserId?.name || 'User'}
                  </Link>
                ),
              },
              {
                key: 'agent',
                label: 'Agent',
                render: (f) => (
                  <span className="text-muted">{f.agentId?.name || 'Agent'}</span>
                ),
              },
              {
                key: 'notes',
                label: 'Notes',
                render: (f) => (
                  <span className="line-clamp-2 max-w-xs whitespace-pre-wrap text-sm" title={f.notes}>
                    {f.notes}
                  </span>
                ),
              },
              {
                key: 'nextFollowUpAt',
                label: 'Next follow-up',
                render: (f) =>
                  f.nextFollowUpAt
                    ? new Date(f.nextFollowUpAt).toLocaleString('en-IN')
                    : '—',
              },
              {
                key: 'actions',
                label: 'Action',
                align: 'right',
                render: (f) =>
                  !f.reminderDone && f.nextFollowUpAt ? (
                    <SoftButton
                      disabled={doneMutation.isPending}
                      onClick={() => doneMutation.mutate(f._id)}
                    >
                      Mark done
                    </SoftButton>
                  ) : (
                    '—'
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
