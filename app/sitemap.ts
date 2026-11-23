import type { MetadataRoute } from "next";

/**
 * Only public, working, evergreen discovery pages. Never include an account,
 * a product/restaurant slug without verified stock, or a blocked admin/API URL.
 * lastModified is a REAL edit date for pages updated on 23 Nov 2026; do not
 * overwrite it with new Date() for every crawl/build (Google ignores false dates).
 */
const BASE_URL = "https://zeshu.in";
const DEPARTMENT_UPDATE = new Date("2026-11-23T00:00:00+05:30");

type PublicPage = {
  path: string;
  priority: number;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  lastModified?: Date;
};

const pages: readonly PublicPage[] = [
  { path: "/", priority: 1, changeFrequency: "daily", lastModified: DEPARTMENT_UPDATE },
  { path: "/dine", priority: 0.9, changeFrequency: "weekly", lastModified: DEPARTMENT_UPDATE },
  { path: "/move", priority: 0.9, changeFrequency: "weekly", lastModified: DEPARTMENT_UPDATE },
  { path: "/pay", priority: 0.85, changeFrequency: "weekly", lastModified: DEPARTMENT_UPDATE },
  { path: "/services", priority: 0.85, changeFrequency: "weekly", lastModified: DEPARTMENT_UPDATE },
  { path: "/fashion", priority: 0.85, changeFrequency: "weekly", lastModified: DEPARTMENT_UPDATE },
  { path: "/weddings", priority: 0.75, changeFrequency: "weekly", lastModified: DEPARTMENT_UPDATE },
  { path: "/interiors", priority: 0.75, changeFrequency: "weekly", lastModified: DEPARTMENT_UPDATE },
  { path: "/help", priority: 0.75, changeFrequency: "monthly" },
  { path: "/policies", priority: 0.7, changeFrequency: "monthly" },
  { path: "/partners", priority: 0.7, changeFrequency: "monthly" },
  { path: "/professional-services", priority: 0.6, changeFrequency: "monthly" },
  { path: "/earn", priority: 0.65, changeFrequency: "monthly" },
  { path: "/earn/promoters", priority: 0.55, changeFrequency: "monthly" },
  { path: "/app", priority: 0.55, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map(({ path, priority, changeFrequency, lastModified }) => ({
    url: BASE_URL + path,
    priority,
    changeFrequency,
    ...(lastModified ? { lastModified } : {}),
  }));
}
