import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { setCustomerSession } from "@/lib/auth/customerSession";
import { hashCustomerPassword } from "@/lib/auth/customerPassword";
import { indianMobile, PHONE_ERROR } from "@/lib/contact";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const DUPLICATE = "An account with this email address already exists. Please log in or use a different email.";

export async function GET() {
  return NextResponse.json({
    status: "active",
    endpoint: "/api/auth/signup",
    description: "Website customer signup API. Send a POST request with firstName, lastName, email, password and optional phone.",
  });
}

// POST { firstName, lastName?, email, password?, phone? } — create a customer account.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Invalid JSON payload provided." }, { status: 400 });
    }

    const { firstName, lastName, email, password, phone } = body;

    if (typeof firstName !== "string" || !firstName.trim()) {
      return NextResponse.json({ success: false, error: "First name is required." }, { status: 400 });
    }
    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ success: false, error: "Email address is required." }, { status: 400 });
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(cleanEmail)) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address." }, { status: 400 });
    }
    // A password is required: an account without one could be created for
    // anyone's email address and used straight away (the signup signs in).
    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }
    if (password.length > 200) {
      return NextResponse.json({ success: false, error: "Password is too long." }, { status: 400 });
    }
    const hasPhone = typeof phone === "string" && phone.trim() !== "";
    const phoneDigits = hasPhone ? indianMobile(phone) : null;
    if (hasPhone && !phoneDigits) {
      return NextResponse.json({ success: false, error: PHONE_ERROR }, { status: 400 });
    }

    if (await prisma.user.findUnique({ where: { email: cleanEmail } })) {
      return NextResponse.json({ success: false, error: DUPLICATE }, { status: 409 });
    }

    let user;
    try {
      user = await prisma.user.create({
        data: {
          firstName: firstName.trim().slice(0, 100),
          lastName: typeof lastName === "string" && lastName.trim() ? lastName.trim().slice(0, 100) : null,
          email: cleanEmail,
          passwordHash: await hashCustomerPassword(password),
          phone: phoneDigits || null,
          role: "customer",
        },
      });
    } catch (err: any) {
      // Two sign-ups with the same email at the same moment.
      if (err?.code === "P2002") return NextResponse.json({ success: false, error: DUPLICATE }, { status: 409 });
      throw err;
    }

    const response = NextResponse.json(
      {
        success: true,
        message: "Account created successfully!",
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName || "",
          email: user.email,
          phone: user.phone,
          role: user.role,
          createdAt: user.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
    setCustomerSession(response, user.id);
    return response;
  } catch (error) {
    console.error("Signup API error:", error);
    return NextResponse.json({ success: false, error: "An unexpected error occurred during signup." }, { status: 500 });
  }
}
