import prisma from "@/lib/prisma";

/**
 * Delivery charges by zone. The fee for an order is
 *   firstItemFee + extraItemFee × (number of sarees − 1)
 * with the amounts per zone set in the dashboard (Delivery Charges page) and
 * stored in the delivery_rates table. Which pincode is in which zone is fixed
 * here, by pincode prefix.
 */

export type ZoneKey = "kerala" | "neighbours" | "south_west" | "rest" | "remote";

export interface ZoneInfo {
  key: ZoneKey;
  name: string;
  description: string;
  defaultFirst: number;
  defaultExtra: number;
}

export const ZONES: ZoneInfo[] = [
  { key: "kerala", name: "Kerala", description: "Kerala and Mahe", defaultFirst: 100, defaultExtra: 50 },
  { key: "neighbours", name: "Neighbouring states", description: "Tamil Nadu, Karnataka, Puducherry", defaultFirst: 150, defaultExtra: 75 },
  { key: "south_west", name: "South & West", description: "Andhra Pradesh, Telangana, Goa, Maharashtra", defaultFirst: 200, defaultExtra: 100 },
  { key: "rest", name: "Rest of India", description: "North, Central and East India", defaultFirst: 500, defaultExtra: 250 },
  { key: "remote", name: "Remote areas", description: "North-East, Sikkim, J&K, Ladakh, Andaman & Nicobar, Lakshadweep", defaultFirst: 700, defaultExtra: 350 },
];

/**
 * Pincode prefix → zone. The longest matching prefix wins, so the more
 * specific remote entries (e.g. Lakshadweep 68255 inside Kerala's 68) take
 * priority. Anything unlisted is "rest".
 */
const PREFIX_ZONES: [string, ZoneKey][] = [
  // Kerala (Mahe, Puducherry, also uses 673)
  ["67", "kerala"], ["68", "kerala"], ["69", "kerala"],
  // Tamil Nadu + Puducherry/Karaikal (60–66), Karnataka (56–59)
  ["56", "neighbours"], ["57", "neighbours"], ["58", "neighbours"], ["59", "neighbours"],
  ["60", "neighbours"], ["61", "neighbours"], ["62", "neighbours"], ["63", "neighbours"],
  ["64", "neighbours"], ["65", "neighbours"], ["66", "neighbours"],
  // Maharashtra + Goa (40–44), Telangana + Andhra Pradesh (50–53)
  ["40", "south_west"], ["41", "south_west"], ["42", "south_west"], ["43", "south_west"], ["44", "south_west"],
  ["50", "south_west"], ["51", "south_west"], ["52", "south_west"], ["53", "south_west"],
  // Remote: J&K + Ladakh (18–19), North-East (78–79), Sikkim (737),
  // Andaman & Nicobar (744), Lakshadweep (682551–682559)
  ["18", "remote"], ["19", "remote"], ["78", "remote"], ["79", "remote"],
  ["737", "remote"], ["744", "remote"], ["68255", "remote"],
];

export function isValidPincode(pincode: unknown): pincode is string {
  return typeof pincode === "string" && /^[1-9]\d{5}$/.test(pincode.trim());
}

export function zoneForPincode(pincode: string): ZoneInfo {
  const pin = pincode.trim();
  let best: [string, ZoneKey] | null = null;
  for (const entry of PREFIX_ZONES) {
    if (pin.startsWith(entry[0]) && (!best || entry[0].length > best[0].length)) best = entry;
  }
  const key = best ? best[1] : "rest";
  return ZONES.find((z) => z.key === key)!;
}

export interface ZoneRate extends ZoneInfo {
  firstItemFee: number;
  extraItemFee: number;
}

/** Current amounts for every zone (defaults for zones never saved). */
export async function getDeliveryRates(): Promise<ZoneRate[]> {
  const saved = await prisma.deliveryRate.findMany();
  const byZone = new Map(saved.map((r) => [r.zone, r]));
  return ZONES.map((z) => ({
    ...z,
    firstItemFee: byZone.get(z.key)?.firstItemFee ?? z.defaultFirst,
    extraItemFee: byZone.get(z.key)?.extraItemFee ?? z.defaultExtra,
  }));
}

export interface DeliveryQuote {
  zone: ZoneKey;
  zoneName: string;
  sarees: number;
  fee: number;
}

/** Delivery fee for `sarees` sarees to `pincode`. */
export async function quoteDelivery(pincode: string, sarees: number): Promise<DeliveryQuote> {
  const zone = zoneForPincode(pincode);
  const rates = await getDeliveryRates();
  const rate = rates.find((r) => r.key === zone.key)!;
  const count = Math.max(1, Math.floor(sarees));
  return {
    zone: zone.key,
    zoneName: zone.name,
    sarees: count,
    fee: rate.firstItemFee + rate.extraItemFee * (count - 1),
  };
}
