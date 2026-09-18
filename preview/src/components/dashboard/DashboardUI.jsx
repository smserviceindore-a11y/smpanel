import { Link } from 'react-router-dom';

const statusTone = {
  new: 'bg-sky-50 text-sky-800 ring-sky-200',
  contacted: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  requirement_discussed: 'bg-violet-50 text-violet-800 ring-violet-200',
  demo_given: 'bg-fuchsia-50 text-fuchsia-800 ring-fuchsia-200',
  quotation_sent: 'bg-amber-50 text-amber-900 ring-amber-200',
  negotiation: 'bg-orange-50 text-orange-900 ring-orange-200',
  won: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  lost: 'bg-rose-50 text-rose-800 ring-rose-200',
  published: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  featured: 'bg-teal-50 text-teal-800 ring-teal-200',
  draft: 'bg-slate-100 text-slate-700 ring-slate-200',
  pending: 'bg-amber-50 text-amber-900 ring-amber-200',
  approved: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  verified: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  rejected: 'bg-rose-50 text-rose-800 ring-rose-200',
  active: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  suspended: 'bg-rose-50 text-rose-800 ring-rose-200',
  inactive: 'bg-slate-100 text-slate-600 ring-slate-200',
  sent: 'bg-sky-50 text-sky-800 ring-sky-200',
  accepted: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  active: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  inactive: 'bg-slate-100 text-slate-600 ring-slate-200',
  paid: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  partially_paid: 'bg-amber-50 text-amber-900 ring-amber-200',
  included: 'bg-violet-50 text-violet-800 ring-violet-200',
  processing: 'bg-amber-50 text-amber-900 ring-amber-200',
  not_applicable: 'bg-slate-100 text-slate-600 ring-slate-200',
  read: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  replied: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  archived: 'bg-slate-100 text-slate-600 ring-slate-200',
  hold: 'bg-amber-50 text-amber-900 ring-amber-200',
  available: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  paid_out: 'bg-violet-50 text-violet-800 ring-violet-200',
};

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-brand sm:text-[1.75rem]">
          {title}
        </h1>
        {subtitle ? <div className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">{subtitle}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({ label, value, hint, tone = 'teal', to }) {
  const tones = {
    teal: 'from-accent/15 via-transparent to-transparent',
    navy: 'from-brand/10 via-transparent to-transparent',
    sand: 'from-mist via-transparent to-transparent',
  };

  const body = (
    <>
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tones[tone] || tones.teal}`} />
      <div className="relative">
        <div className="flex items-start justify-between gap-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</div>
          {to ? (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-accent opacity-0 transition group-hover:opacity-100">
              Open →
            </span>
          ) : null}
        </div>
        <div className="mt-2 font-display text-2xl font-semibold tabular-nums text-brand sm:text-3xl">
          {value ?? '—'}
        </div>
        {hint ? <div className="mt-1.5 text-xs leading-snug text-muted">{hint}</div> : null}
      </div>
    </>
  );

  const cls =
    'group relative block overflow-hidden rounded-2xl border border-line/90 bg-card p-4 shadow-[0_1px_0_rgba(15,61,62,0.04)] transition hover:border-accent/35 hover:shadow-md sm:p-5';

  if (to) {
    return (
      <Link to={to} className={`${cls} cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent`}>
        {body}
      </Link>
    );
  }

  return <div className={cls}>{body}</div>;
}

export function Panel({ title, children, action, className = '' }) {
  return (
    <section className={`rounded-2xl border border-line/90 bg-card shadow-[0_1px_0_rgba(15,61,62,0.04)] ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-line/70 px-4 py-3.5 sm:px-5">
        <h2 className="font-display text-base font-semibold text-brand sm:text-lg">{title}</h2>
        {action ? <div className="shrink-0 text-xs font-medium">{action}</div> : null}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function StatusPill({ value }) {
  const key = String(value || '').toLowerCase();
  const tone = statusTone[key] || 'bg-mist text-brand ring-line';
  return (
    <span
      className={`inline-flex max-w-full truncate rounded-md px-2 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${tone}`}
    >
      {String(value || '—').replace(/_/g, ' ')}
    </span>
  );
}

export function EmptyState({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-sand/70 px-4 py-10 text-center">
      <p className="text-sm text-muted">{text}</p>
    </div>
  );
}

export function ListRow({ title, subtitle, meta, to }) {
  const inner = (
    <>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-brand">{title}</div>
        {subtitle ? <div className="mt-0.5 truncate text-xs text-muted">{subtitle}</div> : null}
      </div>
      {meta ? <div className="shrink-0">{meta}</div> : null}
    </>
  );

  const cls =
    'flex items-center justify-between gap-3 border-b border-line/60 py-3 last:border-0 last:pb-0 first:pt-0';

  if (to) {
    return (
      <Link to={to} className={`${cls} transition hover:opacity-90`}>
        {inner}
      </Link>
    );
  }
  return <div className={cls}>{inner}</div>;
}

export function SoftButton({ children, onClick, type = 'button', variant = 'ghost', disabled }) {
  const styles =
    variant === 'primary'
      ? 'btn btn-accent btn-sm'
      : variant === 'danger'
        ? 'btn btn-danger btn-sm'
        : 'btn btn-outline btn-sm';

  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${styles} disabled:opacity-50`}>
      {children}
    </button>
  );
}

export function ErrorBox({ message = 'Something went wrong' }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-center text-sm text-rose-800">
      {message}
    </div>
  );
}

export function EntityCard({ children, className = '' }) {
  return (
    <article
      className={`rounded-2xl border border-line/90 bg-card p-4 shadow-[0_1px_0_rgba(15,61,62,0.04)] transition hover:border-accent/30 sm:p-5 ${className}`}
    >
      {children}
    </article>
  );
}
