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
