import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import JournalClient from "./JournalClient";

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

export default async function JournalPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
        Please login to view your trade journal.
      </div>
    );
  }

  const rawTrades = await prisma.trade.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const serializedTrades = rawTrades.map((t) => ({
    id: t.id,
    symbol: t.symbol,
    side: t.side,
    quantity: t.quantity,
    entryPrice: t.entryPrice,
    currentPrice: t.currentPrice,
    exitPrice: t.exitPrice,
    stopLoss: t.stopLoss,
    target: t.target,
    pnl: t.pnl,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
    closedAt: t.closedAt ? t.closedAt.toISOString() : null,
  }));

  return <JournalClient initialTrades={serializedTrades} />;
}
