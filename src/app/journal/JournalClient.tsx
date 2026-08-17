"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface TradeItem {
  id: string;
  symbol: string;
  side: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number | null;
  exitPrice: number | null;
  stopLoss: number | null;
  target: number | null;
  pnl: number | null;
  status: string;
  createdAt: string;
  closedAt: string | null;
}

interface JournalClientProps {
  initialTrades: TradeItem[];
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function fmtMoney(val: number) {
  const prefix = val > 0 ? "+" : "";
  return `${prefix}₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getDayKey(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPeriodKey(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export default function JournalClient({ initialTrades }: JournalClientProps) {
  const [trades, setTrades] = useState<TradeItem[]>(initialTrades);
  const [filterTab, setFilterTab] = useState<"ALL" | "OPEN" | "CLOSED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [closingId, setClosingId] = useState<string | null>(null);

  // Poll trades every 2 seconds to keep live prices and closed trades updated
  async function refreshTrades() {
    try {
      const res = await fetch("/api/trades", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setTrades(data);
      }
    } catch {
      // ignore silent fetch error
    }
  }

  useEffect(() => {
    const interval = setInterval(refreshTrades, 2000);
    return () => clearInterval(interval);
  }, []);

  async function handleCloseTrade(trade: TradeItem) {
    setClosingId(trade.id);
    const exitPrice = trade.currentPrice || trade.entryPrice;
    try {
      const res = await fetch(`/api/trades/${trade.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ close: true, exitPrice }),
      });
      if (res.ok) {
        refreshTrades();
      }
    } catch (err) {
      console.error("Close trade error:", err);
    } finally {
      setClosingId(null);
    }
  }

  // Calculate trade P&L for each item
  function getTradePnl(t: TradeItem): number {
    if (t.status === "CLOSED") {
      if (typeof t.pnl === "number" && t.pnl !== 0) return t.pnl;
      const ref = t.exitPrice ?? t.currentPrice ?? t.entryPrice;
      const diff = t.side === "BUY" ? ref - t.entryPrice : t.entryPrice - ref;
      return Number((diff * t.quantity).toFixed(2));
    }
    const ref = t.currentPrice ?? t.entryPrice;
    const diff = t.side === "BUY" ? ref - t.entryPrice : t.entryPrice - ref;
    return Number((diff * t.quantity).toFixed(2));
  }

  const openTradesList = trades.filter((t) => t.status === "OPEN");
  const closedTradesList = trades.filter((t) => t.status === "CLOSED");

  // Summary Metrics
  const grossClosedPnl = closedTradesList.reduce((sum, t) => sum + getTradePnl(t), 0);
  const totalChargesPaid = closedTradesList.length * 100 + openTradesList.length * 50; // ₹50 per order leg
  const netClosedPnl = grossClosedPnl - (closedTradesList.length * 100);
  const openUnrealizedPnl = openTradesList.reduce((sum, t) => sum + getTradePnl(t) - 50, 0);

  // Group daily/monthly P&L
  const dailyPnl = new Map<string, number>();
  const monthlyPnl = new Map<string, number>();
  const yearlyPnl = new Map<string, number>();

  closedTradesList.forEach((t) => {
    const dKey = getDayKey(t.closedAt || t.createdAt);
    const mKey = getPeriodKey(t.closedAt || t.createdAt);
    const yKey = String(new Date(t.closedAt || t.createdAt).getFullYear());
    const netP = getTradePnl(t) - 100; // Net P&L after ₹100 charges (2 legs)

    dailyPnl.set(dKey, (dailyPnl.get(dKey) || 0) + netP);
    monthlyPnl.set(mKey, (monthlyPnl.get(mKey) || 0) + netP);
    yearlyPnl.set(yKey, (yearlyPnl.get(yKey) || 0) + netP);
  });

  const sortedDaily = Array.from(dailyPnl.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  const sortedMonthly = Array.from(monthlyPnl.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  const sortedYearly = Array.from(yearlyPnl.entries()).sort((a, b) => b[0].localeCompare(a[0]));

  const bestDay = sortedDaily[0]?.[1] || 0;
  const avgDaily = sortedDaily.length ? netClosedPnl / sortedDaily.length : 0;

  // Filtered trades for table display
  const filteredTrades = trades.filter((t) => {
    const matchesTab =
      filterTab === "ALL" ||
      (filterTab === "OPEN" && t.status === "OPEN") ||
      (filterTab === "CLOSED" && t.status === "CLOSED");

    const matchesSearch =
      !searchQuery ||
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.side.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  // Calendar Heatmap Cell Generation
  const now = new Date();
  const currentMonthLabel = now.toLocaleString("en-IN", { month: "long", year: "numeric" });
  const firstDayOffset = new Date(now.getFullYear(), now.getMonth(), 1).getDay();

  const calendarCells = Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - firstDayOffset + 1;
    const date = new Date(now.getFullYear(), now.getMonth(), dayNumber);
    const isCurrentMonth = date.getMonth() === now.getMonth();
    const key = getDayKey(date.toISOString());
    const pnl = dailyPnl.get(key) || 0;
    return { isCurrentMonth, dayNumber: date.getDate(), pnl, key };
  });

  return (
    <div className="space-y-8">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Trade Journal & History</h1>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Every paper trade you place is automatically recorded here with entry/exit prices, order charges (₹50/order leg), P&L analytics, and daily calendar heatmaps.
        </p>
      </div>

      {/* Top Stat Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-2xl border border-white/10 bg-[#12151E] p-4 shadow-lg">
          <p className="text-xs text-slate-400 font-semibold">Total Trades</p>
          <p className="text-2xl font-black text-white mt-1 font-mono">{trades.length}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{openTradesList.length} Open • {closedTradesList.length} Closed</p>
        </div>

        <div className="rounded-2xl border border-rose-500/30 bg-[#12151E] p-4 shadow-lg">
          <p className="text-xs text-rose-400 font-semibold">Total Order Charges</p>
          <p className="text-2xl font-black text-rose-400 mt-1 font-mono">₹{totalChargesPaid.toFixed(2)}</p>
          <p className="text-[10px] text-rose-300/70 mt-0.5">₹50 per order execution leg</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#12151E] p-4 shadow-lg">
          <p className="text-xs text-slate-400 font-semibold">Gross Closed P&L</p>
          <p className={`text-2xl font-black mt-1 font-mono ${grossClosedPnl >= 0 ? "text-[#00E599]" : "text-[#FF3B5C]"}`}>
            {fmtMoney(grossClosedPnl)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Before ₹50/order charges</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-[#12151E] p-4 shadow-lg">
          <p className="text-xs text-emerald-400 font-semibold">Net Closed P&L</p>
          <p className={`text-2xl font-black mt-1 font-mono ${netClosedPnl >= 0 ? "text-[#00E599]" : "text-[#FF3B5C]"}`}>
            {fmtMoney(netClosedPnl)}
          </p>
          <p className="text-[10px] text-emerald-300/70 mt-0.5">After ₹50/order charges</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#12151E] p-4 shadow-lg">
          <p className="text-xs text-slate-400 font-semibold">Best Trading Day</p>
          <p className={`text-2xl font-black mt-1 font-mono ${bestDay >= 0 ? "text-[#00E599]" : "text-[#FF3B5C]"}`}>
            {fmtMoney(bestDay)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Avg Net: {fmtMoney(avgDaily)}/day</p>
        </div>
      </div>

      {/* Main Trade History Log Table Section */}
      <div className="rounded-2xl border border-white/10 bg-[#12151E] p-5 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="font-bold text-lg text-white flex items-center gap-2">
              <span>📋 All Paper Trades Log</span>
              <span className="text-xs bg-[#00E599]/10 text-[#00E599] border border-[#00E599]/30 px-2.5 py-0.5 rounded-full font-bold">
                {filteredTrades.length} Trades Listed
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">View and manage open positions or review closed trade performance history.</p>
          </div>

          {/* Controls: Filter Tabs & Search Input */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Tabs */}
            <div className="flex bg-[#080C11] p-1 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => setFilterTab("ALL")}
                className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                  filterTab === "ALL"
                    ? "bg-[#00E599] text-[#090A0F] shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                All ({trades.length})
              </button>
              <button
                onClick={() => setFilterTab("OPEN")}
                className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                  filterTab === "OPEN"
                    ? "bg-[#00E599] text-[#090A0F] shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Open ({openTradesList.length})
              </button>
              <button
                onClick={() => setFilterTab("CLOSED")}
                className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                  filterTab === "CLOSED"
                    ? "bg-[#00E599] text-[#090A0F] shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Closed ({closedTradesList.length})
              </button>
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#080C11] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00E599]/50"
            />
          </div>
        </div>

        {/* Trade Table */}
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-xs text-left font-mono">
            <thead>
              <tr className="border-b border-white/10 bg-[#080C11] text-slate-400 font-bold">
                <th className="p-3">Symbol</th>
                <th className="p-3">Side</th>
                <th className="p-3">Qty</th>
                <th className="p-3">Entry Price</th>
                <th className="p-3">Current / Exit</th>
                <th className="p-3">Charges</th>
                <th className="p-3">Gross P&L</th>
                <th className="p-3">Net P&L</th>
                <th className="p-3">Status</th>
                <th className="p-3">Opened</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400 font-sans">
                    <p className="font-semibold text-base text-white">No trades found in this view.</p>
                    <p className="text-xs text-slate-400 mt-1">Place trades on the Paper Trading Terminal to build your history!</p>
                    <Link
                      href="/trades"
                      className="inline-block mt-3 bg-[#00E599] text-[#090A0F] font-bold text-xs px-4 py-2 rounded-xl hover:brightness-105 transition-all"
                    >
                      Go to Paper Trading Terminal →
                    </Link>
                  </td>
                </tr>
              ) : (
                filteredTrades.map((t) => {
                  const grossPnl = getTradePnl(t);
                  const isClosed = t.status === "CLOSED";
                  const charges = isClosed ? 100 : 50; // ₹50 entry + ₹50 exit
                  const netPnl = grossPnl - charges;
                  const refPrice = isClosed ? t.exitPrice || t.entryPrice : t.currentPrice || t.entryPrice;

                  return (
                    <tr key={t.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-extrabold text-white text-sm">{t.symbol}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.side === "BUY" ? "bg-[#00E599]/15 text-[#00E599]" : "bg-[#FF3B5C]/15 text-[#FF3B5C]"
                          }`}
                        >
                          {t.side}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-200">{t.quantity}</td>
                      <td className="p-3 font-semibold text-slate-200">₹{t.entryPrice}</td>
                      <td className="p-3 font-semibold text-white">₹{refPrice}</td>
                      <td className="p-3 text-rose-400 font-semibold">₹{charges}</td>
                      <td className={`p-3 font-bold ${grossPnl >= 0 ? "text-[#00E599]" : "text-[#FF3B5C]"}`}>
                        {fmtMoney(grossPnl)}
                      </td>
                      <td className={`p-3 font-extrabold text-sm ${netPnl >= 0 ? "text-[#00E599]" : "text-[#FF3B5C]"}`}>
                        {fmtMoney(netPnl)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                            isClosed
                              ? "bg-slate-800 text-slate-400 border border-white/10"
                              : "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 text-[11px]">{fmtDate(t.createdAt)}</td>
                      <td className="p-3">
                        {!isClosed ? (
                          <button
                            onClick={() => handleCloseTrade(t)}
                            disabled={closingId === t.id}
                            className="bg-[#FF3B5C]/20 text-[#FF3B5C] hover:bg-[#FF3B5C]/30 border border-[#FF3B5C]/40 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50"
                          >
                            {closingId === t.id ? "Closing..." : "Close Trade"}
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500">Closed ({fmtDate(t.closedAt)})</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Period Breakdown & Calendar Heatmap Grid */}
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        {/* Period P&L Breakdown */}
        <div className="bg-[#12151E] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="font-bold text-white text-base">Period P&L Breakdown</h2>
            <span className="text-slate-400 text-xs font-mono">Monthly • Yearly • Daily</span>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/10 bg-[#080C11] p-3">
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Monthly P&L</p>
              <div className="mt-2 space-y-2 max-h-44 overflow-auto font-mono text-xs">
                {sortedMonthly.length === 0 ? (
                  <p className="text-slate-500 text-xs">No monthly data yet.</p>
                ) : (
                  sortedMonthly.slice(0, 6).map(([period, value]) => (
                    <div key={period} className="flex justify-between">
                      <span className="text-slate-400">{period}</span>
                      <span className={`font-bold ${value >= 0 ? "text-[#00E599]" : "text-[#FF3B5C]"}`}>
                        {fmtMoney(value)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#080C11] p-3">
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Yearly P&L</p>
              <div className="mt-2 space-y-2 max-h-44 overflow-auto font-mono text-xs">
                {sortedYearly.length === 0 ? (
                  <p className="text-slate-500 text-xs">No yearly data yet.</p>
                ) : (
                  sortedYearly.slice(0, 6).map(([year, value]) => (
                    <div key={year} className="flex justify-between">
                      <span className="text-slate-400">{year}</span>
                      <span className={`font-bold ${value >= 0 ? "text-[#00E599]" : "text-[#FF3B5C]"}`}>
                        {fmtMoney(value)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#080C11] p-3">
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Daily Summary</p>
              <div className="mt-2 space-y-2 max-h-44 overflow-auto font-mono text-xs">
                {sortedDaily.length === 0 ? (
                  <p className="text-slate-500 text-xs">No daily summary yet.</p>
                ) : (
                  sortedDaily.slice(0, 6).map(([day, value]) => (
                    <div key={day} className="flex justify-between">
                      <span className="text-slate-400">
                        {new Date(day).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                      <span className={`font-bold ${value >= 0 ? "text-[#00E599]" : "text-[#FF3B5C]"}`}>
                        {fmtMoney(value)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Monthly P&L Calendar Heatmap */}
        <div className="bg-[#12151E] border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="font-bold text-white text-base">{currentMonthLabel}</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#00E599]/10 text-[#00E599] border border-[#00E599]/30 font-bold">
              🗓️ Daily P&L Heatmap
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-1 text-slate-400 font-bold text-[11px]">
                {day}
              </div>
            ))}
            {calendarCells.map((cell, index) => {
              const hasPnl = cell.pnl !== 0;
              const isProfit = cell.pnl > 0;

              return (
                <div
                  key={`${cell.key}-${index}`}
                  className={`min-h-[58px] rounded-xl border p-1.5 flex flex-col justify-between transition-all ${
                    cell.isCurrentMonth
                      ? hasPnl
                        ? isProfit
                          ? "bg-[#00E599]/15 border-[#00E599]/40 text-[#00E599]"
                          : "bg-[#FF3B5C]/15 border-[#FF3B5C]/40 text-[#FF3B5C]"
                        : "bg-[#080C11] border-white/5 text-slate-400"
                      : "border-transparent bg-transparent opacity-20"
                  }`}
                >
                  <div className="text-[10px] font-bold text-right text-slate-400">{cell.dayNumber}</div>
                  <div className="text-[11px] font-extrabold font-mono text-center">
                    {hasPnl ? fmtMoney(cell.pnl) : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
