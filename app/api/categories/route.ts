import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";

const dataFilePath = path.join(process.cwd(), "data", "categories.json");

function getCategories() {
  try {
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, "utf8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Error reading categories.json:", error);
  }
  return [];
}

export async function GET() {
  try {
    const dbCategories = await prisma.category.findMany({
      orderBy: { createdAt: "asc" },
    });
    if (dbCategories && dbCategories.length > 0) {
      return NextResponse.json(dbCategories);
    }
  } catch (err) {
    // Database offline or not configured yet - fallback to JSON
  }

  const data = getCategories();
  return NextResponse.json(Array.isArray(data) ? data : []);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: "Expected an array of categories" },
        { status: 400 }
      );
    }

    // Try saving to Prisma PostgreSQL
    try {
      for (const cat of body) {
        if (cat.name) {
          const slug = cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          await prisma.category.upsert({
            where: { name: cat.name },
            update: {
              slug,
              description: cat.description || null,
              image: cat.image || null,
              status: cat.status || "active",
            },
            create: {
              name: cat.name,
              slug,
              description: cat.description || null,
              image: cat.image || null,
              status: cat.status || "active",
            },
          });
        }
      }
    } catch (dbErr) {
      // Database offline - fallback file sync proceeds
    }

    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(dataFilePath, JSON.stringify(body, null, 2), "utf8");
    return NextResponse.json({ success: true, data: body });
  } catch (error: any) {
    console.error("Error saving categories.json:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save categories" },
      { status: 500 }
    );
  }
}
