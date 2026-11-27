import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { clientAddress, lockedMinutes, recordFailure } from "@/lib/auth/loginThrottle";
import { createResetToken, RESET_TTL_MINUTES } from "@/lib/auth/passwordReset";
import { emailButton, emailConfigured, emailLayout, escapeHtml, sendEmail, SITE_URL } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

/**
 * POST { email } — email a password-reset link if an account exists. The
 * answer is the same whether or not it does, so the form can't be used to
 * find out who has an account.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!EMAIL_RE.test(email) || email.length > 200) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address." }, { status: 400 });
    }

    if (!emailConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: "Password reset by email isn't available yet. Please contact us through the Contact page and we'll help you get back into your account.",
        },
        { status: 503 }
      );
    }

    const address = clientAddress(request);
    const locked = await lockedMinutes("reset", email, address);
    if (locked > 0) {
      return NextResponse.json(
        { success: false, error: `Too many reset requests. Please try again in ${locked} minute${locked === 1 ? "" : "s"}.` },
        { status: 429, headers: { "Retry-After": String(locked * 60) } }
      );
    }
    await recordFailure("reset", email, address); // every request counts toward the limit

    const user = await prisma.user.findUnique({ where: { email } });
    if (user && user.role === "customer") {
      const link = `${SITE_URL}/reset-password?token=${encodeURIComponent(createResetToken(user.id, user.passwordHash))}`;
      await sendEmail({
        to: user.email,
        subject: "Reset your Thiraala password",
        text: `Hi ${user.firstName},\n\nOpen this link to choose a new password (it works once, for ${RESET_TTL_MINUTES} minutes):\n${link}\n\nIf you didn't ask for this, you can ignore this email.`,
        html: emailLayout(
          "Reset your password",
          `<p>Hi ${escapeHtml(user.firstName)},</p><p>Click the button below to choose a new password. The link works once and expires in ${RESET_TTL_MINUTES} minutes.</p>${emailButton(link, "Choose a new password")}<p style="font-size:13px;color:#6b7b71">If you didn't ask for this, you can ignore this email. Your password won't change.</p>`
        ),
      });
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists for that email, we've sent a link to reset the password. Please check your inbox (and spam folder).",
    });
  } catch (err) {
    console.error("Forgot password failed:", err);
    return NextResponse.json({ success: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
