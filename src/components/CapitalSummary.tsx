"use client";

import { useState } from "react";

export interface TradeSummaryItem {
  id: string;
  symbol: string;
  side: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number | null;
  exitPrice: number | null;
  pnl: number | null;
  status: string;
}

interface CapitalSummaryProps {
  allTrades: TradeSummaryItem[];
  onReset?: () => void;
  showResetButton?: boolean;
}

const INITIAL_CAPITAL = 1000000; // ₹10,00,000 (10 Lakhs Virtual Capital)
const CHARGES_PER_ORDER = 50.0;

export default function CapitalSummary({
  allTrades,
  onReset,
  showResetButton = true,
}: CapitalSummaryProps) {
  const [resetting, setResetting] = useState(false);

  // 1. Calculate Closed Realized Net P&L
  const closedTrades = allTrades.filter((t) => t.status === "CLOSED");
  let realizedPnl = 0;
  closedTrades.forEach((t) => {
    if (typeof t.pnl === "number" && t.pnl !== 0) {
      realizedPnl += t.pnl;
    } else {
      const ref = t.exitPrice ?? t.currentPrice ?? t.entryPrice;
      const diff = t.side === "BUY" ? ref - t.entryPrice : t.entryPrice - ref;
      const gross = diff * t.quantity;
      const net = gross - CHARGES_PER_ORDER * 2;
      realizedPnl += net;
    }
  });

  // 2. Calculate Open Live P&L and Margin Used
  const openTrades = allTrades.filter((t) => t.status === "OPEN");
  let openPnl = 0;
  let marginUsed = 0;
  openTrades.forEach((t) => {
    const ref = t.currentPrice ?? t.entryPrice;
    const diff = t.side === "BUY" ? ref - t.entryPrice : t.entryPrice - ref;
    openPnl += diff * t.quantity;
    marginUsed += t.entryPrice * t.quantity;
  });

  const totalNetPnl = realizedPnl + openPnl;
  const currentCapital = INITIAL_CAPITAL + totalNetPnl;
  const capitalRemained = currentCapital - marginUsed;
  const roiPercent = ((currentCapital - INITIAL_CAPITAL) / INITIAL_CAPITAL) * 100;

  async function handleResetTrades() {
    if (
      !window.confirm(
        "⚠️ RESET ALL TRADES?\n\nThis will permanently delete all open and closed trades from your journal and restore your virtual capital back to ₹10,00,000."
      )
    ) {
      return;
    }

    setResetting(true);
    try {
      const res = await fetch("/api/trades/reset", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset trades.");
      if (onReset) onReset();
    } catch (err: any) {
      alert(err.message || "Failed to reset trades.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="bg-[#12151E] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4 backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#00E599]/15 text-[#00E599] border border-[#00E599]/30">
              💼 Virtual Portfolio Capital
            </span>
            <span className="text-xs text-slate-400 font-mono">Starting Capital: ₹10,00,000</span>
          </div>
          <div className="flex items-baseline gap-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
              ₹{currentCapital.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <span
              className={`text-xs font-extrabold font-mono px-2.5 py-0.5 rounded-lg ${
                roiPercent >= 0
                  ? "bg-[#00E599]/20 text-[#00E599] border border-[#00E599]/30"
                  : "bg-[#FF3B5C]/20 text-[#FF3B5C] border border-[#FF3B5C]/30"
              }`}
            >
              {roiPercent >= 0 ? "▲ +" : "▼ "}
              {roiPercent.toFixed(2)}% ROI
            </span>
          </div>
        </div>

        {showResetButton && (
          <button
            onClick={handleResetTrades}
            disabled={resetting}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 transition-all disabled:opacity-50 flex items-center gap-2 shrink-0 shadow-md"
          >
            <span>🔄</span>
            <span>{resetting ? "Resetting..." : "Reset Trades"}</span>
          </button>
        )}
      </div>

      {/* Grid statistics breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
        <div className="bg-[#080C11] p-3 rounded-xl border border-white/5 space-y-1">
          <span className="text-[10px] text-slate-400 font-sans block font-semibold">Remaining Capital</span>
          <span className="font-bold text-[#38BDF8] text-sm block">
            ₹{capitalRemained.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-500 block font-sans">Available for new trades</span>
        </div>

        <div className="bg-[#080C11] p-3 rounded-xl border border-white/5 space-y-1">
          <span className="text-[10px] text-slate-400 font-sans block font-semibold">Margin Used</span>
          <span className="font-bold text-amber-300 text-sm block">
            ₹{marginUsed.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-500 block font-sans">{openTrades.length} Open position(s)</span>
        </div>

        <div className="bg-[#080C11] p-3 rounded-xl border border-white/5 space-y-1">
          <span className="text-[10px] text-slate-400 font-sans block font-semibold">Realized Net P&L</span>
          <span
            className={`font-bold text-sm block ${
              realizedPnl >= 0 ? "text-[#00E599]" : "text-[#FF3B5C]"
            }`}
          >
            {realizedPnl >= 0 ? "+" : ""}₹{realizedPnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-500 block font-sans">{closedTrades.length} Closed trade(s)</span>
        </div>

        <div className="bg-[#080C11] p-3 rounded-xl border border-white/5 space-y-1">
          <span className="text-[10px] text-slate-400 font-sans block font-semibold">Unrealized Live P&L</span>
          <span
            className={`font-bold text-sm block ${
              openPnl >= 0 ? "text-[#00E599]" : "text-[#FF3B5C]"
            }`}
          >
            {openPnl >= 0 ? "+" : ""}₹{openPnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-500 block font-sans">Live floating positions</span>
        </div>
      </div>
    </div>
  );
}
