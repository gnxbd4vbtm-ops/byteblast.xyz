import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container section narrow-page">
      <p className="eyebrow">404</p>
      <h1>resource not found</h1>
      <div className="card info-card">
        <p>The page you requested does not exist or has moved.</p>
        <pre className="terminal-panel" style={{ marginTop: '1rem' }}>
{`byte@byteblast ~> ls /404
ls: cannot access '/404': No such file or directory`}
        </pre>
        <div className="card-actions" style={{ marginTop: '1rem' }}>
          <Link className="button primary" href="/">Home</Link>
          <Link className="button secondary" href="/projects">Projects</Link>
          <a className="button secondary" href="https://github.com/gnxbd4vbtm-ops" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </div>
    </div>
  );
}
