import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/guard";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    user: { username: session.username, name: session.name, role: session.role },
  });
}
