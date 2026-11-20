import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCustomerId } from "@/lib/auth/customerSession";

// GET — the signed-in customer, or { user: null }.
export async function GET() {
  try {
    const userId = await getCustomerId();
    if (!userId) return NextResponse.json({ success: false, user: null });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ success: false, user: null });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName || "",
        email: user.email,
        phone: user.phone || null,
        role: user.role || "customer",
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json({ success: false, user: null });
  }
}
