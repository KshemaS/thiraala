import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";

const dataFilePath = path.join(process.cwd(), "data", "editorial-photos.json");

interface EditorialPhotoItem {
  id: string;
  url: string;
  title?: string;
}

function getEditorialPhotos() {
  try {
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, "utf8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Error reading editorial-photos.json:", error);
  }
  return [];
}

export async function GET() {
  try {
    const dbPhotos = await prisma.editorialPhoto.findMany({
      orderBy: { order: "asc" },
      select: { id: true, url: true, title: true },
    });
    // An empty table is a valid state (all photos deleted), so only fall back on errors
    return NextResponse.json(dbPhotos);
  } catch (err) {
    // Database offline or not configured yet - fallback to JSON
  }

  const data = getEditorialPhotos();
  return NextResponse.json(Array.isArray(data) ? data : []);
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: "Expected an array of editorial photos" },
        { status: 400 }
      );
    }

    const photos: EditorialPhotoItem[] = body.filter(
      (photo) => photo && typeof photo.id === "string" && typeof photo.url === "string"
    );

    // Try saving to Prisma PostgreSQL. The dashboard always sends the full list,
    // so photos missing from it have been deleted.
    try {
      await prisma.$transaction([
        prisma.editorialPhoto.deleteMany({
          where: { id: { notIn: photos.map((photo) => photo.id) } },
        }),
        ...photos.map((photo, index) =>
          prisma.editorialPhoto.upsert({
            where: { id: photo.id },
            update: { title: photo.title || "Editorial", url: photo.url, order: index + 1 },
            create: {
              id: photo.id,
              title: photo.title || "Editorial",
              url: photo.url,
              order: index + 1,
            },
          })
        ),
      ]);

      return NextResponse.json({ success: true, data: photos });
    } catch (dbErr) {
      console.error("Error saving editorial photos to database:", dbErr);
      // Database offline - fallback to file sync
    }

    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(dataFilePath, JSON.stringify(photos, null, 2), "utf8");
    return NextResponse.json({ success: true, data: photos });
  } catch (error: any) {
    console.error("Error saving editorial photos:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save photos" },
      { status: 500 }
    );
  }
}
