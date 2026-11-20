import prisma from "@/lib/prisma";

/**
 * Delivery charges. The fee for an order is
 *   firstItemFee + extraItemFee × (number of sarees − 1)
 * for the customer's zone. A pincode gives a state (by its leading digits,
 * worked out here, never taken from what the customer types), and each state
 * belongs to a zone. Both the zone amounts (delivery_rates) and which zone
 * each state is in (delivery_state_zones) are set on the dashboard's Delivery
 * Charges page; states never moved there use DEFAULT_STATE_ZONE.
 */

export type ZoneKey = "kerala" | "neighbours" | "south_west" | "rest" | "remote";

export interface ZoneInfo {
  key: ZoneKey;
  name: string;
  defaultFirst: number;
  defaultExtra: number;
}

export const ZONES: ZoneInfo[] = [
  { key: "kerala", name: "Kerala", defaultFirst: 100, defaultExtra: 50 },
  { key: "neighbours", name: "Neighbouring states", defaultFirst: 150, defaultExtra: 75 },
  { key: "south_west", name: "South & West", defaultFirst: 200, defaultExtra: 100 },
  { key: "rest", name: "Rest of India", defaultFirst: 500, defaultExtra: 250 },
  { key: "remote", name: "Remote areas", defaultFirst: 700, defaultExtra: 350 },
];
const ZONE_KEYS = new Set<string>(ZONES.map((z) => z.key));
export const isZoneKey = (v: unknown): v is ZoneKey => typeof v === "string" && ZONE_KEYS.has(v);

/** Every state / union territory, and the zone it's in unless moved on the dashboard. */
export const DEFAULT_STATE_ZONE: Record<string, ZoneKey> = {
  Kerala: "kerala",
  "Tamil Nadu": "neighbours",
  Karnataka: "neighbours",
  Puducherry: "neighbours",
  "Andhra Pradesh": "south_west",
  Telangana: "south_west",
  Goa: "south_west",
  Maharashtra: "south_west",
  "Dadra & Nagar Haveli and Daman & Diu": "rest",
  Gujarat: "rest",
  Rajasthan: "rest",
  "Madhya Pradesh": "rest",
  Chhattisgarh: "rest",
  Odisha: "rest",
  "West Bengal": "rest",
  Bihar: "rest",
  Jharkhand: "rest",
  "Uttar Pradesh": "rest",
  Uttarakhand: "rest",
  Delhi: "rest",
  Haryana: "rest",
  Punjab: "rest",
  Chandigarh: "rest",
  "Himachal Pradesh": "rest",
  "Jammu & Kashmir": "remote",
  Ladakh: "remote",
  Sikkim: "remote",
  Assam: "remote",
  "Arunachal Pradesh": "remote",
  Meghalaya: "remote",
  Manipur: "remote",
  Mizoram: "remote",
  Nagaland: "remote",
  Tripura: "remote",
  "Andaman & Nicobar Islands": "remote",
  Lakshadweep: "remote",
};
export const STATES = Object.keys(DEFAULT_STATE_ZONE);

/**
 * Pincode prefix → state; the longest matching prefix wins. India Post's
 * 2–3 digit regions follow state lines almost everywhere; a few regions span
 * two states (UP/Uttarakhand, Bihar/Jharkhand, Punjab/Haryana around
 * Chandigarh) and are mapped to the main state of that region.
 */
