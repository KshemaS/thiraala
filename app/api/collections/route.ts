import { NextResponse } from "next/server";
import type { Collection } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";

export interface CollectionItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  status: "active" | "inactive";
  featured?: boolean;
}

export function toCollectionItem(c: Collection): CollectionItem {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description || "",
    image: c.image || "",
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

// GET — all collections (database only).
export async function GET() {
  try {
    const collections = await prisma.collection.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(collections.map(toCollectionItem));
  } catch (err) {
    console.error("Failed to load collections:", err);
    return NextResponse.json({ success: false, error: "Unable to load collections." }, { status: 500 });
  }
}

// POST { name, slug?, description?, image?, status?, featured? } — create one collection.
export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ success: false, error: "Please enter a collection name." }, { status: 400 });
    }

    const created = await prisma.collection.create({
      data: {
        name,
        slug: (typeof body.slug === "string" && body.slug.trim()) || slugify(name),
        description: typeof body.description === "string" ? body.description.trim() : "",
        image: typeof body.image === "string" ? body.image.trim() : "",
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
