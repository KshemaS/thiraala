"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Order } from "@/app/api/orders/route";

/**
 * Printable packing slips: /dashboard/print/slips?ids=THR-1098,THR-1099
 * One slip per page. Lives outside the dashboard layout so nothing but the
 * slips is printed; /dashboard/* is still admin-only (proxy.ts) and the
 * order data comes from the admin-only orders API.
 */

const SHOP = {
  name: "Thiraala",
  email: "thiraala@gmail.com",
  phone: "+91 8921768742",
};

function Slips() {
  const params = useSearchParams();
  const ids = (params.get("ids") || "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Unable to load orders.");
        const byId = new Map((data.orders as Order[]).map((o) => [o.id.toUpperCase(), o]));
        setOrders(ids.map((id) => byId.get(id)).filter((o): o is Order => !!o));
      } catch (err: any) {
        setError(err.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  if (error) return <p className="p-8 text-sm text-red-700">{error}</p>;
  if (!orders) return <p className="p-8 text-sm text-neutral-500">Loading packing slips…</p>;
  if (orders.length === 0) return <p className="p-8 text-sm text-neutral-500">No matching orders.</p>;

  return (
    <div className="bg-neutral-100 print:bg-white min-h-screen">
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-neutral-200 px-6 py-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-neutral-800">
          {orders.length} packing slip{orders.length === 1 ? "" : "s"}
          {orders.length < ids.length && ` (${ids.length - orders.length} order not found)`}
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 rounded-lg bg-[#1E3A2C] text-white text-sm font-bold cursor-pointer"
        >
          Print
        </button>
      </div>

      {orders.map((o) => {
        const sarees = o.items.reduce((n, i) => n + i.quantity, 0);
        return (
          <section
            key={o.id}
            className="slip bg-white text-neutral-900 mx-auto my-6 print:my-0 p-10 max-w-[800px] shadow print:shadow-none"
          >
            <header className="flex items-start justify-between border-b-2 border-neutral-900 pb-4">
              <div>
                <p className="text-2xl font-extrabold tracking-tight">{SHOP.name}</p>
                <p className="text-xs text-neutral-600 mt-1">
                  {SHOP.email} · {SHOP.phone}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-widest text-neutral-500">Packing slip</p>
                <p className="text-xl font-extrabold font-mono">{o.id}</p>
                <p className="text-xs text-neutral-600">
                  {new Date(o.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" })}
                </p>
              </div>
            </header>

            <div className="grid grid-cols-2 gap-8 py-6 border-b border-neutral-300">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Ship to</p>
                <p className="text-lg font-bold mt-1">{o.customerName}</p>
                <p className="text-sm leading-relaxed mt-1 whitespace-pre-line">
                  {[o.houseOrFlat, o.street, o.city, o.district].filter(Boolean).join(", ") || o.address}
                </p>
                <p className="text-sm font-bold mt-1">
                  {[o.state, o.pincode].filter(Boolean).join(" - ")}
                </p>
                <p className="text-sm mt-2">Phone: {o.phone}</p>
              </div>
              <div className="text-sm space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Shipment</p>
                <p>
                  Payment: <strong>{o.paymentStatus === "Paid" ? "Prepaid online" : `Not paid (${o.paymentStatus})`}</strong>
                </p>
                <p>
                  Sarees: <strong>{sarees}</strong>
                </p>
                {o.courierName && (
                  <p>
                    Courier: <strong>{o.courierName}</strong>
                  </p>
                )}
                {o.trackingNumber && (
                  <p>
                    Tracking: <strong className="font-mono">{o.trackingNumber}</strong>
                  </p>
                )}
              </div>
            </div>

            <table className="w-full text-sm mt-6">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-widest text-neutral-500 border-b border-neutral-300">
                  <th className="py-2 w-10">✓</th>
                  <th className="py-2">Item</th>
                  <th className="py-2">Colour</th>
                  <th className="py-2">SKU</th>
                  <th className="py-2 text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {o.items.map((i) => (
                  <tr key={i.id} className="border-b border-neutral-200">
                    <td className="py-3">
                      <span className="inline-block w-4 h-4 border border-neutral-500" />
                    </td>
                    <td className="py-3 font-semibold">{i.name}</td>
                    <td className="py-3">{i.selectedColor || "—"}</td>
                    <td className="py-3 font-mono text-xs">{i.sku || "—"}</td>
                    <td className="py-3 text-right font-bold">{i.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {o.notes && (
              <div className="mt-6 p-3 border border-neutral-300 text-sm">
                <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">Notes</p>
                <p className="mt-1 whitespace-pre-line">{o.notes}</p>
              </div>
            )}

            <p className="mt-10 text-xs text-neutral-500 text-center">
              Thank you for shopping with {SHOP.name}. Questions? {SHOP.email} · {SHOP.phone}
            </p>
          </section>
        );
      })}

      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          .slip { page-break-after: always; break-after: page; padding: 0; max-width: none; }
          .slip:last-child { page-break-after: auto; break-after: auto; }
        }
      `}</style>
    </div>
  );
}

export default function PackingSlipsPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-neutral-500">Loading packing slips…</p>}>
      <Slips />
    </Suspense>
  );
}
