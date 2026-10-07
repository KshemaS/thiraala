import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import { StoredWishlistItem } from "../route";

const dataFilePath = path.join(process.cwd(), "data", "wishlist.json");

function getWishlistItems(): StoredWishlistItem[] {
  try {
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, "utf8");
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (error) {
    console.error("Error reading wishlist.json:", error);
  }
  return [];
}

function saveWishlistItems(items: StoredWishlistItem[]): boolean {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(items, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error writing wishlist.json:", error);
    return false;
  }
}

// GET /api/wishlist/[id]
export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const items = getWishlistItems();
    const item = items.find((it) => it.id === id || String(it.productId) === id);

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Wishlist item not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to retrieve item." },
      { status: 500 }
    );
  }
}

// PUT /api/wishlist/[id]
export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const body = await request.json().catch(() => ({}));
    const items = getWishlistItems();
    const index = items.findIndex((it) => it.id === id || String(it.productId) === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "Wishlist item not found." },
        { status: 404 }
      );
    }

    items[index] = {
      ...items[index],
      name: body.name !== undefined ? String(body.name).trim() : items[index].name,
      price: body.price !== undefined ? String(body.price) : items[index].price,
      category: body.category !== undefined ? String(body.category) : items[index].category,
      updatedAt: new Date().toISOString(),
    };

    saveWishlistItems(items);

    return NextResponse.json({
      success: true,
      message: "Wishlist item updated successfully.",
      item: items[index],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update item." },
      { status: 500 }
    );
  }
}

// DELETE /api/wishlist/[id]
export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    let items = getWishlistItems();
    const initialLen = items.length;

    items = items.filter((it) => it.id !== id && String(it.productId) !== id);

    if (items.length === initialLen) {
      return NextResponse.json(
        { success: false, error: "Wishlist item not found." },
        { status: 404 }
      );
    }

    saveWishlistItems(items);

    // Try deleting from Prisma
    try {
      if ((prisma as any)?.wishlistItem) {
        await (prisma as any).wishlistItem.delete({ where: { id } }).catch(() => null);
      }
    } catch {
      // Fallback
    }

    return NextResponse.json({
      success: true,
      message: "Wishlist item removed.",
      removedId: id,
      remainingCount: items.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete item." },
      { status: 500 }
    );
  }
}
