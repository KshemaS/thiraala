"use client";

import Image from "next/image";
import { Palette, Plus, Trash2, ChevronUp, ChevronDown, Upload, X, Wand2 } from "lucide-react";
import type { ProductVariantItem } from "@/lib/productVariants";

/** Variant row as edited in the form (numbers may be blank while typing). */
export interface VariantDraft {
  /** Stable key for React; equals the DB id for saved variants. */
  key: string;
  id?: string;
  name: string;
  sku: string;
  colorHex: string;
  priceValue: number | "";
  mrp: number | "";
  stock: number | "";
  foldedImg: string;
  wornImg: string;
}

let keyCounter = 0;
/** Local React key (crypto.randomUUID is unavailable on plain-http LAN URLs). */
const newKey = () => `v${Date.now().toString(36)}_${++keyCounter}`;

export function toDrafts(variants: ProductVariantItem[] | undefined): VariantDraft[] {
  return (variants || []).map((v) => ({
    key: v.id || newKey(),
    id: v.id,
    name: v.name,
    sku: v.sku,
    colorHex: v.colorHex || "#1E3A2C",
    priceValue: v.priceValue ?? "",
    mrp: v.mrp ?? "",
    stock: v.stock ?? 0,
    foldedImg: v.foldedImg || "",
    wornImg: v.wornImg || "",
  }));
}

export function fromDrafts(drafts: VariantDraft[]): ProductVariantItem[] {
  return drafts.map((d, i) => ({
    id: d.id,
    name: d.name.trim(),
    sku: d.sku.trim(),
    colorHex: d.colorHex || undefined,
    priceValue: d.priceValue === "" ? null : d.priceValue,
    mrp: d.mrp === "" ? null : d.mrp,
    stock: d.stock === "" ? 0 : d.stock,
    foldedImg: d.foldedImg || undefined,
    wornImg: d.wornImg || undefined,
    sortOrder: i,
  }));
}

/** Returns an error message for the first invalid variant, or null. */
export function validateDrafts(drafts: VariantDraft[], productSku: string): string | null {
  const skus = new Set<string>();
  const names = new Set<string>();
  for (const [i, d] of drafts.entries()) {
    const name = d.name.trim();
    const sku = d.sku.trim();
    if (!name) return `Variant ${i + 1}: enter a colour name.`;
    if (!sku) return `Variant "${name}": enter a SKU.`;
    if (sku.toLowerCase() === productSku.trim().toLowerCase())
      return `Variant "${name}": its SKU must be different from the product SKU.`;
    if (skus.has(sku.toLowerCase())) return `SKU "${sku}" is used by more than one variant.`;
    if (names.has(name.toLowerCase())) return `Colour "${name}" is listed more than once.`;
    skus.add(sku.toLowerCase());
    names.add(name.toLowerCase());
  }
  return null;
}

interface VariantsEditorProps {
  variants: VariantDraft[];
  onChange: (variants: VariantDraft[]) => void;
  productSku: string;
  productPrice: number;
  onError: (message: string) => void;
}

const inputClass =
  "w-full px-3 py-2 rounded-xl border border-[#1E3A2C]/15 text-xs font-bold text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-[#FAF8F5]/30";

