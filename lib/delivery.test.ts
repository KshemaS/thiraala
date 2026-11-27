import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  deliveryRate: { findMany: vi.fn() },
  deliveryStateZone: { findMany: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ default: db }));

import { isValidPincode, quoteDelivery, stateForPincode } from "./delivery";

describe("stateForPincode", () => {
  it.each([
    ["682001", "Kerala"],
    ["695001", "Kerala"],
    ["673310", "Kerala"], // Mahe ships like Kerala
    ["605001", "Puducherry"],
    ["600001", "Tamil Nadu"],
    ["560001", "Karnataka"],
    ["403001", "Goa"],
    ["400001", "Maharashtra"],
    ["110001", "Delhi"],
    ["160017", "Chandigarh"],
    ["744101", "Andaman & Nicobar Islands"],
    ["682555", "Lakshadweep"],
  ])("%s → %s", (pin, state) => {
    expect(stateForPincode(pin)).toBe(state);
  });

  it("returns null for an unknown series", () => {
    expect(stateForPincode("990001")).toBeNull();
  });
});

describe("isValidPincode", () => {
  it("needs 6 digits not starting with 0", () => {
    expect(isValidPincode("682001")).toBe(true);
    expect(isValidPincode(" 682001 ")).toBe(true);
    expect(isValidPincode("082001")).toBe(false);
    expect(isValidPincode("68200")).toBe(false);
    expect(isValidPincode(682001)).toBe(false);
  });
});

describe("quoteDelivery", () => {
  beforeEach(() => {
    db.deliveryRate.findMany.mockResolvedValue([]);
    db.deliveryStateZone.findMany.mockResolvedValue([]);
  });

  it("charges the first saree plus each extra one", async () => {
    db.deliveryRate.findMany.mockResolvedValue([{ zone: "kerala", firstItemFee: 60, extraItemFee: 20 }]);
    const q = await quoteDelivery("682001", 3);
    expect(q).toMatchObject({ zone: "kerala", state: "Kerala", sarees: 3, fee: 60 + 20 * 2 });
  });

  it("uses the default amounts when none are saved", async () => {
    const q = await quoteDelivery("560001", 1);
    expect(q).toMatchObject({ zone: "neighbours", fee: 150 });
  });

  it("follows a state moved to another zone on the dashboard", async () => {
    db.deliveryStateZone.findMany.mockResolvedValue([{ state: "Kerala", zone: "remote" }]);
    const q = await quoteDelivery("682001", 2);
    expect(q).toMatchObject({ zone: "remote", fee: 700 + 350 });
  });

  it("treats an unknown series as Rest of India and at least one saree", async () => {
    const q = await quoteDelivery("990001", 0);
    expect(q).toMatchObject({ zone: "rest", state: null, sarees: 1, fee: 500 });
  });
});
