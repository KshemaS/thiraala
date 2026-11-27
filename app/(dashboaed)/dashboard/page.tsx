"use client";


import { errorMessage } from "@/lib/errors";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Inbox,
  Clock,
  IndianRupee,
  Loader2,
  PackageCheck,
  PackageX,
  RefreshCw,
  ShoppingBag,
  Truck,
  Users,
} from "lucide-react";

interface Overview {
  generatedAt: string;
  today: { orders: number; revenue: number };
  month: { orders: number; revenue: number };
  week: { revenue: number; days: { date: string; revenue: number; orders: number }[] };
  toShip: { id: string; customerName: string; total: number; items: number; place: string; createdAt: string }[];
  attention: { id: string; customerName: string; total: number; status: string; reason: string; updatedAt: string }[];
  awaitingPayment: number;
  lowStock: { productId: string; name: string; colour: string | null; sku: string; stock: number }[];
  lowStockThreshold: number;
  counts: { activeProducts: number; customers: number; newMessages: number };
}

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const dayLabel = (date: string) =>
  new Date(`${date}T00:00:00+05:30`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", timeZone: "Asia/Kolkata" });
const ago = (iso: string) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl border border-[#1E3A2C]/10 shadow-xs ${className}`}>{children}</div>;
}

function SectionHeader({ icon, title, hint, href, linkLabel }: { icon: React.ReactNode; title: string; hint?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-[#DAA87C] flex-shrink-0">{icon}</span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-[#1E3A2C]">{title}</h2>
          {hint && <p className="text-[11px] text-[#1E3A2C]/50">{hint}</p>}
        </div>
      </div>
      {href && (
        <Link href={href} className="text-[11px] font-bold text-[#1E3A2C]/70 hover:text-[#1E3A2C] inline-flex items-center gap-1 flex-shrink-0">
          {linkLabel} <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

export default function DashboardOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/overview", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Unable to load the overview.");
      setData(json);
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads data from the server when this opens; the data arrives asynchronously
    load();
    window.addEventListener("thiraala-orders-updated", load);
    window.addEventListener("thiraala-products-updated", load);
    return () => {
      window.removeEventListener("thiraala-orders-updated", load);
      window.removeEventListener("thiraala-products-updated", load);
    };
  }, [load]);

  const maxDay = Math.max(1, ...(data?.week.days.map((d) => d.revenue) ?? [0]));

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-[#1E3A2C]/10">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A2C] tracking-tight">Overview</h1>
          <p className="text-xs text-[#1E3A2C]/60 mt-1">
            What needs doing today. Revenue counts paid, non-cancelled orders; days are India time.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={isLoading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#1E3A2C]/15 bg-white text-xs font-bold text-[#1E3A2C] hover:bg-[#FAF8F5] disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-800">{error}</div>
      )}

      {!data && isLoading ? (
        <div className="p-20 flex justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-[#DAA87C]" />
        </div>
      ) : data ? (
        <>
          {/* Needs attention — first, because it's money owed to customers */}
          {data.attention.length > 0 && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/60 overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 pt-4 pb-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h2 className="text-sm font-bold text-rose-900">
                  {data.attention.length} order{data.attention.length === 1 ? " needs" : "s need"} your attention
                </h2>
              </div>
              <ul className="divide-y divide-rose-200/60">
                {data.attention.map((o) => (
                  <li key={o.id}>
                    <Link href={`/dashboard/orders?order=${encodeURIComponent(o.id)}`} className="flex items-start justify-between gap-4 px-5 py-3 hover:bg-rose-100/40">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-rose-950">
                          {o.id} · {o.customerName} · {rupees(o.total)}
                        </p>
                        <p className="text-[11px] text-rose-900/80 mt-0.5">{o.reason}</p>
                      </div>
                      <span className="text-[11px] font-bold text-rose-800 inline-flex items-center gap-1 flex-shrink-0">
                        Open <ArrowRight className="w-3 h-3" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Numbers */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Revenue today", value: rupees(data.today.revenue), sub: `${data.today.orders} order${data.today.orders === 1 ? "" : "s"} placed today`, icon: <IndianRupee className="w-4 h-4" /> },
              { label: "Revenue this month", value: rupees(data.month.revenue), sub: `${data.month.orders} paid order${data.month.orders === 1 ? "" : "s"}`, icon: <CalendarDays className="w-4 h-4" /> },
              { label: "To ship", value: String(data.toShip.length), sub: "Paid and confirmed", icon: <Truck className="w-4 h-4" />, href: "/dashboard/orders" },
              { label: "Awaiting payment", value: String(data.awaitingPayment), sub: "Placed, not paid yet", icon: <Clock className="w-4 h-4" />, href: "/dashboard/orders" },
            ].map((s) => {
              const body = (
                <Card className="p-4 h-full hover:border-[#1E3A2C]/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#1E3A2C]/50">{s.label}</p>
                    <span className="p-1.5 rounded-lg bg-[#FAF8F5] text-[#DAA87C]">{s.icon}</span>
                  </div>
                  <p className="text-2xl font-bold text-[#1E3A2C] mt-2">{s.value}</p>
                  <p className="text-[11px] text-[#1E3A2C]/50 mt-0.5">{s.sub}</p>
                </Card>
              );
              return s.href ? (
                <Link key={s.label} href={s.href}>
                  {body}
                </Link>
              ) : (
                <div key={s.label}>{body}</div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Last 7 days */}
            <Card className="lg:col-span-3">
              <SectionHeader icon={<IndianRupee className="w-4 h-4" />} title="Last 7 days" hint={`${rupees(data.week.revenue)} from paid orders`} />
              <div className="px-5 pb-5">
                {data.week.revenue === 0 ? (
                  <p className="text-xs text-[#1E3A2C]/50 py-10 text-center">No paid orders in the last 7 days yet.</p>
                ) : (
                  <div className="flex items-end gap-2 h-44">
                    {data.week.days.map((d) => (
                      <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5 min-w-0">
                        <span className="text-[10px] font-bold text-[#1E3A2C]/70 truncate">{d.revenue ? rupees(d.revenue) : ""}</span>
                        <div
                          className="w-full rounded-t-md bg-[#1E3A2C]"
                          style={{ height: `${Math.max(d.revenue ? 4 : 1, (d.revenue / maxDay) * 100)}%`, opacity: d.revenue ? 1 : 0.15 }}
                          title={`${dayLabel(d.date)}: ${rupees(d.revenue)} (${d.orders} order${d.orders === 1 ? "" : "s"})`}
                        />
                        <span className="text-[10px] text-[#1E3A2C]/50 truncate">{dayLabel(d.date)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Shop at a glance */}
            <Card className="lg:col-span-2">
              <SectionHeader icon={<ShoppingBag className="w-4 h-4" />} title="Shop" />
              <div className="px-5 pb-5 grid grid-cols-2 gap-3">
                <Link href="/dashboard/products" className="p-3 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EFE8]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#1E3A2C]/50">Products live</p>
                  <p className="text-xl font-bold text-[#1E3A2C] mt-1">{data.counts.activeProducts}</p>
                </Link>
                <div className="p-3 rounded-xl bg-[#FAF8F5]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#1E3A2C]/50 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Customers
                  </p>
                  <p className="text-xl font-bold text-[#1E3A2C] mt-1">{data.counts.customers}</p>
                </div>
                <Link
                  href="/dashboard/messages"
                  className={`p-3 rounded-xl ${data.counts.newMessages > 0 ? "bg-amber-50 border border-amber-200 hover:bg-amber-100" : "bg-[#FAF8F5] hover:bg-[#F3EFE8]"}`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#1E3A2C]/50 flex items-center gap-1">
                    <Inbox className="w-3 h-3" /> New messages
                  </p>
                  <p className="text-xl font-bold text-[#1E3A2C] mt-1">{data.counts.newMessages}</p>
                </Link>
                <Link href="/dashboard/products/create" className="p-3 rounded-xl border border-dashed border-[#1E3A2C]/20 text-xs font-bold text-[#1E3A2C] flex items-center justify-center hover:bg-[#FAF8F5]">
                  + Add a product
                </Link>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* To ship */}
            <Card>
              <SectionHeader icon={<PackageCheck className="w-4 h-4" />} title="Ready to ship" hint="Paid and confirmed, oldest first" href="/dashboard/orders" linkLabel="All orders" />
              {data.toShip.length === 0 ? (
                <p className="text-xs text-[#1E3A2C]/50 px-5 pb-6 pt-2">Nothing waiting to be shipped.</p>
              ) : (
                <ul className="divide-y divide-[#1E3A2C]/5 pb-2">
                  {data.toShip.slice(0, 8).map((o) => (
                    <li key={o.id}>
                      <Link href={`/dashboard/orders?order=${encodeURIComponent(o.id)}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-[#FAF8F5]">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1E3A2C]">
                            {o.id} · {o.customerName}
                          </p>
                          <p className="text-[11px] text-[#1E3A2C]/50 truncate">
                            {o.items} item{o.items === 1 ? "" : "s"}
                            {o.place && ` · ${o.place}`} · placed {ago(o.createdAt)}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-[#1E3A2C] flex-shrink-0">{rupees(o.total)}</span>
                      </Link>
                    </li>
                  ))}
                  {data.toShip.length > 8 && (
                    <li className="px-5 py-2 text-[11px] text-[#1E3A2C]/50">and {data.toShip.length - 8} more…</li>
                  )}
                </ul>
              )}
            </Card>

            {/* Low stock */}
            <Card>
              <SectionHeader
                icon={<PackageX className="w-4 h-4" />}
                title="Low stock"
                hint={`${data.lowStockThreshold} or fewer left, per colour`}
                href="/dashboard/products"
                linkLabel="All products"
              />
              {data.lowStock.length === 0 ? (
                <p className="text-xs text-[#1E3A2C]/50 px-5 pb-6 pt-2">Everything is well stocked.</p>
              ) : (
                <ul className="divide-y divide-[#1E3A2C]/5 pb-2">
                  {data.lowStock.slice(0, 10).map((s) => (
                    <li key={s.sku}>
                      <Link href={`/dashboard/products/edit/${s.productId}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-[#FAF8F5]">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1E3A2C] truncate">
                            {s.name}
                            {s.colour && <span className="font-medium text-[#1E3A2C]/60"> · {s.colour}</span>}
                          </p>
                          <p className="text-[11px] text-[#1E3A2C]/50 font-mono">{s.sku}</p>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                            s.stock === 0 ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {s.stock === 0 ? "Sold out" : `${s.stock} left`}
                        </span>
                      </Link>
                    </li>
                  ))}
                  {data.lowStock.length > 10 && (
                    <li className="px-5 py-2 text-[11px] text-[#1E3A2C]/50">and {data.lowStock.length - 10} more…</li>
                  )}
                </ul>
              )}
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
