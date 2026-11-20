import { NextResponse } from "next/server";
import { clearCustomerSession } from "@/lib/auth/customerSession";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  clearCustomerSession(response);

  return response;
}
