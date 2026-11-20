import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/**
 * POST { ids: string[], action, … } — change several products at once.
 *   action "show" | "hide"                      show in / hide from the shop
 *   action "price", mode "set",     value ₹     set the selling price
 *   action "price", mode "percent", value %     raise/lower prices by a percentage
 *                                               (colour-specific prices move too)
 * MRPs are left as they are.
 */
export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => null);
    const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter((x: unknown) => typeof x === "string").slice(0, 500) : [];
    if (ids.length === 0) return NextResponse.json({ success: false, error: "No products selected." }, { status: 400 });

    if (body.action === "show" || body.action === "hide") {
      const { count } = await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { status: body.action === "show" ? "active" : "inactive" },
      });
      return NextResponse.json({ success: true, updated: count });
    }

    if (body.action === "price") {
      const value = Number(body.value);
      const percent = body.mode === "percent";
      if (!Number.isFinite(value) || (percent ? value <= -90 || value > 500 : value <= 0 || value > 10_000_000)) {
        return NextResponse.json(
          { success: false, error: percent ? "Enter a percentage between -90 and 500." : "Enter a price greater than ₹0." },
          { status: 400 }
        );
      }
      const scale = (n: number) => Math.max(1, Math.round(n * (1 + value / 100)));

      const products = await prisma.product.findMany({ where: { id: { in: ids } }, include: { variants: true } });
      await prisma.$transaction(
        async (tx) => {
          for (const p of products) {
            const priceValue = percent ? scale(p.priceValue) : Math.round(value);
            await tx.product.update({ where: { id: p.id }, data: { priceValue, price: rupees(priceValue) } });
            if (percent) {
              for (const v of p.variants) {
                if (v.priceValue != null) await tx.productVariant.update({ where: { id: v.id }, data: { priceValue: scale(v.priceValue) } });
              }
            }
          }
        },
        { timeout: 30_000, maxWait: 15_000 }
      );
      return NextResponse.json({ success: true, updated: products.length });
    }

    return NextResponse.json({ success: false, error: "Unknown action." }, { status: 400 });
  } catch (err) {
    console.error("Bulk product update failed:", err);
    return NextResponse.json({ success: false, error: "Unable to update the products." }, { status: 500 });
  }
}
