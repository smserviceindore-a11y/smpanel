import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-brand text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="font-display text-lg font-semibold">SM Global Solution Hub</div>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/70">
            Explore live digital solutions. Experience demos. Customize for your business.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold text-accent-soft">Explore</div>
          <div className="mt-3 flex flex-col gap-2 text-sm text-white/75">
            <Link to="/projects">All Projects</Link>
            <Link to="/projects?ownerType=company">Company Solutions</Link>
            <Link to="/marketplace/developers">Developer Marketplace</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/submit-requirement">Submit Requirement</Link>
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold text-accent-soft">SM Global Tech Solutions</div>
          <p className="mt-3 text-sm text-white/70">
            Primary technology provider for discovery, customization and delivery.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} SM Global Solution Hub · Preview build for testing
      </div>
    </footer>
  );
}
