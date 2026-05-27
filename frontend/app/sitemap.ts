import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tayibat.com";

const routes = [
  "",
  "/guidance",
  "/pricing",
  "/products",
  "/about",
  "/contact",
  "/medical-disclaimer",
  "/privacy-policy",
  "/refund-policy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/guidance" || route === "/pricing" ? 0.9 : 0.7,
  }));
}
