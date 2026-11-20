import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { setCustomerSession } from "@/lib/auth/customerSession";
import { hashCustomerPassword, verifyCustomerPassword } from "@/lib/auth/customerPassword";
import { DUMMY_PASSWORD_HASH } from "@/lib/auth/password";
import { clientAddress, lockedMinutes, recordFailure, recordSuccess, tooManyAttemptsMessage } from "@/lib/auth/loginThrottle";

// POST { email, password } — customer sign-in.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email) {
      return NextResponse.json({ success: false, error: "Email address is required." }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ success: false, error: "Password is required." }, { status: 400 });
    }

    const address = clientAddress(request);
    const locked = await lockedMinutes("customer", email, address);
    if (locked > 0) {
      return NextResponse.json(
        { success: false, error: tooManyAttemptsMessage(locked) },
        { status: 429, headers: { "Retry-After": String(locked * 60) } }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    // Always check a hash so the response time doesn't reveal whether the email exists.
    const { ok, needsRehash } = await verifyCustomerPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

    // Unknown email, account without a password and wrong password all count
    // as a failed attempt and get the same answer.
    if (!user || !ok) {
      await recordFailure("customer", email, address);
      return NextResponse.json({ success: false, error: "Invalid email or password." }, { status: 401 });
    }
    await recordSuccess("customer", email, address);

    // Upgrade an old-style password hash now that we know the password.
    if (needsRehash) {
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashCustomerPassword(password) } });
    }

    const response = NextResponse.json({
      success: true,
      message: "Signed in successfully!",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName || "",
        email: user.email,
        phone: user.phone || null,
        role: user.role || "customer",
        createdAt: user.createdAt.toISOString(),
      },
    });
    // Signed, httpOnly session cookie (see lib/auth/customerSession.ts)
    setCustomerSession(response, user.id);
    return response;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json({ success: false, error: "An unexpected error occurred during login." }, { status: 500 });
  }
}
