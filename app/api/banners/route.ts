import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { imageUrl, isServedImageUrl } from "@/lib/productImages";

const BANNER_KEYS = ["image1", "image2", "image3"] as const;
type BannerKey = (typeof BANNER_KEYS)[number];
type Banners = Record<BannerKey, string>;

/**
 * The three home page banners as links. Uploaded banners are base64 in the
 * database (megabytes); only "is it an upload, or which static path" is read
 * here, and uploads are served by /api/images/banner/….
 */
async function getBanners(): Promise<Banners> {
  const rows = await prisma.$queryRaw<{ id: string; imageKey: string; updatedAt: Date; ref: string | null }[]>`
    SELECT id, "imageKey", "updatedAt",
      CASE WHEN "imageUrl" LIKE 'data:%' THEN 'data:' ELSE "imageUrl" END AS ref
    FROM "hero_banners"
    WHERE "imageKey" IN ('image1', 'image2', 'image3')`;
  const byKey = new Map(rows.map((r) => [r.imageKey, imageUrl("banner", r.id, "image", r.ref, r.updatedAt) || ""]));
  return { image1: byKey.get("image1") || "", image2: byKey.get("image2") || "", image3: byKey.get("image3") || "" };
}

// GET — the three home page banner images (database only).
export async function GET() {
  try {
    return NextResponse.json(await getBanners());
  } catch (err) {
    console.error("Failed to load banners:", err);
    return NextResponse.json({ success: false, error: "Unable to load banners." }, { status: 500 });
  }
}

// POST { image1?, image2?, image3? } — replace any of the banner images. A
// banner sent back as its served link is unchanged.
export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => ({}));
    const changes = BANNER_KEYS.flatMap((key, index) => {
      const value = body?.[key];
      if (typeof value !== "string" || isServedImageUrl(value)) return [];
      return [{ key, value, order: index + 1 }];
    });

    if (changes.length > 0) {
      await prisma.$transaction(
        changes.map(({ key, value, order }) =>
          prisma.heroBanner.upsert({
            where: { imageKey: key },
            update: { imageUrl: value, order },
            create: { imageKey: key, imageUrl: value, order },
            select: { id: true },
          })
        )
      );
    }
    return NextResponse.json({ success: true, data: await getBanners() });
  } catch (error) {
    console.error("Error saving hero banners:", error);
    return NextResponse.json({ success: false, error: "Failed to save banners" }, { status: 500 });
  }
}
