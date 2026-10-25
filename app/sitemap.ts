import type { MetadataRoute } from "next";

const siteUrl = "https://byteblast.xyz";

const publicPages = ["", "/about", "/contact", "/privacy", "/status", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPages.map((path) => ({
    url: `${siteUrl}${path}`,
  }));
}
