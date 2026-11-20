import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCustomerId } from "@/lib/auth/customerSession";
import { clientAddress, lockedMinutes, recordFailure } from "@/lib/auth/loginThrottle";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const MAX_MESSAGE = 4000;

/**
 * POST { name, email, phone?, query, website? } — a message from the Contact
 * page, saved for the admin's Messages inbox. `website` is a hidden field
 * people never fill in; bots that do are silently ignored. Each address can
 * send at most 5 messages per email (20 in total) every 15 minutes.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
    }

    // Bot trap: pretend success so the bot doesn't retry.
    if (typeof body.website === "string" && body.website.trim()) {
      return NextResponse.json({ success: true });
    }

    const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 200) : "";
    const phoneDigits = typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";
    const message = typeof body.query === "string" ? body.query.trim() : typeof body.message === "string" ? body.message.trim() : "";

    if (!name) return NextResponse.json({ success: false, error: "Please enter your name." }, { status: 400 });
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address." }, { status: 400 });
    }
    if (phoneDigits && !/^[6-9]\d{9}$/.test(phoneDigits.slice(-10))) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid 10-digit Indian mobile number." },
        { status: 400 }
      );
    }
    if (!message) return NextResponse.json({ success: false, error: "Please write your message." }, { status: 400 });
    if (message.length > MAX_MESSAGE) {
      return NextResponse.json(
        { success: false, error: `Please keep your message under ${MAX_MESSAGE} characters.` },
        { status: 400 }
      );
    }

    const address = clientAddress(request);
    const locked = await lockedMinutes("contact", email, address);
    if (locked > 0) {
      return NextResponse.json(
        { success: false, error: `You've sent several messages already. Please try again in ${locked} minute${locked === 1 ? "" : "s"}, or email us directly.` },
        { status: 429, headers: { "Retry-After": String(locked * 60) } }
      );
    }
    await recordFailure("contact", email, address); // every message counts toward the limit

    await prisma.customerMessage.create({
      data: {
        name,
        email,
        phone: phoneDigits ? phoneDigits.slice(-10) : null,
        message,
        userId: await getCustomerId(),
      },
    });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Contact message failed:", error);
    return NextResponse.json(
      { success: false, error: "Sorry, your message couldn't be sent. Please try again or email us directly." },
      { status: 500 }
    );
  }
}
