import Link from 'next/link';
import { navItems, siteConfig } from '@/lib/site';
import { ThemeToggle } from '@/components/theme-toggle';

export function NavBar() {
  return (
    <header className="topbar">
      <div className="container nav-wrap">
        <Link href="/" className="brand" aria-label="ByteBlast home">
          <span className="brand-mark">&gt;_</span>
          <span>
            <strong>{siteConfig.displayName}</strong>
            <small>{siteConfig.brandName}</small>
          </span>
        </Link>

        <nav className="main-nav" aria-label="Primary navigation">
          {navItems.map((item) =>
            item.external ? (
              <a key={item.href} href={item.href} target="_blank" rel="noreferrer" className="nav-link external-link">
                {item.label}
              </a>
            ) : (
              <Link key={item.href} href={item.href} className="nav-link">
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <ThemeToggle />
      </div>
    </header>
  );
}
