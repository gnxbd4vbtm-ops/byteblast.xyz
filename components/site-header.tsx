"use client";

import Link from "next/link";
import { useState } from "react";

const navItems = [
  { href: "/about", label: "About" },
  { href: "/#work", label: "Work" },
  { href: "/#systems", label: "Systems" },
  { href: "/status", label: "Status" },
  { href: "/contact", label: "Contact" },
  { href: "/admin", label: "Admin" },
];

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="site-header">
        <div className="flex items-center gap-3">
          <div className="brand-image">
            <img
              src="/pfp.png"
              alt="Byte Blast profile"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="brand-name">
            <p>byteblast</p>
          </div>
        </div>

        <nav className="desktop-nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <form
            action="/search"
            method="get"
            role="search"
            className="site-search-form header-search"
          >
            <input
              type="search"
              name="q"
              aria-label="Search this site"
              placeholder="Search"
              className="site-search-input"
            />
            <button type="submit" aria-label="Submit search" className="site-search-submit">
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
                <circle cx="8.75" cy="8.75" r="5.75" />
                <path d="m13 13 4 4" />
              </svg>
            </button>
          </form>

          <button
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((value) => !value)}
            className="menu-toggle"
          >
            <span className="relative block h-4 w-5">
              <span
                className={`absolute left-0 h-0.5 w-full rounded-full bg-current ${
                  mobileOpen ? "top-1.5 rotate-45" : "top-0 rotate-0"
                }`}
              />
              <span
                className={`absolute left-0 top-1.5 h-0.5 w-full rounded-full bg-current ${
                  mobileOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 h-0.5 w-full rounded-full bg-current ${
                  mobileOpen ? "top-1.5 -rotate-45" : "bottom-0 rotate-0"
                }`}
              />
            </span>
          </button>
        </div>
      </header>

      <div
        className={`mobile-backdrop ${
          mobileOpen ? "is-open" : ""
        }`}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={`mobile-menu ${
          mobileOpen ? "is-open" : ""
        }`}
        aria-label="Mobile navigation"
      >
        <div className="mobile-menu-heading">
          <div className="flex items-center gap-2">
            <div className="mobile-brand-image">
              <img src="/pfp.png" alt="Byte Blast profile" className="h-full w-full object-cover" />
            </div>
            <span className="brand-name">byteblast</span>
          </div>

          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
            className="menu-close"
          >
            ×
          </button>
        </div>

        <form
          action="/search"
          method="get"
          role="search"
          className="site-search-form mobile-search"
        >
          <input
            type="search"
            name="q"
            aria-label="Search this site"
            placeholder="Search public pages"
            className="site-search-input"
          />
          <button type="submit" aria-label="Submit search" className="site-search-submit">
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
              <circle cx="8.75" cy="8.75" r="5.75" />
              <path d="m13 13 4 4" />
            </svg>
          </button>
        </form>

        <nav className="mobile-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="mobile-nav-link"
            >
              {item.label}
            </Link>
          ))}
        </nav>

      </aside>
    </>
  );
}
