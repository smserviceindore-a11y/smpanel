import { Link, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const linkClass = ({ isActive }) =>
  `text-sm font-medium transition ${isActive ? 'text-accent' : 'text-muted hover:text-brand'}`;

export default function Navbar() {
  const { token, logout, user } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-sand/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-sm font-bold text-accent-soft">
            SM
          </span>
          <div className="leading-tight">
            <div className="font-display text-sm font-semibold text-brand">SM Global</div>
            <div className="text-[11px] tracking-wide text-muted">Solution Hub</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/" end className={linkClass}>Home</NavLink>
          <NavLink to="/projects" className={linkClass}>Projects</NavLink>
          <NavLink to="/marketplace/developers" className={linkClass}>Developers</NavLink>
          <NavLink to="/about" className={linkClass}>About</NavLink>
          <NavLink to="/contact" className={linkClass}>Contact</NavLink>
          <NavLink to="/submit-requirement" className={linkClass}>Submit Requirement</NavLink>
          {token && user ? (
            <>
              <NavLink
                to={
                  user.role === 'super_admin'
                    ? '/super-admin'
                    : user.role === 'admin'
                      ? '/admin'
                      : user.role === 'developer'
                        ? '/developer'
                        : '/client'
                }
                className={linkClass}
              >
                Dashboard
              </NavLink>
              <button type="button" onClick={logout} className="text-sm text-muted hover:text-brand">
                Logout
              </button>
            </>
          ) : (
            <NavLink to="/login" className={linkClass}>Login</NavLink>
          )}
        </nav>

        <Link
          to="/projects"
          className="btn btn-accent btn-sm md:hidden"
        >
          Explore
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto border-t border-line/60 px-4 py-2 md:hidden">
        <NavLink to="/" end className={linkClass}>Home</NavLink>
        <NavLink to="/projects" className={linkClass}>Projects</NavLink>
        <NavLink to="/marketplace/developers" className={linkClass}>Developers</NavLink>
        <NavLink to="/about" className={linkClass}>About</NavLink>
        <NavLink to="/contact" className={linkClass}>Contact</NavLink>
        <NavLink to="/submit-requirement" className={linkClass}>Requirement</NavLink>
        {token && user ? (
          <NavLink
            to={
              user.role === 'super_admin'
                ? '/super-admin'
                : user.role === 'admin'
                  ? '/admin'
                  : user.role === 'developer'
                    ? '/developer'
                    : '/client'
            }
            className={linkClass}
          >
            Dashboard
          </NavLink>
        ) : (
          <NavLink to="/login" className={linkClass}>Login</NavLink>
        )}
      </div>
    </header>
  );
}
