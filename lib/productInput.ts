import { imageInputError, incomingImage } from "@/lib/productImages";

/**
 * Checks and cleans product fields sent by the dashboard (create and edit).
 * Every field is optional here; `requireCore` makes name, SKU and price
 * required (for a new product). Fields that weren't sent stay undefined, so
 * an edit only changes what it includes.
 */

export const MAX_PRICE = 10_000_000;
const MAX_STOCK = 100_000;

export const formatRupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** URL slug from plain letters/digits. Empty for e.g. a Malayalam-only name. */
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

/**
 * The first candidate that gives a usable slug. Product names can be all
 * Malayalam (e.g. തെച്ചി), which slugify() empties; falling back to the SKU
 * keeps the address readable and unique instead of "/products/-".
 */
export function productSlug(...candidates: unknown[]): string {
  for (const c of candidates) {
    if (typeof c === "string") {
      const s = slugify(c);
      if (s) return s;
    }
  }
  return `saree-${Date.now().toString(36)}`;
}

const TEXT_LIMITS = {
  subtitle: 200,
  selectedColor: 100,
  fabric: 200,
  sareeFabric: 200,
  color: 200,
  pattern: 200,
  border: 200,
  blouse: 200,
  occasion: 200,
  sareeLength: 50,
  blouseLength: 50,
  careInstructions: 2000,
  description: 5000,
  altFolded: 300,
  altWorn: 300,
} as const;
type TextField = keyof typeof TEXT_LIMITS;

export interface ProductFields {
  name?: string;
  sku?: string;
  slug?: string;
  priceValue?: number;
  price?: string;
  mrp?: number | null;
  rating?: number | null;
  ratingCount?: number | null;
  stock?: number;
  status?: "active" | "inactive";
  categoryName?: string;
  collectionName?: string | null;
  highlights?: string | null;
  foldedImg?: string | null;
  wornImg?: string | null;
  featured?: boolean;
  isNewArrival?: boolean;
  text: Partial<Record<TextField, string | null>>;
}

const blank = (v: unknown) => v === undefined || v === null || v === "";

/** Whole number in range, or an error. undefined/blank → null. */
function wholeNumber(v: unknown, label: string, min: number, max: number): number | null | { error: string } {
  if (blank(v)) return null;
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v.replace(/[,\s₹]/g, "")) : NaN;
  if (!Number.isInteger(n) || n < min || n > max) {
    return { error: `${label} must be a whole number from ${min.toLocaleString("en-IN")} to ${max.toLocaleString("en-IN")}.` };
  }
  return n;
}

export function parseProductFields(
  body: Record<string, any>,
  opts: { requireCore: boolean; current?: { priceValue: number; mrp: number | null; name: string; sku: string } }
): { fields: ProductFields } | { error: string } {
  const out: ProductFields = { text: {} };

  // Name and SKU
  for (const [key, label, max] of [["name", "Product name", 200], ["sku", "SKU", 64]] as const) {
    const v = body[key];
    if (v === undefined && !opts.requireCore) continue;
    if (typeof v !== "string" || !v.trim()) return { error: `${label} is required.` };
    if (v.trim().length > max) return { error: `${label} must be ${max} characters or fewer.` };
    out[key] = v.trim();
  }
  if (out.sku !== undefined && !/^[A-Za-z0-9._-]+$/.test(out.sku)) {
    return { error: "SKU can only use letters, numbers, dots, dashes and underscores." };
  }

  if (body.slug !== undefined) {
    if (typeof body.slug !== "string") return { error: "URL slug must be text." };
    // A slug typed in non-English letters (or left blank) falls back to the name, then the SKU.
    out.slug = productSlug(body.slug, out.name ?? opts.current?.name, out.sku ?? opts.current?.sku);
  }

  // Price: the number is the source of truth; the display text follows it.
  if (body.priceValue !== undefined || opts.requireCore) {
    const p = wholeNumber(body.priceValue, "Price", 1, MAX_PRICE);
    if (p === null) return { error: "Price is required and must be more than ₹0." };
    if (typeof p === "object") return p;
    out.priceValue = p;
    out.price = formatRupees(p);
  }

  if (body.mrp !== undefined) {
    const m = wholeNumber(body.mrp, "MRP", 1, MAX_PRICE);
    if (m !== null && typeof m === "object") return m;
    out.mrp = m;
  }
  const price = out.priceValue ?? opts.current?.priceValue;
  const mrp = out.mrp !== undefined ? out.mrp : opts.current?.mrp ?? null;
  if (price && mrp && mrp < price) {
    return { error: `MRP (${formatRupees(mrp)}) can't be lower than the selling price (${formatRupees(price)}).` };
  }

  if (body.rating !== undefined) {
    if (blank(body.rating)) out.rating = null;
    else {
      const r = Number(body.rating);
      if (!Number.isFinite(r) || r < 0 || r > 5) return { error: "Rating must be between 0 and 5." };
      out.rating = Math.round(r * 10) / 10;
    }
  }
  if (body.ratingCount !== undefined) {
    const c = wholeNumber(body.ratingCount, "Rating count", 0, 10_000_000);
    if (c !== null && typeof c === "object") return c;
    out.ratingCount = c;
  }

  if (body.stock !== undefined) {
    const s = wholeNumber(body.stock, "Stock", 0, MAX_STOCK);
    if (s !== null && typeof s === "object") return s;
    out.stock = s ?? 0;
  }

  if (body.status !== undefined) {
    if (body.status !== "active" && body.status !== "inactive") return { error: "Status must be active or inactive." };
    out.status = body.status;
  }

  if (body.category !== undefined) {
    if (typeof body.category !== "string" || body.category.trim().length > 200) return { error: "Category must be text (200 characters or fewer)." };
    out.categoryName = body.category.trim() || "General";
  }
  if (body.collection !== undefined) {
    if (body.collection !== null && (typeof body.collection !== "string" || body.collection.length > 200)) {
      return { error: "Collection must be text (200 characters or fewer)." };
    }
    out.collectionName = body.collection ? body.collection.trim() || null : null;
  }

  for (const key of Object.keys(TEXT_LIMITS) as TextField[]) {
    const v = body[key];
    if (v === undefined) continue;
    if (v !== null && typeof v !== "string") return { error: `${key} must be text.` };
    const s = typeof v === "string" ? v.trim() : "";
    if (s.length > TEXT_LIMITS[key]) return { error: `${key} must be ${TEXT_LIMITS[key]} characters or fewer.` };
    out.text[key] = s || null;
  }

  if (body.highlights !== undefined) {
    const list = Array.isArray(body.highlights)
      ? body.highlights
      : typeof body.highlights === "string"
        ? body.highlights.split("\n")
        : body.highlights === null
          ? []
          : null;
    if (!list) return { error: "Highlights must be a list of text." };
    const clean = list.map((h: unknown) => String(h ?? "").trim()).filter(Boolean);
    if (clean.length > 20 || clean.some((h: string) => h.length > 300)) {
      return { error: "Up to 20 highlights, each 300 characters or fewer." };
    }
    out.highlights = clean.join("\n") || null;
  }

  for (const key of ["foldedImg", "wornImg"] as const) {
    const err = imageInputError(body[key]);
    if (err) return { error: `${key === "foldedImg" ? "Folded" : "Worn"} photo: ${err}` };
    out[key] = incomingImage(body[key]);
  }

  if (body.featured !== undefined) out.featured = Boolean(body.featured);
  if (body.isNewArrival !== undefined) out.isNewArrival = Boolean(body.isNewArrival);

  return { fields: out };
}
