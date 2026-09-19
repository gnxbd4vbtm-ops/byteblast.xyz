"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollYRef.current;

      if (currentY <= 12) {
        setIsVisible(true);
      } else if (delta > 6) {
        setIsVisible(false);
      } else if (delta < -6) {
        setIsVisible(true);
      }

      lastScrollYRef.current = currentY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`panel sticky top-0 z-40 flex items-center justify-between gap-3 rounded-full border border-slate-800/80 bg-slate-950/80 px-3 py-2.5 backdrop-blur shadow-[0_18px_50px_rgba(15,23,42,0.28)] transition-all duration-300 ease-out sm:px-5 md:top-4 ${
          isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cyan-400/30 bg-slate-900 shadow-lg shadow-cyan-500/10 transition-transform duration-300 hover:scale-105">
            <img
              src="/pfp.png"
              alt="Byte Blast profile"
              className="h-full w-full object-cover transition duration-300 hover:scale-105"
            />
          </div>

          <div className="leading-none">
            <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">byteblast</p>
          </div>
        </div>

        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="mailto:contact@byteblast.xyz"
            className="hidden rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-500/20 sm:inline-flex"
          >
            Book a project
          </Link>

          <button
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-slate-200 transition duration-200 hover:border-cyan-500/40 hover:text-cyan-200 md:hidden"
          >
            <span className="relative block h-4 w-5">
              <span
                className={`absolute left-0 h-0.5 w-full rounded-full bg-current transition-all duration-300 ${
                  mobileOpen ? "top-1.5 rotate-45" : "top-0 rotate-0"
                }`}
              />
              <span
                className={`absolute left-0 top-1.5 h-0.5 w-full rounded-full bg-current transition-all duration-300 ${
                  mobileOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 h-0.5 w-full rounded-full bg-current transition-all duration-300 ${
                  mobileOpen ? "top-1.5 -rotate-45" : "bottom-0 rotate-0"
                }`}
              />
            </span>
          </button>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-30 bg-slate-950/55 backdrop-blur-[2px] transition-opacity duration-300 md:hidden ${
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={`fixed inset-x-3 top-3 z-40 flex max-h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950/95 p-3 shadow-2xl shadow-slate-950/60 transition-all duration-300 ease-out md:hidden ${
          mobileOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"
        }`}
        aria-label="Mobile navigation"
      >
        <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-cyan-400/30 bg-slate-900">
              <img src="/pfp.png" alt="Byte Blast profile" className="h-full w-full object-cover" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.24em] text-slate-400">byteblast</span>
          </div>

          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-lg leading-none text-slate-200 transition hover:border-cyan-500/40 hover:text-cyan-200"
          >
            ×
          </button>
        </div>

        <nav className="flex flex-1 flex-col items-stretch gap-2 overflow-y-auto pb-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-full border border-slate-800 bg-slate-900/70 px-3 py-2 text-center text-sm font-medium text-slate-200 transition duration-200 hover:border-cyan-500/40 hover:bg-slate-900 hover:text-cyan-200"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="mailto:contact@byteblast.xyz"
          onClick={() => setMobileOpen(false)}
          className="mt-2 inline-flex items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-[11px] font-medium text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/20"
        >
          Book a project
        </Link>
      </aside>
    </>
  );
}
