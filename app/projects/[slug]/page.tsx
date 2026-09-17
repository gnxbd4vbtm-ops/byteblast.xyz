import Link from 'next/link';
import { notFound } from 'next/navigation';
import { projects } from '@/lib/site';

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);

  if (!project) {
    notFound();
  }

  return (
    <div className="container section narrow-page">
      <p className="eyebrow">Project</p>
      <h1>{project.name}</h1>
      <div className="card info-card">
        <div className="project-meta">
          <span className="pill status-pill">{project.status}</span>
          <span className="pill">{project.version}</span>
        </div>
        <p>{project.description}</p>
        <ul className="tag-list">
          {project.technologies.map((technology) => <li key={technology}>{technology}</li>)}
        </ul>
        <div className="card-actions">
          {project.repo ? <a href={project.repo} target="_blank" rel="noreferrer">GitHub</a> : null}
          {project.website ? <a href={project.website} target="_blank" rel="noreferrer">Live demo</a> : null}
          <Link href="/projects">Back to projects</Link>
        </div>
      </div>
    </div>
  );
}
