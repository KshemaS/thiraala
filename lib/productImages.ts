/**
 * Product photos uploaded in the dashboard are stored in the database as
 * base64 data URLs. Sending those inline made each product page ~7 MB, so
 * pages and APIs get a short URL instead, served by
 * app/api/images/[type]/[id]/[kind]/[version]/route.ts.
 *
 * The version segment (the row's updatedAt) changes whenever the photo can
 * change, so the image response can be cached forever. It's in the path, not a
 * query string, because next/image only optimizes local URLs with query
 * strings when they're listed in images.localPatterns.
 */

export type ImageOwner = "product" | "variant" | "category" | "collection" | "banner" | "editorial";
export type ImageKind = "folded" | "worn" | "image";

const SERVED_PREFIX = "/api/images/";

export function isDataUrl(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("data:");
}

/** True for URLs produced by imageUrl() (i.e. "photo unchanged" when sent back). */
export function isServedImageUrl(value: unknown): boolean {
  return typeof value === "string" && value.startsWith(SERVED_PREFIX);
}

/**
 * The URL to hand to the client for a stored image value: data URLs become a
 * served URL; static paths and external URLs are returned unchanged.
 */
export function imageUrl(
  owner: ImageOwner,
  id: string,
  kind: ImageKind,
  stored: string | null | undefined,
  updatedAt: Date
): string | undefined {
  if (!stored) return undefined;
  if (!isDataUrl(stored)) return stored;
  return `${SERVED_PREFIX}${owner}/${encodeURIComponent(id)}/${kind}/${updatedAt.getTime()}`;
}

/**
 * Normalizes an image field coming back from a form:
 * - a served URL means "keep the stored photo" → undefined (don't update)
 * - blank → null (remove)
 * - anything else (new data URL, static path) → stored as is
 */
export function incomingImage(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (isServedImageUrl(value)) return undefined;
  if (value === null) return null;
  const s = String(value).trim();
  return s ? s : null;
}

const UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
/** ~5 MB of image data (base64 adds a third), matching the dashboard's upload limit. */
const MAX_DATA_URL_LENGTH = Math.ceil((5 * 1024 * 1024 * 4) / 3) + 100;

/**
 * Why an image value from a form can't be stored, or null if it's fine.
 * Allowed: nothing, a served link ("unchanged"), a site path (/images/…),
 * an https link, or an uploaded JPEG/PNG/WebP/AVIF/GIF up to ~5 MB.
 */
export function imageInputError(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return "must be an image.";
  const v = value.trim();
  if (isServedImageUrl(v)) return null;
  if (v.startsWith("data:")) {
    const type = /^data:([^;,]+)/.exec(v)?.[1]?.toLowerCase();
    if (!type || !UPLOAD_TYPES.includes(type) || !v.includes(";base64,")) return "upload a JPEG, PNG, WebP, AVIF or GIF image.";
    if (v.length > MAX_DATA_URL_LENGTH) return "the image is larger than 5 MB. Please use a smaller photo.";
    return null;
  }
  if ((v.startsWith("/") && !v.startsWith("//")) || /^https:\/\//i.test(v)) return v.length <= 2048 ? null : "the link is too long.";
  return "must be an uploaded image, a site path or an https link.";
}

/** Splits "data:image/png;base64,AAAA" into its type and bytes. */
export function decodeDataUrl(dataUrl: string): { contentType: string; bytes: Buffer } | null {
  const match = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/.exec(dataUrl);
  if (!match) return null;
  const contentType = match[1] || "application/octet-stream";
  const bytes = match[2] ? Buffer.from(match[3], "base64") : Buffer.from(decodeURIComponent(match[3]), "utf8");
  return { contentType, bytes };
}
