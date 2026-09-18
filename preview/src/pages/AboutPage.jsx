import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">About</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-brand sm:text-4xl">
        SM Global Solution Hub
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted">
        A digital marketplace by SM Global Tech Solutions — browse ready ERP, CRM, education and
        business products, try live demos, and request customization. Company projects and verified
        developer listings sit under one quality-controlled delivery model.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {[
          {
            t: 'Marketplace',
            d: 'Explore featured and filtered solutions with screenshots, modules and demos.',
          },
          {
            t: 'Developer network',
            d: 'Verified developers list products; SM Global routes and delivers client work.',
          },
          {
            t: 'End-to-end delivery',
            d: 'Requirements, quotations, payments and settlements handled on the hub.',
          },
        ].map((item) => (
          <div key={item.t} className="rounded-2xl border border-line bg-card p-5">
            <h2 className="font-display text-lg font-semibold text-brand">{item.t}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{item.d}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/projects" className="btn btn-accent btn-md">
          Browse projects
        </Link>
        <Link to="/submit-requirement" className="btn btn-outline btn-md">
          Submit requirement
        </Link>
        <Link to="/contact" className="btn btn-brand btn-md">
          Contact us
        </Link>
      </div>
    </div>
  );
}
