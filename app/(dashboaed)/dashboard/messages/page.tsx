"use client";


import { errorMessage } from "@/lib/errors";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Inbox, Loader2, Mail, MessageCircle, Phone, RefreshCw, Trash2, CheckCircle2, Archive, RotateCcw } from "lucide-react";

interface CustomerMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: "new" | "replied" | "closed";
  adminNote: string | null;
  repliedAt: string | null;
  userId: string | null;
  createdAt: string;
}

type Filter = "new" | "replied" | "closed" | "all";

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

const STATUS_STYLE: Record<CustomerMessage["status"], string> = {
  new: "bg-amber-50 text-amber-800 border-amber-200",
  replied: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-stone-100 text-stone-600 border-stone-200",
};

export default function MessagesPage() {
  const [messages, setMessages] = useState<CustomerMessage[]>([]);
  const [counts, setCounts] = useState({ new: 0, replied: 0, closed: 0 });
  const [filter, setFilter] = useState<Filter>("new");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/messages", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Unable to load messages.");
      setMessages(data.messages);
      setCounts(data.counts);
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
  }, [load]);

  const shown = useMemo(() => (filter === "all" ? messages : messages.filter((m) => m.status === filter)), [messages, filter]);
  const selected = messages.find((m) => m.id === selectedId) || null;

  // Opening another message loads its note into the box (state adjusted
  // during render, so the box never shows the previous message's note).
  const [noteFor, setNoteFor] = useState<string | null>(null);
  if ((selected?.id ?? null) !== noteFor) {
    setNoteFor(selected?.id ?? null);
    setNote(selected?.adminNote || "");
  }

  const update = async (id: string, patch: { status?: CustomerMessage["status"]; adminNote?: string }) => {
    // Saving just the note (on leaving the box) mustn't disable the buttons,
    // or the click that moved focus away would be swallowed.
    const isStatusChange = !!patch.status;
    if (isStatusChange) setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Unable to update message.");
      setMessages((prev) => prev.map((m) => (m.id === id ? data.message : m)));
      if (patch.status) {
        const before = messages.find((m) => m.id === id)?.status;
        if (before && before !== patch.status) {
          setCounts((c) => ({ ...c, [before]: c[before] - 1, [patch.status!]: c[patch.status!] + 1 }));
        }
        window.dispatchEvent(new Event("thiraala-messages-updated"));
      }
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      if (isStatusChange) setIsSaving(false);
    }
  };

  const remove = async (m: CustomerMessage) => {
    if (!confirm(`Delete the message from ${m.name}? This can't be undone.`)) return;
    const res = await fetch(`/api/admin/messages/${m.id}`, { method: "DELETE" });
    if (res.ok) {
      setMessages((prev) => prev.filter((x) => x.id !== m.id));
      setCounts((c) => ({ ...c, [m.status]: c[m.status] - 1 }));
      setSelectedId(null);
      window.dispatchEvent(new Event("thiraala-messages-updated"));
    } else {
      alert("Unable to delete the message.");
    }
  };

  const mailto = (m: CustomerMessage) => {
    const quoted = m.message.split("\n").map((l) => `> ${l}`).join("\n");
    const body = `Hi ${m.name.split(" ")[0]},\n\n\n\nWarm regards,\nThiraala\n\n---\nOn ${when(m.createdAt)}, you wrote:\n${quoted}`;
    return `mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent("Re: Your message to Thiraala")}&body=${encodeURIComponent(body)}`;
  };
  const whatsapp = (m: CustomerMessage) =>
    `https://wa.me/91${m.phone}?text=${encodeURIComponent(`Hi ${m.name.split(" ")[0]}, this is Thiraala replying to your message: `)}`;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-[#1E3A2C]/10">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A2C] tracking-tight flex items-center gap-2.5">
            <Inbox className="w-6 h-6 text-[#DAA87C]" /> Customer Messages
          </h1>
          <p className="text-xs text-[#1E3A2C]/60 mt-1">
            Sent from the website&apos;s Contact page. Reply by email or WhatsApp, then mark the message as replied.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={isLoading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#1E3A2C]/15 bg-white text-xs font-bold text-[#1E3A2C] hover:bg-[#FAF8F5] disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {error && <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-800">{error}</div>}

      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["new", `New (${counts.new})`],
            ["replied", `Replied (${counts.replied})`],
            ["closed", `Closed (${counts.closed})`],
            ["all", `All (${counts.new + counts.replied + counts.closed})`],
          ] as [Filter, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              filter === key ? "bg-[#1E3A2C] text-white" : "bg-white border border-[#1E3A2C]/10 text-[#1E3A2C]/70 hover:text-[#1E3A2C]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#1E3A2C]/10 shadow-xs overflow-hidden">
          {isLoading && messages.length === 0 ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#DAA87C]" />
            </div>
          ) : shown.length === 0 ? (
            <p className="p-10 text-center text-xs text-[#1E3A2C]/50">
              {filter === "new" ? "No new messages. You're all caught up." : "No messages here."}
            </p>
          ) : (
            <ul className="divide-y divide-[#1E3A2C]/5 max-h-[70vh] overflow-y-auto">
              {shown.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(m.id)}
                    className={`w-full text-left px-4 py-3.5 hover:bg-[#FAF8F5] cursor-pointer ${selectedId === m.id ? "bg-[#FAF8F5]" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs truncate ${m.status === "new" ? "font-extrabold text-[#1E3A2C]" : "font-semibold text-[#1E3A2C]/80"}`}>
                        {m.name}
                      </span>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_STYLE[m.status]}`}>
                        {m.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#1E3A2C]/60 mt-1 line-clamp-2">{m.message}</p>
                    <p className="text-[10px] text-[#1E3A2C]/40 mt-1">{when(m.createdAt)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-3">
          {!selected ? (
            <div className="bg-white rounded-2xl border border-dashed border-[#1E3A2C]/15 p-12 text-center text-xs text-[#1E3A2C]/50">
              Select a message to read and reply.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#1E3A2C]/10 shadow-xs p-6 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-[#1E3A2C]">{selected.name}</h2>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-[#1E3A2C]/70">
                    <a href={`mailto:${selected.email}`} className="inline-flex items-center gap-1 hover:text-[#1E3A2C]">
                      <Mail className="w-3.5 h-3.5" /> {selected.email}
                    </a>
                    {selected.phone && (
                      <a href={`tel:+91${selected.phone}`} className="inline-flex items-center gap-1 hover:text-[#1E3A2C]">
                        <Phone className="w-3.5 h-3.5" /> {selected.phone}
                      </a>
                    )}
                    {selected.userId && <span className="text-[#DAA87C] font-semibold">Registered customer</span>}
                  </div>
                  <p className="text-[11px] text-[#1E3A2C]/40 mt-1">
                    Received {when(selected.createdAt)}
                    {selected.repliedAt && ` · replied ${when(selected.repliedAt)}`}
                  </p>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${STATUS_STYLE[selected.status]}`}>
                  {selected.status}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#1E3A2C]/5 text-sm text-[#1E3A2C] whitespace-pre-wrap break-words">
                {selected.message}
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href={mailto(selected)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E3A2C] text-white text-xs font-bold hover:bg-[#284f3c]"
                >
                  <Mail className="w-4 h-4" /> Reply by email
                </a>
                {selected.phone && (
                  <a
                    href={whatsapp(selected)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-300 text-emerald-800 bg-emerald-50 text-xs font-bold hover:bg-emerald-100"
                  >
                    <MessageCircle className="w-4 h-4" /> Reply on WhatsApp
                  </a>
                )}
              </div>

              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E3A2C]/60">Private note (only you see this)</span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onBlur={() => note !== (selected.adminNote || "") && update(selected.id, { adminNote: note })}
                  rows={3}
                  placeholder="e.g. Sent blouse measurements guide on WhatsApp"
                  className="mt-1 w-full p-3 rounded-xl border border-[#1E3A2C]/15 bg-[#FAF8F5]/40 text-xs text-[#1E3A2C] outline-none focus:border-[#DAA87C] resize-none"
                />
              </label>

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#1E3A2C]/5">
                {selected.status !== "replied" && (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => update(selected.id, { status: "replied", adminNote: note })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 mt-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Mark as replied
                  </button>
                )}
                {selected.status !== "closed" && (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => update(selected.id, { status: "closed", adminNote: note })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 mt-3 rounded-xl border border-[#1E3A2C]/15 text-[#1E3A2C] text-xs font-bold hover:bg-[#FAF8F5] disabled:opacity-50 cursor-pointer"
                  >
                    <Archive className="w-4 h-4" /> Close
                  </button>
                )}
                {selected.status !== "new" && (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => update(selected.id, { status: "new" })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 mt-3 rounded-xl border border-[#1E3A2C]/15 text-[#1E3A2C] text-xs font-bold hover:bg-[#FAF8F5] disabled:opacity-50 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" /> Mark as new
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(selected)}
                  className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 mt-3 rounded-xl text-rose-700 text-xs font-bold hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
