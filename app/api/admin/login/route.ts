import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "@/lib/auth/password";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json(
      { success: false, error: "Please enter both username and password." },
      { status: 400 }
    );
  }

  try {
    const admin = await prisma.adminUser.findUnique({ where: { username } });
    // Always run a hash comparison so timing doesn't reveal whether the username exists.
    const valid = await verifyPassword(password, admin?.passwordHash ?? DUMMY_PASSWORD_HASH);

    if (!admin || !valid) {
      return NextResponse.json(
        { success: false, error: "Invalid username or password." },
        { status: 401 }
      );
    }

    const user = { username: admin.username, name: admin.name, role: admin.role };
    const response = NextResponse.json({ success: true, user });
    response.cookies.set(
      SESSION_COOKIE,
      createSessionToken({ sub: admin.id, ...user }),
      sessionCookieOptions
    );
    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to sign in right now. Please try again." },
      { status: 500 }
    );
  }
}
