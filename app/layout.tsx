import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { SiteTracker } from "@/components/site-tracker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://byteblast.xyz"),
  title: {
    default: "byteblast.xyz | developer portfolio & infrastructure status",
    template: "%s | byteblast.xyz",
  },
  description:
    "Developer portfolio, software delivery updates, and system status for byteblast.xyz.",
  openGraph: {
    title: "byteblast.xyz",
    description: "Developer portfolio and infrastructure operations dashboard.",
    url: "https://byteblast.xyz",
    siteName: "byteblast.xyz",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-950 text-slate-100">
        <Suspense fallback={null}>
          <SiteTracker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
