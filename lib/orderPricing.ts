import prisma from "@/lib/prisma";
import { imageUrl } from "@/lib/productImages";
import { isValidPincode, quoteDelivery } from "@/lib/delivery";
import { attachImageRefs, OMIT_PHOTOS } from "@/lib/imageRefs";

/**
 * Prices an order on the server from the database. Never trust prices,
 * totals, fees or discounts sent by the browser: anyone can edit that request.
 */

export const MAX_QUANTITY_PER_LINE = 10;

export interface PricedLine {
  productId: string;
  variantId: string | null;
  sku: string;
  name: string;
  price: string;
  priceValue: number;
  quantity: number;
  foldedImg: string | null;
  wornImg: string | null;
  category: string;
  selectedColor: string;
}

export type PricingResult =
  | { ok: true; lines: PricedLine[]; subtotal: number; deliveryFee: number; discount: number; total: number }
  | { ok: false; status: number; error: string };

const formatRupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Cart lines as the browser sends them (only ids and quantity are used). */
interface IncomingItem {
  id?: unknown;
  productId?: unknown;
  variantId?: unknown;
  quantity?: unknown;
  name?: unknown;
}

export async function priceOrder(rawItems: unknown, pincode: unknown): Promise<PricingResult> {
  if (!isValidPincode(pincode)) {
    return { ok: false, status: 400, error: "Please enter a valid 6-digit delivery pincode." };
  }
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { ok: false, status: 400, error: "Your bag is empty." };
  }
  if (rawItems.length > 50) {
    return { ok: false, status: 400, error: "Too many items in one order." };
  }

  const wanted = rawItems.map((raw: IncomingItem) => ({
    productId: String(raw?.productId ?? raw?.id ?? "").trim(),
    variantId: raw?.variantId ? String(raw.variantId).trim() : null,
    quantity: Number(raw?.quantity ?? 1),
    label: typeof raw?.name === "string" ? raw.name : "An item",
  }));

  for (const w of wanted) {
    if (!w.productId) return { ok: false, status: 400, error: "An item in your bag is invalid." };
    if (!Number.isInteger(w.quantity) || w.quantity < 1 || w.quantity > MAX_QUANTITY_PER_LINE) {
      return { ok: false, status: 400, error: `Quantity for "${w.label}" must be between 1 and ${MAX_QUANTITY_PER_LINE}.` };
    }
  }

  const products = await attachImageRefs(
    await prisma.product.findMany({
      where: { id: { in: [...new Set(wanted.map((w) => w.productId))] } },
      omit: OMIT_PHOTOS,
      include: { variants: { omit: OMIT_PHOTOS } },
    })
  );
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines: PricedLine[] = [];
  for (const w of wanted) {
    const product = byId.get(w.productId);
    if (!product || product.status !== "active") {
      return {
        ok: false,
        status: 409,
        error: `"${w.label}" is no longer available. Please remove it from your bag.`,
      };
    }

    // A product with colours must be ordered as a specific colour.
    const variant = w.variantId ? product.variants.find((v) => v.id === w.variantId) : null;
    if (w.variantId && !variant) {
      return {
        ok: false,
        status: 409,
        error: `The colour you chose for "${product.name}" is no longer available. Please pick it again.`,
      };
    }
    if (!variant && product.variants.length > 0) {
      return {
        ok: false,
        status: 409,
        error: `Please choose a colour for "${product.name}" before checking out.`,
      };
    }

    const priceValue = variant?.priceValue ?? product.priceValue;
    if (!Number.isInteger(priceValue) || priceValue <= 0) {
      return { ok: false, status: 409, error: `"${product.name}" can't be ordered right now.` };
    }

    const folded = variant?.foldedImg ? variant : product;
    const worn = variant?.wornImg ? variant : product;
    lines.push({
      productId: product.id,
      variantId: variant?.id ?? null,
      sku: variant?.sku ?? product.sku,
      name: product.name,
      price: formatRupees(priceValue),
      priceValue,
      quantity: w.quantity,
      foldedImg:
        imageUrl(folded === product ? "product" : "variant", folded.id, "folded", folded.foldedImg, folded.updatedAt) ?? null,
      wornImg: imageUrl(worn === product ? "product" : "variant", worn.id, "worn", worn.wornImg, worn.updatedAt) ?? null,
      category: product.categoryName,
      selectedColor: variant?.name ?? product.selectedColor ?? product.color ?? "",
    });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.priceValue * l.quantity, 0);
  // Delivery by zone and number of sarees (amounts set in the dashboard).
  const sarees = lines.reduce((sum, l) => sum + l.quantity, 0);
  const deliveryFee = (await quoteDelivery(pincode, sarees)).fee;
  // No discounts or coupons yet.
  const discount = 0;
  return { ok: true, lines, subtotal, deliveryFee, discount, total: subtotal + deliveryFee - discount };
}
