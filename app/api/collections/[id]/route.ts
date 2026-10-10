import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { CollectionItem } from "../route";

const dataFilePath = path.join(process.cwd(), "data", "collections.json");

function getCollections(): CollectionItem[] {
  try {
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, "utf8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Error reading collections.json:", error);
  }
  return [];
}

function saveCollections(collections: CollectionItem[]): boolean {
  try {
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(collections, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error writing collections.json:", error);
    return false;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const dbCol = await prisma.collection.findUnique({
      where: { id },
    });
    if (dbCol) {
      return NextResponse.json({
        id: dbCol.id,
        name: dbCol.name,
        slug: dbCol.slug,
        description: dbCol.description || "",
        image: dbCol.image || "",
        status: (dbCol.status as "active" | "inactive") || "active",
        featured: dbCol.featured,
      });
    }
  } catch (err) {
    // Database offline - fallback to file
  }

  const collections = getCollections();
  const collection = collections.find((c) => String(c.id) === String(id));

  if (!collection) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  return NextResponse.json(collection);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const body = await request.json();

    // Try updating in Prisma PostgreSQL
    try {
      await prisma.collection.update({
        where: { id },
        data: {
          name: body.name !== undefined ? body.name.trim() : undefined,
          slug: body.slug !== undefined ? body.slug.trim() : undefined,
          description: body.description !== undefined ? body.description.trim() : undefined,
          image: body.image !== undefined ? body.image.trim() : undefined,
          status: body.status !== undefined ? body.status : undefined,
          featured: body.featured !== undefined ? Boolean(body.featured) : undefined,
        },
      });
    } catch (dbErr) {
      // Database offline - fallback file sync proceeds
    }

    const collections = getCollections();
    const index = collections.findIndex((c) => String(c.id) === String(id));

    if (index === -1) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const current = collections[index];
    const updatedCollection: CollectionItem = {
      ...current,
      ...body,
      id: current.id,
      name: body.name !== undefined ? body.name.trim() : current.name,
      slug: body.slug !== undefined ? body.slug.trim() : current.slug,
      description: body.description !== undefined ? body.description.trim() : current.description,
      image: body.image !== undefined ? body.image.trim() : current.image,
      status: body.status !== undefined ? body.status : current.status,
      featured: body.featured !== undefined ? Boolean(body.featured) : current.featured,
    };

    collections[index] = updatedCollection;
    saveCollections(collections);

    return NextResponse.json({ success: true, data: updatedCollection });
  } catch (error: any) {
    console.error("Error updating collection:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update collection" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;

    // Try deleting from Prisma PostgreSQL
    try {
      await prisma.collection.delete({
        where: { id },
      });
    } catch (dbErr) {
      // Database offline - fallback file sync proceeds
    }

    const collections = getCollections();
    const filtered = collections.filter((c) => String(c.id) !== String(id));

    if (filtered.length === collections.length) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    saveCollections(filtered);
    return NextResponse.json({ success: true, message: "Collection deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting collection:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete collection" },
      { status: 500 }
    );
  }
}
