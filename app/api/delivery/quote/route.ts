import { NextResponse } from "next/server";
import { isValidPincode, quoteDelivery } from "@/lib/delivery";

// GET /api/delivery/quote?pincode=682001&sarees=2
// Public: the cart uses it to show the delivery charge before checkout.
// The order itself is always re-priced on the server.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pincode = (searchParams.get("pincode") || "").trim();
  const sarees = Number(searchParams.get("sarees") || "1");

  if (!isValidPincode(pincode)) {
    return NextResponse.json({ success: false, error: "Enter a valid 6-digit pincode." }, { status: 400 });
  }
  if (!Number.isInteger(sarees) || sarees < 1 || sarees > 500) {
    return NextResponse.json({ success: false, error: "Invalid number of sarees." }, { status: 400 });
  }

  try {
    const quote = await quoteDelivery(pincode, sarees);
    return NextResponse.json({ success: true, ...quote });
  } catch (err) {
    console.error("Delivery quote failed:", err);
    return NextResponse.json({ success: false, error: "Unable to calculate delivery." }, { status: 500 });
  }
}
