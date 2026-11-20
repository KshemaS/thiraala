import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth/guard";

// GET — all customer accounts (admin only; never includes password hashes).
export async function GET() {
  try {
    if (!(await getAdminSession())) {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin privileges required." }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, createdAt: true },
    });
    return NextResponse.json({
      success: true,
      count: users.length,
      users: users.map((u) => ({ ...u, lastName: u.lastName || "", role: u.role || "customer" })),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 });
  }
}
