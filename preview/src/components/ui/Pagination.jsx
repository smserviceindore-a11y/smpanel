/**
 * Numbered pagination: Previous · 1 2 3 … 10 · Next
 * Always shows result count; page buttons when totalPages > 1.
 */
export default function Pagination({ page, totalPages, onChange, total }) {
  const pages = Math.max(1, Number(totalPages) || 1);
  const current = Math.min(pages, Math.max(1, Number(page) || 1));

  const pageList = buildPageList(current, pages);

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
      <div className="text-xs text-muted">
        {total != null ? (
          <>
            {total} result{total === 1 ? '' : 's'}
            {pages > 1 ? ` · Page ${current} of ${pages}` : ''}
          </>
        ) : pages > 1 ? (
          <>
            Page {current} of {pages}
          </>
        ) : null}
      </div>

      {pages > 1 ? (
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            disabled={current <= 1}
            onClick={() => onChange?.(current - 1)}
            className="rounded-lg border border-line bg-card px-3 py-1.5 text-sm font-medium text-brand disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          {pageList.map((p, i) =>
            p === '…' ? (
              <span key={`e-${i}`} className="px-1.5 text-sm text-muted">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onChange?.(p)}
                aria-current={p === current ? 'page' : undefined}
                className={`min-w-[2.25rem] rounded-lg border px-2.5 py-1.5 text-sm font-medium ${
                  p === current
                    ? 'border-brand bg-brand text-white'
                    : 'border-line bg-card text-brand hover:bg-mist'
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            type="button"
            disabled={current >= pages}
            onClick={() => onChange?.(current + 1)}
            className="rounded-lg border border-line bg-card px-3 py-1.5 text-sm font-medium text-brand disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Compact window of page numbers with ellipses */
function buildPageList(current, total) {
  if (total <= 9) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const set = new Set([1, total, current, current - 1, current + 1, current - 2, current + 2]);
  const sorted = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push('…');
    out.push(sorted[i]);
  }
  return out;
}
