import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";

const dataFilePath = path.join(process.cwd(), "data", "hero-banners.json");
const BANNER_KEYS = ["image1", "image2", "image3"] as const;

type Banners = Record<(typeof BANNER_KEYS)[number], string>;

function getBannersFromFile(): Banners {
  try {
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, "utf8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Error reading hero-banners.json:", error);
  }
  return { image1: "", image2: "", image3: "" };
}

async function getBannersFromDb(): Promise<Banners> {
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

export async function GET() {
  try {
    return NextResponse.json(await getBannersFromDb());
  } catch (err) {
    // Database offline or not configured yet - fallback to JSON
  }

  return NextResponse.json(getBannersFromFile());
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();

    // Try saving to Prisma PostgreSQL
    try {
      const current = await getBannersFromDb();
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
    } catch (dbErr) {
      console.error("Error saving hero banners to database:", dbErr);
      // Database offline - fallback to file sync
    }

    const current = getBannersFromFile();
    const updated: Banners = {
      image1: typeof body.image1 === "string" ? body.image1 : current.image1 || "",
      image2: typeof body.image2 === "string" ? body.image2 : current.image2 || "",
      image3: typeof body.image3 === "string" ? body.image3 : current.image3 || "",
    };

    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(dataFilePath, JSON.stringify(updated, null, 2), "utf8");
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Error saving hero banners:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save banners" },
      { status: 500 }
    );
  }
}
