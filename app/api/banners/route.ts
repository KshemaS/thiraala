import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataFilePath = path.join(process.cwd(), "data", "hero-banners.json");

function getBannersFromFile() {
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

export async function GET() {
  const data = getBannersFromFile();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const current = getBannersFromFile();
    const updated = {
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
    console.error("Error writing hero-banners.json:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save banners" },
      { status: 500 }
    );
  }
}
