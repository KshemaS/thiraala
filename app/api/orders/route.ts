import { NextResponse } from "next/server";
import { getCustomerId } from "@/lib/auth/customerSession";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth/guard";
import { priceOrder } from "@/lib/orderPricing";
import { ensureOrderCounter, nextOrderNumber } from "@/lib/counters";
import { EMAIL_ERROR, indianMobile, isValidEmail, PHONE_ERROR } from "@/lib/contact";

// Orders for the same saree queue on its stock row; with a remote database a
// burst of simultaneous checkouts can take longer than Prisma's 5 s default.
const ORDER_TRANSACTION_OPTIONS = { maxWait: 15_000, timeout: 30_000 };
import { OutOfStockError, releaseExpiredReservations, reserveStock } from "@/lib/stock";
import type { Order as PrismaOrder, OrderItem as PrismaOrderItem, Prisma } from "@prisma/client";

export interface OrderItem {
  id: string | number;
  productId?: string | number;
  sku?: string;
  name: string;
  price: string;
  priceValue?: number;
  quantity: number;
  foldedImg?: string;
  wornImg?: string;
  category?: string;
  selectedColor?: string;
}

export type OrderStatus =
  | "Pending"
  | "Order Confirmed"
  | "Dispatched"
  | "In Transit"
  | "Delivered"
  | "Cancelled"
  | "Confirmed"
  | "Shipped";
export type PaymentStatus = "Pending" | "Paid" | "Failed" | "Refunded";
export type PaymentMethod = "COD" | "UPI" | "Card" | "NetBanking" | "Razorpay";

