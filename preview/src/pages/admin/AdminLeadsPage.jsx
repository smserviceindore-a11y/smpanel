import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  downloadBlob,
  exportAdminCustomizationsExcel,
  exportAdminRequirementsExcel,
  getAdminCustomizations,
  getAdminRequirements,
  updateCustomizationStatus,
  updateRequirementStatus,
} from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import ListToolbar, { FilterSelect, DateRangeFilters } from '../../components/dashboard/ListToolbar';
import ReportTable from '../../components/dashboard/ReportTable';
import {
  ErrorBox,
  PageHeader,
  SoftButton,
} from '../../components/dashboard/DashboardUI';

const statusesReq = [
  'new',
  'contacted',
  'requirement_discussed',
  'demo_given',
  'quotation_sent',
  'negotiation',
  'won',
  'lost',
];

const statusesCust = ['new', 'contacted', 'quotation_sent', 'negotiation', 'won', 'lost'];

const PAGE_SIZE = 10;

export default function AdminLeadsPage() {
  const [tab, setTab] = useState('requirements');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [ownership, setOwnership] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [notes, setNotes] = useState({});
  const [briefs, setBriefs] = useState({});
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const queryClient = useQueryClient();

  useEffect(() => {
    setPage(1);
  }, [tab, debouncedSearch, status, ownership, dateFrom, dateTo]);

  const listParams = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(status ? { status } : {}),
      ...(tab === 'customizations' && ownership ? { ownership } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
    }),
    [page, debouncedSearch, status, ownership, tab, dateFrom, dateTo]
  );

  const reqQuery = useQuery({
    queryKey: ['admin', 'requirements', listParams],
    queryFn: async () => (await getAdminRequirements(listParams)).data,
    enabled: tab === 'requirements',
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const custQuery = useQuery({
    queryKey: ['admin', 'customizations', listParams],
    queryFn: async () => (await getAdminCustomizations(listParams)).data,
    enabled: tab === 'customizations',
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const reqMutation = useMutation({
    mutationFn: ({ id, body }) => updateRequirementStatus(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'requirements'] }),
  });

  const custMutation = useMutation({
    mutationFn: ({ id, body }) => updateCustomizationStatus(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'customizations'] }),
  });

  const activeQuery = tab === 'requirements' ? reqQuery : custQuery;
  const loading = activeQuery.isLoading;
  const error = activeQuery.isError;
  const rows = activeQuery.data?.data || [];
  const pagination = activeQuery.data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const handleExport = async () => {
    setExportError('');
    setExporting(true);
    try {
      const params = {
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(status ? { status } : {}),
        ...(ownership ? { ownership } : {}),
      };
      if (tab === 'requirements') {
        await downloadBlob(exportAdminRequirementsExcel(params), 'requirements-leads.xlsx');
      } else {
        await downloadBlob(exportAdminCustomizationsExcel(params), 'customization-leads.xlsx');
      }
    } catch {
      setExportError('Excel export failed. Try again or narrow filters.');
    } finally {
      setExporting(false);
    }
  };

  const statusOptions = tab === 'requirements' ? statusesReq : statusesCust;

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle="Review requests. Developer projects need your approve + sanitized brief before the developer can see them (client contact stays hidden)."
        actions={
          <SoftButton variant="primary" onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting…' : 'Export Excel'}
          </SoftButton>
        }
      />

      {exportError ? (
        <div className="mb-4">
          <ErrorBox message={exportError} />
        </div>
      ) : null}

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {[
          ['requirements', 'Requirements'],
          ['customizations', 'Customizations'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              tab === id ? 'bg-brand text-white shadow-sm' : 'bg-card text-muted ring-1 ring-line hover:bg-mist'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, email, lead ID, company…"
        filters={
          <>
            <FilterSelect value={status} onChange={setStatus}>
              <option value="">All statuses</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </FilterSelect>
            {tab === 'customizations' ? (
              <FilterSelect value={ownership} onChange={setOwnership}>
                <option value="">All ownership</option>
                <option value="platform">SM / Platform</option>
                <option value="developer">Developer project</option>
              </FilterSelect>
            ) : null}
            <DateRangeFilters
              dateFrom={dateFrom}
              dateTo={dateTo}
              onFromChange={setDateFrom}
              onToChange={setDateTo}
            />
          </>
        }
        actions={
          <span className="text-xs text-muted">
            {pagination.total ?? 0} result{(pagination.total ?? 0) === 1 ? '' : 's'}
            {activeQuery.isFetching && !loading ? ' · updating…' : ''}
          </span>
        }
      />

      {loading && <Spinner />}
      {error && <ErrorBox message="Failed to load leads" />}

      {!loading && !error && (
        <>
          <ReportTable
            emptyText="No leads match these filters"
            rows={rows}
            columns={[
              {
                key: 'leadId',
                label: 'Lead ID',
                render: (lead) => <span className="font-semibold">{lead.leadId}</span>,
              },
              {
                key: 'name',
                label: 'Name',
                render: (lead) => (
                  <div>
                    <div>{lead.name}</div>
                    {lead.company ? (
                      <div className="text-xs text-muted">{lead.company}</div>
                    ) : null}
                  </div>
                ),
              },
              {
                key: 'contact',
                label: 'Contact',
                render: (lead) => (
                  <div className="text-xs">
                    <div className="break-all">{lead.email}</div>
                    <div className="text-muted">{lead.mobile}</div>
                  </div>
                ),
              },
              {
                key: 'project',
                label: tab === 'customizations' ? 'Project' : 'Industry',
                render: (lead) => {
                  if (tab === 'customizations') {
                    const isDevOwned =
                      lead.ownership === 'developer' || Boolean(lead.developerId);
                    return (
                      <div className="text-xs">
                        <div className="line-clamp-1 max-w-[140px]">
                          {lead.projectTitle || lead.projectId?.title || '—'}
                        </div>
                        <div className={isDevOwned ? 'text-indigo-700' : 'text-teal-700'}>
                          {isDevOwned ? 'Developer' : 'Platform'}
                          {lead.developerId?.name ? ` · ${lead.developerId.name}` : ''}
                        </div>
                        {lead.developerQuoteAmount ? (
                          <div className="font-medium text-brand">
                            ₹{Number(lead.developerQuoteAmount).toLocaleString('en-IN')}
                          </div>
                        ) : null}
                      </div>
                    );
                  }
                  return (
                    <span className="text-xs text-muted">
                      {lead.industry || '—'}
                      {lead.projectType ? ` · ${lead.projectType}` : ''}
                    </span>
                  );
                },
              },
              {
                key: 'status',
                label: 'Status',
                render: (lead) => (
                  <select
                    value={lead.status}
                    onChange={(e) => {
                      const next = e.target.value;
                      if (tab === 'requirements') {
                        reqMutation.mutate({
                          id: lead._id,
                          body: {
                            status: next,
                            adminNotes: notes[lead._id] ?? lead.adminNotes,
                          },
                        });
                      } else {
                        custMutation.mutate({ id: lead._id, body: { status: next } });
                      }
                    }}
                    className="max-w-[9rem] rounded-xl border border-line bg-sand px-2 py-1.5 text-xs text-brand outline-none focus:border-accent"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                ),
              },
              {
                key: 'date',
                label: 'Date',
                render: (lead) =>
                  lead.createdAt
                    ? new Date(lead.createdAt).toLocaleDateString('en-IN')
                    : '—',
              },
              {
                key: 'actions',
                label: 'Actions',
                render: (lead) => {
                  const noteVal = notes[lead._id] ?? lead.adminNotes ?? '';
                  const briefVal = briefs[lead._id] ?? lead.developerBrief ?? '';
                  const isDevOwned =
                    lead.ownership === 'developer' || Boolean(lead.developerId);

                  return (
                    <div className="min-w-[12rem] space-y-1.5">
                      {tab === 'customizations' ? (
                        <textarea
                          rows={2}
                          value={briefVal}
                          onChange={(e) =>
                            setBriefs((b) => ({ ...b, [lead._id]: e.target.value }))
                          }
                          className="w-full rounded-lg border border-line bg-sand px-2 py-1 text-xs outline-none focus:border-accent"
                          placeholder="Dev brief…"
                          title="Developer brief (no client phone/email)"
                        />
                      ) : null}
                      <textarea
                        rows={2}
                        value={noteVal}
                        onChange={(e) =>
                          setNotes((n) => ({ ...n, [lead._id]: e.target.value }))
                        }
                        className="w-full rounded-lg border border-line bg-sand px-2 py-1 text-xs outline-none focus:border-accent"
                        placeholder="Admin notes…"
                      />
                      <div className="flex flex-wrap gap-1">
                        {tab === 'requirements' ? (
                          <SoftButton
                            variant="primary"
                            onClick={() =>
                              reqMutation.mutate({
                                id: lead._id,
                                body: {
                                  status: lead.status,
                                  adminNotes: notes[lead._id] ?? lead.adminNotes ?? '',
                                },
                              })
                            }
                          >
                            Save
                          </SoftButton>
                        ) : (
                          <>
                            <SoftButton
                              onClick={() =>
                                custMutation.mutate({
                                  id: lead._id,
                                  body: {
                                    developerBrief:
                                      briefs[lead._id] ?? lead.developerBrief ?? '',
                                    adminNotes: notes[lead._id] ?? lead.adminNotes ?? '',
                                  },
                                })
                              }
                            >
                              Save
                            </SoftButton>
                            {isDevOwned && lead.reviewStatus !== 'released_to_developer' ? (
                              <SoftButton
                                variant="primary"
                                onClick={() =>
                                  custMutation.mutate({
                                    id: lead._id,
                                    body: {
                                      action: 'release_to_developer',
                                      developerBrief:
                                        briefs[lead._id] ??
                                        lead.developerBrief ??
                                        lead.additionalRequirements ??
                                        '',
                                      adminNotes: notes[lead._id] ?? lead.adminNotes ?? '',
                                    },
                                  })
                                }
                              >
                                Release
                              </SoftButton>
                            ) : null}
                            {isDevOwned && lead.reviewStatus === 'released_to_developer' ? (
                              <SoftButton
                                onClick={() =>
                                  custMutation.mutate({
                                    id: lead._id,
                                    body: { action: 'hold' },
                                  })
                                }
                              >
                                Hold
                              </SoftButton>
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>
                  );
                },
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
