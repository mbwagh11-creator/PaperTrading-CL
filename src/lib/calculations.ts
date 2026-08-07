import type { Trade } from "@prisma/client";

/**
 * Calculates P&L for a trade.
 * BUY (long): profit when price rises above entry.
 * SELL (short/writing): profit when price falls below entry.
 */
export function calculatePnl(
  side: "BUY" | "SELL",
  entryPrice: number,
  referencePrice: number,
  quantity: number
): number {
  const diff =
    side === "BUY" ? referencePrice - entryPrice : entryPrice - referencePrice;
  return Number((diff * quantity).toFixed(2));
}

/** Live/unrealized P&L for an OPEN trade using its currentPrice (falls back to entryPrice). */
export function livePnl(trade: Trade): number {
  const ref = trade.currentPrice ?? trade.entryPrice;
  return calculatePnl(trade.side as "BUY" | "SELL", trade.entryPrice, ref, trade.quantity);
}

export interface AnalyticsSummary {
  totalTrades: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number; // percentage
  totalPnl: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number | null; // grossProfit / grossLoss
  bestTrade: number;
  worstTrade: number;
}

/** Performance analytics computed strictly from CLOSED trades. */
export function computeAnalytics(closedTrades: Trade[]): AnalyticsSummary {
  const pnls = closedTrades.map((t) => t.pnl ?? 0);

  const wins = pnls.filter((p) => p > 0);
  const losses = pnls.filter((p) => p < 0);
  const breakeven = pnls.filter((p) => p === 0);

  const totalPnl = Number(pnls.reduce((a, b) => a + b, 0).toFixed(2));
  const grossProfit = wins.reduce((a, b) => a + b, 0);
  const grossLoss = Math.abs(losses.reduce((a, b) => a + b, 0));

  return {
    totalTrades: closedTrades.length,
    wins: wins.length,
    losses: losses.length,
    breakeven: breakeven.length,
    winRate: closedTrades.length ? Number(((wins.length / closedTrades.length) * 100).toFixed(1)) : 0,
    totalPnl,
    avgWin: wins.length ? Number((grossProfit / wins.length).toFixed(2)) : 0,
    avgLoss: losses.length ? Number((grossLoss / losses.length).toFixed(2)) : 0,
    profitFactor: grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : null,
    bestTrade: pnls.length ? Math.max(...pnls) : 0,
    worstTrade: pnls.length ? Math.min(...pnls) : 0,
  };
}