export default function VariantsEditor({
  variants,
  onChange,
  productSku,
  productPrice,
  onError,
}: VariantsEditorProps) {
  const update = (key: string, patch: Partial<VariantDraft>) =>
    onChange(variants.map((v) => (v.key === key ? { ...v, ...patch } : v)));

  const remove = (key: string) => onChange(variants.filter((v) => v.key !== key));

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= variants.length) return;
    const next = [...variants];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const add = () =>
    onChange([
      ...variants,
      {
        key: newKey(),
        name: "",
        sku: "",
        colorHex: "#1E3A2C",
        priceValue: "",
        mrp: "",
        stock: 0,
        foldedImg: "",
        wornImg: "",
      },
    ]);

  const generateSku = (v: VariantDraft) => {
    const base = productSku.trim() || "SAR";
    const code =
      v.name
        .trim()
        .split(/\s+/)
        .map((w) => w[0]?.toUpperCase() || "")
        .join("")
        .slice(0, 3) || String(variants.indexOf(v) + 1);
    update(v.key, { sku: `${base}_${code}` });
  };

  const numberOrBlank = (val: string): number | "" => {
    if (val === "") return "";
    const n = parseInt(val, 10);
    return Number.isFinite(n) && n >= 0 ? n : "";
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>, key: string, field: "foldedImg" | "wornImg") => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onError("Please select a valid image file (JPEG, PNG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onError("Image size must be under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update(key, { [field]: reader.result as string });
    reader.readAsDataURL(file);
  };

  const totalStock = variants.reduce((sum, v) => sum + (v.stock === "" ? 0 : v.stock), 0);

  return (
    <div className="bg-white rounded-2xl border border-[#1E3A2C]/10 p-6 shadow-xs space-y-5">
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#1E3A2C]/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#1E3A2C]/10 flex items-center justify-center text-[#DAA87C]">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1E3A2C]">Colour Variants</h3>
            <p className="text-[11px] text-[#1E3A2C]/50">
              Each colour gets its own SKU, stock and photos. Leave price blank to use the product price.
            </p>
          </div>
        </div>
        {variants.length > 0 && (
          <span className="text-[10px] font-bold px-2.5 py-1 bg-[#1E3A2C]/5 text-[#1E3A2C] rounded-full whitespace-nowrap">
            {variants.length} {variants.length === 1 ? "colour" : "colours"} · {totalStock} in stock
          </span>
        )}
      </div>

      {variants.length === 0 ? (
        <p className="text-xs text-[#1E3A2C]/50 text-center py-4">
          No variants. This saree is sold in one colour, using the stock and photos above and beside.
        </p>
      ) : (
        <div className="space-y-4">
          {variants.map((v, index) => (
            <div key={v.key} className="rounded-xl border border-[#1E3A2C]/10 bg-[#FAF8F5]/40 p-4 space-y-3">
              {/* Row header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-4 h-4 rounded-full border border-[#1E3A2C]/20 flex-shrink-0"
                    style={{ backgroundColor: v.colorHex }}
                  />
                  <span className="text-xs font-bold text-[#1E3A2C] truncate">
                    {v.name.trim() || `Variant ${index + 1}`}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg text-[#1E3A2C]/50 hover:bg-white hover:text-[#1E3A2C] disabled:opacity-30 cursor-pointer"
                    title="Move up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === variants.length - 1}
                    className="p-1.5 rounded-lg text-[#1E3A2C]/50 hover:bg-white hover:text-[#1E3A2C] disabled:opacity-30 cursor-pointer"
                    title="Move down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(v.key)}
                    className="p-1.5 rounded-lg text-rose-600/70 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                    title="Remove variant"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Name + colour + SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#1E3A2C] mb-1">
                    Colour name <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={v.colorHex}
                      onChange={(e) => update(v.key, { colorHex: e.target.value })}
                      className="w-10 h-[34px] rounded-lg border border-[#1E3A2C]/15 bg-white cursor-pointer p-0.5 flex-shrink-0"
                      title="Swatch colour"
                    />
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => update(v.key, { name: e.target.value })}
                      placeholder="Wine Lily"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#1E3A2C] mb-1">
                    Variant SKU <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={v.sku}
                      onChange={(e) => update(v.key, { sku: e.target.value.toUpperCase() })}
                      placeholder={`${productSku || "SAR_COT_061"}_WL`}
                      className={`${inputClass} font-mono`}
                    />
                    <button
                      type="button"
                      onClick={() => generateSku(v)}
                      className="px-2.5 rounded-lg border border-[#1E3A2C]/15 bg-white text-[#DAA87C] hover:bg-[#FAF8F5] cursor-pointer flex-shrink-0"
                      title="Generate from product SKU and colour name"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Price / MRP / stock */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#1E3A2C] mb-1">Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={v.priceValue}
                    onChange={(e) => update(v.key, { priceValue: numberOrBlank(e.target.value) })}
                    placeholder={productPrice ? String(productPrice) : "Same"}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#1E3A2C] mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={v.mrp}
                    onChange={(e) => update(v.key, { mrp: numberOrBlank(e.target.value) })}
                    placeholder="Same"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#1E3A2C] mb-1">Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={v.stock}
                    onChange={(e) => update(v.key, { stock: numberOrBlank(e.target.value) })}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Photos */}
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ["foldedImg", "Folded photo"],
                    ["wornImg", "Draped photo"],
                  ] as const
                ).map(([field, label]) => (
                  <div key={field}>
                    <span className="block text-[11px] font-bold text-[#1E3A2C] mb-1">{label}</span>
                    {v[field] ? (
                      <div className="relative w-full aspect-[3/4] max-w-[120px] rounded-lg overflow-hidden border border-[#1E3A2C]/10 bg-white">
                        <Image
                          src={v[field]}
                          alt={`${v.name || "Variant"} ${label.toLowerCase()}`}
                          fill
                          className="object-cover"
                          unoptimized={v[field].startsWith("data:")}
                        />
                        <button
                          type="button"
                          onClick={() => update(v.key, { [field]: "" })}
                          className="absolute top-1 right-1 p-1 rounded-full bg-white/90 text-rose-600 hover:bg-white cursor-pointer"
                          title="Remove photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full aspect-[3/4] max-w-[120px] rounded-lg border border-dashed border-[#1E3A2C]/20 bg-white text-[#1E3A2C]/40 hover:border-[#DAA87C] hover:text-[#DAA87C] cursor-pointer transition-colors">
                        <Upload className="w-4 h-4 mb-1" />
                        <span className="text-[10px] font-semibold">Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImage(e, v.key, field)}
                        />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={add}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[#1E3A2C]/25 text-xs font-bold text-[#1E3A2C] hover:border-[#DAA87C] hover:bg-[#FAF8F5] transition-all cursor-pointer"
      >
        <Plus className="w-4 h-4 text-[#DAA87C]" />
        <span>Add colour variant</span>
      </button>
    </div>
  );
}
