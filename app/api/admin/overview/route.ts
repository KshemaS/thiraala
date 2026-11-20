import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const LOW_STOCK = 2;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Start of the India (IST) calendar day containing `at`, as a UTC Date. */
function istDayStart(at: Date) {
  const ist = at.getTime() + IST_OFFSET_MS;
  return new Date(ist - (ist % DAY_MS) - IST_OFFSET_MS);
}
const istDateKey = (d: Date) => new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);

/** Paid and not cancelled: money actually earned. */
const EARNED = { paymentStatus: "Paid", status: { not: "Cancelled" } } as const;

// GET — everything the dashboard overview shows, calculated on the server.
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const now = new Date();
    const todayStart = istDayStart(now);
    const weekStart = new Date(todayStart.getTime() - 6 * DAY_MS);
    const istNow = new Date(now.getTime() + IST_OFFSET_MS);
    const monthStart = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), 1) - IST_OFFSET_MS);

    const [
      ordersToday,
      earnedToday,
      earnedMonth,
      weekOrders,
      toShip,
      attention,
      awaitingPayment,
      lowProducts,
      lowVariants,
      activeProducts,
      customers,
      newMessages,
    ] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: todayStart }, status: { not: "Cancelled" } } }),
      prisma.order.aggregate({ where: { ...EARNED, createdAt: { gte: todayStart } }, _sum: { total: true } }),
      prisma.order.aggregate({ where: { ...EARNED, createdAt: { gte: monthStart } }, _sum: { total: true }, _count: true }),
      prisma.order.findMany({ where: { ...EARNED, createdAt: { gte: weekStart } }, select: { total: true, createdAt: true } }),
      prisma.order.findMany({
        where: { paymentStatus: "Paid", status: { in: ["Order Confirmed", "Confirmed"] }, attentionReason: null },
        orderBy: { createdAt: "asc" },
        select: { humanId: true, customerName: true, total: true, createdAt: true, city: true, state: true, _count: { select: { items: true } } },
      }),
      prisma.order.findMany({
        where: { attentionReason: { not: null } },
        orderBy: { updatedAt: "desc" },
        select: { humanId: true, customerName: true, total: true, attentionReason: true, updatedAt: true, status: true },
      }),
      prisma.order.count({ where: { paymentStatus: { in: ["Pending", "Failed"] }, status: { not: "Cancelled" } } }),
      prisma.product.findMany({
        where: { status: "active", stock: { lte: LOW_STOCK }, variants: { none: {} } },
        orderBy: { stock: "asc" },
        select: { id: true, name: true, sku: true, stock: true },
      }),
      prisma.productVariant.findMany({
        where: { stock: { lte: LOW_STOCK }, product: { status: "active" } },
        orderBy: { stock: "asc" },
        select: { sku: true, name: true, stock: true, product: { select: { id: true, name: true } } },
      }),
      prisma.product.count({ where: { status: "active" } }),
      prisma.user.count(),
      prisma.customerMessage.count({ where: { status: "new" } }),
    ]);

    // Revenue per day for the last 7 IST days (oldest first).
    const days = Array.from({ length: 7 }, (_, i) => {
      const start = new Date(weekStart.getTime() + i * DAY_MS);
      return { date: istDateKey(start), revenue: 0, orders: 0 };
    });
    for (const o of weekOrders) {
      const day = days.find((d) => d.date === istDateKey(o.createdAt));
      if (day) {
        day.revenue += o.total;
        day.orders += 1;
      }
    }

    const lowStock = [
      ...lowProducts.map((p) => ({ productId: p.id, name: p.name, colour: null as string | null, sku: p.sku, stock: p.stock })),
      ...lowVariants.map((v) => ({ productId: v.product.id, name: v.product.name, colour: v.name, sku: v.sku, stock: v.stock })),
    ].sort((a, b) => a.stock - b.stock);

    return NextResponse.json({
      success: true,
      generatedAt: now.toISOString(),
      today: { orders: ordersToday, revenue: earnedToday._sum.total ?? 0 },
      month: { orders: earnedMonth._count, revenue: earnedMonth._sum.total ?? 0 },
      week: { revenue: days.reduce((s, d) => s + d.revenue, 0), days },
      toShip: toShip.map((o) => ({
        id: o.humanId,
        customerName: o.customerName,
        total: o.total,
        items: o._count.items,
        place: [o.city, o.state].filter(Boolean).join(", "),
        createdAt: o.createdAt.toISOString(),
      })),
      attention: attention.map((o) => ({
        id: o.humanId,
        customerName: o.customerName,
        total: o.total,
        status: o.status,
        reason: o.attentionReason,
        updatedAt: o.updatedAt.toISOString(),
      })),
      awaitingPayment,
      lowStock,
      lowStockThreshold: LOW_STOCK,
      counts: { activeProducts, customers, newMessages },
    });
  } catch (err) {
    console.error("Overview failed:", err);
    return NextResponse.json({ success: false, error: "Unable to load the overview." }, { status: 500 });
  }
}
