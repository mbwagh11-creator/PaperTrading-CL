import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { computeAnalytics } from "@/lib/calculations";
import { getCurrentUser } from "@/lib/auth";
import AnalyticsClient from "./AnalyticsClient";

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

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
        Please login to view analytics for your paper trades.
      </div>
    );
  }

  const allTrades = await prisma.trade.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  const closedTrades = allTrades.filter((t) => t.status === "CLOSED");
  const a = computeAnalytics(closedTrades);

  return (
    <AnalyticsClient
      allTrades={allTrades.map((t) => ({
        id: t.id,
        symbol: t.symbol,
        side: t.side,
        quantity: t.quantity,
        entryPrice: t.entryPrice,
        currentPrice: t.currentPrice,
        exitPrice: t.exitPrice,
        pnl: t.pnl,
        status: t.status,
      }))}
      analytics={a}
    />
  );
}
