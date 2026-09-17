"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

function sendTrackEvent(type: "view" | "click", path: string, label: string) {
  if (type === "view") {
    const params = new URLSearchParams({ path, label });
    fetch(`/track?${params.toString()}`, { method: "GET", cache: "no-store" }).catch(() => {
      // no-op: tracking failures should not block UI
    });
    return;
  }

  const form = new URLSearchParams({ path, label });
  fetch("/track", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
    cache: "no-store",
  }).catch(() => {
    // no-op: tracking failures should not block UI
  });
}

export function SiteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const path = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    sendTrackEvent("view", path || "/", "page");
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;

      if (!anchor) {
        return;
      }

      const href = anchor.getAttribute("href") || "";
      const isExternal = href.startsWith("http://") || href.startsWith("https://");
      const isMailto = href.startsWith("mailto:");
      const isTel = href.startsWith("tel:");

      if (href.startsWith("#") || isMailto || isTel || (!isExternal && href.startsWith("/"))) {
        const label = anchor.textContent?.trim() || anchor.getAttribute("aria-label") || "link";
        const nextPath = href.startsWith("/") ? href : window.location.pathname;
        sendTrackEvent("click", nextPath, label);
      }

      if (isExternal) {
        const label = anchor.textContent?.trim() || anchor.getAttribute("aria-label") || "external-link";
        sendTrackEvent("click", window.location.pathname, label);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
