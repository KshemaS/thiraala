import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";

type Params = { params: Promise<{ id: string }> };
const STATUSES = ["new", "replied", "closed"];

// PATCH { status?, adminNote? } — mark a message replied/closed/new, or note what was done.
export async function PATCH(request: Request, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const existing = await prisma.customerMessage.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: "Message not found." }, { status: 404 });

    const status = typeof body.status === "string" && STATUSES.includes(body.status) ? body.status : undefined;
    const message = await prisma.customerMessage.update({
      where: { id },
      data: {
        status,
        adminNote: typeof body.adminNote === "string" ? body.adminNote.slice(0, 4000) : undefined,
        repliedAt: status === "replied" && !existing.repliedAt ? new Date() : undefined,
      },
    });
    return NextResponse.json({ success: true, message });
  } catch (err) {
    console.error("Failed to update message:", err);
    return NextResponse.json({ success: false, error: "Unable to update message." }, { status: 500 });
  }
}

// DELETE — remove a message (e.g. spam).
export async function DELETE(request: Request, { params }: Params) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const { count } = await prisma.customerMessage.deleteMany({ where: { id } });
    if (!count) return NextResponse.json({ success: false, error: "Message not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete message:", err);
    return NextResponse.json({ success: false, error: "Unable to delete message." }, { status: 500 });
  }
}
