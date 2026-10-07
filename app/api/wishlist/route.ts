import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import prisma from "@/lib/prisma";

const dataFilePath = path.join(process.cwd(), "data", "wishlist.json");

export interface StoredWishlistItem {
  id: string;
  userId?: string | null;
  productId: string | number;
  name: string;
  price: string;
  foldedImg?: string | null;
  wornImg?: string | null;
  img?: string | null;
  altFolded?: string | null;
  altWorn?: string | null;
  category?: string | null;
  createdAt: string;
  updatedAt: string;
}

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
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(items, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error writing wishlist.json:", error);
    return false;
  }
}

// -------------------------------------------------------------
// 1. READ (GET) - Get all wishlist items (or filtered by user)
// -------------------------------------------------------------
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId")?.trim() || null;
    const productId = searchParams.get("productId")?.trim() || null;

    let items = getWishlistItems();

    // Try reading from Prisma PostgreSQL if available
    try {
      if ((prisma as any)?.wishlistItem) {
        const whereClause: any = {};
        if (userId) whereClause.userId = userId;
        if (productId) whereClause.productId = String(productId);

        const dbItems = await (prisma as any).wishlistItem.findMany({
          where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
          orderBy: { createdAt: "desc" },
        });

        if (dbItems && dbItems.length > 0) {
          items = dbItems.map((dbItem: any) => ({
            id: dbItem.id,
            userId: dbItem.userId,
            productId: dbItem.productId,
            name: dbItem.name,
            price: dbItem.price,
            foldedImg: dbItem.foldedImg,
            wornImg: dbItem.wornImg,
            category: dbItem.category,
            createdAt: dbItem.createdAt?.toISOString?.() || new Date().toISOString(),
            updatedAt: dbItem.updatedAt?.toISOString?.() || new Date().toISOString(),
          }));
        }
      }
    } catch {
      // Fallback to JSON
    }

    // Filter by userId if provided
    if (userId) {
      items = items.filter((item) => item.userId === userId);
    }

    // Filter by productId if provided
    if (productId) {
      items = items.filter((item) => String(item.productId) === String(productId));
    }

    return NextResponse.json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error: any) {
    console.error("GET wishlist error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve wishlist items." },
      { status: 500 }
    );
  }
}

// -------------------------------------------------------------
// 2. CREATE (POST) - Add a product to the wishlist
// -------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload provided." },
        { status: 400 }
      );
    }

    const {
      productId,
      id: rawId,
      name,
      price,
      foldedImg,
      wornImg,
      img,
      altFolded,
      altWorn,
      category,
      userId,
    } = body;

    const resolvedProductId = productId !== undefined ? productId : rawId;

    if (resolvedProductId === undefined || resolvedProductId === null) {
      return NextResponse.json(
        { success: false, error: "Product ID is required to add to wishlist." },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { success: false, error: "Product name is required." },
        { status: 400 }
      );
    }

    const items = getWishlistItems();
    const cleanUserId = typeof userId === "string" ? userId.trim() : null;
    const strProductId = String(resolvedProductId);

    // Check if item already exists in wishlist for this user
    const existingIndex = items.findIndex((item) => {
      const matchProduct = String(item.productId) === strProductId;
      if (cleanUserId && item.userId) {
        return matchProduct && item.userId === cleanUserId;
      }
      return matchProduct;
    });

    if (existingIndex !== -1) {
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        message: `"${name}" is already in your wishlist.`,
        item: items[existingIndex],
      });
    }

    // Create new item
    const now = new Date().toISOString();
    const newItem: StoredWishlistItem = {
      id: `wish_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      userId: cleanUserId,
      productId: resolvedProductId,
      name: name.trim(),
      price: typeof price === "string" ? price : String(price || "₹0"),
      foldedImg: foldedImg || img || null,
      wornImg: wornImg || img || null,
      img: img || foldedImg || wornImg || null,
      altFolded: altFolded || name,
      altWorn: altWorn || name,
      category: category ? String(category) : null,
      createdAt: now,
      updatedAt: now,
    };

    // Try saving to Prisma PostgreSQL
    try {
      if ((prisma as any)?.wishlistItem) {
        await (prisma as any).wishlistItem.create({
          data: {
            id: newItem.id,
            userId: newItem.userId,
            productId: strProductId,
            name: newItem.name,
            price: newItem.price,
            foldedImg: typeof newItem.foldedImg === "string" ? newItem.foldedImg : null,
            wornImg: typeof newItem.wornImg === "string" ? newItem.wornImg : null,
            category: newItem.category,
            createdAt: new Date(newItem.createdAt),
            updatedAt: new Date(newItem.updatedAt),
          },
        });
      }
    } catch (dbError) {
      console.warn("Prisma wishlistItem save skipped:", dbError);
    }

    // Save to JSON
    items.unshift(newItem);
    saveWishlistItems(items);

    return NextResponse.json(
      {
        success: true,
        message: `"${newItem.name}" added to wishlist successfully.`,
        item: newItem,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST wishlist error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to add item to wishlist." },
      { status: 500 }
    );
  }
}

// -------------------------------------------------------------
// 3. UPDATE (PUT) - Update specific item or bulk sync items
// -------------------------------------------------------------
export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload provided." },
        { status: 400 }
      );
    }

    let items = getWishlistItems();
    const now = new Date().toISOString();

    // Case A: Bulk replace/sync array of items
    if (Array.isArray(body.items)) {
      const cleanUserId = typeof body.userId === "string" ? body.userId.trim() : null;

      const newItems: StoredWishlistItem[] = body.items.map((it: any) => ({
        id: it.id || `wish_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
        userId: cleanUserId || it.userId || null,
        productId: it.productId !== undefined ? it.productId : it.id,
        name: it.name || "Saree Product",
        price: it.price || "₹0",
        foldedImg: it.foldedImg || it.img || null,
        wornImg: it.wornImg || it.img || null,
        img: it.img || it.foldedImg || it.wornImg || null,
        altFolded: it.altFolded || it.name,
        altWorn: it.altWorn || it.name,
        category: it.category || null,
        createdAt: it.createdAt || now,
        updatedAt: now,
      }));

      if (cleanUserId) {
        // Keep other users' items, replace this user's items
        items = [...items.filter((it) => it.userId !== cleanUserId), ...newItems];
      } else {
        items = newItems;
      }

      saveWishlistItems(items);

      return NextResponse.json({
        success: true,
        message: "Wishlist synchronized successfully.",
        count: newItems.length,
        items: newItems,
      });
    }

    // Case B: Update single item by id or productId
    const targetId = body.id || (body.productId ? String(body.productId) : null);
    if (!targetId) {
      return NextResponse.json(
        { success: false, error: "Item ID or productId is required for update." },
        { status: 400 }
      );
    }

    const index = items.findIndex(
      (it) => it.id === targetId || String(it.productId) === targetId
    );

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "Wishlist item not found." },
        { status: 404 }
      );
    }

    // Apply allowed updates
    items[index] = {
      ...items[index],
      name: body.name !== undefined ? String(body.name).trim() : items[index].name,
      price: body.price !== undefined ? String(body.price) : items[index].price,
      category: body.category !== undefined ? String(body.category) : items[index].category,
      foldedImg: body.foldedImg !== undefined ? body.foldedImg : items[index].foldedImg,
      wornImg: body.wornImg !== undefined ? body.wornImg : items[index].wornImg,
      updatedAt: now,
    };

    saveWishlistItems(items);

    return NextResponse.json({
      success: true,
      message: "Wishlist item updated successfully.",
      item: items[index],
    });
  } catch (error: any) {
    console.error("PUT wishlist error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update wishlist." },
      { status: 500 }
    );
  }
}

