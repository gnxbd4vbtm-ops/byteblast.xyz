import Link from 'next/link';
import { projects } from '@/lib/site';

export const metadata = {
  title: 'Projects',
  description: 'Project directory for Byte / ByteBlast, including automation, API, and Linux-focused work.',
};

export default function ProjectsPage() {
  return (
    <div className="container section narrow-page">
      <p className="eyebrow">Projects</p>
      <h1>Software and automation experiments.</h1>

      <div className="project-grid full-grid">
        {projects.map((project) => (
          <article key={project.slug} className="card project-card large-card">
            <div className={`project-accent accent-${project.accent}`} />
            <div className="project-meta">
              <span className="pill status-pill">{project.status}</span>
              <span className="pill">{project.version}</span>
            </div>
            <h2>{project.name}</h2>
            <p>{project.description}</p>
            <ul className="tag-list">
              {project.technologies.map((technology) => (
                <li key={technology}>{technology}</li>
              ))}
            </ul>
            <div className="card-actions">
              <Link href={`/projects/${project.slug}`}>View details</Link>
              {project.repo ? <a href={project.repo} target="_blank" rel="noreferrer">Repository</a> : null}
              {project.website ? <a href={project.website} target="_blank" rel="noreferrer">Demo</a> : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