export interface TrackingEvent {
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  houseOrFlat?: string;
  street?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  total: number;
  subtotal?: number;
  deliveryFee?: number;
  discount?: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  trackingNumber?: string;
  courierName?: string;
  notes?: string;
  items: OrderItem[];
  trackingTimeline: TrackingEvent[];
  /** Admin only: why the order needs action. Never sent to customers. */
  attentionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderWithItems = PrismaOrder & { items: PrismaOrderItem[] };

export function toOrderJSON(order: OrderWithItems, opts: { admin?: boolean } = {}): Order {
  return {
    ...(opts.admin && order.attentionReason ? { attentionReason: order.attentionReason } : {}),
    id: order.humanId,
    customerName: order.customerName,
    phone: order.phone,
    email: order.email || "",
    address: order.address,
    houseOrFlat: order.houseOrFlat || "",
    street: order.street || "",
    city: order.city || "",
    district: order.district || "",
    state: order.state || "",
    pincode: order.pincode || "",
    total: order.total,
    subtotal: order.subtotal ?? order.total,
    deliveryFee: order.deliveryFee,
    discount: order.discount,
    paymentMethod: order.paymentMethod as PaymentMethod,
    paymentStatus: order.paymentStatus as PaymentStatus,
    status: order.status as OrderStatus,
    trackingNumber: order.trackingNumber || "",
    courierName: order.courierName || "",
    notes: order.notes || "",
    items: (order.items || []).map((item: PrismaOrderItem) => ({
      id: item.id,
      productId: item.productId || undefined,
      sku: item.sku || undefined,
      name: item.name,
      price: item.price,
      priceValue: item.priceValue,
      quantity: item.quantity,
      foldedImg: item.foldedImg || undefined,
      wornImg: item.wornImg || undefined,
      category: item.category || undefined,
      selectedColor: item.selectedColor || undefined,
    })),
    trackingTimeline: (order.trackingTimeline as unknown as TrackingEvent[]) || [],
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

// GET all orders
export async function GET(request: Request) {
  try {
    // ?mine=1 (the shop's "My Orders" page): only the signed-in customer's own
    // orders, even in a browser that is also signed in to the dashboard.
    const mine = new URL(request.url).searchParams.get("mine") === "1";
    const adminSession = mine ? null : await getAdminSession();
    const customerUserId = await getCustomerId();

    if (!adminSession && !customerUserId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in to view orders." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const email = searchParams.get("email")?.trim().toLowerCase();
    const phone = searchParams.get("phone")?.trim();

    const andConditions: Prisma.OrderWhereInput[] = [];
    const where: Prisma.OrderWhereInput = {};

    // Customer scoping: regular customer can ONLY view their own orders (TH-001)
    if (!adminSession && customerUserId) {
      const user = await prisma.user.findUnique({ where: { id: customerUserId } });
      if (!user) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 401 }
        );
      }

      // Only orders placed while signed in to this account. Matching on email
      // or phone isn't safe: neither is verified at signup, so anyone could
      // register with a guest buyer's phone and read their orders. Guest
      // orders stay reachable via Track Order (order number + phone).
      andConditions.push({ userId: customerUserId });
    }

    // Admin direct filters
    if (adminSession) {
      if (email) {
        where.email = { equals: email, mode: "insensitive" };
      }
      if (phone) {
        where.phone = { contains: phone };
      }
    }

    if (status && status !== "All") {
      where.status = { equals: status, mode: "insensitive" };
    }

    if (search) {
      const q = search;
      andConditions.push({
        OR: [
          { humanId: { contains: q, mode: "insensitive" } },
          { customerName: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
          { email: { contains: q, mode: "insensitive" } },
          { items: { some: { name: { contains: q, mode: "insensitive" } } } },
        ],
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const orders = await prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      count: orders.length,
      orders: orders.map((o) => toOrderJSON(o, { admin: !!adminSession })),
    });
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST create new order
export async function POST(request: Request) {
  try {
    // Orders can only be placed from a customer account.
    const customerUserId = await getCustomerId();
    if (!customerUserId || !(await prisma.user.findUnique({ where: { id: customerUserId }, select: { id: true } }))) {
      return NextResponse.json(
        { success: false, code: "SIGN_IN_REQUIRED", error: "Please sign in or create an account to place your order." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
    }
    // Prices, totals, fees and discounts from the browser are ignored: the
    // order is priced from the database (see lib/orderPricing.ts). The browser's
    // `total` is only compared, so nobody is charged an amount they didn't see.
    const {
      customerName,
      phone,
      email = "",
      address,
      houseOrFlat = "",
      street = "",
      city = "",
      district = "",
      state = "",
      pincode = "",
      items = [],
      total: clientTotal,
      notes = "",
    } = body;

    if (!customerName || !phone || !address || !items || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields (customerName, phone, address, and at least 1 item)",
        },
        { status: 400 }
      );
    }

    // Contact details must be real enough to deliver and to send updates.
    const cleanPhone = indianMobile(phone);
    if (!cleanPhone) return NextResponse.json({ success: false, error: PHONE_ERROR }, { status: 400 });
    if (email && !isValidEmail(email)) return NextResponse.json({ success: false, error: EMAIL_ERROR }, { status: 400 });
    const tooLong = (
      [
        [customerName, "Name", 100],
        [address, "Address", 500],
        [houseOrFlat, "House / flat", 200],
        [street, "Street", 200],
        [city, "City", 100],
        [district, "District", 100],
        [state, "State", 100],
        [notes, "Notes", 1000],
      ] as const
    ).find(([v, , max]) => typeof v !== "string" || v.trim().length > max);
    if (tooLong) {
      const [, label, max] = tooLong;
      return NextResponse.json({ success: false, error: `${label} must be text of ${max} characters or fewer.` }, { status: 400 });
    }
    if (!String(customerName).trim() || String(customerName).trim().length < 2) {
      return NextResponse.json({ success: false, error: "Please enter your full name." }, { status: 400 });
    }

    // Free up stock held by checkouts that were abandoned unpaid.
    await releaseExpiredReservations().catch((err) => console.error("Releasing expired reservations failed:", err));

    const priced = await priceOrder(items, typeof pincode === "string" ? pincode.trim() : pincode);
    if (!priced.ok) {
      return NextResponse.json({ success: false, error: priced.error }, { status: priced.status });
    }
    if (clientTotal !== undefined && Math.round(Number(clientTotal)) !== priced.total) {
      return NextResponse.json(
        {
          success: false,
          error: `Your order total has changed. The current total is ₹${priced.total.toLocaleString("en-IN")} (including ₹${priced.deliveryFee.toLocaleString("en-IN")} delivery). Please review your bag and try again.`,
          code: "PRICE_CHANGED",
          total: priced.total,
        },
        { status: 409 }
      );
    }

    await ensureOrderCounter();
    const now = new Date().toISOString();

    const trackingTimeline: TrackingEvent[] = [
      {
        title: "Order Placed",
        description: "Order placed successfully. Awaiting payment confirmation.",
        timestamp: now,
        completed: true,
      },
      {
        title: "Order Confirmed",
        description: "Artisanal handloom drape inspected and confirmed by Thiraala boutique.",
        timestamp: "",
        completed: false,
      },
      {
        title: "Dispatched",
        description: "Consignment packed and dispatched from Thiraala fulfillment center.",
        timestamp: "",
        completed: false,
      },
      {
        title: "In Transit",
        description: "Package is on its way and in transit to your shipping address.",
        timestamp: "",
        completed: false,
      },
      {
        title: "Delivered",
        description: "Order completed and delivered to customer. Enjoy your drape!",
        timestamp: "",
        completed: false,
      },
    ];

    // Create the order and take its stock together: if any item is short,
    // nothing is saved and no stock moves.
    const created = await prisma.$transaction(async (tx) => {
      await reserveStock(tx, priced.lines);
      // Unique human-readable id e.g. THR-1087, from an atomic counter. Taken
      // here, after stock, so a failed order rolls it back (no gaps).
      const newOrderId = await nextOrderNumber(tx);
      return tx.order.create({
      data: {
        humanId: newOrderId,
        stockReserved: true,
        stockReservedAt: new Date(),
        // Only the signed-in customer's own id; never an id from the request body.
        userId: customerUserId,
        customerName: String(customerName).trim(),
        phone: cleanPhone,
        email: typeof email === "string" ? email.trim().toLowerCase() : "",
        address: String(address).trim(),
        houseOrFlat: houseOrFlat ? String(houseOrFlat).trim() : "",
        street: street ? String(street).trim() : "",
        city: city ? String(city).trim() : "",
        district: district ? String(district).trim() : "",
        state: state ? String(state).trim() : "",
        pincode: pincode ? String(pincode).trim() : "",
        total: priced.total,
        subtotal: priced.subtotal,
        deliveryFee: priced.deliveryFee,
        discount: priced.discount,
        // The shop only takes online payment (no cash on delivery), so this is
        // never taken from the request.
        paymentMethod: "Razorpay",
        // Payment is never verified at creation time — only a verified
        // Razorpay payment (client verify or webhook) flips this to "Paid".
        paymentStatus: "Pending",
        status: "Pending",
        notes: notes || "",
        trackingTimeline: trackingTimeline as unknown as Prisma.InputJsonValue,
        items: {
          create: priced.lines.map((line) => ({
            productId: line.productId,
            sku: line.sku,
            name: line.name,
            price: line.price,
            priceValue: line.priceValue,
            quantity: line.quantity,
            foldedImg: line.foldedImg || line.wornImg || null,
            wornImg: line.wornImg || line.foldedImg || null,
            category: line.category,
            selectedColor: line.selectedColor,
            variantId: line.variantId,
          })),
        },
      },
      include: { items: true },
      });
    }, ORDER_TRANSACTION_OPTIONS);

    return NextResponse.json(
      {
        success: true,
        message: "Order placed successfully",
        order: toOrderJSON(created),
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof OutOfStockError) {
      return NextResponse.json(
        { success: false, error: error.message, code: "OUT_OF_STOCK" },
        { status: 409 }
      );
    }
    console.error("Error creating order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create order. Please try again." },
      { status: 500 }
    );
  }
}
