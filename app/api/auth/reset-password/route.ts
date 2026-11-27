import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashCustomerPassword } from "@/lib/auth/customerPassword";
import { setCustomerSession } from "@/lib/auth/customerSession";
import { readResetToken, resetSignatureValid } from "@/lib/auth/passwordReset";

const INVALID = "This reset link has expired or was already used. Please ask for a new one.";

/** POST { token, password } — set a new password from an emailed reset link, then sign in. */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const token = body?.token;
    const password = body?.password;

    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters long." }, { status: 400 });
    }
    if (password.length > 200) {
      return NextResponse.json({ success: false, error: "Password is too long." }, { status: 400 });
    }

    const userId = readResetToken(token);
    const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
    if (!user || user.role !== "customer" || !resetSignatureValid(token, user.passwordHash)) {
      return NextResponse.json({ success: false, error: INVALID }, { status: 400 });
    }

    // Only update if the hash is still the one the link was signed for, so two
    // uses of the same link at the same moment can't both succeed.
    const updated = await prisma.user.updateMany({
      where: { id: user.id, passwordHash: user.passwordHash },
      data: { passwordHash: await hashCustomerPassword(password) },
    });
    if (updated.count !== 1) {
      return NextResponse.json({ success: false, error: INVALID }, { status: 400 });
    }

    const response = NextResponse.json({ success: true, message: "Your password has been changed. You're now signed in." });
    setCustomerSession(response, user.id);
    return response;
  } catch (err) {
    console.error("Reset password failed:", err);
    return NextResponse.json({ success: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
