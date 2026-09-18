/**
 * Compact Excel-style report table for dashboards.
 * columns: [{ key, label, align?: 'left'|'right'|'center', className? }]
 * rows: array of objects; render cell via columns[].render?.(row) or row[key]
 */
export default function ReportTable({ columns = [], rows = [], emptyText = 'No rows', rowKey = '_id' }) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-line bg-card px-4 py-10 text-center text-sm text-muted">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-card">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-mist/80">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted ${
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''
                } ${col.className || ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row[rowKey] ?? row.id ?? idx}
              className="border-b border-line/80 last:border-0 hover:bg-sand/40"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-3 py-2.5 align-middle text-brand ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''
                  } ${col.className || ''}`}
                >
                  {typeof col.render === 'function' ? col.render(row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
