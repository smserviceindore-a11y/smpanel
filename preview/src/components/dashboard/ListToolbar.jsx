export default function ListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters,
  actions,
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-line bg-card p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-4">
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {typeof onSearchChange === 'function' ? (
          <input
            value={search ?? ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent sm:max-w-xs"
          />
        ) : null}
        {filters}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function FilterSelect({ value, onChange, children, className = '' }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-xl border border-line bg-sand px-3 py-2.5 text-sm outline-none focus:border-accent ${className}`}
    >
      {children}
    </select>
  );
}

/** From / To date inputs for report toolbars */
export function DateRangeFilters({ dateFrom, dateTo, onFromChange, onToChange }) {
  return (
    <>
      <label className="flex items-center gap-1.5 text-xs text-muted">
        <span className="shrink-0">From</span>
        <input
          type="date"
          value={dateFrom || ''}
          onChange={(e) => onFromChange(e.target.value)}
          className="rounded-xl border border-line bg-sand px-2.5 py-2 text-sm text-brand outline-none focus:border-accent"
        />
      </label>
      <label className="flex items-center gap-1.5 text-xs text-muted">
        <span className="shrink-0">To</span>
        <input
          type="date"
          value={dateTo || ''}
          onChange={(e) => onToChange(e.target.value)}
          className="rounded-xl border border-line bg-sand px-2.5 py-2 text-sm text-brand outline-none focus:border-accent"
        />
      </label>
    </>
  );
}
