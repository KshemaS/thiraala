import prisma from "@/lib/prisma";
import { imageUrl } from "@/lib/productImages";
import { singleImageRefs } from "@/lib/imageRefs";

/**
 * All categories with their photo as a short link (served by
 * /api/images/category/…). Uploaded photos are base64 in the database, up to
 * several MB each, so the photo column itself is never loaded here.
 */
export async function listCategories() {
  const rows = await prisma.category.findMany({ orderBy: { createdAt: "asc" }, omit: { image: true } });
  const refs = await singleImageRefs("categories", rows.map((c) => c.id));
  return rows.map((c) => ({ ...c, image: imageUrl("category", c.id, "image", refs.get(c.id), c.updatedAt) ?? null }));
}

export type CategoryListItem = Awaited<ReturnType<typeof listCategories>>[number];
