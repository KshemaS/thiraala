import { describe, expect, it } from "vitest";
import type { Order, OrderItem } from "@prisma/client";
import { customerOwnsOrder, normalizePhone, phoneMatchesOrder, publicTrackingView } from "./orderAccess";

describe("customerOwnsOrder", () => {
  it("only matches orders placed while signed in to that account", async () => {
    expect(await customerOwnsOrder("user1", { userId: "user1" })).toBe(true);
    expect(await customerOwnsOrder("user1", { userId: "user2" })).toBe(false);
    // Guest orders (no account) never belong to a signed-in customer, even
    // one using the same email or phone: those aren't verified at signup.
    expect(await customerOwnsOrder("user1", { userId: null })).toBe(false);
  });
});

describe("phone checks", () => {
  it("compares the last 10 digits", () => {
    expect(normalizePhone("+91 98765 43210")).toBe("9876543210");
    expect(phoneMatchesOrder("+91 98765-43210", { phone: "9876543210" })).toBe(true);
    expect(phoneMatchesOrder("9876543211", { phone: "9876543210" })).toBe(false);
  });
  it("rejects partial numbers that happen to match the end", () => {
    expect(phoneMatchesOrder("43210", { phone: "9876543210" })).toBe(false);
    expect(phoneMatchesOrder("", { phone: "" })).toBe(false);
  });
});

describe("publicTrackingView", () => {
  const order = {
    humanId: "THR-1100",
    customerName: "Asha K",
    phone: "9876543210",
    email: "asha@example.com",
    address: "12 Temple Road, Thrissur",
    city: "Thrissur",
    district: "Thrissur",
    state: "Kerala",
    pincode: "680001",
    total: 1500,
    subtotal: 1400,
    deliveryFee: 100,
    paymentMethod: "Razorpay",
    paymentStatus: "Paid",
    status: "Dispatched",
    trackingNumber: "TRK1",
    courierName: "India Post",
    trackingTimeline: [],
    items: [] as OrderItem[],
    createdAt: new Date("2026-11-01T00:00:00Z"),
    updatedAt: new Date("2026-11-02T00:00:00Z"),
  } as unknown as Order & { items: OrderItem[] };

  it("masks the phone and drops the street address and email", () => {
    const view = publicTrackingView(order);
    expect(view.phone).toBe("••••••3210");
    expect(view.address).toBe("Thrissur, Thrissur, Kerala - 680001");
    expect(JSON.stringify(view)).not.toContain("Temple Road");
    expect(JSON.stringify(view)).not.toContain("asha@example.com");
    expect(view.trackingNumber).toBe("TRK1");
  });
});
