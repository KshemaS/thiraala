import type { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/**
 * A product stores its category and collection twice: as a name (shown in the
 * shop and filters) and as an id (the link to the Category / Collection row).
 * The ids are always worked out here from the names, never taken from the
 * browser, so the two can't drift apart.
 *
 * - Category: matched by name (any capitalisation). A new name typed in the
 *   product form ("+ Add Custom Category") creates that category, so every
 *   product's category exists in the category list.
 * - Collection: must be one of the existing collections; empty means none.
 *
 * Only the fields passed (not undefined) are resolved.
 */
export async function resolveProductLinks(
  db: Db,
  names: { categoryName?: string; collectionName?: string | null }
): Promise<
  | { ok: true; categoryName?: string; categoryId?: string; collectionName?: string | null; collectionId?: string | null }
  | { ok: false; error: string }
> {
  const out: { categoryName?: string; categoryId?: string; collectionName?: string | null; collectionId?: string | null } = {};

  // Collection first: it can fail, and then no category should have been created.
  if (names.collectionName !== undefined) {
    const name = names.collectionName?.trim() || "";
    if (!name) {
      out.collectionName = null;
      out.collectionId = null;
    } else {
      const col = await db.collection.findFirst({ where: { name: { equals: name, mode: "insensitive" } }, select: { id: true, name: true } });
      if (!col) return { ok: false, error: `There is no collection called "${name}". Pick one from the list or create it on the Collections page first.` };
      out.collectionName = col.name;
      out.collectionId = col.id;
    }
  }

  if (names.categoryName !== undefined) {
    const name = names.categoryName.trim() || "General";
    let cat = await db.category.findFirst({ where: { name: { equals: name, mode: "insensitive" } }, select: { id: true, name: true } });
    if (!cat) {
      let slug = slugify(name) || "category";
      if (await db.category.findUnique({ where: { slug }, select: { id: true } })) slug = `${slug}-${Date.now().toString(36)}`;
      cat = await db.category.create({ data: { id: `cat-${Date.now()}`, name, slug, status: "active" }, select: { id: true, name: true } });
    }
    out.categoryName = cat.name; // the category's own spelling
    out.categoryId = cat.id;
  }

  return { ok: true, ...out };
}
