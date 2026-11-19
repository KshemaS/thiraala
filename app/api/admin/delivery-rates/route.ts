import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { getDeliveryRates, ZONES } from "@/lib/delivery";

const MAX_FEE = 100000;

// GET current delivery charges for every zone (admin only).
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    return NextResponse.json({ success: true, rates: await getDeliveryRates() });
  } catch (err) {
    console.error("Failed to load delivery rates:", err);
    return NextResponse.json({ success: false, error: "Unable to load delivery charges." }, { status: 500 });
  }
}

// PUT { rates: [{ zone, firstItemFee, extraItemFee }] } — saves the amounts.
export async function PUT(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => null);
    const incoming = Array.isArray(body?.rates) ? body.rates : null;
    if (!incoming) {
      return NextResponse.json({ success: false, error: "No delivery charges sent." }, { status: 400 });
    }

    const updates: { zone: string; firstItemFee: number; extraItemFee: number }[] = [];
    for (const r of incoming) {
      const zone = ZONES.find((z) => z.key === r?.zone);
      if (!zone) {
        return NextResponse.json({ success: false, error: `Unknown zone "${r?.zone}".` }, { status: 400 });
      }
      const first = Number(r.firstItemFee);
      const extra = Number(r.extraItemFee);
      for (const [label, n] of [["first saree", first], ["each extra saree", extra]] as const) {
        if (!Number.isInteger(n) || n < 0 || n > MAX_FEE) {
          return NextResponse.json(
            { success: false, error: `${zone.name}: the ${label} charge must be a whole number of rupees (0 or more).` },
            { status: 400 }
          );
        }
      }
      updates.push({ zone: zone.key, firstItemFee: first, extraItemFee: extra });
    }

    await prisma.$transaction(
      updates.map((u) =>
        prisma.deliveryRate.upsert({
          where: { zone: u.zone },
          update: { firstItemFee: u.firstItemFee, extraItemFee: u.extraItemFee },
          create: u,
        })
      )
    );

    return NextResponse.json({ success: true, rates: await getDeliveryRates() });
  } catch (err) {
    console.error("Failed to save delivery rates:", err);
    return NextResponse.json({ success: false, error: "Unable to save delivery charges." }, { status: 500 });
  }
}
