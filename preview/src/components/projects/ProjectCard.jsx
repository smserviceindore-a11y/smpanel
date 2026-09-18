import { Link } from 'react-router-dom';

export default function ProjectCard({ project }) {
  const image =
    project.screenshots?.[0]?.url ||
    `https://picsum.photos/seed/${project.slug}/800/500`;

  return (
    <article className="animate-fade-up group overflow-hidden rounded-2xl border border-line bg-card shadow-[0_8px_30px_rgba(11,31,31,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(11,31,31,0.08)]">
      <Link to={`/projects/${project.slug}`} className="block overflow-hidden">
        <div className="relative aspect-[16/10] overflow-hidden bg-mist">
          <img
            src={image}
            alt={project.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                project.ownerType === 'company'
                  ? 'bg-brand text-white'
                  : 'bg-accent text-brand-deep'
              }`}
            >
              {project.ownerType === 'company' ? 'SM Global' : 'Developer'}
            </span>
            {project.featured && (
              <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-brand">
                Featured
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="space-y-3 p-4">
        <div>
          <Link to={`/projects/${project.slug}`}>
            <h3 className="font-display text-lg font-semibold text-brand transition group-hover:text-accent">
              {project.title}
            </h3>
          </Link>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted">
            {project.industry || 'Business'} · {project.projectType || 'Solution'}
          </p>
        </div>

        <p className="line-clamp-2 text-sm leading-relaxed text-muted">
          {project.shortDescription}
        </p>

        {project.technologies?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.technologies.slice(0, 3).map((tech) => (
              <span key={tech} className="rounded-md bg-mist px-2 py-0.5 text-[11px] text-brand">
                {tech}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {project.liveDemoAvailable && project.demoUrl ? (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-accent btn-sm"
            >
              Live Demo
            </a>
          ) : null}
          <Link to={`/projects/${project.slug}`} className="btn btn-outline btn-sm">
            View Details
          </Link>
          <Link to={`/customize/${project.slug}`} className="btn btn-brand btn-sm">
            Customize
          </Link>
        </div>
      </div>
    </article>
  );
}
