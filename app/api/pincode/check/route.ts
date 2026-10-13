import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface PostOffice {
  Name: string;
  Description: string | null;
  BranchType: string;
  DeliveryStatus: string;
  Circle: string;
  District: string;
  Division: string;
  Region: string;
  Block: string;
  State: string;
  Country: string;
  Pincode: string;
}

interface PostalApiResponse {
  Message: string;
  Status: "Success" | "Error";
  PostOffice: PostOffice[] | null;
}

// Format expected delivery date range (e.g., "Friday, 17 Oct")
function calculateEstimatedDelivery(businessDays: number): string {
  const date = new Date();
  let added = 0;
  while (added < businessDays) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    // Skip Sunday (0)
    if (day !== 0) {
      added++;
    }
  }
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pincode = searchParams.get("pincode")?.trim() || "";

  // Validate standard 6-digit Indian PIN code format
  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return NextResponse.json(
      {
        success: false,
        available: false,
        message: "Please enter a valid 6-digit Indian PIN code.",
      },
      { status: 400 }
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const response = await fetch(
      `https://api.postalpincode.in/pincode/${pincode}`,
      {
        signal: controller.signal,
        next: { revalidate: 86400 }, // Cache postal data for 24 hours
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Postal API returned ${response.status}`);
    }

    const data = (await response.json()) as PostalApiResponse[];

    if (
      Array.isArray(data) &&
      data[0]?.Status === "Success" &&
      Array.isArray(data[0]?.PostOffice) &&
      data[0].PostOffice.length > 0
    ) {
      const offices = data[0].PostOffice;

      // Check if any post office has doorstep delivery capability
      const deliveryOffices = offices.filter(
        (po) => po.DeliveryStatus?.toLowerCase() === "delivery"
      );

      const primaryOffice = deliveryOffices[0] || offices[0];
      const hasDirectDelivery = deliveryOffices.length > 0;

      const stateName = primaryOffice.State || "";
      const districtName = primaryOffice.District || "";
      const officeName = primaryOffice.Name || "";
      const isKerala = stateName.toLowerCase() === "kerala";

      // Intra-state Kerala Speed Post takes 2-4 days, outside Kerala takes 4-7 days
      const daysMin = isKerala ? 2 : 4;
      const daysMax = isKerala ? 4 : 7;
      const estimatedDate = calculateEstimatedDelivery(daysMax);

      return NextResponse.json({
        success: true,
        available: hasDirectDelivery,
        pincode,
        carrier: "India Post (Speed Post / Parcel)",
        postOffice: `${officeName} (${primaryOffice.BranchType || "Post Office"})`,
        district: districtName,
        state: stateName,
        location: `${districtName}, ${stateName}`,
        hasDirectDelivery,
        isKerala,
        estimatedDays: `${daysMin}–${daysMax} business days`,
        estimatedDate,
        message: hasDirectDelivery
          ? `Delivery available via India Post Speed Post to ${districtName}, ${stateName}.`
          : `Counter delivery available at ${officeName} Post Office (Non-delivery zone).`,
      });
    }

    // No postal records found for this pincode
    return NextResponse.json({
      success: true,
      available: false,
      pincode,
      message: "Delivery unavailable",
    });
  } catch (error) {
    console.error("India Post API error:", error);
    return NextResponse.json({
      success: false,
      available: false,
      pincode,
      message: "Delivery unavailable",
    });
  }
}
