import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { duplicateCollectionError, toCollectionItem } from "../route";

type Params = { params: Promise<{ id: string }> };

// GET — one collection.
export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const collection = await prisma.collection.findUnique({ where: { id } });
    if (!collection) return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    return NextResponse.json(toCollectionItem(collection));
  } catch (err) {
    console.error("Failed to load collection:", err);
    return NextResponse.json({ error: "Unable to load collection." }, { status: 500 });
  }
}

// PUT — update a collection. Renaming it also renames it on its products.
export async function PUT(request: Request, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const before = await prisma.collection.findUnique({ where: { id } });
    if (!before) return NextResponse.json({ error: "Collection not found" }, { status: 404 });

    const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : undefined;
    const updated = await prisma.$transaction(async (tx) => {
      const c = await tx.collection.update({
        where: { id },
        data: {
          name,
          slug: typeof body.slug === "string" && body.slug.trim() ? body.slug.trim() : undefined,
          description: typeof body.description === "string" ? body.description.trim() : undefined,
          image: typeof body.image === "string" ? body.image.trim() : undefined,
          status: body.status === "active" || body.status === "inactive" ? body.status : undefined,
          featured: body.featured !== undefined ? Boolean(body.featured) : undefined,
        },
      });
      if (name && name !== before.name) {
        await tx.product.updateMany({
          where: { OR: [{ collectionId: id }, { collectionName: before.name }] },
          data: { collectionName: name, collectionId: id },
        });
      }
      return c;
    });

    return NextResponse.json({ success: true, data: toCollectionItem(updated) });
  } catch (error) {
    const dup = duplicateCollectionError(error);
    if (dup) return dup;
    console.error("Error updating collection:", error);
    return NextResponse.json({ success: false, error: "Failed to update collection" }, { status: 500 });
  }
}

// DELETE — remove a collection. Its products stay, just without this collection.
export async function DELETE(request: Request, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const before = await prisma.collection.findUnique({ where: { id } });
    if (!before) return NextResponse.json({ error: "Collection not found" }, { status: 404 });

    await prisma.$transaction([
      prisma.product.updateMany({
        where: { OR: [{ collectionId: id }, { collectionName: before.name }] },
        data: { collectionName: null, collectionId: null },
      }),
      prisma.collection.delete({ where: { id } }),
    ]);
    return NextResponse.json({ success: true, message: "Collection deleted successfully" });
  } catch (error) {
    console.error("Error deleting collection:", error);
    return NextResponse.json({ success: false, error: "Failed to delete collection" }, { status: 500 });
  }
}
