import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

const BASE_URL = "https://www.thiraala.com";

/**
 * Every shop page and every visible product. Products carry the date they
 * were last changed, so search engines know when to look again; the fixed
 * pages carry no date rather than a made-up one.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const products = await prisma.product.findMany({
      where: { status: "active" },
      select: { id: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
    });
    productEntries = products.map((p) => ({
      url: `${BASE_URL}/products/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch (err) {
    console.error("Failed to generate product sitemap entries:", err);
  }

  const newest = productEntries.reduce<Date | undefined>((latest, e) => {
    const d = e.lastModified as Date;
    return !latest || d > latest ? d : latest;
  }, undefined);

  const staticRoutes: MetadataRoute.Sitemap = [
    // The home page and shop list change whenever a product does.
    { url: BASE_URL, lastModified: newest, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/products`, lastModified: newest, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/contact`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/track-order`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/shipping-returns`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE_URL}/care-guide`, changeFrequency: "yearly", priority: 0.5 },
  ];

  return [...staticRoutes, ...productEntries];
}