const PREFIX_STATE: [string, string][] = [
  ["11", "Delhi"],
  ["12", "Haryana"], ["13", "Haryana"],
  ["14", "Punjab"], ["15", "Punjab"], ["16", "Punjab"], ["160", "Chandigarh"],
  ["17", "Himachal Pradesh"],
  ["18", "Jammu & Kashmir"], ["19", "Jammu & Kashmir"], ["194", "Ladakh"],
  ["20", "Uttar Pradesh"], ["21", "Uttar Pradesh"], ["22", "Uttar Pradesh"], ["23", "Uttar Pradesh"],
  ["24", "Uttar Pradesh"], ["25", "Uttar Pradesh"], ["26", "Uttar Pradesh"], ["27", "Uttar Pradesh"], ["28", "Uttar Pradesh"],
  ["246", "Uttarakhand"], ["248", "Uttarakhand"], ["249", "Uttarakhand"], ["263", "Uttarakhand"], ["2625", "Uttarakhand"],
  ["30", "Rajasthan"], ["31", "Rajasthan"], ["32", "Rajasthan"], ["33", "Rajasthan"], ["34", "Rajasthan"],
  ["36", "Gujarat"], ["37", "Gujarat"], ["38", "Gujarat"], ["39", "Gujarat"],
  ["39621", "Dadra & Nagar Haveli and Daman & Diu"], ["39623", "Dadra & Nagar Haveli and Daman & Diu"], ["36252", "Dadra & Nagar Haveli and Daman & Diu"],
  ["40", "Maharashtra"], ["41", "Maharashtra"], ["42", "Maharashtra"], ["43", "Maharashtra"], ["44", "Maharashtra"],
  ["403", "Goa"],
  ["45", "Madhya Pradesh"], ["46", "Madhya Pradesh"], ["47", "Madhya Pradesh"], ["48", "Madhya Pradesh"],
  ["49", "Chhattisgarh"],
  ["50", "Telangana"],
  ["51", "Andhra Pradesh"], ["52", "Andhra Pradesh"], ["53", "Andhra Pradesh"], ["533464", "Andhra Pradesh"] /* Yanam (Puducherry, inside Andhra Pradesh) ships like AP */,
  ["56", "Karnataka"], ["57", "Karnataka"], ["58", "Karnataka"], ["59", "Karnataka"],
  ["60", "Tamil Nadu"], ["61", "Tamil Nadu"], ["62", "Tamil Nadu"], ["63", "Tamil Nadu"], ["64", "Tamil Nadu"],
  ["6050", "Puducherry"], ["6051", "Puducherry"], ["60960", "Puducherry"],
  ["67", "Kerala"], ["68", "Kerala"], ["69", "Kerala"],
  ["673310", "Kerala"], // Mahe: part of Puducherry but inside Kerala, so it ships like Kerala
  ["68255", "Lakshadweep"],
  ["70", "West Bengal"], ["71", "West Bengal"], ["72", "West Bengal"], ["73", "West Bengal"], ["74", "West Bengal"],
  ["737", "Sikkim"],
  ["744", "Andaman & Nicobar Islands"],
  ["75", "Odisha"], ["76", "Odisha"], ["77", "Odisha"],
  ["78", "Assam"],
  ["790", "Arunachal Pradesh"], ["791", "Arunachal Pradesh"], ["792", "Arunachal Pradesh"],
  ["793", "Meghalaya"], ["794", "Meghalaya"],
  ["795", "Manipur"],
  ["796", "Mizoram"],
  ["797", "Nagaland"], ["798", "Nagaland"],
  ["799", "Tripura"],
  ["80", "Bihar"], ["81", "Bihar"], ["82", "Bihar"], ["83", "Jharkhand"], ["84", "Bihar"], ["85", "Bihar"],
  ["814", "Jharkhand"], ["815", "Jharkhand"], ["816", "Jharkhand"], ["822", "Jharkhand"],
  ["825", "Jharkhand"], ["826", "Jharkhand"], ["827", "Jharkhand"], ["828", "Jharkhand"], ["829", "Jharkhand"],
];

export function isValidPincode(pincode: unknown): pincode is string {
  return typeof pincode === "string" && /^[1-9]\d{5}$/.test(pincode.trim());
}

/** The state a pincode belongs to, or null for an unknown series. */
export function stateForPincode(pincode: string): string | null {
  const pin = pincode.trim();
  let best: [string, string] | null = null;
  for (const entry of PREFIX_STATE) {
    if (pin.startsWith(entry[0]) && (!best || entry[0].length > best[0].length)) best = entry;
  }
  return best ? best[1] : null;
}

/** Which zone each state is in right now (dashboard choices over defaults). */
export async function getStateZones(): Promise<Record<string, ZoneKey>> {
  const saved = await prisma.deliveryStateZone.findMany();
  const map: Record<string, ZoneKey> = { ...DEFAULT_STATE_ZONE };
  for (const row of saved) if (row.state in map && isZoneKey(row.zone)) map[row.state] = row.zone;
  return map;
}

export interface ZoneRate extends ZoneInfo {
  firstItemFee: number;
  extraItemFee: number;
  /** States currently in this zone. */
  states: string[];
}

/** Current amounts and states for every zone. */
export async function getDeliveryRates(): Promise<ZoneRate[]> {
  const [saved, stateZones] = await Promise.all([prisma.deliveryRate.findMany(), getStateZones()]);
  const byZone = new Map(saved.map((r) => [r.zone, r]));
  return ZONES.map((z) => ({
    ...z,
    firstItemFee: byZone.get(z.key)?.firstItemFee ?? z.defaultFirst,
    extraItemFee: byZone.get(z.key)?.extraItemFee ?? z.defaultExtra,
    states: STATES.filter((s) => stateZones[s] === z.key),
  }));
}

export interface DeliveryQuote {
  zone: ZoneKey;
  zoneName: string;
  state: string | null;
  sarees: number;
  fee: number;
}

/** Delivery fee for `sarees` sarees to `pincode`. Unknown series count as Rest of India. */
export async function quoteDelivery(pincode: string, sarees: number): Promise<DeliveryQuote> {
  const state = stateForPincode(pincode);
  const rates = await getDeliveryRates();
  const zoneKey: ZoneKey = (state && rates.find((r) => r.states.includes(state))?.key) || "rest";
  const rate = rates.find((r) => r.key === zoneKey)!;
  const count = Math.max(1, Math.floor(sarees));
  return {
    zone: zoneKey,
    zoneName: rate.name,
    state,
    sarees: count,
    fee: rate.firstItemFee + rate.extraItemFee * (count - 1),
  };
}
