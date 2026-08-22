"use client";

import CapitalSummary, { TradeSummaryItem } from "@/components/CapitalSummary";
import { AnalyticsSummary } from "@/lib/calculations";

interface AnalyticsClientProps {
  allTrades: TradeSummaryItem[];
  analytics: AnalyticsSummary;
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  const color = tone === "up" ? "text-[#00E599]" : tone === "down" ? "text-[#FF3B5C]" : "text-white";
  return (
    <div className="bg-[#12151E] border border-white/10 rounded-2xl p-5 shadow-lg space-y-1">
      <p className="text-slate-400 text-xs font-semibold">{label}</p>
      <p className={`text-2xl font-black font-mono ${color}`}>{value}</p>
    </div>
  );
}

export default function AnalyticsClient({ allTrades, analytics: a }: AnalyticsClientProps) {
  function handleReset() {
    window.location.reload();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Performance Analytics</h1>
        <p className="text-xs text-slate-400 mt-1">
          Calculated strictly from closed trades and active virtual positions in your journal.
        </p>
      </div>

      {/* Virtual Portfolio Capital Summary Card & Reset Trades Button */}
      <CapitalSummary allTrades={allTrades} onReset={handleReset} />

      {a.totalTrades === 0 ? (
        <div className="bg-[#12151E] border border-white/10 rounded-2xl p-8 text-center text-slate-400 text-sm shadow-xl">
          Close some trades to see detailed performance analytics here.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Stat label="Total Closed Trades" value={String(a.totalTrades)} />
            <Stat label="Gross P&L" value={`₹${a.grossPnl.toFixed(2)}`} tone={a.grossPnl >= 0 ? "up" : "down"} />
            <Stat label="Total Order Charges" value={`₹${a.totalCharges.toFixed(2)}`} tone="down" />
            <Stat label="Net Realized P&L" value={`₹${a.netPnl.toFixed(2)}`} tone={a.netPnl >= 0 ? "up" : "down"} />
            <Stat label="Win Rate" value={`${a.winRate}%`} tone={a.winRate >= 50 ? "up" : "down"} />
          </div>

          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
            <Stat label="Wins" value={String(a.wins)} tone="up" />
            <Stat label="Losses" value={String(a.losses)} tone="down" />
            <Stat label="Breakeven" value={String(a.breakeven)} />
            <Stat label="Avg Win" value={`₹${a.avgWin.toFixed(2)}`} tone="up" />
            <Stat label="Avg Loss" value={`₹${a.avgLoss.toFixed(2)}`} tone="down" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Stat label="Profit Factor" value={a.profitFactor === null ? "—" : a.profitFactor.toFixed(2)} />
            <Stat label="Best Net Trade" value={`₹${a.bestTrade.toFixed(2)}`} tone="up" />
            <Stat label="Worst Net Trade" value={`₹${a.worstTrade.toFixed(2)}`} tone="down" />
          </div>
        </>
      )}
    </div>
  );
}
