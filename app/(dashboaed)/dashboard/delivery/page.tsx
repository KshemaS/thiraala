"use client";

import { useEffect, useState } from "react";
import { Truck, Loader2, Check, AlertCircle, Calculator } from "lucide-react";

interface ZoneRate {
  key: string;
  name: string;
  states: string[];
  firstItemFee: number;
  extraItemFee: number;
}

type Draft = ZoneRate & { firstText: string; extraText: string };

const toDraft = (r: ZoneRate): Draft => ({ ...r, firstText: String(r.firstItemFee), extraText: String(r.extraItemFee) });
const parseFee = (text: string) => (/^\d+$/.test(text.trim()) ? Number(text.trim()) : NaN);
const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function DeliveryChargesPage() {
  const [rates, setRates] = useState<Draft[]>([]);
  // state -> zone key, as shown in the "States in each zone" editor
  const [stateZones, setStateZones] = useState<Record<string, string>>({});
  const [savedStateZones, setSavedStateZones] = useState<Record<string, string>>({});
  const [isSavingStates, setIsSavingStates] = useState(false);
  const [statesSaved, setStatesSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Fee checker
  const [testPin, setTestPin] = useState("");
  const [testCount, setTestCount] = useState(1);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/delivery-rates");
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Unable to load delivery charges.");
        setRates(data.rates.map(toDraft));
        applyStateZones(data.rates);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const update = (key: string, patch: Partial<Draft>) => {
    setSaved(false);
    setRates((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const applyStateZones = (list: ZoneRate[]) => {
    const map: Record<string, string> = {};
    for (const z of list) for (const st of z.states) map[st] = z.key;
    setStateZones(map);
    setSavedStateZones(map);
  };

  const changedStates = Object.keys(stateZones).filter((st) => stateZones[st] !== savedStateZones[st]);

  const handleSaveStates = async () => {
    setIsSavingStates(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/delivery-rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stateZones: Object.fromEntries(changedStates.map((st) => [st, stateZones[st]])) }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Unable to save the zones.");
      setRates(data.rates.map(toDraft));
      applyStateZones(data.rates);
      setStatesSaved(true);
      setTestResult(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSavingStates(false);
    }
  };

  const invalid = rates.find((r) => Number.isNaN(parseFee(r.firstText)) || Number.isNaN(parseFee(r.extraText)));

  const handleSave = async () => {
    if (invalid) {
      setError(`${invalid.name}: enter whole rupee amounts (0 or more).`);
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/delivery-rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rates: rates.map((r) => ({ zone: r.key, firstItemFee: parseFee(r.firstText), extraItemFee: parseFee(r.extraText) })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Unable to save delivery charges.");
      setRates(data.rates.map(toDraft));
      applyStateZones(data.rates);
      setSaved(true);
      setTestResult(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setTestResult(null);
    const res = await fetch(`/api/delivery/quote?pincode=${encodeURIComponent(testPin.trim())}&sarees=${testCount}`);
    const data = await res.json();
    setTestResult(
      data.success
        ? `${data.state ?? "Unknown area"} → ${data.zoneName}: ${rupees(data.fee)} for ${data.sarees} ${data.sarees === 1 ? "saree" : "sarees"}`
        : data.error
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-4xl">
      <div className="pb-4 border-b border-[#1E3A2C]/10">
        <h1 className="text-2xl font-bold text-[#1E3A2C] tracking-tight flex items-center gap-2.5">
          <Truck className="w-6 h-6 text-[#DAA87C]" />
          <span>Delivery Charges</span>
        </h1>
        <p className="text-xs text-[#1E3A2C]/60 mt-1">
          Charged per order by the customer&apos;s pincode: the first saree&apos;s charge, plus the extra charge for each
          additional saree. Changes apply to new orders straight away.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-16 flex justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-[#DAA87C]" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#1E3A2C]/10 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-[10px] font-bold uppercase tracking-wider text-[#1E3A2C]/60">
                <tr>
                  <th className="py-3 px-4">Zone</th>
                  <th className="py-3 px-4">First saree (₹)</th>
                  <th className="py-3 px-4">Each extra saree (₹)</th>
                  <th className="py-3 px-4">2 sarees</th>
                  <th className="py-3 px-4">3 sarees</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E3A2C]/5">
                {rates.map((r) => {
                  const first = parseFee(r.firstText);
                  const extra = parseFee(r.extraText);
                  const ok = !Number.isNaN(first) && !Number.isNaN(extra);
                  return (
                    <tr key={r.key}>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-[#1E3A2C]">{r.name}</p>
                        <p className="text-[10px] text-[#1E3A2C]/50 mt-0.5 max-w-[280px]">
                          {r.states.length ? r.states.join(", ") : "No states — move some here below"}
                        </p>
                      </td>
                      {(["firstText", "extraText"] as const).map((field) => (
                        <td key={field} className="py-3.5 px-4">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={r[field]}
                            onChange={(e) => update(r.key, { [field]: e.target.value.replace(/[^\d]/g, "") })}
                            aria-label={`${r.name} ${field === "firstText" ? "first saree" : "each extra saree"} charge`}
                            className={`w-24 px-3 py-2 rounded-xl border text-xs font-bold text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-[#FAF8F5]/30 ${
                              Number.isNaN(parseFee(r[field])) ? "border-rose-300" : "border-[#1E3A2C]/15"
                            }`}
                          />
                        </td>
                      ))}
                      <td className="py-3.5 px-4 font-semibold text-[#1E3A2C]/70">{ok ? rupees(first + extra) : "–"}</td>
                      <td className="py-3.5 px-4 font-semibold text-[#1E3A2C]/70">{ok ? rupees(first + extra * 2) : "–"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-[#1E3A2C]/5 flex items-center justify-end gap-3">
            {saved && (
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <Check className="w-4 h-4" /> Saved
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || Boolean(invalid)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E3A2C] text-white text-xs font-bold hover:bg-[#284f3c] disabled:opacity-50 cursor-pointer"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save delivery charges
            </button>
          </div>
        </div>
      )}

      {/* Which states are in each zone */}
      {!isLoading && rates.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#1E3A2C]/10 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-[#1E3A2C]/5">
            <h3 className="text-sm font-bold text-[#1E3A2C]">States in each zone</h3>
            <p className="text-[11px] text-[#1E3A2C]/50 mt-0.5">
              Move a state to another zone to change what its customers pay. The state is worked out from the delivery pincode.
            </p>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
            {Object.keys(stateZones)
              .sort((a, b) => a.localeCompare(b))
              .map((st) => (
                <label key={st} className="flex items-center justify-between gap-3 py-1">
                  <span className={`text-xs ${stateZones[st] !== savedStateZones[st] ? "font-bold text-[#b45309]" : "font-semibold text-[#1E3A2C]"}`}>
                    {st}
                  </span>
                  <select
                    value={stateZones[st]}
                    onChange={(e) => {
                      setStatesSaved(false);
                      setStateZones((prev) => ({ ...prev, [st]: e.target.value }));
                    }}
                    aria-label={`Zone for ${st}`}
                    className="px-2 py-1.5 rounded-lg border border-[#1E3A2C]/15 text-[11px] font-bold text-[#1E3A2C] bg-white max-w-[170px]"
                  >
                    {rates.map((z) => (
                      <option key={z.key} value={z.key}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
          </div>
          <div className="p-4 border-t border-[#1E3A2C]/5 flex items-center justify-end gap-3">
            {statesSaved && changedStates.length === 0 && (
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <Check className="w-4 h-4" /> Saved
              </span>
            )}
            {changedStates.length > 0 && (
              <span className="text-xs text-[#b45309] font-semibold">
                {changedStates.length} state{changedStates.length === 1 ? "" : "s"} changed
              </span>
            )}
            <button
              type="button"
              onClick={handleSaveStates}
              disabled={isSavingStates || changedStates.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E3A2C] text-white text-xs font-bold hover:bg-[#284f3c] disabled:opacity-50 cursor-pointer"
            >
              {isSavingStates && <Loader2 className="w-4 h-4 animate-spin" />}
              Save zones
            </button>
          </div>
        </div>
      )}

      {/* Check a pincode */}
      <div className="bg-white rounded-2xl border border-[#1E3A2C]/10 shadow-xs p-5 space-y-3">
        <h3 className="text-sm font-bold text-[#1E3A2C] flex items-center gap-2">
          <Calculator className="w-4 h-4 text-[#DAA87C]" />
          Check a pincode
        </h3>
        <p className="text-[11px] text-[#1E3A2C]/50">See which zone a pincode falls in and what a customer would pay (uses saved charges).</p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={testPin}
            onChange={(e) => setTestPin(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="Pincode"
            className="w-32 px-3 py-2 rounded-xl border border-[#1E3A2C]/15 text-xs font-bold text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C]"
          />
          <select
            value={testCount}
            onChange={(e) => setTestCount(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-[#1E3A2C]/15 text-xs font-bold text-[#1E3A2C] bg-white"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "saree" : "sarees"}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleTest}
            disabled={testPin.length !== 6}
            className="px-4 py-2 rounded-xl border border-[#1E3A2C]/15 text-xs font-bold text-[#1E3A2C] hover:bg-[#FAF8F5] disabled:opacity-50 cursor-pointer"
          >
            Check
          </button>
          {testResult && <span className="text-xs font-semibold text-[#1E3A2C]">{testResult}</span>}
        </div>
      </div>
    </div>
  );
}
