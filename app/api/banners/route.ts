import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";

const BANNER_KEYS = ["image1", "image2", "image3"] as const;
type Banners = Record<(typeof BANNER_KEYS)[number], string>;

async function getBanners(): Promise<Banners> {
  const rows = await prisma.heroBanner.findMany({
    where: { imageKey: { in: [...BANNER_KEYS] } },
  });
  const byKey = new Map(rows.map((row) => [row.imageKey, row.imageUrl]));
  return {
    image1: byKey.get("image1") || "",
    image2: byKey.get("image2") || "",
    image3: byKey.get("image3") || "",
  };
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

// POST { image1?, image2?, image3? } — replace any of the banner images.
export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => ({}));
    const current = await getBanners();
    const updated: Banners = {
      image1: typeof body.image1 === "string" ? body.image1 : current.image1,
      image2: typeof body.image2 === "string" ? body.image2 : current.image2,
      image3: typeof body.image3 === "string" ? body.image3 : current.image3,
    };

    await prisma.$transaction(
      BANNER_KEYS.map((key, index) =>
        prisma.heroBanner.upsert({
          where: { imageKey: key },
          update: { imageUrl: updated[key], order: index + 1 },
          create: { imageKey: key, imageUrl: updated[key], order: index + 1 },
        })
      )
    );
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error saving hero banners:", error);
    return NextResponse.json({ success: false, error: "Failed to save banners" }, { status: 500 });
  }
}
