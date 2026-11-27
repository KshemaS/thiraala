import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { DEFAULT_STATE_ZONE, getDeliveryRates, isZoneKey, ZONES } from "@/lib/delivery";

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

// PUT { rates?: [{ zone, firstItemFee, extraItemFee }], stateZones?: { [state]: zone } }
// — saves the amounts and/or which zone each state is in.
export async function PUT(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => null);
    const incoming: unknown[] = Array.isArray(body?.rates) ? body.rates : [];
    const stateZones = body?.stateZones && typeof body.stateZones === "object" ? (body.stateZones as Record<string, unknown>) : null;
    if (incoming.length === 0 && !stateZones) {
      return NextResponse.json({ success: false, error: "Nothing to save." }, { status: 400 });
    }
    if (stateZones) {
      for (const [state, zone] of Object.entries(stateZones)) {
        if (!(state in DEFAULT_STATE_ZONE)) {
          return NextResponse.json({ success: false, error: `Unknown state "${state}".` }, { status: 400 });
        }
        if (!isZoneKey(zone)) {
          return NextResponse.json({ success: false, error: `Unknown zone for ${state}.` }, { status: 400 });
        }
      }
    }

    const updates: { zone: string; firstItemFee: number; extraItemFee: number }[] = [];
    for (const raw of incoming) {
      const r = (raw && typeof raw === "object" ? raw : {}) as { zone?: unknown; firstItemFee?: unknown; extraItemFee?: unknown };
      const zone = ZONES.find((z) => z.key === r.zone);
      if (!zone) {
        return NextResponse.json({ success: false, error: `Unknown zone "${String(r.zone)}".` }, { status: 400 });
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

    await prisma.$transaction([
      ...updates.map((u) =>
        prisma.deliveryRate.upsert({
          where: { zone: u.zone },
          update: { firstItemFee: u.firstItemFee, extraItemFee: u.extraItemFee },
          create: u,
        })
      ),
      // A state set back to its default zone doesn't need a row.
      ...Object.entries(stateZones ?? {}).map(([state, zone]) =>
        zone === DEFAULT_STATE_ZONE[state]
          ? prisma.deliveryStateZone.deleteMany({ where: { state } })
          : prisma.deliveryStateZone.upsert({ where: { state }, update: { zone: zone as string }, create: { state, zone: zone as string } })
      ),
    ]);

    return NextResponse.json({ success: true, rates: await getDeliveryRates() });
  } catch (err) {
    console.error("Failed to save delivery rates:", err);
    return NextResponse.json({ success: false, error: "Unable to save delivery charges." }, { status: 500 });
  }
}
