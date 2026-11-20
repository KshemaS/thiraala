import prisma from "@/lib/prisma";
import { decodeDataUrl, isDataUrl } from "@/lib/productImages";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

/**
 * Serves a product or variant photo stored in the database as a data URL.
 * URL: /api/images/{product|variant}/{id}/{folded|worn}/{version}
 *      /api/images/category/{id}/image/{version}
 * The version is the row's updatedAt, so responses are cached immutably.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string; id: string; kind: string; version: string }> }
) {
  const { type, id, kind } = await params;
  const valid =
    ((type === "product" || type === "variant") && (kind === "folded" || kind === "worn")) ||
    (type === "category" && kind === "image");
  if (!valid) return new Response("Not found", { status: 404 });

  let stored: string | null | undefined;
  try {
    if (type === "category") {
      stored = (await prisma.category.findUnique({ where: { id }, select: { image: true } }))?.image;
    } else {
      const select = { foldedImg: kind === "folded", wornImg: kind === "worn" } as const;
      const row =
        type === "product"
          ? await prisma.product.findUnique({ where: { id }, select })
          : await prisma.productVariant.findUnique({ where: { id }, select });
      stored = kind === "folded" ? row?.foldedImg : row?.wornImg;
    }
  } catch (err) {
    console.error("Failed to load image:", err);
    return new Response("Unable to load image", { status: 500 });
  }

  if (!stored) return new Response("Not found", { status: 404 });

  // Static paths / external URLs: send the browser there.
  if (!isDataUrl(stored)) {
    return Response.redirect(new URL(stored, request.url), 302);
  }

  const decoded = decodeDataUrl(stored);
  // Only serve real raster image types (never e.g. SVG or HTML from the DB).
  if (!decoded || !ALLOWED_TYPES.has(decoded.contentType.toLowerCase())) {
    return new Response("Unsupported image", { status: 415 });
  }

  return new Response(new Uint8Array(decoded.bytes), {
    headers: {
      "Content-Type": decoded.contentType,
      "Content-Length": String(decoded.bytes.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
