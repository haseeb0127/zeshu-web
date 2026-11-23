import type { MetadataRoute } from "next";

/**
 * Public discovery stays crawlable, including Next.js assets needed to render it.
 * Sensitive account data is protected by server-side auth, not robots.txt.
 * Cloudflare may prepend its independently managed bot directives at the edge.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: "*",
      allow: ["/", "/_next/"],
      disallow: [
        "/admin",
        "/api",
        "/checkout",
        "/account",
        "/auth",
        "/orders",
        "/payment",
        "/earn/promoters/dashboard",
      ],
    }],
    sitemap: "https://zeshu.in/sitemap.xml",
    host: "https://zeshu.in",
  };
}
