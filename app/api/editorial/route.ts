import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";

interface EditorialPhotoItem {
  id: string;
  url: string;
  title?: string;
}

// GET — editorial photos in display order (database only; empty is valid).
export async function GET() {
  try {
    const photos = await prisma.editorialPhoto.findMany({
      orderBy: { order: "asc" },
      select: { id: true, url: true, title: true },
    });
    return NextResponse.json(photos);
  } catch (err) {
    console.error("Failed to load editorial photos:", err);
    return NextResponse.json({ success: false, error: "Unable to load editorial photos." }, { status: 500 });
  }
}

// POST [ {id, url, title?}, … ] — the dashboard always sends the full list,
// so photos missing from it have been deleted.
export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => null);
    if (!Array.isArray(body)) {
      return NextResponse.json({ success: false, error: "Expected an array of editorial photos" }, { status: 400 });
    }

    const photos: EditorialPhotoItem[] = body.filter(
      (photo) => photo && typeof photo.id === "string" && typeof photo.url === "string"
    );

    await prisma.$transaction([
      prisma.editorialPhoto.deleteMany({ where: { id: { notIn: photos.map((photo) => photo.id) } } }),
      ...photos.map((photo, index) =>
        prisma.editorialPhoto.upsert({
          where: { id: photo.id },
          update: { title: photo.title || "Editorial", url: photo.url, order: index + 1 },
          create: { id: photo.id, title: photo.title || "Editorial", url: photo.url, order: index + 1 },
        })
      ),
    ]);
    return NextResponse.json({ success: true, data: photos });
  } catch (error) {
    console.error("Error saving editorial photos:", error);
    return NextResponse.json({ success: false, error: "Failed to save photos" }, { status: 500 });
  }
}
