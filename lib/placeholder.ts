import type { StaticImageData } from "next/image";

/**
 * Neutral image shown when a product has no photo. Never fall back to a real
 * saree photo: customers would take it for this product.
 */
export const NO_PHOTO = "/images/no-photo.svg";

/**
 * A product's own photos: a missing one borrows the other, and only when
 * both are missing is the neutral placeholder used.
 */
export function ownPhotos(folded?: string | null, worn?: string | null) {
  return {
    foldedImg: folded || worn || NO_PHOTO,
    wornImg: worn || folded || NO_PHOTO,
  };
}

/** A photo as stored in the shop: a URL, or an image imported in code. */
export type Photo = string | StaticImageData;

/** The URL of a photo of either kind, or the placeholder if there isn't one. */
export function photoSrc(img: unknown, fallback: string = NO_PHOTO): string {
  if (!img) return fallback;
  if (typeof img === "string") return img;
  if (typeof img === "object" && "src" in img && typeof img.src === "string") return img.src;
  return fallback;
}
