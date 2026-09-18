import { useEffect, useId, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

function initials(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || 'SM'
  );
}

function MenuIcon({ open }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
}

export default function DashboardShell({ title, basePath, links }) {
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const panelId = useId();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItem = ({ isActive }) =>
    [
      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
      isActive
        ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/10'
        : 'text-white/75 hover:bg-white/10 hover:text-white',
    ].join(' ');

  const SidebarBody = () => (
    <>
      <div className="border-b border-white/10 px-5 pb-5 pt-5">
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-accent-soft/90 transition hover:text-white"
        >
          <span aria-hidden="true">←</span> Marketplace
        </Link>
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/20 font-display text-sm font-bold text-accent-soft ring-1 ring-accent/30">
            {initials(user?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-sm font-semibold text-white">{title}</div>
            <div className="mt-0.5 truncate text-xs text-white/55">{user?.name}</div>
            <span className="mt-2 inline-flex rounded-md bg-accent/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-soft">
              {user?.role?.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Dashboard">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={navItem} onClick={() => setOpen(false)}>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" />
            <span className="truncate">{l.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <p className="mb-3 truncate px-1 text-[11px] text-white/40">{basePath}</p>
        <button
          type="button"
          onClick={onLogout}
          className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
        >
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="dash-shell relative min-h-screen">
      {/* Fixed desktop sidebar — always visible from md up */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col bg-brand-deep text-white shadow-xl md:flex">
        <SidebarBody />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line/80 bg-sand/95 px-4 py-3 backdrop-blur-md md:hidden">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-card text-brand shadow-sm"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          <MenuIcon open={open} />
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
        </button>
        <div className="min-w-0 flex-1 text-center">
          <div className="truncate font-display text-sm font-semibold text-brand">{title}</div>
          <div className="truncate text-[11px] text-muted">{user?.name}</div>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand font-display text-xs font-bold text-accent-soft">
          {initials(user?.name)}
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-ink/55"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside
            id={panelId}
            className="absolute inset-y-0 left-0 flex w-[min(100%,288px)] flex-col bg-brand-deep shadow-2xl"
          >
            <SidebarBody />
          </aside>
        </div>
      )}

      {/* Main content offset for fixed sidebar */}
      <main className="min-w-0 md:pl-[260px]">
        <div className="dash-content animate-fade-up mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
