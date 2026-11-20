import type { MetadataRoute } from "next";

/**
 * Public search-engine crawl policy for Zeshu.
 * Keep public discovery pages crawlable while excluding private and transactional routes.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/account/",
        "/checkout/",
        "/orders/",
        "/auth/",
      ],
    },
    sitemap: "https://zeshu.in/sitemap.xml",
    host: "https://zeshu.in",
  };
}
