import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategories,
  updateAdminCategory,
} from '../../services/api';
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
const emptyForm = { name: '', slug: '', description: '', isActive: true };

export default function AdminCategoriesPage() {
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const queryClient = useQueryClient();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, isActive]);

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(isActive ? { isActive } : {}),
    }),
    [page, debouncedSearch, isActive]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'categories', params],
    queryFn: async () => (await getAdminCategories(params)).data,
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim(),
        isActive: !!form.isActive,
      };
      if (editingId) return updateAdminCategory(editingId, payload);
      return createAdminCategory(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setForm(emptyForm);
      setEditingId(null);
      setFormError('');
    },
    onError: (err) => {
      setFormError(err?.response?.data?.message || 'Could not save category');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAdminCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const rows = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const startEdit = (c) => {
    setEditingId(c._id);
    setForm({
      name: c.name || '',
      slug: c.slug || '',
      description: c.description || '',
      isActive: c.isActive !== false,
    });
    setFormError('');
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Organize marketplace projects. Changes reflect on public filters."
      />

      <EntityCard className="mb-5">
        <div className="mb-3 text-sm font-semibold text-brand">
          {editingId ? 'Edit category' : 'Add category'}
        </div>
        {formError ? <div className="mb-3"><ErrorBox message={formError} /></div> : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Name *"
            className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
          />
          <input
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            placeholder="Slug (optional)"
            className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent"
          />
          <input
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Description"
            className="rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent sm:col-span-2"
          />
          <label className="flex items-center gap-2 text-sm text-brand">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            Active
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <SoftButton
            variant="primary"
            onClick={() => {
              if (!form.name.trim()) {
                setFormError('Name is required');
                return;
              }
              saveMutation.mutate();
            }}
            disabled={saveMutation.isPending}
          >
            {editingId ? 'Update' : 'Create'}
          </SoftButton>
          {editingId ? (
            <SoftButton
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
                setFormError('');
              }}
            >
              Cancel
            </SoftButton>
          ) : null}
        </div>
      </EntityCard>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search categories…"
        filters={
          <FilterSelect value={isActive} onChange={setIsActive}>
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </FilterSelect>
        }
        actions={<span className="text-xs text-muted">{pagination.total ?? 0} categories</span>}
      />

      {isLoading && <Spinner />}
      {isError && <ErrorBox message="Failed to load categories" />}

      {!isLoading && !isError && (
        <>
          <div className="space-y-3">
            {rows.length === 0 && <EmptyState text="No categories found" />}
            {rows.map((c) => (
              <EntityCard key={c._id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="font-display font-semibold text-brand">{c.name}</div>
                    <div className="mt-1 text-xs text-muted">
                      /{c.slug} · {c.projectCount || 0} projects
                    </div>
                    {c.description ? (
                      <p className="mt-2 text-sm text-muted">{c.description}</p>
                    ) : null}
                    <div className="mt-2">
                      <StatusPill value={c.isActive ? 'active' : 'inactive'} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <SoftButton onClick={() => startEdit(c)}>Edit</SoftButton>
                    <SoftButton
                      variant="danger"
                      onClick={() => {
                        if (window.confirm(`Delete category "${c.name}"?`)) {
                          deleteMutation.mutate(c._id);
                        }
                      }}
                    >
                      Delete
                    </SoftButton>
                  </div>
                </div>
              </EntityCard>
            ))}
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
