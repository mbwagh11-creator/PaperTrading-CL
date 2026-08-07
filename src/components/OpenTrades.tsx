"use client";

import { useState } from "react";

interface Trade {
  id: string;
  symbol: string;
  instrumentKey: string | null;
  side: "BUY" | "SELL";
  quantity: number;
  entryPrice: number;
  currentPrice: number | null;
  stopLoss: number | null;
  target: number | null;
}

function pnlOf(t: Trade) {
  const ref = t.currentPrice ?? t.entryPrice;
  const diff = t.side === "BUY" ? ref - t.entryPrice : t.entryPrice - ref;
  return Number((diff * t.quantity).toFixed(2));
}

export default function OpenTrades({
  trades,
  onChanged,
}: {
  trades: Trade[];
  onChanged: () => void;
}) {
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [exitDrafts, setExitDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [liveErrors, setLiveErrors] = useState<Record<string, string>>({});

  async function fetchLivePrice(id: string, instrumentKey: string) {
    setBusyId(id);
    setLiveErrors((prev) => ({ ...prev, [id]: "" }));
    try {
      const quoteRes = await fetch(`/api/upstox/quote?instrumentKey=${encodeURIComponent(instrumentKey)}`);
      const quoteData = await quoteRes.json();
      if (!quoteRes.ok) throw new Error(quoteData.error || "Failed to fetch live price");

      await fetch(`/api/trades/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPrice: quoteData.lastPrice }),
      });
      onChanged();
    } catch (err: any) {
      setLiveErrors((prev) => ({ ...prev, [id]: err.message }));
    } finally {
      setBusyId(null);
    }
  }

  async function updatePrice(id: string) {
    const val = priceDrafts[id];
    if (!val) return;
    setBusyId(id);
    await fetch(`/api/trades/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPrice: val }),
    });
    setBusyId(null);
    onChanged();
  }

  async function closeTrade(id: string) {
    const val = exitDrafts[id];
    if (!val) return;
    setBusyId(id);
    await fetch(`/api/trades/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ close: true, exitPrice: val }),
    });
    setBusyId(null);
    onChanged();
  }

  if (!Array.isArray(trades) || trades.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-5 text-muted text-sm shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
        No open positions. Place a trade to see it here with live P&L.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {trades.map((t) => {
        const pnl = pnlOf(t);
        return (
          <div
            key={t.id}
            className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-[0_18px_60px_rgba(0,0,0,0.25)] transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-medium">{t.symbol}</span>{" "}
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    t.side === "BUY" ? "bg-accent/20 text-accent" : "bg-danger/20 text-danger"
                  }`}
                >
                  {t.side}
                </span>{" "}
                <span className="text-muted text-sm">x{t.quantity}</span>
              </div>
              <span className={`font-semibold ${pnl >= 0 ? "text-accent" : "text-danger"}`}>
                ₹{pnl.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs text-muted mb-3">
              <span>Entry: ₹{t.entryPrice}</span>
              <span>SL: {t.stopLoss ?? "—"}</span>
              <span>Target: {t.target ?? "—"}</span>
            </div>

            {t.instrumentKey && (
              <div className="mb-2">
                <button
                  disabled={busyId === t.id}
                  onClick={() => fetchLivePrice(t.id, t.instrumentKey!)}
                  className="text-xs px-3 py-1.5 rounded-xl bg-accent/20 text-accent border border-accent/40 hover:bg-accent/30 disabled:opacity-50 transition-all duration-200"
                >
                  ⚡ Fetch Live Price
                </button>
                {liveErrors[t.id] && <p className="text-xs text-danger mt-1">{liveErrors[t.id]}</p>}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <input
                type="number"
                step="0.05"
                placeholder="Update price"
                className="bg-panel2 border border-border rounded-lg px-2 py-1 text-sm w-32"
                value={priceDrafts[t.id] ?? ""}
                onChange={(e) => setPriceDrafts({ ...priceDrafts, [t.id]: e.target.value })}
              />
              <button
                disabled={busyId === t.id}
                onClick={() => updatePrice(t.id)}
                className="text-sm px-3 py-1.5 rounded-xl border border-white/10 hover:border-accent disabled:opacity-50 transition-all duration-200"
              >
                Update
              </button>

              <input
                type="number"
                step="0.05"
                placeholder="Exit price"
                className="bg-panel2 border border-border rounded-lg px-2 py-1 text-sm w-32"
                value={exitDrafts[t.id] ?? ""}
                onChange={(e) => setExitDrafts({ ...exitDrafts, [t.id]: e.target.value })}
              />
              <button
                disabled={busyId === t.id}
                onClick={() => closeTrade(t.id)}
                className="text-sm px-3 py-1.5 rounded-xl bg-danger text-white hover:brightness-95 disabled:opacity-50 transition-all duration-200 shadow-[0_8px_22px_rgba(255,72,72,0.22)]"
              >
                Close Trade
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
