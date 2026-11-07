import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: ":3",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Q7vPage() {
  return (
    <main className="site-shell q7v-page">
      <p className="section-label">&lt;3</p>
      <h1>Catboy :33333</h1>
      <div className="q7v-content">
        <p className="q7v-note">So im lwk a catboy</p>
        <img
          src="/byte-irl.gif"
          alt="Byte in real life"
          className="q7v-art"
        />
      </div>
      <Link href="/" className="search-home-link">
        Back to home
      </Link>
    </main>
  );
}
