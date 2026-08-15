import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { livePnl } from "@/lib/calculations";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "NSE Option Trade Journal & Daily P&L Calendar | PRO-TRADER",
  description:
    "Track and review your NSE options paper trades with automated monthly, yearly, and daily P&L calendar breakdowns and trade logs.",
  keywords: [
    "NSE trade journal",
    "daily PnL calendar trading",
    "options trading log India",
    "stock market trade journal app",
    "paper trading history",
  ],
  alternates: {
    canonical: "/journal",
  },
  openGraph: {
    title: "NSE Trade Journal & P&L Calendar | PRO-TRADER",
    description: "Automated daily P&L heatmap and trade history journal for Indian derivatives traders.",
    url: "/journal",
  },
};


function fmtDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function fmtMoney(value: number) {
  return `₹${value.toFixed(2)}`;
}

function getPeriodKey(date: Date | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 7);
}

function getDayKey(date: Date | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export default async function JournalPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
        Please login to view your trade journal.
      </div>
    );
  }

  const trades = await prisma.trade.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });

  const closedTrades = trades.filter((t) => t.status === "CLOSED" && typeof t.pnl === "number");

  const dailyPnl = new Map<string, number>();
  const monthlyPnl = new Map<string, number>();
  const yearlyPnl = new Map<string, number>();

  closedTrades.forEach((trade) => {
    const eventDate = new Date(trade.closedAt ?? trade.createdAt);
    const dayKey = getDayKey(eventDate);
    const monthKey = getPeriodKey(eventDate);
    const yearKey = String(eventDate.getFullYear());
    const pnl = trade.pnl ?? 0;

    dailyPnl.set(dayKey, (dailyPnl.get(dayKey) ?? 0) + pnl);
    monthlyPnl.set(monthKey, (monthlyPnl.get(monthKey) ?? 0) + pnl);
    yearlyPnl.set(yearKey, (yearlyPnl.get(yearKey) ?? 0) + pnl);
  });

  const sortedDailyEntries = Array.from(dailyPnl.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  const sortedMonthlyEntries = Array.from(monthlyPnl.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  const sortedYearlyEntries = Array.from(yearlyPnl.entries()).sort((a, b) => b[0].localeCompare(a[0]));

  const totalClosedPnl = closedTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const bestDay = sortedDailyEntries[0]?.[1] ?? 0;
  const avgDaily = sortedDailyEntries.length ? totalClosedPnl / sortedDailyEntries.length : 0;

  const sortedTradeDays = Array.from(new Set(closedTrades.map((trade) => getDayKey(trade.closedAt ?? trade.createdAt)))).sort();
  const last22TradeDays = sortedTradeDays.slice(-22);
  const chartData = last22TradeDays.map((day) => ({
    day,
    pnl: dailyPnl.get(day) ?? 0,
  }));
  const maxAbsPnl = chartData.length ? Math.max(...chartData.map((entry) => Math.abs(entry.pnl))) : 0;

  const now = new Date();
  const currentMonthLabel = now.toLocaleString("en-IN", { month: "long", year: "numeric" });
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDayOffset = new Date(now.getFullYear(), now.getMonth(), 1).getDay();

  const calendarCells = Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - firstDayOffset + 1;
    const date = new Date(now.getFullYear(), now.getMonth(), dayNumber);
    const isCurrentMonth = date.getMonth() === now.getMonth();
    const key = date.toISOString().slice(0, 10);
    const pnl = dailyPnl.get(key) ?? 0;

    return { isCurrentMonth, date, dayNumber: date.getDate(), pnl, key };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Trade Journal</h1>
        <p className="text-muted">
          Every trade you've placed, open or closed, stored permanently with month, year, and daily P&L insights.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-panel border border-border rounded-xl p-4">
          <p className="text-muted text-sm">Closed Trades</p>
          <p className="text-2xl font-semibold mt-2">{closedTrades.length}</p>
        </div>
        <div className="bg-panel border border-border rounded-xl p-4">
          <p className="text-muted text-sm">Net Closed P&L</p>
          <p className={`text-2xl font-semibold mt-2 ${totalClosedPnl >= 0 ? "text-accent" : "text-danger"}`}>
            {fmtMoney(totalClosedPnl)}
          </p>
        </div>
        <div className="bg-panel border border-border rounded-xl p-4">
          <p className="text-muted text-sm">Best Day</p>
          <p className="text-2xl font-semibold mt-2 text-accent">{fmtMoney(bestDay)}</p>
        </div>
        <div className="bg-panel border border-border rounded-xl p-4">
          <p className="text-muted text-sm">Avg. Daily P&L</p>
          <p className={`text-2xl font-semibold mt-2 ${avgDaily >= 0 ? "text-accent" : "text-danger"}`}>
            {fmtMoney(avgDaily)}
          </p>
        </div>
      </div>

      <div className="bg-panel border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold">Last 22 Trading Days</h2>
            <p className="text-muted text-xs mt-1">Auto-generated from your closed trade history</p>
          </div>
          <span className="text-xs text-muted">Positive vs negative P&L</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-3 items-end min-h-[240px]">
          {chartData.map((entry) => {
            const barHeight = maxAbsPnl ? Math.max((Math.abs(entry.pnl) / maxAbsPnl) * 140, entry.pnl === 0 ? 6 : 18) : 6;
            return (
              <div key={entry.day} className="flex flex-col items-center gap-2">
                <div className="flex h-40 w-full items-end justify-center gap-1 rounded-lg border border-border/50 bg-black/10 p-2">
                  <div
                    className={`w-full rounded-t-md ${entry.pnl >= 0 ? "bg-accent" : "bg-danger"}`}
                    style={{ height: `${barHeight}px` }}
                    title={`${entry.day}: ${fmtMoney(entry.pnl)}`}
                  />
                </div>
                <div className="text-center text-[11px] text-muted">
                  <div>{new Date(entry.day).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                  <div className={entry.pnl >= 0 ? "text-accent" : "text-danger"}>{fmtMoney(entry.pnl)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        <div className="bg-panel border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Period Breakdown</h2>
            <span className="text-muted text-xs">Month · Year · Daily</span>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-border p-3">
              <p className="text-muted text-xs uppercase">Month</p>
              <div className="mt-2 space-y-2 max-h-44 overflow-auto">
                {sortedMonthlyEntries.slice(0, 6).map(([period, value]) => (
                  <div key={period} className="flex justify-between text-sm">
                    <span className="text-muted">{period}</span>
                    <span className={value >= 0 ? "text-accent" : "text-danger"}>{fmtMoney(value)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="text-muted text-xs uppercase">Year</p>
              <div className="mt-2 space-y-2 max-h-44 overflow-auto">
                {sortedYearlyEntries.slice(0, 6).map(([year, value]) => (
                  <div key={year} className="flex justify-between text-sm">
                    <span className="text-muted">{year}</span>
                    <span className={value >= 0 ? "text-accent" : "text-danger"}>{fmtMoney(value)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="text-muted text-xs uppercase">Daily</p>
              <div className="mt-2 space-y-2 max-h-44 overflow-auto">
                {sortedDailyEntries.slice(0, 6).map(([day, value]) => (
                  <div key={day} className="flex justify-between text-sm">
                    <span className="text-muted">{new Date(day).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                    <span className={value >= 0 ? "text-accent" : "text-danger"}>{fmtMoney(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-panel border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">{currentMonthLabel}</h2>
            <span className="text-muted text-xs">Daily P&L Calendar</span>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-[11px] text-muted">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="py-1">{day}</div>
            ))}
            {calendarCells.map((cell, index) => (
              <div
                key={`${cell.key}-${index}`}
                className={`min-h-[64px] rounded-lg border p-1 ${
                  cell.isCurrentMonth ? "border-border bg-background/40" : "border-border/40 bg-transparent opacity-40"
                }`}
              >
                <div className="text-[11px] text-muted text-right">{cell.dayNumber}</div>
                <div className={`mt-3 text-[11px] font-medium ${cell.pnl >= 0 ? "text-accent" : "text-danger"}`}>
                  {cell.pnl !== 0 ? fmtMoney(cell.pnl) : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-panel border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted text-left">
              <th className="p-3">Symbol</th>
              <th className="p-3">Side</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Entry</th>
              <th className="p-3">Exit</th>
              <th className="p-3">SL</th>
              <th className="p-3">Target</th>
              <th className="p-3">P&L</th>
              <th className="p-3">Status</th>
              <th className="p-3">Opened</th>
              <th className="p-3">Closed</th>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 && (
              <tr>
                <td colSpan={11} className="p-6 text-center text-muted">
                  No trades recorded yet.
                </td>
              </tr>
            )}
            {trades.map((t) => {
              const pnl = t.status === "CLOSED" ? t.pnl ?? 0 : livePnl(t);
              return (
                <tr key={t.id} className="border-b border-border/50 hover:bg-panel2">
                  <td className="p-3 font-medium">{t.symbol}</td>
                  <td className="p-3">
                    <span className={t.side === "BUY" ? "text-accent" : "text-danger"}>{t.side}</span>
                  </td>
                  <td className="p-3">{t.quantity}</td>
                  <td className="p-3">₹{t.entryPrice}</td>
                  <td className="p-3">{t.exitPrice ? `₹${t.exitPrice}` : "—"}</td>
                  <td className="p-3">{t.stopLoss ?? "—"}</td>
                  <td className="p-3">{t.target ?? "—"}</td>
                  <td className={`p-3 font-medium ${pnl >= 0 ? "text-accent" : "text-danger"}`}>
                    ₹{pnl.toFixed(2)}
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        t.status === "OPEN" ? "bg-yellow-500/20 text-yellow-400" : "bg-border text-muted"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="p-3 text-muted">{fmtDate(t.createdAt)}</td>
                  <td className="p-3 text-muted">{fmtDate(t.closedAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
