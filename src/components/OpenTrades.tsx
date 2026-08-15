"use client";

import { useEffect, useState } from "react";

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

export default function OpenTrades({
  trades,
  onChanged,
}: {
  trades: Trade[];
  onChanged: () => void;
}) {
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [exitDrafts, setExitDrafts] = useState<Record<string, string>>({});
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [liveErrors, setLiveErrors] = useState<Record<string, string>>({});
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const [tickCount, setTickCount] = useState(0);

  async function fetchSingleLivePrice(t: Trade) {
    setBusyId(t.id);
    setLiveErrors((prev) => ({ ...prev, [t.id]: "" }));
    try {
      const params = new URLSearchParams();
      if (t.instrumentKey) params.set("instrumentKey", t.instrumentKey);
      params.set("symbol", t.symbol);

      const res = await fetch(`/api/market/quote?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || typeof data.lastPrice !== "number") {
        throw new Error(data.error || "Failed to fetch market price");
      }

      setLivePrices((prev) => ({ ...prev, [t.id]: data.lastPrice }));
      setLastRefreshedAt(new Date().toLocaleTimeString("en-IN"));
      setTickCount((c) => c + 1);

      fetch(`/api/trades/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPrice: data.lastPrice }),
      }).catch(() => {});
    } catch (err: any) {
      setLiveErrors((prev) => ({ ...prev, [t.id]: err.message }));
    } finally {
      setBusyId(null);
    }
  }

  async function refreshAllPrices() {
    if (!Array.isArray(trades) || trades.length === 0) return;

    try {
      const updates: Record<string, number> = {};

      await Promise.all(
        trades.map(async (t) => {
          try {
            const params = new URLSearchParams();
            if (t.instrumentKey) params.set("instrumentKey", t.instrumentKey);
            params.set("symbol", t.symbol);

            const res = await fetch(`/api/market/quote?${params.toString()}`);
            const data = await res.json();
            if (res.ok && typeof data.lastPrice === "number") {
              updates[t.id] = data.lastPrice;
            }
          } catch {
            // ignore silent tick errors
          }
        })
      );

      if (Object.keys(updates).length > 0) {
        setLivePrices((prev) => ({ ...prev, ...updates }));
        setLastRefreshedAt(new Date().toLocaleTimeString("en-IN"));
        setTickCount((c) => c + 1);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (!autoRefresh || !Array.isArray(trades) || trades.length === 0) return;
    refreshAllPrices();
    const interval = setInterval(() => {
      refreshAllPrices();
    }, 500);
    return () => clearInterval(interval);
  }, [autoRefresh, trades.map((t) => t.id).join(",")]);

  async function updatePrice(id: string) {
    const val = priceDrafts[id];
    if (!val) return;
    const numPrice = parseFloat(val);
    if (isNaN(numPrice)) return;

    setBusyId(id);
    setLivePrices((prev) => ({ ...prev, [id]: numPrice }));
    await fetch(`/api/trades/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPrice: numPrice }),
    });
    setBusyId(null);
  }

  async function closeTrade(id: string) {
    const val = exitDrafts[id];
    const trade = trades.find((t) => t.id === id);
    const fallbackPrice = trade ? livePrices[id] ?? trade.currentPrice ?? trade.entryPrice : 0;
    const exitP = val ? parseFloat(val) : fallbackPrice;

    setBusyId(id);
    await fetch(`/api/trades/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ close: true, exitPrice: exitP }),
    });
    setBusyId(null);
    onChanged();
  }

  if (!Array.isArray(trades) || trades.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 text-muted text-sm shadow-lg">
        No open positions. Place a trade to see it here with live P&L.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2 text-xs">
        <label className="flex items-center gap-2 cursor-pointer text-slate-200">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="rounded border-white/20 bg-slate-900 text-accent focus:ring-accent"
          />
          <span>⚡ Auto-refresh live prices (1s)</span>
        </label>
        <span className="text-muted flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse" />
          Tick #{tickCount} {lastRefreshedAt ? `• ${lastRefreshedAt}` : ""}
        </span>
      </div>

      {trades.map((t) => {
        const currentP = livePrices[t.id] ?? t.currentPrice ?? t.entryPrice;
        const diff = t.side === "BUY" ? currentP - t.entryPrice : t.entryPrice - currentP;
        const pnl = Number((diff * t.quantity).toFixed(2));

        return (
          <div
            key={t.id}
            className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-semibold text-slate-100">{t.symbol}</span>{" "}
                <span
                  className={`text-xs px-2 py-0.5 rounded font-medium ${
                    t.side === "BUY" ? "bg-accent/20 text-accent" : "bg-danger/20 text-danger"
                  }`}
                >
                  {t.side}
                </span>{" "}
                <span className="text-muted text-sm">x{t.quantity}</span>
              </div>
              <div className="text-right">
                <span className={`text-base font-bold ${pnl >= 0 ? "text-accent" : "text-danger"}`}>
                  ₹{pnl.toFixed(2)}
                </span>
                <p className="text-[11px] text-muted">LTP: ₹{currentP}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs text-muted mb-3 bg-slate-950/60 p-2.5 rounded-xl">
              <span>Entry: ₹{t.entryPrice}</span>
              <span>SL: {t.stopLoss ? `₹${t.stopLoss}` : "—"}</span>
              <span>Target: {t.target ? `₹${t.target}` : "—"}</span>
            </div>

            <div className="mb-3 flex items-center justify-between">
              <button
                disabled={busyId === t.id}
                onClick={() => fetchSingleLivePrice(t)}
                className="text-xs px-3 py-1.5 rounded-xl bg-accent/20 text-accent border border-accent/40 hover:bg-accent/30 disabled:opacity-50 flex items-center gap-1"
              >
                ⚡ {busyId === t.id ? "Fetching..." : "Fetch Live Price"}
              </button>
              {liveErrors[t.id] && <span className="text-xs text-danger">{liveErrors[t.id]}</span>}
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
              <input
                type="number"
                step="0.05"
                placeholder="Manual price"
                className="bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs w-28 text-slate-200 outline-none focus:border-accent"
                value={priceDrafts[t.id] ?? ""}
                onChange={(e) => setPriceDrafts({ ...priceDrafts, [t.id]: e.target.value })}
              />
              <button
                disabled={busyId === t.id}
                onClick={() => updatePrice(t.id)}
                className="text-xs px-3 py-1.5 rounded-xl border border-white/10 hover:border-accent disabled:opacity-50"
              >
                Set
              </button>

              <input
                type="number"
                step="0.05"
                placeholder="Exit price"
                className="bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs w-28 text-slate-200 outline-none focus:border-accent ml-auto"
                value={exitDrafts[t.id] ?? ""}
                onChange={(e) => setExitDrafts({ ...exitDrafts, [t.id]: e.target.value })}
              />
              <button
                disabled={busyId === t.id}
                onClick={() => closeTrade(t.id)}
                className="text-xs px-3 py-1.5 rounded-xl bg-danger text-white hover:brightness-95 disabled:opacity-50 shadow-[0_8px_22px_rgba(255,72,72,0.22)]"
              >
                Close Position
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
