import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";
import { getAdminSession } from "@/lib/auth/guard";
import prisma from "@/lib/prisma";

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
export type PaymentMethod = "COD" | "UPI" | "Card" | "NetBanking";

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

const dataFilePath = path.join(process.cwd(), "data", "orders.json");

export function getOrdersFromFile(): Order[] {
  try {
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, "utf8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Error reading orders.json:", error);
  }
  return [];
}

export function saveOrdersToFile(orders: Order[]): boolean {
  try {
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(orders, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error saving orders.json:", error);
    return false;
  }
}

// GET all orders
export async function GET(request: Request) {
  try {
    const adminSession = await getAdminSession();
    const cookieStore = await cookies();
    const customerUserId = cookieStore.get("thiraala_user_id")?.value;

    if (!adminSession && !customerUserId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in to view orders." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    let email = searchParams.get("email")?.trim().toLowerCase();
    let phone = searchParams.get("phone")?.trim();

    let orders = getOrdersFromFile();

    // If customer (not admin), strictly scope to customer's own identity
    if (!adminSession && customerUserId) {
      let customerEmail: string | null = null;
      let customerPhone: string | null = null;

      try {
        if ((prisma as any)?.user) {
          const dbUser = await (prisma as any).user.findUnique({
            where: { id: customerUserId },
          });
          if (dbUser) {
            customerEmail = dbUser.email?.toLowerCase().trim() || null;
            customerPhone = dbUser.phone?.trim() || null;
          }
        }
      } catch {
        // Fallback
      }

      if (!customerEmail) {
        const usersFile = path.join(process.cwd(), "data", "users.json");
        if (fs.existsSync(usersFile)) {
          try {
            const raw = JSON.parse(fs.readFileSync(usersFile, "utf8"));
            const found = Array.isArray(raw) ? raw.find((u: any) => u.id === customerUserId) : null;
            if (found) {
              customerEmail = (found.email || "").toLowerCase().trim() || null;
              customerPhone = (found.phone || "").trim() || null;
            }
          } catch {
            // ignore
          }
        }
      }

      if (!customerEmail && !customerPhone) {
        return NextResponse.json(
          { success: false, error: "User profile not found." },
          { status: 401 }
        );
      }

      // Restrict orders to only matching this customer
      orders = orders.filter((o) => {
        const orderEmail = (o.email || "").toLowerCase().trim();
        const orderPhone = (o.phone || "").trim();
        return (customerEmail && orderEmail === customerEmail) || (customerPhone && orderPhone === customerPhone);
      });
    } else {
      // Admin query filters
      if (email) {
        orders = orders.filter((o) => (o.email || "").toLowerCase().trim() === email);
      }
      if (phone) {
        orders = orders.filter((o) => (o.phone || "").includes(phone));
      }
    }

    if (status && status !== "All") {
      orders = orders.filter((o) => o.status.toLowerCase() === status.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      orders = orders.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.phone.includes(q) ||
          (o.email && o.email.toLowerCase().includes(q)) ||
          o.items.some((item) => item.name.toLowerCase().includes(q))
      );
    }

    // Sort newest orders first
    orders.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeA && timeB) return timeB - timeA;
      return b.id.localeCompare(a.id);
    });

    return NextResponse.json({ success: true, count: orders.length, orders });
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
      paymentMethod = "UPI",
      paymentStatus = "Pending",
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

    const currentOrders = getOrdersFromFile();

    // Generate unique human-readable order id e.g. THR-1087
    let nextNum = 1087;
    const existingIds = currentOrders.map((o) => o.id);
    while (existingIds.includes(`THR-${nextNum}`)) {
      nextNum++;
    }
    const newOrderId = `THR-${nextNum}`;
    const now = new Date().toISOString();

    const newOrder: Order = {
      id: newOrderId,
      customerName: customerName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      houseOrFlat: houseOrFlat ? String(houseOrFlat).trim() : "",
      street: street ? String(street).trim() : "",
      city: city ? String(city).trim() : "",
      district: district ? String(district).trim() : "",
      state: state ? String(state).trim() : "",
      pincode: pincode ? String(pincode).trim() : "",
      items: items.map((item: any, idx: number) => ({
        id: item.id || `item-${idx + 1}`,
        productId: item.productId || item.id,
        sku: item.sku || `THR-SKU-${idx + 1}`,
        name: item.name,
        price: item.price || `₹${item.priceValue || 0}`,
        priceValue: item.priceValue || parseInt(String(item.price).replace(/[^\d]/g, ""), 10) || 0,
        quantity: item.quantity || 1,
        foldedImg: item.foldedImg || "/images/folded-gopuram.jpeg",
        wornImg: item.wornImg || "/images/gopura.jpeg",
        category: item.category || "Handloom Saree",
        selectedColor: item.selectedColor || "",
      })),
      total: Number(total) || 0,
      subtotal: Number(subtotal !== undefined ? subtotal : total),
      deliveryFee: Number(deliveryFee) || 0,
      discount: Number(discount) || 0,
      paymentMethod: (paymentMethod as PaymentMethod) || "UPI",
      paymentStatus: (paymentStatus as PaymentStatus) || (paymentMethod === "COD" ? "Pending" : "Paid"),
      status: "Pending",
      trackingNumber: "",
      courierName: "",
      notes: notes || "",
      trackingTimeline: [
        {
          title: "Order Placed",
          description: `Order placed successfully via ${paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}.`,
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
      ],
      createdAt: now,
      updatedAt: now,
    };

    // Prepend new order to list so newest is first
    const updatedOrders = [newOrder, ...currentOrders];
    const saved = saveOrdersToFile(updatedOrders);

    if (!saved) {
      return NextResponse.json(
        { success: false, error: "Failed to persist order to storage" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Order placed successfully",
        order: newOrder,
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