// -------------------------------------------------------------
// 4. DELETE (DELETE) - Remove single item or clear entire wishlist
// -------------------------------------------------------------
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryId = searchParams.get("id");
    const queryProductId = searchParams.get("productId");
    const queryClearAll = searchParams.get("clearAll") === "true";
    const queryUserId = searchParams.get("userId");

    // Also check optional JSON body
    let body: any = null;
    try {
      body = await request.json();
    } catch {
      // Body may be empty in normal DELETE requests
    }

    const targetId = queryId || body?.id;
    const targetProductId = queryProductId || body?.productId;
    const clearAll = queryClearAll || body?.clearAll === true;
    const userId = queryUserId || body?.userId;

    let items = getWishlistItems();

    // Case A: Clear all items
    if (clearAll) {
      let remainingItems: StoredWishlistItem[] = [];

      if (userId) {
        // Only clear for specific user
        remainingItems = items.filter((it) => it.userId !== userId);
      }

      saveWishlistItems(remainingItems);

      // Try clearing in Prisma
      try {
        if ((prisma as any)?.wishlistItem) {
          if (userId) {
            await (prisma as any).wishlistItem.deleteMany({ where: { userId } });
          } else {
            await (prisma as any).wishlistItem.deleteMany();
          }
        }
      } catch (dbErr) {
        console.warn("Prisma wishlist deleteMany skipped:", dbErr);
      }

      return NextResponse.json({
        success: true,
        message: "Wishlist cleared successfully.",
        count: 0,
      });
    }

    // Case B: Remove specific item by id or productId
    if (!targetId && !targetProductId) {
      return NextResponse.json(
        { success: false, error: "Please specify 'id' or 'productId' to remove." },
        { status: 400 }
      );
    }

    const initialLength = items.length;
    items = items.filter((it) => {
      if (targetId && it.id === targetId) return false;
      if (targetProductId && String(it.productId) === String(targetProductId)) return false;
      return true;
    });

    if (items.length === initialLength) {
      return NextResponse.json(
        { success: false, error: "Item not found in wishlist." },
        { status: 404 }
      );
    }

    saveWishlistItems(items);

    // Try deleting from Prisma
    try {
      if ((prisma as any)?.wishlistItem) {
        if (targetId) {
          await (prisma as any).wishlistItem.delete({ where: { id: targetId } }).catch(() => null);
        } else if (targetProductId) {
          await (prisma as any).wishlistItem.deleteMany({
            where: { productId: String(targetProductId) },
          }).catch(() => null);
        }
      }
    } catch {
      // Ignore DB fallback error
    }

    return NextResponse.json({
      success: true,
      message: "Item removed from wishlist.",
      removedId: targetId || targetProductId,
      remainingCount: items.length,
    });
  } catch (error: any) {
    console.error("DELETE wishlist error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete item from wishlist." },
      { status: 500 }
    );
  }
}
