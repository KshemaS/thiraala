import { NextResponse } from "next/server";
import type { Category } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { imageUrl, isServedImageUrl } from "@/lib/productImages";

// Uploaded category photos are base64 in the database; send a short link
// (served by /api/images/category/…) instead of megabytes of text.
const toJSON = (c: Category) => ({ ...c, image: imageUrl("category", c.id, "image", c.image, c.updatedAt) ?? null });

// GET — all categories (database only).
export async function GET() {
  try {
    const categories = await prisma.category.findMany({ orderBy: { createdAt: "asc" } });
    return NextResponse.json(categories.map(toJSON));
  } catch (err) {
    console.error("Failed to load categories:", err);
    return NextResponse.json({ success: false, error: "Unable to load categories." }, { status: 500 });
  }
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/**
 * POST [ {id?, name, slug?, description?, image?, status?}, … ] — the
 * dashboard always sends the complete list, so it is saved as the full set:
 * existing categories (matched by id) are updated, new ones created, and
 * categories missing from the list are deleted. Renaming a category also
 * renames it on the products that use it. An image sent back as its served
 * link means "unchanged".
 */
export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => null);
    if (!Array.isArray(body)) {
      return NextResponse.json({ success: false, error: "Expected an array of categories" }, { status: 400 });
    }

    const incoming = body
      .filter((c) => c && typeof c.name === "string" && c.name.trim())
      .map((c) => ({
        id: typeof c.id === "string" ? c.id : undefined,
        name: c.name.trim() as string,
        slug: ((typeof c.slug === "string" && c.slug.trim()) || slugify(c.name)) as string,
        description: typeof c.description === "string" && c.description.trim() ? c.description.trim() : null,
        // undefined = keep the stored photo; null = no photo
        image: isServedImageUrl(c.image)
          ? undefined
          : typeof c.image === "string" && c.image.trim()
            ? (c.image.trim() as string)
            : null,
        status: c.status === "inactive" ? "inactive" : "active",
      }));

    const names = new Set<string>();
    for (const c of incoming) {
      const key = c.name.toLowerCase();
      if (names.has(key)) {
        return NextResponse.json({ success: false, error: `Category "${c.name}" is listed twice.` }, { status: 400 });
      }
      names.add(key);
    }

    await prisma.$transaction(
      async (tx) => {
        // Only the fields needed to match rows (not the photos).
        const existing = await tx.category.findMany({ select: { id: true, name: true } });
        const byId = new Map(existing.map((c) => [c.id, c]));
        const keepIds = new Set(incoming.map((c) => c.id).filter((id): id is string => !!id && byId.has(id)));

        // Remove deleted categories first so their names/slugs can be reused.
        await tx.category.deleteMany({ where: { id: { notIn: [...keepIds] } } });

        for (const c of incoming) {
          const data = { name: c.name, slug: c.slug, description: c.description, image: c.image, status: c.status };
          const before = c.id ? byId.get(c.id) : undefined;
          if (before) {
            await tx.category.update({ where: { id: before.id }, data });
            if (before.name !== c.name) {
              await tx.product.updateMany({
                where: { OR: [{ categoryId: before.id }, { categoryName: before.name }] },
                data: { categoryName: c.name, categoryId: before.id },
              });
            }
          } else {
            // Keep the id the dashboard assigned so its next save matches this row.
            await tx.category.create({ data: { ...data, image: data.image ?? null, ...(c.id ? { id: c.id } : {}) } });
          }
        }
      },
      { maxWait: 15_000, timeout: 30_000 }
    );

    const saved = await prisma.category.findMany({ orderBy: { createdAt: "asc" } });
    return NextResponse.json({ success: true, data: saved.map(toJSON) });
  } catch (error: any) {
    console.error("Error saving categories:", error);
    const duplicate = error?.code === "P2002";
    return NextResponse.json(
      { success: false, error: duplicate ? "Two categories can't have the same name or URL slug." : "Failed to save categories" },
      { status: duplicate ? 409 : 500 }
    );
  }
}
