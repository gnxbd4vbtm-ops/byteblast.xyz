import { skillGroups } from '@/lib/site';

export const metadata = {
  title: 'About',
  description: 'About Byte / ByteBlast, focusing on Linux, programming, networking, self-hosting, and open-source systems work.',
};

export default function AboutPage() {
  return (
    <div className="container section narrow-page">
      <p className="eyebrow">About</p>
      <h1>Developer-focused, systems-aware, and intentionally practical.</h1>

      <div className="content-stack">
        <section className="card info-card">
          <h2>About me</h2>
          <p>
            Byte is a developer interested in Linux, programming, networking, self-hosting, AI/ML,
            automation, and open-source software. The work centers on building small but useful tools,
            learning through practical experimentation, and improving how local systems and workflows function.
          </p>
        </section>

        <section className="card info-card">
          <h2>What I work on</h2>
          <p>
            Projects tend to sit at the intersection of command-line tooling, system-level automation,
            web development, and experimentation. The focus is on useful engineering work instead of fluff.
          </p>
        </section>

        <section className="card info-card">
          <h2>Technologies</h2>
          <p>
            Core work includes Python, C#, C++, shell/fish, Git, Docker, Linux, and web technologies,
            with an emphasis on maintainable tooling and efficient local workflows.
          </p>
        </section>

        <section className="card info-card">
          <h2>Linux and open-source interests</h2>
          <p>
            Linux is the primary environment, centered on CachyOS / Arch-based development and a KDE Plasma desktop setup.
            Open source work is central to the way projects are approached: reusable, transparent, and practical.
          </p>
        </section>

        <section className="card info-card">
          <h2>AI/ML interests</h2>
          <p>
            AI and ML projects are explored as tools for automation, code assistance, and workflow improvement, with a bias toward
            real-world utility instead of hype.
          </p>
        </section>

        <section className="card info-card">
          <h2>Networking and self-hosting</h2>
          <p>
            Networking and self-hosting remain strong interest areas for building reliable local services and maintaining a systems-first environment.
          </p>
        </section>

        <section className="card info-card">
          <h2>Tooling</h2>
          <div className="skill-grid compact-grid">
            {skillGroups.map((group) => (
              <div key={group.title} className="skill-bundle">
                <h3>{group.title}</h3>
                <ul className="tag-list compact">
                  {group.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
