import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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

export type OrderStatus = "Pending" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled";
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
  city?: string;
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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    let orders = getOrdersFromFile();

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
      city = "",
      pincode = "",
      items = [],
      total = 0,
      subtotal,
      deliveryFee = 0,
      discount = 0,
      paymentMethod = "COD",
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
      city: city.trim(),
      pincode: pincode.trim(),
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
      paymentMethod: (paymentMethod as PaymentMethod) || "COD",
      paymentStatus: (paymentStatus as PaymentStatus) || (paymentMethod === "UPI" ? "Paid" : "Pending"),
      status: "Pending",
      trackingNumber: "",
      courierName: "",
      notes: notes || "",
      trackingTimeline: [
        {
          title: "Order Placed",
          description: `Order placed successfully via ${paymentMethod === "COD" ? "Cash on Delivery" : "UPI Payment"}.`,
          timestamp: now,
          completed: true,
        },
        {
          title: "Order Confirmed & Packing",
          description: "Artisanal handloom drape undergoing inspection and heritage packaging.",
          timestamp: "",
          completed: false,
        },
        {
          title: "Handed to Courier",
          description: "Consignment will be handed over to logistics partner.",
          timestamp: "",
          completed: false,
        },
        {
          title: "Out for Delivery",
          description: "Courier agent will arrive at your shipping address.",
          timestamp: "",
          completed: false,
        },
        {
          title: "Delivered",
          description: "Order completed and delivered to customer.",
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
