import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataFilePath = path.join(process.cwd(), "data", "editorial-photos.json");

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
  const data = getEditorialPhotos();
  return NextResponse.json(Array.isArray(data) ? data : []);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: "Expected an array of editorial photos" },
        { status: 400 }
      );
    }

    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(dataFilePath, JSON.stringify(body, null, 2), "utf8");
    return NextResponse.json({ success: true, data: body });
  } catch (error: any) {
    console.error("Error saving editorial-photos.json:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save photos" },
      { status: 500 }
    );
  }
}
