import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";

// GET ?status=new|replied|closed — Contact-page messages, newest first (admin only).
export async function GET(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const params = new URL(request.url).searchParams;
    // ?countOnly=1 — just the number of new messages (for the sidebar badge).
    if (params.get("countOnly")) {
      return NextResponse.json({ success: true, new: await prisma.customerMessage.count({ where: { status: "new" } }) });
    }
    const status = params.get("status");
    const where = status && ["new", "replied", "closed"].includes(status) ? { status } : {};
    const [messages, counts] = await Promise.all([
      prisma.customerMessage.findMany({ where, orderBy: { createdAt: "desc" }, take: 500 }),
      prisma.customerMessage.groupBy({ by: ["status"], _count: true }),
    ]);
    const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count]));
    return NextResponse.json({
      success: true,
      messages,
      counts: { new: byStatus.new ?? 0, replied: byStatus.replied ?? 0, closed: byStatus.closed ?? 0 },
    });
  } catch (err) {
    console.error("Failed to load messages:", err);
    return NextResponse.json({ success: false, error: "Unable to load messages." }, { status: 500 });
  }
}
