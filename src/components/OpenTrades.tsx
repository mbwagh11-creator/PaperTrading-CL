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
  practiceMode = false,
}: {
  trades: Trade[];
  onChanged: () => void;
  practiceMode?: boolean;
}) {
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [exitDrafts, setExitDrafts] = useState<Record<string, string>>({});
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [closingAll, setClosingAll] = useState(false);
  const [liveErrors, setLiveErrors] = useState<Record<string, string>>({});
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const [tickCount, setTickCount] = useState(0);
  const [showPayoff, setShowPayoff] = useState(false);

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
            if (practiceMode) params.set("practice", "true");

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

  // Live PnL 1-second interval refresh
  useEffect(() => {
    if (!autoRefresh || !Array.isArray(trades) || trades.length === 0) return;
    refreshAllPrices();
    const interval = setInterval(() => {
      refreshAllPrices();
    }, 1000);
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

  // 1-Click Square-off All Positions
  async function handleCloseAll() {
    if (!window.confirm("⚠️ Are you sure you want to exit ALL active open positions instantly?")) {
      return;
    }

    setClosingAll(true);
    try {
      const res = await fetch("/api/trades/close-all", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to close positions");
      onChanged();
    } catch (err: any) {
      alert(err.message || "Failed to square off all positions.");
    } finally {
      setClosingAll(false);
    }
  }

  if (!Array.isArray(trades) || trades.length === 0) {
    return (
      <div className="bg-[#12151E] border border-white/10 rounded-2xl p-5 text-slate-400 text-sm shadow-lg text-center">
        No open positions. Select any option from the matrix above to trade!
      </div>
    );
  }

  // Calculate Total Net PnL across open positions
  let totalNetPnl = 0;
  let totalInvestment = 0;
  trades.forEach((t) => {
    const currentP = livePrices[t.id] ?? t.currentPrice ?? t.entryPrice;
    const diff = t.side === "BUY" ? currentP - t.entryPrice : t.entryPrice - currentP;
    totalNetPnl += diff * t.quantity;
    totalInvestment += t.entryPrice * t.quantity;
  });

  return (
    <div className="space-y-4">
      {/* Real-time Status & Emergency Action Header */}
      <div className="bg-[#12151E] border border-white/10 rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs text-slate-400 font-semibold">Total Open P&L</p>
              <h3 className={`text-xl font-black font-mono ${totalNetPnl >= 0 ? "text-[#00E599]" : "text-[#FF3B5C]"}`}>
                {totalNetPnl >= 0 ? "+" : ""}₹{totalNetPnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 font-bold">
              {trades.length} Position{trades.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPayoff(!showPayoff)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-800 text-slate-200 border border-white/10 hover:border-white/30 transition-all"
            >
              📊 {showPayoff ? "Hide Payoff" : "Payoff Analyzer"}
            </button>
            <button
              onClick={handleCloseAll}
              disabled={closingAll}
              className="px-3.5 py-1.5 text-xs font-extrabold rounded-xl bg-[#FF3B5C] text-white hover:brightness-110 shadow-[0_4px_14px_rgba(255,59,92,0.35)] transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>💥</span>
              <span>{closingAll ? "Closing All..." : "Close All Positions"}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-white/10 pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-white/20 bg-[#080C11] text-[#00E599] focus:ring-[#00E599]"
            />
            <span>⚡ 1-Sec Live Feed</span>
          </label>
          <span className="flex items-center gap-1.5 font-mono">
            <span className="inline-block w-2 h-2 rounded-full bg-[#00E599] animate-pulse" />
            Tick #{tickCount} {lastRefreshedAt ? `• ${lastRefreshedAt}` : ""}
          </span>
        </div>
      </div>

      {/* Interactive Payoff Analyzer Panel */}
      {showPayoff && (
        <div className="bg-[#080C11] border border-white/10 rounded-2xl p-4 space-y-3 animate-fadeIn">
          <h4 className="text-xs font-bold text-white flex items-center gap-2">
            <span>📈 Multi-Leg Strategy Payoff Matrix</span>
          </h4>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="bg-[#12151E] p-2.5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 block">Total Margin</span>
              <span className="font-bold text-white">₹{totalInvestment.toLocaleString("en-IN")}</span>
            </div>
            <div className="bg-[#12151E] p-2.5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 block">Max Risk</span>
              <span className="font-bold text-[#FF3B5C]">₹{totalInvestment.toLocaleString("en-IN")}</span>
            </div>
            <div className="bg-[#12151E] p-2.5 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-400 block">Breakeven</span>
              <span className="font-bold text-[#38BDF8]">Live Dynamic</span>
            </div>
          </div>
        </div>
      )}

      {/* Open Positions List */}
      {trades.map((t) => {
        const currentP = livePrices[t.id] ?? t.currentPrice ?? t.entryPrice;
        const diff = t.side === "BUY" ? currentP - t.entryPrice : t.entryPrice - currentP;
        const pnl = Number((diff * t.quantity).toFixed(2));

        return (
          <div
            key={t.id}
            className="bg-[#12151E] border border-white/10 rounded-2xl p-4 shadow-lg space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-white text-sm">{t.symbol}</span>{" "}
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold ${
                    t.side === "BUY" ? "bg-[#00E599]/20 text-[#00E599] border border-[#00E599]/30" : "bg-[#FF3B5C]/20 text-[#FF3B5C] border border-[#FF3B5C]/30"
                  }`}
                >
                  {t.side}
                </span>{" "}
                <span className="text-slate-400 text-xs font-mono">x{t.quantity} Qty</span>
              </div>
              <div className="text-right">
                <span className={`text-base font-black font-mono ${pnl >= 0 ? "text-[#00E599]" : "text-[#FF3B5C]"}`}>
                  {pnl >= 0 ? "+" : ""}₹{pnl.toFixed(2)}
                </span>
                <p className="text-[11px] text-slate-400 font-mono">LTP: ₹{currentP}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs text-slate-400 font-mono bg-[#080C11] p-2.5 rounded-xl border border-white/5">
              <span>Entry: ₹{t.entryPrice}</span>
              <span>SL: {t.stopLoss ? `₹${t.stopLoss}` : "—"}</span>
              <span>Tgt: {t.target ? `₹${t.target}` : "—"}</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                disabled={busyId === t.id}
                onClick={() => fetchSingleLivePrice(t)}
                className="text-[11px] px-3 py-1 rounded-xl bg-[#00E599]/10 text-[#00E599] border border-[#00E599]/30 hover:bg-[#00E599]/25 disabled:opacity-50 flex items-center gap-1 font-semibold"
              >
                ⚡ {busyId === t.id ? "Updating..." : "Live Price"}
              </button>
              {liveErrors[t.id] && <span className="text-xs text-[#FF3B5C]">{liveErrors[t.id]}</span>}

              <button
                disabled={busyId === t.id}
                onClick={() => closeTrade(t.id)}
                className="text-xs px-3.5 py-1.5 rounded-xl bg-[#FF3B5C] text-white hover:brightness-110 font-bold disabled:opacity-50 shadow-md ml-auto"
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
