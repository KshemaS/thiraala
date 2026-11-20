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

export type ImageOwner = "product" | "variant" | "category";
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

/** Splits "data:image/png;base64,AAAA" into its type and bytes. */
export function decodeDataUrl(dataUrl: string): { contentType: string; bytes: Buffer } | null {
  const match = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/.exec(dataUrl);
  if (!match) return null;
  const contentType = match[1] || "application/octet-stream";
  const bytes = match[2] ? Buffer.from(match[3], "base64") : Buffer.from(decodeURIComponent(match[3]), "utf8");
  return { contentType, bytes };
}
