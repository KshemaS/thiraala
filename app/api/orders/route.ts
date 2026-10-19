import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Order as PrismaOrder, OrderItem as PrismaOrderItem } from "@prisma/client";

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
  createdAt: string;
  updatedAt: string;
}

type OrderWithItems = PrismaOrder & { items: PrismaOrderItem[] };

export function toOrderJSON(order: OrderWithItems): Order {
  return {
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
    items: order.items.map((item) => ({
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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const email = searchParams.get("email")?.trim().toLowerCase();
    const phone = searchParams.get("phone")?.trim();

    const where: Record<string, unknown> = {};

    if (email) {
      where.email = { equals: email, mode: "insensitive" };
    }

    if (phone) {
      where.phone = { contains: phone };
    }

    if (status && status !== "All") {
      where.status = { equals: status, mode: "insensitive" };
    }

    if (search) {
      const q = search;
      where.OR = [
        { humanId: { contains: q, mode: "insensitive" } },
        { customerName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { email: { contains: q, mode: "insensitive" } },
        { items: { some: { name: { contains: q, mode: "insensitive" } } } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      count: orders.length,
      orders: orders.map(toOrderJSON),
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
    const body = await request.json();
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
      total = 0,
      subtotal,
      deliveryFee = 0,
      discount = 0,
      paymentMethod = "Razorpay",
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

    // Generate unique human-readable order id e.g. THR-1087
    let nextNum = 1087;
    const existing = await prisma.order.findMany({ select: { humanId: true } });
    const existingIds = new Set(existing.map((o) => o.humanId));
    while (existingIds.has(`THR-${nextNum}`)) {
      nextNum++;
    }
    const newOrderId = `THR-${nextNum}`;
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

    const created = await prisma.order.create({
      data: {
        humanId: newOrderId,
        customerName: String(customerName).trim(),
        phone: String(phone).trim(),
        email: String(email).trim(),
        address: String(address).trim(),
        houseOrFlat: houseOrFlat ? String(houseOrFlat).trim() : "",
        street: street ? String(street).trim() : "",
        city: city ? String(city).trim() : "",
        district: district ? String(district).trim() : "",
        state: state ? String(state).trim() : "",
        pincode: pincode ? String(pincode).trim() : "",
        total: Number(total) || 0,
        subtotal: Number(subtotal !== undefined ? subtotal : total) || 0,
        deliveryFee: Number(deliveryFee) || 0,
        discount: Number(discount) || 0,
        paymentMethod: String(paymentMethod) || "Razorpay",
        // Payment is never verified at creation time — only a verified
        // Razorpay payment (client verify or webhook) flips this to "Paid".
        paymentStatus: "Pending",
        status: "Pending",
        notes: notes || "",
        trackingTimeline,
        items: {
          create: items.map((item: any, idx: number) => ({
            productId: item.productId ? String(item.productId) : item.id ? String(item.id) : null,
            sku: item.sku || `THR-SKU-${idx + 1}`,
            name: item.name,
            price: item.price || `₹${item.priceValue || 0}`,
            priceValue:
              item.priceValue || parseInt(String(item.price).replace(/[^\d]/g, ""), 10) || 0,
            quantity: item.quantity || 1,
            foldedImg: item.foldedImg || "/images/folded-gopuram.jpeg",
            wornImg: item.wornImg || "/images/gopura.jpeg",
            category: item.category || "Handloom Saree",
            selectedColor: item.selectedColor || "",
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Order placed successfully",
        order: toOrderJSON(created),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
