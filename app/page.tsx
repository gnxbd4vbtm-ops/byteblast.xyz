import Link from 'next/link';
import { siteConfig, projects, skillGroups } from '@/lib/site';

export default function HomePage() {
  const featuredProjects = projects.filter((project) => project.featured);

  return (
    <>
      <section className="hero section">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">Byte / ByteBlast</p>
            <h1>Linux, automation, and tools that are useful.</h1>
            <p className="lead">
              I build with Linux, automation, networking, self-hosting, and practical software that solves real problems.
            </p>
            <div className="button-row">
              <a className="button primary" href={siteConfig.github} target="_blank" rel="noreferrer">GitHub</a>
              <Link className="button secondary" href="/projects">Projects</Link>
              <Link className="button secondary" href="/contact">Contact</Link>
            </div>
          </div>

          <div className="terminal-panel" aria-label="Developer terminal preview">
            <div className="terminal-header">
              <span className="dot red" />
              <span className="dot amber" />
              <span className="dot green" />
            </div>
            <pre>
{`byte@byteblast ~> whoami
byte
byte@byteblast ~> uname -a
Linux CachyOS x86_64
byte@byteblast ~> ls ~/projects
### ai-git-committer
### byteformat
### EloServer
### byteblast.xyz`}
            </pre>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">About</p>
            <h2>Developer work with a Linux-first setup and a practical mindset.</h2>
          </div>
          <div className="content-grid two-col">
            <p>
              Byte works on Linux, software development, networking, self-hosting, automation, and small tools that make daily work easier.
            </p>
            <p>
              The stack is mostly Python, C#, C++, shell, Docker, and web tools, with a preference for reliable systems and straightforward workflows.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Featured projects</p>
            <h2>Things I keep building and refining.</h2>
          </div>
          <div className="project-grid">
            {featuredProjects.map((project) => (
              <article key={project.slug} className="card project-card">
                <div className={`project-accent accent-${project.accent}`} />
                <div className="project-meta">
                  <span className="pill status-pill">{project.status}</span>
                  <span className="pill">v{project.version}</span>
                </div>
                <h3>{project.name}</h3>
                <p>{project.shortDescription}</p>
                <ul className="tag-list">
                  {project.technologies.slice(0, 4).map((technology) => (
                    <li key={technology}>{technology}</li>
                  ))}
                </ul>
                <div className="card-actions">
                  <Link href={`/projects/${project.slug}`}>Details</Link>
                  {project.repo ? <a href={project.repo} target="_blank" rel="noreferrer">Repo</a> : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Technologies</p>
            <h2>The tools I keep coming back to.</h2>
          </div>
          <div className="skill-grid">
            {skillGroups.map((group) => (
              <div key={group.title} className="card skill-card">
                <h3>{group.title}</h3>
                <ul className="tag-list compact">
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container panel-box">
          <div>
            <p className="eyebrow">GitHub & open source</p>
            <h2>Public work, experiments, and side projects live here.</h2>
          </div>
          <a className="button primary" href={siteConfig.github} target="_blank" rel="noreferrer">
            View GitHub profile
          </a>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Current focus</p>
            <h2>What I keep exploring lately.</h2>
          </div>
          <div className="content-grid three-col">
            <div className="card mini-card">
              <h3>Linux</h3>
              <p>CachyOS / Arch-based workflows, tooling, and local systems management.</p>
            </div>
            <div className="card mini-card">
              <h3>Self-hosting</h3>
              <p>Reliable local services, automation, and homelab-friendly software stacks.</p>
            </div>
            <div className="card mini-card">
              <h3>AI / tooling</h3>
              <p>Practical automation and experiments that improve developer productivity.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section contact-cta">
        <div className="container panel-box accent-box">
          <div>
            <p className="eyebrow">Contact</p>
            <h2>Need a developer with a Linux-first mindset and a practical systems approach?</h2>
          </div>
          <a className="button primary" href="mailto:contact@byteblast.xyz">contact@byteblast.xyz</a>
        </div>
      </section>
    </>
  );
}
