import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { computeAnalytics } from "@/lib/calculations";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trading Analytics & Win Rate Insights | PRO-TRADER",
  description:
    "Analyze your NSE options and stock paper trading performance metrics: win rate, profit factor, average win/loss ratio, and drawdown analysis.",
  keywords: [
    "trading performance analytics",
    "NSE options win rate tracker",
    "trading profit factor calculator",
    "paper trade analytics India",
  ],
  alternates: {
    canonical: "/analytics",
  },
  openGraph: {
    title: "Trading Performance Analytics | PRO-TRADER",
    description: "Deep analytics for your virtual stock and options trade performance.",
    url: "/analytics",
  },
};

function Stat({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  const color = tone === "up" ? "text-accent" : tone === "down" ? "text-danger" : "text-white";
  return (
    <div className="bg-panel border border-border rounded-xl p-5">
      <p className="text-muted text-sm mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
        Please login to view analytics for your paper trades.
      </div>
    );
  }

  const closedTrades = await prisma.trade.findMany({ where: { userId: user.id, status: "CLOSED" } });
  const a = computeAnalytics(closedTrades);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Performance Analytics</h1>
        <p className="text-muted">Calculated strictly from closed trades in your journal.</p>
      </div>

      {a.totalTrades === 0 ? (
        <div className="bg-panel border border-border rounded-xl p-8 text-center text-muted">
          Close some trades to see analytics here.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Total Closed Trades" value={String(a.totalTrades)} />
            <Stat label="Win Rate" value={`${a.winRate}%`} tone={a.winRate >= 50 ? "up" : "down"} />
            <Stat label="Total Realized P&L" value={`₹${a.totalPnl.toFixed(2)}`} tone={a.totalPnl >= 0 ? "up" : "down"} />
            <Stat
              label="Profit Factor"
              value={a.profitFactor === null ? "—" : a.profitFactor.toFixed(2)}
            />
          </div>

          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
            <Stat label="Wins" value={String(a.wins)} tone="up" />
            <Stat label="Losses" value={String(a.losses)} tone="down" />
            <Stat label="Breakeven (0 P&L)" value={String(a.breakeven)} />
            <Stat label="Avg Win" value={`₹${a.avgWin.toFixed(2)}`} tone="up" />
            <Stat label="Avg Loss" value={`₹${a.avgLoss.toFixed(2)}`} tone="down" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Stat label="Best Trade" value={`₹${a.bestTrade.toFixed(2)}`} tone="up" />
            <Stat label="Worst Trade" value={`₹${a.worstTrade.toFixed(2)}`} tone="down" />
          </div>
        </>
      )}
    </div>
  );
}
