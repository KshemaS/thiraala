import fs from "fs";
import path from "path";
import prisma from "../lib/prisma";

interface LegacyOrderItem {
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

interface LegacyTrackingEvent {
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
}

interface LegacyOrder {
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
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  trackingNumber?: string;
  courierName?: string;
  notes?: string;
  items: LegacyOrderItem[];
  trackingTimeline: LegacyTrackingEvent[];
  createdAt: string;
  updatedAt: string;
}

async function main() {
  const dataFilePath = path.join(process.cwd(), "data", "orders.json");
  const content = fs.readFileSync(dataFilePath, "utf8");
  const legacyOrders: LegacyOrder[] = JSON.parse(content);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const legacy of legacyOrders) {
    try {
      const existing = await prisma.order.findUnique({ where: { humanId: legacy.id } });
      if (existing) {
        console.log(`Skipping ${legacy.id} — already migrated`);
        skipped++;
        continue;
      }

      await prisma.order.create({
        data: {
          humanId: legacy.id,
          customerName: legacy.customerName,
          phone: legacy.phone,
          email: legacy.email || "",
          address: legacy.address,
          houseOrFlat: legacy.houseOrFlat || "",
          street: legacy.street || "",
          city: legacy.city || "",
          district: legacy.district || "",
          state: legacy.state || "",
          pincode: legacy.pincode || "",
          total: Number(legacy.total) || 0,
          subtotal: Number(legacy.subtotal ?? legacy.total) || 0,
          deliveryFee: Number(legacy.deliveryFee) || 0,
          discount: Number(legacy.discount) || 0,
          paymentMethod: legacy.paymentMethod || "Razorpay",
          paymentStatus: legacy.paymentStatus || "Pending",
          status: legacy.status || "Pending",
          trackingNumber: legacy.trackingNumber || "",
          courierName: legacy.courierName || "",
          notes: legacy.notes || "",
          trackingTimeline: legacy.trackingTimeline as any,
          createdAt: new Date(legacy.createdAt),
          updatedAt: new Date(legacy.updatedAt),
          items: {
            create: legacy.items.map((item) => ({
              productId: item.productId ? String(item.productId) : null,
              sku: item.sku || null,
              name: item.name,
              price: item.price,
              priceValue: item.priceValue || 0,
              quantity: item.quantity || 1,
              foldedImg: item.foldedImg || null,
              wornImg: item.wornImg || null,
              category: item.category || null,
              selectedColor: item.selectedColor || "",
            })),
          },
        },
      });

      console.log(`Migrated ${legacy.id}`);
      migrated++;
    } catch (error) {
      console.error(`Failed to migrate ${legacy.id}:`, error);
      failed++;
    }
  }

  console.log(`\nDone. ${migrated} migrated, ${skipped} skipped, ${failed} failed.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
