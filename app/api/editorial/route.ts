import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { imageUrl, isServedImageUrl } from "@/lib/productImages";

interface EditorialPhotoItem {
  id: string;
  url: string;
  title?: string;
}

/**
 * Editorial photos as links. Uploaded photos are base64 in the database; only
 * "is it an upload, or which static path" is read here, and uploads are
 * served by /api/images/editorial/….
 */
async function getPhotos(): Promise<EditorialPhotoItem[]> {
  const rows = await prisma.$queryRaw<{ id: string; title: string; updatedAt: Date; ref: string }[]>`
    SELECT id, title, "updatedAt",
      CASE WHEN url LIKE 'data:%' THEN 'data:' ELSE url END AS ref
    FROM "editorial_photos"
    ORDER BY "order" ASC`;
  return rows.map((r) => ({ id: r.id, title: r.title, url: imageUrl("editorial", r.id, "image", r.ref, r.updatedAt) || "" }));
}

// GET — editorial photos in display order (database only; empty is valid).
export async function GET() {
  try {
    return NextResponse.json(await getPhotos());
  } catch (err) {
    console.error("Failed to load editorial photos:", err);
    return NextResponse.json({ success: false, error: "Unable to load editorial photos." }, { status: 500 });
  }
}

// POST [ {id, url, title?}, … ] — the dashboard always sends the full list,
// so photos missing from it have been deleted. A photo sent back as its
// served link keeps its stored image.
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
      ...photos.map((photo, index) => {
        const keep = isServedImageUrl(photo.url);
        const fields = { title: photo.title || "Editorial", order: index + 1 };
        return prisma.editorialPhoto.upsert({
          where: { id: photo.id },
          update: keep ? fields : { ...fields, url: photo.url },
          // A served link only exists for a saved photo, so a create always has real data.
          create: { id: photo.id, ...fields, url: keep ? "" : photo.url },
          select: { id: true },
        });
      }),
    ]);
    return NextResponse.json({ success: true, data: await getPhotos() });
  } catch (error) {
    console.error("Error saving editorial photos:", error);
    return NextResponse.json({ success: false, error: "Failed to save photos" }, { status: 500 });
  }
}
