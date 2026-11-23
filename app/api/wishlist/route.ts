import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCustomerId } from "@/lib/auth/customerSession";
import { imageUrl } from "@/lib/productImages";
import { attachImageRefs, OMIT_PHOTOS } from "@/lib/imageRefs";

/**
 * The signed-in customer's wishlist (sign-in is required to use one).
 * The customer always comes from the signed session cookie; a `userId` in
 * the request is ignored, so nobody can read or change another customer's
 * wishlist.
 */

const text = (v: unknown, max = 500) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

const notSignedIn = () =>
  NextResponse.json({ success: false, error: "Please sign in to use your wishlist." }, { status: 401 });

function toJSON(item: {
  id: string;
  productId: string;
  name: string;
  price: string;
  foldedImg: string | null;
  wornImg: string | null;
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    productId: item.productId,
    name: item.name,
    price: item.price,
    foldedImg: item.foldedImg,
    wornImg: item.wornImg,
    img: item.wornImg || item.foldedImg,
    category: item.category,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

// GET — the customer's wishlist (empty for guests).
export async function GET() {
  try {
    const userId = await getCustomerId();
    if (!userId) return NextResponse.json({ success: true, count: 0, items: [] });

    const items = await prisma.wishlistItem.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ success: true, count: items.length, items: items.map(toJSON) });
  } catch (error) {
    console.error("GET wishlist error:", error);
    return NextResponse.json({ success: false, error: "Failed to retrieve wishlist items." }, { status: 500 });
  }
}

// POST { productId } — add one item. Only real products on sale can be saved,
// and their name, price and photos come from the database, not the request.
export async function POST(request: Request) {
  try {
    const userId = await getCustomerId();
    if (!userId) return notSignedIn();

    const body = await request.json().catch(() => null);
    const productId = text(body?.productId ?? body?.id, 200);
    if (!productId) {
      return NextResponse.json({ success: false, error: "Product ID is required to add to wishlist." }, { status: 400 });
    }

    const found = await prisma.product.findFirst({
      where: { id: productId, status: "active" },
      omit: OMIT_PHOTOS,
    });
    if (!found) {
      return NextResponse.json({ success: false, error: "This saree isn't available any more." }, { status: 404 });
    }
    const [product] = await attachImageRefs([found]);

    const existing = await prisma.wishlistItem.findFirst({ where: { userId, productId } });
    if (existing) {
      return NextResponse.json({ success: true, message: "Item is already in your wishlist.", item: toJSON(existing) });
    }

    const item = await prisma.wishlistItem.create({
      data: {
        userId,
        productId: product.id,
        name: product.name,
        price: product.price,
        foldedImg: imageUrl("product", product.id, "folded", product.foldedImg, product.updatedAt) ?? null,
        wornImg: imageUrl("product", product.id, "worn", product.wornImg, product.updatedAt) ?? null,
        category: product.categoryName,
      },
    });
    return NextResponse.json({ success: true, message: "Added to wishlist.", item: toJSON(item) }, { status: 201 });
  } catch (error) {
    console.error("POST wishlist error:", error);
    return NextResponse.json({ success: false, error: "Failed to add item to wishlist." }, { status: 500 });
  }
}

// DELETE ?productId=… (or ?id=…) removes one item; ?clearAll=true empties the
// wishlist. Only ever touches the signed-in customer's own items.
export async function DELETE(request: Request) {
  try {
    const userId = await getCustomerId();
    if (!userId) return notSignedIn();

    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => null);
    const clearAll = searchParams.get("clearAll") === "true" || body?.clearAll === true;
    const productId = searchParams.get("productId") || body?.productId;
    const id = searchParams.get("id") || body?.id;

    if (clearAll) {
      const { count } = await prisma.wishlistItem.deleteMany({ where: { userId } });
      return NextResponse.json({ success: true, message: "Wishlist cleared successfully.", removed: count, count: 0 });
    }

    if (!productId && !id) {
      return NextResponse.json({ success: false, error: "Please specify 'id' or 'productId' to remove." }, { status: 400 });
    }

    const keys = [productId, id].filter(Boolean).map(String);
    const { count } = await prisma.wishlistItem.deleteMany({
      where: { userId, OR: [{ productId: { in: keys } }, { id: { in: keys } }] },
    });
    return NextResponse.json({ success: true, message: "Item removed from wishlist.", removed: count });
  } catch (error) {
    console.error("DELETE wishlist error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete item from wishlist." }, { status: 500 });
  }
}
