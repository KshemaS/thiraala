import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";

const dataFilePath = path.join(process.cwd(), "data", "collections.json");

export interface CollectionItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  status: "active" | "inactive";
  featured?: boolean;
}

const defaultCollections: CollectionItem[] = [
  {
    id: "col-1",
    name: "Onam Collection",
    slug: "onam-collection",
    description: "Festive celebration sarees crafted with rich golden kasavu weaves and traditional Kerala motifs.",
    image: "/images/folded-gopuram.jpeg",
    status: "active",
    featured: true,
  },
  {
    id: "col-2",
    name: "Wedding & Bridal Kasavu",
    slug: "wedding-bridal-kasavu",
    description: "Grand bridal and festive sets adorned with opulent Gold Zari and auspicious temple drapes.",
    image: "/images/gopura.jpeg",
    status: "active",
    featured: true,
  },
  {
    id: "col-3",
    name: "Cotton Classics",
    slug: "cotton-classics",
    description: "Pure handloom cotton and mul-mul drapes tailored for lightweight breathability and timeless charm.",
    image: "/images/shoot.png",
    status: "active",
    featured: false,
  },
  {
    id: "col-4",
    name: "Festive Specials",
    slug: "festive-specials",
    description: "Vibrant celebratory sarees styled for weddings, temple ceremonies, and cultural gatherings.",
    image: "/images/folded-gopuram.jpeg",
    status: "active",
    featured: false,
  },
];

function getCollections(): CollectionItem[] {
  try {
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, "utf8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Error reading collections.json:", error);
  }

  // Seed default collections
  try {
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(defaultCollections, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing default collections.json:", err);
  }

  return defaultCollections;
}

export async function GET() {
  try {
    const dbCollections = await prisma.collection.findMany({
      orderBy: { createdAt: "desc" },
    });
    if (dbCollections && dbCollections.length > 0) {
      const mapped: CollectionItem[] = dbCollections.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || "",
        image: c.image || "",
        status: (c.status as "active" | "inactive") || "active",
        featured: c.featured,
      }));
      return NextResponse.json(mapped);
    }
  } catch (err) {
    // Database offline - fallback to JSON
  }

  const data = getCollections();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();

    // If an array is passed (bulk update/reorder)
    if (Array.isArray(body)) {
      const dir = path.dirname(dataFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(dataFilePath, JSON.stringify(body, null, 2), "utf8");
      return NextResponse.json({ success: true, data: body });
    }

    // Creating single collection
    const current = getCollections();
    const cleanName = body.name ? body.name.trim() : "Untitled Collection";
    const cleanSlug =
      body.slug?.trim() ||
      cleanName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const newCollection: CollectionItem = {
      id: body.id || `col-${Date.now()}`,
      name: cleanName,
      slug: cleanSlug,
      description: body.description ? body.description.trim() : "",
      image: body.image ? body.image.trim() : "",
      status: body.status || "active",
      featured: Boolean(body.featured),
    };

    // Try saving to Prisma PostgreSQL
    try {
      await prisma.collection.upsert({
        where: { name: cleanName },
        update: {
          slug: cleanSlug,
          description: newCollection.description,
          image: newCollection.image,
          status: newCollection.status,
          featured: newCollection.featured,
        },
        create: {
          id: newCollection.id,
          name: cleanName,
          slug: cleanSlug,
          description: newCollection.description,
          image: newCollection.image,
          status: newCollection.status,
          featured: newCollection.featured,
        },
      });
    } catch (dbErr) {
      // Database offline - fallback to file
    }

    const updated = [newCollection, ...current];
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(updated, null, 2), "utf8");

    return NextResponse.json({ success: true, data: newCollection });
  } catch (error: any) {
    console.error("Error saving collections:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save collection" },
      { status: 500 }
    );
  }
}
