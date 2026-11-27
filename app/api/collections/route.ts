import { refreshesShop } from "@/lib/revalidateShop";
import { NextResponse } from "next/server";
import type { Collection } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getAdminSession, requireAdmin } from "@/lib/auth/guard";
import { imageInputError, imageUrl, incomingImage } from "@/lib/productImages";
import { singleImageRefs } from "@/lib/imageRefs";

export interface CollectionItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  status: "active" | "inactive";
  featured?: boolean;
}

/**
 * `image` may be the stored value or just its ref ("data:" for an upload);
 * either way the client gets a short link, never the base64 photo itself.
 */
export function toCollectionItem(c: Omit<Collection, "image"> & { image: string | null | undefined }): CollectionItem {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description || "",
    image: imageUrl("collection", c.id, "image", c.image, c.updatedAt) || "",
    status: c.status === "inactive" ? "inactive" : "active",
    featured: c.featured,
  };
}

export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** Friendly error for a duplicate name/slug, else null. */
export function duplicateCollectionError(err: unknown) {
  return (err as { code?: string })?.code === "P2002"
    ? NextResponse.json(
        { success: false, error: "Another collection already uses this name or URL slug." },
        { status: 409 }
      )
    : null;
}

/** Why a collection's fields can't be saved, or null. */
export function collectionInputError(body: Record<string, unknown>): string | null {
  const err = imageInputError(body.image);
  if (err) return `Cover photo: ${err}`;
  if (typeof body.name === "string" && body.name.trim().length > 100) return "Name must be 100 characters or fewer.";
  if (typeof body.description === "string" && body.description.length > 2000) return "Description must be 2000 characters or fewer.";
  return null;
}

// GET — collections (database only). Hidden ones are for the dashboard only.
// The photo column isn't loaded: uploads are served by /api/images/collection/….
export async function GET() {
  try {
    const isAdmin = !!(await getAdminSession());
    const rows = await prisma.collection.findMany({
      where: isAdmin ? undefined : { status: "active" },
      orderBy: { createdAt: "desc" },
      omit: { image: true },
    });
    const refs = await singleImageRefs("collections", rows.map((c) => c.id));
    return NextResponse.json(rows.map((c) => toCollectionItem({ ...c, image: refs.get(c.id) })));
  } catch (err) {
    console.error("Failed to load collections:", err);
    return NextResponse.json({ success: false, error: "Unable to load collections." }, { status: 500 });
  }
}

// POST { name, slug?, description?, image?, status?, featured? } — create one collection.
async function handlePOST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ success: false, error: "Please enter a collection name." }, { status: 400 });
    }
    const inputError = collectionInputError(body);
    if (inputError) return NextResponse.json({ success: false, error: inputError }, { status: 400 });

    const created = await prisma.collection.create({
      data: {
        name,
        // Malayalam-only names slugify to nothing; fall back to a unique one.
        slug: slugify(typeof body.slug === "string" ? body.slug : "") || slugify(name) || `collection-${Date.now().toString(36)}`,
        description: typeof body.description === "string" ? body.description.trim() : "",
        image: incomingImage(body.image) ?? null,
        status: body.status === "inactive" ? "inactive" : "active",
        featured: Boolean(body.featured),
      },
    });
    return NextResponse.json({ success: true, data: toCollectionItem(created) });
  } catch (error) {
    const dup = duplicateCollectionError(error);
    if (dup) return dup;
    console.error("Error saving collection:", error);
    return NextResponse.json({ success: false, error: "Failed to save collection" }, { status: 500 });
  }
}

export const POST = refreshesShop(handlePOST);
