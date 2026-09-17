import Link from 'next/link';
import { siteConfig } from '@/lib/site';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <p>© {year} Byte / ByteBlast</p>
        <div className="footer-links">
          <a href={siteConfig.github} target="_blank" rel="noreferrer">GitHub</a>
          <Link href="/contact">Contact</Link>
          <Link href="/status">Status</Link>
        </div>
      </div>
    </footer>
  );
}
